import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketRegimeRow {
  id: string;
  direction: string;
  volatility: string;
  liquidity: string;
  risk_bias: string;
  regime_state: Record<string, unknown>;
  ts: string;
}

export function useMarketRegimes(limit = 25) {
  return useQuery({
    queryKey: ['market-regimes', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_regimes')
        .select('*')
        .order('ts', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as MarketRegimeRow[];
    },
    refetchInterval: 15000,
  });
}
