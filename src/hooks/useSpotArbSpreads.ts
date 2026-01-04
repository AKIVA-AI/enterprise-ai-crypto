import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpotArbSpreadRow {
  id: string;
  instrument_id: string;
  buy_venue_id: string;
  sell_venue_id: string;
  executable_spread_bps: number;
  net_edge_bps: number;
  liquidity_score: number;
  latency_score: number;
  ts: string;
}

export function useSpotArbSpreads(enabled = true) {
  return useQuery({
    queryKey: ['spot-arb-spreads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arb_spreads')
        .select('*')
        .order('ts', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SpotArbSpreadRow[];
    },
    enabled,
    refetchInterval: enabled ? 10000 : false,
  });
}
