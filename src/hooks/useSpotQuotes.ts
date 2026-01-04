import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpotQuoteRow {
  id: string;
  instrument_id: string;
  venue_id: string;
  bid_price: number;
  ask_price: number;
  bid_size: number;
  ask_size: number;
  spread_bps: number;
  ts: string;
}

export function useSpotQuotes(instrumentIds: string[], enabled = true) {
  return useQuery({
    queryKey: ['spot-quotes', instrumentIds],
    queryFn: async () => {
      if (instrumentIds.length === 0) return [];

      const { data, error } = await supabase
        .from('spot_quotes')
        .select('*')
        .in('instrument_id', instrumentIds)
        .order('ts', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as SpotQuoteRow[];
    },
    enabled: enabled && instrumentIds.length > 0,
    refetchInterval: enabled ? 5000 : false,
  });
}
