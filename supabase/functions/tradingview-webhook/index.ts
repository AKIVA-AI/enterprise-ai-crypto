import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSecureCorsHeaders, RATE_LIMITS, rateLimitMiddleware, validateAuth } from "../_shared/security.ts";

interface TradingViewAlert {
  // Standard TradingView fields
  ticker?: string;
  exchange?: string;
  time?: string;
  interval?: string;
  
  // Custom fields from alert message
  instrument?: string;
  action?: 'buy' | 'sell' | 'close' | 'neutral' | 'long' | 'short';
  price?: number;
  strategy?: string;
  
  // Signal details
  signal_type?: string;
  strength?: number;
  confidence?: number;
  
  // Risk parameters
  stop_loss?: number;
  take_profit?: number;
  position_size_pct?: number;
  
  // Metadata
  comment?: string;
  indicator?: string;
  timeframe?: string;
  
  // Security
  secret?: string;
}

serve(async (req) => {
  // TradingView webhook needs to accept external origin, but uses secret validation
  const corsHeaders = getSecureCorsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('TRADINGVIEW_WEBHOOK_SECRET');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse incoming alert
    const alertText = await req.text();
    let alert: TradingViewAlert;

    // TradingView can send JSON or plain text
    try {
      alert = JSON.parse(alertText);
    } catch {
      // Parse plain text format
      alert = parseTextAlert(alertText);
    }

    console.log('[tradingview-webhook] Received alert:', JSON.stringify(alert));

    // Validate webhook secret if configured
    const headerSecret = req.headers.get('x-tv-secret');
    const providedSecret = alert.secret || headerSecret;
    
    if (webhookSecret && webhookSecret !== providedSecret) {
      console.error('[tradingview-webhook] Invalid secret provided');
      
      // Log failed attempt
      await supabase.from('audit_events').insert({
        action: 'tradingview_auth_failed',
        resource_type: 'external_signal',
        severity: 'warning',
        after_state: { 
          alert_ticker: alert.ticker,
          ip: req.headers.get('x-forwarded-for') || 'unknown',
        },
      });
      
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid webhook secret' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Normalize instrument name
    const instrument = normalizeInstrument(alert.ticker || alert.instrument || '');
    if (!instrument) {
      return new Response(
        JSON.stringify({ success: false, error: 'No instrument provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Map TradingView action to our signal direction
    const direction = mapActionToDirection(alert.action);
    const signalType = alert.signal_type || alert.indicator || alert.strategy || 'tradingview_custom';
    const strength = Math.min(1, Math.max(0, alert.strength || 0.7));
    const confidence = Math.min(1, Math.max(0, alert.confidence || 0.65));

    // Create intelligence signal
    const signal = {
      instrument,
      signal_type: `tradingview_${signalType}`,
      direction,
      strength,
      confidence,
      source_data: {
        source: 'tradingview',
        exchange: alert.exchange,
        interval: alert.interval || alert.timeframe,
        price: alert.price,
        stop_loss: alert.stop_loss,
        take_profit: alert.take_profit,
        position_size_pct: alert.position_size_pct,
        comment: alert.comment,
        strategy: alert.strategy,
        indicator: alert.indicator,
        raw_time: alert.time,
        processing_ms: Date.now() - startTime,
      },
      reasoning: buildReasoning(alert, instrument, direction),
      expires_at: calculateExpiry(alert.interval),
      created_at: new Date().toISOString(),
    };

    // Store signal
    const { data: insertedSignal, error: insertError } = await supabase
      .from('intelligence_signals')
      .insert(signal)
      .select()
      .single();

    if (insertError) {
      console.error('[tradingview-webhook] Insert error:', insertError);
      throw insertError;
    }

    console.log('[tradingview-webhook] Signal created:', insertedSignal.id);

    // If action is buy/sell with sufficient confidence, create a trade intent
    if ((alert.action === 'buy' || alert.action === 'sell' || alert.action === 'long' || alert.action === 'short') && confidence >= 0.6) {
      await createTradeIntent(supabase, alert, instrument, direction, confidence);
    }

    // Create audit log
    await supabase.from('audit_events').insert({
      action: 'tradingview_signal_received',
      resource_type: 'external_signal',
      resource_id: insertedSignal.id,
      severity: 'info',
      after_state: { 
        signal_id: insertedSignal.id,
        instrument,
        direction,
        strategy: alert.strategy,
        processing_ms: Date.now() - startTime,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        signal_id: insertedSignal.id,
        instrument,
        direction,
        strength,
        confidence,
        message: `TradingView signal received for ${instrument}: ${direction}`,
        processing_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[tradingview-webhook] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function parseTextAlert(text: string): TradingViewAlert {
  // Parse multiple formats:
  // Format 1: "BTCUSDT buy 50000 strength=0.8 sl=49000 tp=52000"
  // Format 2: "BTC/USD,long,43500,strategy=momentum"
  // Format 3: JSON-like but malformed
  
  const alert: TradingViewAlert = {};
  const cleanText = text.trim();
  
  // Try comma-separated format first
  if (cleanText.includes(',')) {
    const parts = cleanText.split(',').map(p => p.trim());
    if (parts.length >= 1) alert.ticker = parts[0];
    if (parts.length >= 2) {
      const action = parts[1].toLowerCase();
      if (['buy', 'sell', 'long', 'short', 'close', 'neutral'].includes(action)) {
        alert.action = action as any;
      }
    }
    if (parts.length >= 3 && !isNaN(parseFloat(parts[2]))) {
      alert.price = parseFloat(parts[2]);
    }
    // Parse remaining key=value pairs
    for (const part of parts.slice(3)) {
      parseKeyValue(part, alert);
    }
    return alert;
  }
  
  // Space-separated format
  const parts = cleanText.split(/\s+/);
  
  if (parts.length >= 1) {
    alert.ticker = parts[0];
  }
  if (parts.length >= 2) {
    const action = parts[1].toLowerCase();
    if (['buy', 'sell', 'long', 'short', 'close', 'neutral'].includes(action)) {
      alert.action = action as any;
    }
  }
  if (parts.length >= 3 && !isNaN(parseFloat(parts[2]))) {
    alert.price = parseFloat(parts[2]);
  }

  // Parse key=value pairs
  for (const part of parts.slice(3)) {
    parseKeyValue(part, alert);
  }

  return alert;
}

function parseKeyValue(part: string, alert: TradingViewAlert): void {
  const [key, value] = part.split('=');
  if (!key || !value) return;
  
  switch (key.toLowerCase()) {
    case 'strength':
    case 's':
      alert.strength = parseFloat(value);
      break;
    case 'confidence':
    case 'c':
      alert.confidence = parseFloat(value);
      break;
    case 'sl':
    case 'stoploss':
    case 'stop_loss':
      alert.stop_loss = parseFloat(value);
      break;
    case 'tp':
    case 'takeprofit':
    case 'take_profit':
      alert.take_profit = parseFloat(value);
      break;
    case 'size':
    case 'position_size':
    case 'pct':
      alert.position_size_pct = parseFloat(value);
      break;
    case 'strategy':
    case 'strat':
      alert.strategy = value;
      break;
    case 'indicator':
    case 'ind':
      alert.indicator = value;
      break;
    case 'timeframe':
    case 'tf':
    case 'interval':
      alert.timeframe = value;
      break;
    case 'comment':
    case 'msg':
      alert.comment = value;
      break;
    case 'secret':
      alert.secret = value;
      break;
  }
}

function normalizeInstrument(ticker: string): string {
  if (!ticker) return '';
  
  // Clean up common ticker formats
  const normalized = ticker.toUpperCase()
    .replace(/[/_-]/g, '') // Remove separators first for processing
    .replace('PERP', '')
    .replace('PERPETUAL', '')
    .replace('.P', '')
    .replace('1000', '') // Handle Binance 1000PEPE etc
    .trim();

  // Known quote currencies
  const quotes = ['USDT', 'USDC', 'USD', 'BUSD', 'EUR', 'BTC', 'ETH'];
  
  for (const quote of quotes) {
    if (normalized.endsWith(quote) && normalized.length > quote.length) {
      const base = normalized.slice(0, -quote.length);
      return `${base}-${quote === 'BUSD' ? 'USDT' : quote}`;
    }
  }

  // If already formatted with separator, just normalize
  if (ticker.includes('/') || ticker.includes('-')) {
    const [base, quote] = ticker.toUpperCase().split(/[/-]/);
    if (base && quote) {
      return `${base}-${quote === 'BUSD' ? 'USDT' : quote}`;
    }
  }

  // Default: assume USDT pair
  return `${normalized}-USDT`;
}

function mapActionToDirection(action?: string): string {
  switch (action?.toLowerCase()) {
    case 'buy':
    case 'long':
      return 'bullish';
    case 'sell':
    case 'short':
      return 'bearish';
    case 'close':
    case 'neutral':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function buildReasoning(alert: TradingViewAlert, instrument: string, direction: string): string {
  const parts: string[] = [];
  
  if (alert.strategy) {
    parts.push(`Strategy: ${alert.strategy}`);
  } else if (alert.indicator) {
    parts.push(`Indicator: ${alert.indicator}`);
  } else {
    parts.push('TradingView Custom Alert');
  }
  
  parts.push(`${direction.toUpperCase()} signal on ${instrument}`);
  
  if (alert.price) {
    parts.push(`@ $${alert.price.toLocaleString()}`);
  }
  
  if (alert.timeframe || alert.interval) {
    parts.push(`(${alert.timeframe || alert.interval})`);
  }
  
  if (alert.comment) {
    parts.push(`- ${alert.comment}`);
  }
  
  return parts.join(' ');
}

function calculateExpiry(interval?: string): string {
  // Set expiry based on timeframe
  const intervalMinutes: Record<string, number> = {
    '1': 15,
    '5': 30,
    '15': 60,
    '30': 120,
    '60': 240,
    '1h': 240,
    '4h': 480,
    '1d': 1440,
    'd': 1440,
    '1w': 10080,
    'w': 10080,
  };
  
  const minutes = intervalMinutes[interval?.toLowerCase() || ''] || 240; // Default 4 hours
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

async function createTradeIntent(
  supabase: any,
  alert: TradingViewAlert,
  instrument: string,
  direction: string,
  confidence: number
) {
  try {
    // Get the first active PROP book for external signals
    let { data: book } = await supabase
      .from('books')
      .select('id, capital_allocated')
      .eq('status', 'active')
      .eq('type', 'PROP')
      .limit(1)
      .single();

    if (!book) {
      // Try any active book
      const { data: anyBook } = await supabase
        .from('books')
        .select('id, capital_allocated')
        .eq('status', 'active')
        .limit(1)
        .single();
      book = anyBook;
    }

    if (!book) {
      console.log('[tradingview-webhook] No active book found for trade intent');
      return;
    }

    // Get or create external signals strategy
    let { data: strategy } = await supabase
      .from('strategies')
      .select('id')
      .eq('name', 'TradingView Signals')
      .eq('book_id', book.id)
      .limit(1)
      .single();

    if (!strategy) {
      const { data: newStrategy } = await supabase
        .from('strategies')
        .insert({
          name: 'TradingView Signals',
          book_id: book.id,
          timeframe: alert.timeframe || alert.interval || '1h',
          status: 'paper',
          asset_class: 'crypto',
          config_metadata: { 
            source: 'tradingview',
            auto_created: true,
          },
          venue_scope: ['coinbase', 'binance', 'kraken'],
        })
        .select()
        .single();
      strategy = newStrategy;
    }

    if (!strategy) {
      console.log('[tradingview-webhook] Could not create strategy');
      return;
    }

    // Calculate position sizing
    const portfolioValue = book.capital_allocated || 100000;
    const positionSizePct = alert.position_size_pct || 2; // Default 2% of portfolio
    const targetExposure = Math.min(portfolioValue * (positionSizePct / 100), 10000); // Cap at $10k
    
    // Calculate stop loss
    const price = alert.price || 0;
    let stopLossPct = 0.02; // Default 2%
    
    if (alert.stop_loss && price) {
      stopLossPct = Math.abs((alert.stop_loss - price) / price);
    }
    
    const maxLoss = targetExposure * stopLossPct;

    // Create trade intent
    const intent = {
      book_id: book.id,
      strategy_id: strategy.id,
      instrument,
      direction: direction === 'bullish' ? 'buy' : 'sell',
      target_exposure_usd: targetExposure,
      max_loss_usd: Math.max(maxLoss, 50), // Minimum $50 max loss
      confidence,
      horizon_minutes: getHorizonMinutes(alert.interval || alert.timeframe),
      invalidation_price: alert.stop_loss,
      liquidity_requirement: 'normal',
      status: 'pending',
      metadata: {
        source: 'tradingview',
        strategy: alert.strategy,
        indicator: alert.indicator,
        entry_price: alert.price,
        stop_loss: alert.stop_loss,
        take_profit: alert.take_profit,
        comment: alert.comment,
        timeframe: alert.interval || alert.timeframe,
      },
    };

    const { data: createdIntent, error: intentError } = await supabase
      .from('trade_intents')
      .insert(intent)
      .select()
      .single();

    if (intentError) {
      console.error('[tradingview-webhook] Intent creation error:', intentError);
    } else {
      console.log('[tradingview-webhook] Trade intent created:', createdIntent.id);
    }

  } catch (error) {
    console.error('[tradingview-webhook] Error creating trade intent:', error);
  }
}

function getHorizonMinutes(interval?: string): number {
  const horizons: Record<string, number> = {
    '1': 15,
    '5': 60,
    '15': 120,
    '30': 240,
    '60': 480,
    '1h': 480,
    '4h': 960,
    '1d': 2880,
    'd': 2880,
  };
  return horizons[interval?.toLowerCase() || ''] || 240;
}
