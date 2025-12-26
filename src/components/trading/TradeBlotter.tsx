import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Activity, TrendingUp, TrendingDown, Clock, Gauge, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Fill {
  id: string;
  order_id: string;
  instrument: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  fee: number;
  executed_at: string;
  venue_id: string | null;
  venues?: { name: string } | null;
}

interface ExecutionMetrics {
  avgLatency: number;
  avgSlippage: number;
  fillRate: number;
  totalVolume: number;
}

export function TradeBlotter() {
  const [metrics, setMetrics] = useState<ExecutionMetrics>({
    avgLatency: 0,
    avgSlippage: 0,
    fillRate: 0,
    totalVolume: 0,
  });

  const { data: fills = [], refetch } = useQuery({
    queryKey: ['fills-blotter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fills')
        .select('*, venues(name)')
        .order('executed_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Fill[];
    },
  });

  // Fetch orders for execution quality metrics
  const { data: orders = [] } = useQuery({
    queryKey: ['orders-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate execution metrics
  useEffect(() => {
    if (orders.length === 0) return;

    const filledOrders = orders.filter(o => o.status === 'filled');
    const ordersWithLatency = orders.filter(o => o.latency_ms != null);
    const ordersWithSlippage = orders.filter(o => o.slippage != null);

    const avgLatency = ordersWithLatency.length > 0 
      ? ordersWithLatency.reduce((sum, o) => sum + (o.latency_ms || 0), 0) / ordersWithLatency.length 
      : 0;

    const avgSlippage = ordersWithSlippage.length > 0 
      ? ordersWithSlippage.reduce((sum, o) => sum + Math.abs(o.slippage || 0), 0) / ordersWithSlippage.length 
      : 0;

    const fillRate = orders.length > 0 ? (filledOrders.length / orders.length) * 100 : 0;

    const totalVolume = fills.reduce((sum, f) => sum + (f.size * f.price), 0);

    setMetrics({ avgLatency, avgSlippage, fillRate, totalVolume });
  }, [orders, fills]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('fills-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fills' },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Trade Blotter
          </span>
          <Badge variant="outline" className="font-mono">
            {fills.length} fills
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Execution Quality Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              Avg Latency
            </div>
            <div className="text-lg font-mono font-semibold">
              {metrics.avgLatency.toFixed(0)}
              <span className="text-xs text-muted-foreground ml-1">ms</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="h-3 w-3" />
              Avg Slippage
            </div>
            <div className={cn(
              'text-lg font-mono font-semibold',
              metrics.avgSlippage > 0.5 ? 'text-warning' : 'text-success'
            )}>
              {metrics.avgSlippage.toFixed(2)}
              <span className="text-xs text-muted-foreground ml-1">%</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Gauge className="h-3 w-3" />
              Fill Rate
            </div>
            <div className={cn(
              'text-lg font-mono font-semibold',
              metrics.fillRate >= 90 ? 'text-success' : metrics.fillRate >= 70 ? 'text-warning' : 'text-destructive'
            )}>
              {metrics.fillRate.toFixed(1)}
              <span className="text-xs text-muted-foreground ml-1">%</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Activity className="h-3 w-3" />
              Volume
            </div>
            <div className="text-lg font-mono font-semibold">
              ${(metrics.totalVolume / 1000).toFixed(1)}k
            </div>
          </div>
        </div>

        {/* Fills List */}
        <ScrollArea className="h-[400px]">
          {fills.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No fills yet</p>
              <p className="text-xs">Executed trades will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fills.map((fill) => (
                <div
                  key={fill.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      fill.side === 'buy' ? 'bg-success/20' : 'bg-destructive/20'
                    )}>
                      {fill.side === 'buy' ? (
                        <TrendingUp className={cn('h-4 w-4', 'text-success')} />
                      ) : (
                        <TrendingDown className={cn('h-4 w-4', 'text-destructive')} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{fill.instrument}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs',
                            fill.side === 'buy' ? 'border-success/50 text-success' : 'border-destructive/50 text-destructive'
                          )}
                        >
                          {fill.side.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fill.venues?.name || 'Unknown venue'} • {formatDistanceToNow(new Date(fill.executed_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-medium">
                      {Number(fill.size).toFixed(4)} @ ${Number(fill.price).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fee: ${Number(fill.fee).toFixed(4)} • 
                      <span className="ml-1 font-mono">
                        ${(Number(fill.size) * Number(fill.price)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
