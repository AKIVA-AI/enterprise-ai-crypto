import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tv-secret',
};

interface TradingViewAlert {
  // Standard TradingView fields
  ticker?: string;
  exchange?: string;
  time?: string;
  interval?: string;
  
  // Custom fields from alert message
  instrument?: string;
  action?: 'buy' | 'sell' | 'close' | 'neutral';
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
      // Parse plain text format: "BTCUSDT buy 50000 strength=0.8"
      alert = parseTextAlert(alertText);
    }

    console.log('[tradingview-webhook] Received alert:', JSON.stringify(alert));

    // Validate webhook secret if configured
    const headerSecret = req.headers.get('x-tv-secret');
    if (webhookSecret && webhookSecret !== (alert.secret || headerSecret)) {
      console.error('[tradingview-webhook] Invalid secret');
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
    const signalType = alert.signal_type || alert.indicator || alert.strategy || 'tradingview';
    const strength = alert.strength || 0.7;
    const confidence = alert.confidence || 0.6;

    // Create intelligence signal
    const signal = {
      instrument,
      signal_type: signalType,
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
        raw_time: alert.time,
      },
      reasoning: `TradingView alert: ${alert.strategy || 'Custom Alert'} on ${instrument}. ${alert.comment || ''}`,
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hour expiry
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
    if ((alert.action === 'buy' || alert.action === 'sell') && confidence >= 0.6) {
      await createTradeIntent(supabase, alert, instrument, direction, confidence);
    }

    // Create audit log
    await supabase.from('audit_events').insert({
      action: 'tradingview_signal_received',
      resource_type: 'external_signal',
      resource_id: insertedSignal.id,
      severity: 'info',
      after_state: { signal, alert },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        signal_id: insertedSignal.id,
        instrument,
        direction,
        message: `Signal received for ${instrument}: ${direction}`
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
  // Parse format: "BTCUSDT buy 50000 strength=0.8 sl=49000 tp=52000"
  const parts = text.trim().split(/\s+/);
  const alert: TradingViewAlert = {};

  if (parts.length >= 1) {
    alert.ticker = parts[0];
  }
  if (parts.length >= 2) {
    const action = parts[1].toLowerCase();
    if (['buy', 'sell', 'close', 'neutral'].includes(action)) {
      alert.action = action as 'buy' | 'sell' | 'close' | 'neutral';
    }
  }
  if (parts.length >= 3 && !isNaN(parseFloat(parts[2]))) {
    alert.price = parseFloat(parts[2]);
  }

  // Parse key=value pairs
  for (const part of parts.slice(3)) {
    const [key, value] = part.split('=');
    if (key && value) {
      switch (key.toLowerCase()) {
        case 'strength':
          alert.strength = parseFloat(value);
          break;
        case 'confidence':
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
          alert.position_size_pct = parseFloat(value);
          break;
        case 'strategy':
          alert.strategy = value;
          break;
        case 'comment':
          alert.comment = value;
          break;
        case 'secret':
          alert.secret = value;
          break;
      }
    }
  }

  return alert;
}

function normalizeInstrument(ticker: string): string {
  if (!ticker) return '';
  
  // Common conversions
  const normalized = ticker.toUpperCase()
    .replace('PERP', '')
    .replace('PERPETUAL', '')
    .replace('.P', '')
    .trim();

  // Convert BTCUSDT to BTC-USDT format
  const usdtMatch = normalized.match(/^([A-Z]+)(USDT?)$/);
  if (usdtMatch) {
    return `${usdtMatch[1]}-USDT`;
  }

  const usdMatch = normalized.match(/^([A-Z]+)(USD)$/);
  if (usdMatch) {
    return `${usdMatch[1]}-USD`;
  }

  // If already has dash, return as-is
  if (normalized.includes('-')) {
    return normalized;
  }

  // Default: assume USD pair
  return `${normalized}-USD`;
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

async function createTradeIntent(
  supabase: any,
  alert: TradingViewAlert,
  instrument: string,
  direction: string,
  confidence: number
) {
  try {
    // Get the first active book for external signals
    const { data: book } = await supabase
      .from('books')
      .select('id')
      .eq('status', 'active')
      .eq('type', 'prop')
      .limit(1)
      .single();

    if (!book) {
      console.log('[tradingview-webhook] No active book found for trade intent');
      return;
    }

    // Get or create external signal strategy
    let { data: strategy } = await supabase
      .from('strategies')
      .select('id')
      .eq('name', 'external_signals')
      .limit(1)
      .single();

    if (!strategy) {
      const { data: newStrategy } = await supabase
        .from('strategies')
        .insert({
          name: 'external_signals',
          book_id: book.id,
          timeframe: '1h',
          status: 'paper',
          asset_class: 'crypto',
          config_metadata: { source: 'tradingview' },
        })
        .select()
        .single();
      strategy = newStrategy;
    }

    if (!strategy) return;

    // Calculate position sizing
    const defaultExposure = 5000; // $5k default
    const positionSizePct = alert.position_size_pct || 2; // 2% of portfolio
    const targetExposure = Math.min(defaultExposure, 100000 * (positionSizePct / 100));
    
    // Calculate stop loss
    const price = alert.price || 0;
    const stopLossPct = alert.stop_loss ? Math.abs((alert.stop_loss - price) / price) : 0.02;
    const maxLoss = targetExposure * stopLossPct;

    // Create trade intent
    const intent = {
      book_id: book.id,
      strategy_id: strategy.id,
      instrument,
      direction: direction === 'bullish' ? 'buy' : 'sell',
      target_exposure_usd: targetExposure,
      max_loss_usd: maxLoss,
      confidence,
      horizon_minutes: 240, // 4 hours default
      invalidation_price: alert.stop_loss,
      liquidity_requirement: 'normal',
      status: 'pending',
      metadata: {
        source: 'tradingview',
        strategy: alert.strategy,
        entry_price: alert.price,
        stop_loss: alert.stop_loss,
        take_profit: alert.take_profit,
        comment: alert.comment,
      },
    };

    const { error: intentError } = await supabase
      .from('trade_intents')
      .insert(intent);

    if (intentError) {
      console.error('[tradingview-webhook] Intent creation error:', intentError);
    } else {
      console.log('[tradingview-webhook] Trade intent created for', instrument);
    }

  } catch (error) {
    console.error('[tradingview-webhook] Error creating trade intent:', error);
  }
}
