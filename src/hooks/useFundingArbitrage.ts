import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FundingOpportunity {
  symbol: string;
  spotVenue: string;
  perpVenue: string;
  spotPrice: number;
  perpPrice: number;
  fundingRate: number;
  fundingRateAnnualized: number;
  nextFundingTime: string;
  direction: 'long_spot_short_perp' | 'short_spot_long_perp';
  estimatedApy: number;
  riskLevel: 'low' | 'medium' | 'high';
  netSpread: number;
  isActionable: boolean;
}

export interface FundingPosition {
  id: string;
  symbol: string;
  buy_exchange: string;
  sell_exchange: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  spread_percent: number;
  gross_profit: number;
  net_profit: number;
  status: string;
  created_at: string;
  metadata: Record<string, any>;
}

const annualizeFundingRate = (rate: number) => rate * 3 * 365;

export function useFundingOpportunities() {
  return useQuery({
    queryKey: ['funding-opportunities'],
    queryFn: async () => {
      const { data: basisQuotes, error: basisError } = await supabase
        .from('basis_quotes')
        .select('*')
        .order('ts', { ascending: false })
        .limit(200);

      if (basisError) throw basisError;

      const instrumentIds = Array.from(new Set((basisQuotes ?? []).map((quote) => quote.instrument_id)));
      const venueIds = Array.from(
        new Set(
          (basisQuotes ?? []).flatMap((quote) => [quote.spot_venue_id, quote.deriv_venue_id])
        )
      );

      const [{ data: instruments, error: instrumentError }, { data: venues, error: venueError }, { data: fundingRates, error: fundingError }] =
        await Promise.all([
          instrumentIds.length
            ? supabase
                .from('instruments')
                .select('id, common_symbol')
                .in('id', instrumentIds)
            : Promise.resolve({ data: [], error: null }),
          venueIds.length
            ? supabase
                .from('venues')
                .select('id, name')
                .in('id', venueIds)
            : Promise.resolve({ data: [], error: null }),
          instrumentIds.length && venueIds.length
            ? supabase
                .from('funding_rates')
                .select('instrument_id, venue_id, funding_rate, funding_time')
                .in('instrument_id', instrumentIds)
                .in('venue_id', venueIds)
                .order('funding_time', { ascending: false })
                .limit(500)
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (instrumentError) throw instrumentError;
      if (venueError) throw venueError;
      if (fundingError) throw fundingError;

      const instrumentMap = new Map<string, string>();
      instruments?.forEach((instrument) => instrumentMap.set(instrument.id, instrument.common_symbol));

      const venueMap = new Map<string, string>();
      venues?.forEach((venue) => venueMap.set(venue.id, venue.name));

      const fundingMap = new Map<string, { funding_rate: number; funding_time: string }>();
      fundingRates?.forEach((rate) => {
        const key = `${rate.instrument_id}:${rate.venue_id}`;
        if (!fundingMap.has(key)) {
          fundingMap.set(key, {
            funding_rate: Number(rate.funding_rate),
            funding_time: rate.funding_time,
          });
        }
      });

      const opportunities = (basisQuotes ?? []).map((quote) => {
        const symbol = instrumentMap.get(quote.instrument_id) ?? 'UNKNOWN';
        const spotVenue = venueMap.get(quote.spot_venue_id) ?? 'Unknown';
        const perpVenue = venueMap.get(quote.deriv_venue_id) ?? 'Unknown';
        const funding = fundingMap.get(`${quote.instrument_id}:${quote.deriv_venue_id}`);
        const fundingRate = funding?.funding_rate ?? 0;
        const fundingRateAnnualized = annualizeFundingRate(fundingRate);
        const spotPrice = (Number(quote.spot_bid) + Number(quote.spot_ask)) / 2;
        const perpPrice = (Number(quote.perp_bid) + Number(quote.perp_ask)) / 2;
        const basisBps = Number(quote.basis_bps);
        const netSpread = basisBps / 100;
        const direction = basisBps >= 0 ? 'long_spot_short_perp' : 'short_spot_long_perp';
        const basisZ = Math.abs(Number(quote.basis_z));
        const riskLevel = basisZ >= 2 ? 'high' : basisZ >= 1 ? 'medium' : 'low';
        const estimatedApy = fundingRateAnnualized * 100;
        const isActionable = Math.abs(basisBps) >= 10 && Math.abs(estimatedApy) >= 1;

        return {
          symbol,
          spotVenue,
          perpVenue,
          spotPrice,
          perpPrice,
          fundingRate,
          fundingRateAnnualized,
          nextFundingTime: funding?.funding_time ?? quote.ts,
          direction,
          estimatedApy,
          riskLevel,
          netSpread,
          isActionable,
        } as FundingOpportunity;
      });

      return {
        opportunities,
        actionable: opportunities.filter((opp) => opp.isActionable).length,
        total: opportunities.length,
      };
    },
    refetchInterval: 60 * 1000,
  });
}

export function useFundingHistory(symbol: string) {
  return useQuery({
    queryKey: ['funding-history', symbol],
    queryFn: async () => {
      const { data: instruments, error: instrumentError } = await supabase
        .from('instruments')
        .select('id, common_symbol')
        .eq('common_symbol', symbol)
        .limit(10);

      if (instrumentError) throw instrumentError;

      const instrumentIds = instruments?.map((instrument) => instrument.id) ?? [];
      if (instrumentIds.length === 0) return [];

      const { data, error } = await supabase
        .from('funding_rates')
        .select('*')
        .in('instrument_id', instrumentIds)
        .order('funding_time', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data;
    },
    enabled: !!symbol,
  });
}

export function useActiveFundingPositions() {
  return useQuery({
    queryKey: ['active-funding-positions'],
    queryFn: async () => [],
    refetchInterval: 30 * 1000,
  });
}

export function useExecuteFundingArb() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      throw new Error('Execution is handled by the OMS.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-funding-positions'] });
    },
    onError: (error) => {
      toast.error(`Execution unavailable: ${error.message}`);
    },
  });
}

export function useCloseFundingPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      throw new Error('Position management is handled by the OMS.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-funding-positions'] });
    },
    onError: (error) => {
      toast.error(`Close unavailable: ${error.message}`);
    },
  });
}
