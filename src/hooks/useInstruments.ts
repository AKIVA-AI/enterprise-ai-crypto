import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InstrumentRow {
  id: string;
  common_symbol: string;
  venue_id: string;
  venue_symbol: string;
  contract_type: string;
}

export function useInstruments() {
  return useQuery({
    queryKey: ['instruments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instruments')
        .select('id, common_symbol, venue_id, venue_symbol, contract_type');

      if (error) throw error;
      return data as InstrumentRow[];
    },
  });
}
