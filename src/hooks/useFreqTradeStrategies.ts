/**
 * Hook for FreqTrade Strategies
 * 
 * Provides access to FreqTrade strategies from the backend:
 * - List available strategies
 * - Get strategy details
 * - Run backtests
 * - Get current signals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { strategiesApi, Strategy, BacktestResult } from '@/lib/apiClient';

export function useFreqTradeStrategies() {
  return useQuery({
    queryKey: ['freqtrade-strategies'],
    queryFn: async () => {
      const response = await strategiesApi.list();
      if (response.error) throw new Error(response.error);
      return response.data || [];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useFreqTradeStrategy(name: string) {
  return useQuery({
    queryKey: ['freqtrade-strategy', name],
    queryFn: async () => {
      const response = await strategiesApi.get(name);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !!name,
  });
}

export function useFreqTradeBacktest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: {
      strategy: string;
      start_date: string;
      end_date: string;
      pairs: string[];
    }) => {
      const response = await strategiesApi.backtest(config);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freqtrade-strategies'] });
    },
  });
}

export function useFreqTradeSignal(strategyName: string, pair: string) {
  return useQuery({
    queryKey: ['freqtrade-signal', strategyName, pair],
    queryFn: async () => {
      const response = await strategiesApi.getSignal(strategyName, pair);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !!strategyName && !!pair,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Available FreqTrade strategies (static list for UI)
export const FREQTRADE_STRATEGIES = [
  {
    name: 'AlphaTrendHMA',
    description: 'AlphaTrend indicator with Hull Moving Average confirmation - adaptive trend following',
    indicators: ['AlphaTrend', 'HMA', 'ATR', 'MFI'],
    timeframe: '15m',
    expectedReturn: '15-30%',
    canShort: false, // US compliance - spot only
    hyperoptable: true,
    params: 7,
  },
  {
    name: 'AlphaTrendVWMA',
    description: 'AlphaTrend with Volume Weighted MA - volume-confirmed trend entries',
    indicators: ['AlphaTrend', 'VWMA', 'ATR', 'MFI'],
    timeframe: '15m',
    expectedReturn: '15-25%',
    canShort: false,
    hyperoptable: true,
    params: 7,
  },
  {
    name: 'ATSSLHybrid',
    description: 'Advanced AT + SSL Channel hybrid with Keltner bands - professional grade multi-variant',
    indicators: ['AlphaTrend', 'SSL', 'Keltner', 'ATR'],
    timeframe: '15m',
    expectedReturn: '20-40%',
    canShort: false,
    hyperoptable: true,
    params: 13,
  },
  {
    name: 'RSIMomentumStrategy',
    description: 'RSI-based momentum strategy with trend confirmation',
    indicators: ['RSI', 'EMA', 'MACD'],
    timeframe: '1h',
    expectedReturn: '15-25%',
  },
  {
    name: 'BollingerMeanReversion',
    description: 'Mean reversion using Bollinger Bands',
    indicators: ['BB', 'RSI', 'Volume'],
    timeframe: '4h',
    expectedReturn: '10-20%',
  },
  {
    name: 'BreakoutStrategy',
    description: 'Support/resistance breakout with volume confirmation',
    indicators: ['ATR', 'Volume', 'Price Action'],
    timeframe: '1h',
    expectedReturn: '20-35%',
  },
  {
    name: 'TrendFollowing',
    description: 'Multi-timeframe trend following strategy',
    indicators: ['EMA', 'ADX', 'MACD'],
    timeframe: '4h',
    expectedReturn: '15-30%',
  },
  {
    name: 'StatisticalArbitrage',
    description: 'Pairs trading based on cointegration',
    indicators: ['Z-Score', 'Correlation', 'Spread'],
    timeframe: '15m',
    expectedReturn: '10-20%',
  },
];

