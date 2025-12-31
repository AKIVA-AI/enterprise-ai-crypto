import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FactorScores {
  technical: number;
  sentiment: number;
  onchain: number;
  derivatives: number;
  market_structure: number;
}

export interface ScoredSignal {
  id?: string;
  instrument: string;
  composite_score: number;
  factor_scores: FactorScores;
  direction: 'bullish' | 'bearish' | 'neutral';
  reasoning: string;
  tier: number;
  venue: string;
  product_type: string;
  is_high_probability: boolean;
  created_at?: string;
  expires_at?: string;
}

export interface TradeableInstrument {
  id: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  venue: string;
  product_type: string;
  tier: number;
  is_us_compliant: boolean;
  is_active: boolean;
  volume_24h: number;
}

interface ScanFilters {
  tier?: number;
  venue?: string;
  product_type?: string;
}

export function useTradeableInstruments(filters?: ScanFilters) {
  return useQuery({
    queryKey: ['tradeable-instruments', filters],
    queryFn: async () => {
      let query = supabase
        .from('tradeable_instruments')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true })
        .order('volume_24h', { ascending: false });

      if (filters?.tier) {
        query = query.lte('tier', filters.tier);
      }
      if (filters?.venue) {
        query = query.eq('venue', filters.venue);
      }
      if (filters?.product_type) {
        query = query.eq('product_type', filters.product_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TradeableInstrument[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useHighProbabilitySignals(filters?: ScanFilters) {
  return useQuery({
    queryKey: ['high-probability-signals', filters],
    queryFn: async () => {
      let query = supabase
        .from('intelligence_signals')
        .select('*')
        .eq('is_high_probability', true)
        .gte('expires_at', new Date().toISOString())
        .order('composite_score', { ascending: false });

      if (filters?.tier) {
        query = query.lte('tier', filters.tier);
      }
      if (filters?.venue) {
        query = query.eq('venue', filters.venue);
      }
      if (filters?.product_type) {
        query = query.eq('product_type', filters.product_type);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;

      return (data || []).map(signal => ({
        ...signal,
        factor_scores: signal.factor_scores as unknown as FactorScores,
        direction: signal.direction as 'bullish' | 'bearish' | 'neutral',
      })) as ScoredSignal[];
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useAllScoredSignals(filters?: ScanFilters) {
  return useQuery({
    queryKey: ['all-scored-signals', filters],
    queryFn: async () => {
      let query = supabase
        .from('intelligence_signals')
        .select('*')
        .not('composite_score', 'is', null)
        .gte('expires_at', new Date().toISOString())
        .order('composite_score', { ascending: false });

      if (filters?.tier) {
        query = query.lte('tier', filters.tier);
      }
      if (filters?.venue) {
        query = query.eq('venue', filters.venue);
      }
      if (filters?.product_type) {
        query = query.eq('product_type', filters.product_type);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      return (data || []).map(signal => ({
        ...signal,
        factor_scores: signal.factor_scores as unknown as FactorScores,
        direction: signal.direction as 'bullish' | 'bearish' | 'neutral',
      })) as ScoredSignal[];
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useScanOpportunities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filters?: ScanFilters) => {
      const { data, error } = await supabase.functions.invoke('signal-scoring', {
        body: {
          action: 'scan_opportunities',
          tier: filters?.tier,
          venue: filters?.venue,
          product_type: filters?.product_type
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['high-probability-signals'] });
      queryClient.invalidateQueries({ queryKey: ['all-scored-signals'] });
      toast.success(`Scanned ${data.scanned} instruments, found ${data.high_probability} high-probability opportunities`);
    },
    onError: (error) => {
      toast.error(`Scan failed: ${error.message}`);
    }
  });
}

export function useComputeScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instruments: string[]) => {
      const { data, error } = await supabase.functions.invoke('signal-scoring', {
        body: {
          action: 'compute_scores',
          instruments
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['high-probability-signals'] });
      queryClient.invalidateQueries({ queryKey: ['all-scored-signals'] });
    },
    onError: (error) => {
      toast.error(`Score computation failed: ${error.message}`);
    }
  });
}
