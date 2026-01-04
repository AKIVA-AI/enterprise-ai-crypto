import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StrategyPositionRow {
  id: string;
  strategy_id: string;
  instrument_id: string;
  spot_position: number;
  deriv_position: number;
  avg_entry_basis_bps: number;
  hedged_ratio: number;
  updated_at: string;
  strategies?: { name: string } | null;
  instruments?: { common_symbol: string } | null;
}

export function useStrategyPositions(limit = 50) {
  return useQuery({
    queryKey: ['strategy-positions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategy_positions')
        .select('*, strategies(name), instruments(common_symbol)')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as StrategyPositionRow[];
    },
    refetchInterval: 15000,
  });
}
