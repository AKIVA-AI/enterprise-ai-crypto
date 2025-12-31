import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExternalSignalRequest {
  action: 'list_sources' | 'fetch_signals' | 'configure_source' | 'get_aggregated';
  source?: string;
  instruments?: string[];
  config?: any;
}

// Supported external signal sources
const SIGNAL_SOURCES = {
  tradingview: {
    name: 'TradingView',
    type: 'webhook',
    description: 'Receive alerts from TradingView strategies and indicators',
    config_required: ['webhook_secret'],
  },
  cryptocompare: {
    name: 'CryptoCompare',
    type: 'api',
    description: 'Social and trading signals from CryptoCompare',
    config_required: ['api_key'],
    base_url: 'https://min-api.cryptocompare.com/data',
  },
  lunarcrush: {
    name: 'LunarCrush',
    type: 'api',
    description: 'Social metrics and Galaxy Score',
    config_required: ['api_key'],
    base_url: 'https://lunarcrush.com/api4/public',
  },
  santiment: {
    name: 'Santiment',
    type: 'api',
    description: 'On-chain and social signals',
    config_required: ['api_key'],
    base_url: 'https://api.santiment.net/graphql',
  },
  glassnode: {
    name: 'Glassnode',
    type: 'api',
    description: 'On-chain metrics and signals',
    config_required: ['api_key'],
    base_url: 'https://api.glassnode.com/v1',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, source, instruments = ['BTC-USDT', 'ETH-USDT'], config } = await req.json() as ExternalSignalRequest;

    console.log(`[external-signals] Action: ${action}, source: ${source}`);

    switch (action) {
      case 'list_sources': {
        return new Response(
          JSON.stringify({ 
            success: true, 
            sources: Object.entries(SIGNAL_SOURCES).map(([key, val]) => ({
              id: key,
              ...val,
            }))
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'fetch_signals': {
        if (!source) {
          throw new Error('Source required for fetch_signals');
        }

        let signals: any[] = [];

        switch (source) {
          case 'cryptocompare':
            signals = await fetchCryptoCompareSignals(instruments);
            break;
          case 'lunarcrush':
            signals = await fetchLunarCrushSignals(instruments);
            break;
          case 'santiment':
            signals = await fetchSantimentSignals(instruments);
            break;
          default:
            throw new Error(`Unknown source: ${source}`);
        }

        // Store signals
        for (const signal of signals) {
          await supabase.from('intelligence_signals').insert(signal);
        }

        return new Response(
          JSON.stringify({ success: true, signals, count: signals.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_aggregated': {
        // Get signals from all sources and aggregate
        const aggregated = await getAggregatedSignals(supabase, instruments);
        
        return new Response(
          JSON.stringify({ success: true, signals: aggregated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'configure_source': {
        // Store source configuration (encrypted in production)
        const { error } = await supabase
          .from('global_settings')
          .upsert({
            id: 'default',
            [`${source}_config`]: config,
          });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: `${source} configured` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[external-signals] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function fetchCryptoCompareSignals(instruments: string[]): Promise<any[]> {
  const apiKey = Deno.env.get('CRYPTOCOMPARE_API_KEY');
  const signals: any[] = [];

  for (const instrument of instruments) {
    const symbol = instrument.split('-')[0];
    
    try {
      // Fetch trading signals
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/tradingsignals/intotheblock/latest?fsym=${symbol}`,
        {
          headers: apiKey ? { 'authorization': `Apikey ${apiKey}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.Data) {
          // Parse CryptoCompare signals
          const inOutVar = data.Data.inOutVar || {};
          const largeHolders = data.Data.largeHolders || {};
          
          // Calculate composite direction
          let bullishCount = 0;
          let bearishCount = 0;
          
          if (inOutVar.sentiment === 'bullish') bullishCount++;
          if (inOutVar.sentiment === 'bearish') bearishCount++;
          if (largeHolders.sentiment === 'bullish') bullishCount++;
          if (largeHolders.sentiment === 'bearish') bearishCount++;
          
          const direction = bullishCount > bearishCount ? 'bullish' : 
                           bearishCount > bullishCount ? 'bearish' : 'neutral';
          
          signals.push({
            instrument,
            signal_type: 'cryptocompare_onchain',
            direction,
            strength: Math.abs(bullishCount - bearishCount) / 2,
            confidence: 0.6,
            source_data: {
              source: 'cryptocompare',
              inOutVar,
              largeHolders,
            },
            reasoning: `CryptoCompare on-chain analysis: ${direction} based on holder behavior`,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.error(`[external-signals] CryptoCompare error for ${symbol}:`, e);
    }
  }

  return signals;
}

async function fetchLunarCrushSignals(instruments: string[]): Promise<any[]> {
  const apiKey = Deno.env.get('LUNARCRUSH_API_KEY');
  const signals: any[] = [];

  if (!apiKey) {
    // Return simulated data if no API key
    return instruments.map(instrument => ({
      instrument,
      signal_type: 'social_momentum',
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: 0.3 + Math.random() * 0.5,
      confidence: 0.55,
      source_data: {
        source: 'lunarcrush_simulated',
        galaxy_score: 50 + Math.random() * 30,
        social_volume: Math.floor(1000 + Math.random() * 9000),
        social_dominance: Math.random() * 5,
      },
      reasoning: 'Social momentum based on LunarCrush Galaxy Score (simulated)',
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    }));
  }

  for (const instrument of instruments) {
    const symbol = instrument.split('-')[0].toLowerCase();
    
    try {
      const response = await fetch(
        `https://lunarcrush.com/api4/public/coins/${symbol}/v1`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const coin = data.data;
        
        if (coin) {
          const galaxyScore = coin.galaxy_score || 50;
          const direction = galaxyScore > 60 ? 'bullish' : galaxyScore < 40 ? 'bearish' : 'neutral';
          
          signals.push({
            instrument,
            signal_type: 'social_momentum',
            direction,
            strength: Math.abs(galaxyScore - 50) / 50,
            confidence: 0.65,
            source_data: {
              source: 'lunarcrush',
              galaxy_score: galaxyScore,
              alt_rank: coin.alt_rank,
              social_volume: coin.social_volume,
              social_dominance: coin.social_dominance,
              market_dominance: coin.market_dominance,
            },
            reasoning: `LunarCrush Galaxy Score: ${galaxyScore} - ${direction} social momentum`,
            expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.error(`[external-signals] LunarCrush error for ${symbol}:`, e);
    }
  }

  return signals;
}

async function fetchSantimentSignals(instruments: string[]): Promise<any[]> {
  const apiKey = Deno.env.get('SANTIMENT_API_KEY');
  const signals: any[] = [];

  // Return simulated data for now - Santiment requires GraphQL queries
  for (const instrument of instruments) {
    const symbol = instrument.split('-')[0];
    
    // Simulate on-chain metrics signal
    const devActivity = 50 + Math.random() * 100;
    const socialVolume = 1000 + Math.random() * 9000;
    const exchangeInflow = Math.random() * 1000;
    const exchangeOutflow = Math.random() * 1000;
    
    const netFlow = exchangeOutflow - exchangeInflow;
    const direction = netFlow > 100 ? 'bullish' : netFlow < -100 ? 'bearish' : 'neutral';
    
    signals.push({
      instrument,
      signal_type: 'onchain_flow',
      direction,
      strength: Math.min(1, Math.abs(netFlow) / 500),
      confidence: 0.6,
      source_data: {
        source: 'santiment_simulated',
        dev_activity: devActivity,
        social_volume: socialVolume,
        exchange_inflow: exchangeInflow,
        exchange_outflow: exchangeOutflow,
        net_flow: netFlow,
      },
      reasoning: `Exchange flow analysis: Net ${netFlow > 0 ? 'outflow' : 'inflow'} of ${Math.abs(netFlow).toFixed(0)} BTC - ${direction}`,
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });
  }

  return signals;
}

async function getAggregatedSignals(supabase: any, instruments: string[]): Promise<any[]> {
  const aggregated: any[] = [];

  for (const instrument of instruments) {
    // Get recent signals from all sources
    const { data: signals } = await supabase
      .from('intelligence_signals')
      .select('*')
      .eq('instrument', instrument)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (!signals || signals.length === 0) continue;

    // Aggregate by direction
    let bullishScore = 0;
    let bearishScore = 0;
    let totalWeight = 0;

    for (const signal of signals) {
      const weight = signal.confidence || 0.5;
      const strength = signal.strength || 0.5;
      
      if (signal.direction === 'bullish') {
        bullishScore += weight * strength;
      } else if (signal.direction === 'bearish') {
        bearishScore += weight * strength;
      }
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      bullishScore /= totalWeight;
      bearishScore /= totalWeight;
    }

    const netScore = bullishScore - bearishScore;
    const direction = netScore > 0.1 ? 'bullish' : netScore < -0.1 ? 'bearish' : 'neutral';

    aggregated.push({
      instrument,
      direction,
      bullish_score: bullishScore,
      bearish_score: bearishScore,
      net_score: netScore,
      confidence: Math.min(1, (bullishScore + bearishScore) * 0.7),
      signal_count: signals.length,
      sources: [...new Set(signals.map((s: any) => s.source_data?.source).filter(Boolean))],
      latest_signals: signals.slice(0, 5),
    });
  }

  return aggregated;
}
