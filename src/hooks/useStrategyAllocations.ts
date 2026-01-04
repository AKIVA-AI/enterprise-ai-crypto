import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StrategyAllocationRow {
  id: string;
  strategy_id: string;
  allocated_capital: number;
  allocation_pct: number;
  leverage_cap: number;
  risk_multiplier: number;
  updated_at: string;
}

export function useStrategyAllocations(limit = 50) {
  return useQuery({
    queryKey: ['strategy-allocations', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategy_allocations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as StrategyAllocationRow[];
    },
    refetchInterval: 15000,
  });
}
