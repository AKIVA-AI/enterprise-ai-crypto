import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetric {
  id: string;
  function_name: string;
  endpoint: string | null;
  latency_ms: number;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  metadata: Record<string, unknown>;
  recorded_at: string;
}

export interface MetricsSummary {
  functionName: string;
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorCount: number;
}

export function usePerformanceMetrics(functionName?: string, timeRangeMinutes = 60) {
  return useQuery({
    queryKey: ['performance-metrics', functionName, timeRangeMinutes],
    queryFn: async () => {
      const since = new Date(Date.now() - timeRangeMinutes * 60 * 1000).toISOString();
      
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: false })
        .limit(500);
      
      if (functionName) {
        query = query.eq('function_name', functionName);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[Metrics] Query error:', error);
        throw error;
      }
      
      return (data || []) as PerformanceMetric[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });
}

export function useMetricsSummary(timeRangeMinutes = 60) {
  const { data: metrics, isLoading, error } = usePerformanceMetrics(undefined, timeRangeMinutes);
  
  const summary: MetricsSummary[] = [];
  
  if (metrics) {
    // Group by function name
    const grouped = metrics.reduce((acc, m) => {
      if (!acc[m.function_name]) {
        acc[m.function_name] = [];
      }
      acc[m.function_name].push(m);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);
    
    for (const [functionName, functionMetrics] of Object.entries(grouped)) {
      const successCount = functionMetrics.filter(m => m.success).length;
      const errorCount = functionMetrics.length - successCount;
      const latencies = functionMetrics.map(m => m.latency_ms).sort((a, b) => a - b);
      
      const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
      const p95Index = Math.floor(latencies.length * 0.95);
      const p95Latency = latencies[p95Index] || latencies[latencies.length - 1] || 0;
      
      summary.push({
        functionName,
        totalCalls: functionMetrics.length,
        successRate: (successCount / functionMetrics.length) * 100,
        avgLatencyMs: Math.round(avgLatency),
        p95LatencyMs: Math.round(p95Latency),
        errorCount,
      });
    }
  }
  
  return {
    summary: summary.sort((a, b) => b.totalCalls - a.totalCalls),
    isLoading,
    error,
  };
}
