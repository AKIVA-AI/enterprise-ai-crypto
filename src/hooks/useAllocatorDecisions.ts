import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AllocatorDecisionRow {
  id: string;
  decision_id: string;
  regime_state: Record<string, unknown>;
  allocation_snapshot_json: Record<string, unknown>;
  rationale_json: Record<string, unknown>;
  ts: string;
}

export function useAllocatorDecisions(limit = 20) {
  return useQuery({
    queryKey: ['allocator-decisions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allocator_decisions')
        .select('*')
        .order('ts', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AllocatorDecisionRow[];
    },
    refetchInterval: 20000,
  });
}
