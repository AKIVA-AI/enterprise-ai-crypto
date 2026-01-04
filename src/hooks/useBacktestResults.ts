import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface BacktestRequest {
  strategyName: string;
  instruments: string[];
  startDate: string;
  endDate: string;
  initialCapital?: number;
  timeframe?: string;
  slippageBps?: number;
  commissionBps?: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  maxDrawdownDurationDays: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  volatility: number;
  var95: number;
  cvar95: number;
}

export interface EquityPoint {
  timestamp: string;
  equity: number;
  drawdown: number;
  positionValue: number;
  cash: number;
}

export interface BacktestSummary {
  id: string;
  strategyName: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  executionTimeSeconds: number;
  initialCapital: number;
  finalEquity: number;
  totalReturn: number;
  totalTrades: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  hasInSample: boolean;
  hasOutSample: boolean;
}

export interface BacktestDetail {
  id: string;
  strategyName: string;
  instruments: string[];
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalEquity: number;
  metrics: PerformanceMetrics;
  inSampleMetrics: PerformanceMetrics | null;
  outSampleMetrics: PerformanceMetrics | null;
  createdAt: string;
  executionTimeSeconds: number;
}

// API base URL
const API_BASE = '/api/backtest';

// Helper for API calls
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
}

/**
 * Hook to run a new backtest
 */
export function useRunBacktest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: BacktestRequest): Promise<BacktestSummary> => {
      return fetchApi<BacktestSummary>(`${API_BASE}/run`, {
        method: 'POST',
        body: JSON.stringify({
          strategy_name: request.strategyName,
          instruments: request.instruments,
          start_date: request.startDate,
          end_date: request.endDate,
          initial_capital: request.initialCapital ?? 100000,
          timeframe: request.timeframe ?? '1h',
          slippage_bps: request.slippageBps ?? 5,
          commission_bps: request.commissionBps ?? 10,
        }),
      });
    },
    onSuccess: () => {
      // Invalidate backtest list
      queryClient.invalidateQueries({ queryKey: ['backtests'] });
    },
  });
}

/**
 * Hook to get backtest details
 */
export function useBacktestDetail(backtestId: string | undefined) {
  return useQuery({
    queryKey: ['backtest', backtestId],
    queryFn: async (): Promise<BacktestDetail> => {
      if (!backtestId) throw new Error('No backtest ID');
      return fetchApi<BacktestDetail>(`${API_BASE}/${backtestId}`);
    },
    enabled: !!backtestId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get equity curve data for charting
 */
export function useEquityCurve(backtestId: string | undefined, sampleRate: number = 1) {
  return useQuery({
    queryKey: ['backtest', backtestId, 'equity-curve', sampleRate],
    queryFn: async (): Promise<EquityPoint[]> => {
      if (!backtestId) throw new Error('No backtest ID');
      const response = await fetchApi<{ data: EquityPoint[] }>(
        `${API_BASE}/${backtestId}/equity-curve?sample_rate=${sampleRate}`
      );
      return response.data;
    },
    enabled: !!backtestId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to list all backtests
 */
export function useBacktestList(strategyName?: string, limit: number = 20) {
  return useQuery({
    queryKey: ['backtests', strategyName, limit],
    queryFn: async (): Promise<BacktestSummary[]> => {
      const params = new URLSearchParams();
      if (strategyName) params.set('strategy_name', strategyName);
      params.set('limit', limit.toString());
      
      return fetchApi<BacktestSummary[]>(`${API_BASE}/list?${params}`);
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
