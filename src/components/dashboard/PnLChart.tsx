import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Loader2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PnLDataPoint {
  time: string;
  pnl: number;
  cumulative: number;
  volatility: number;
  regime: 'trending' | 'ranging' | 'volatile';
}

export function PnLChart() {
  const { data: positions, isLoading } = useQuery({
    queryKey: ['positions-pnl'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('unrealized_pnl, realized_pnl, created_at, updated_at')
        .order('updated_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const [showVolatility, setShowVolatility] = useState(true);

  const chartData = useMemo(() => {
    // Generate data with volatility overlay
    const now = new Date();
    const data: PnLDataPoint[] = [];
    let cumulative = 0;
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseVol = 10 + Math.sin(i / 4) * 8;
      const volatility = baseVol + (Math.random() - 0.5) * 5;
      const pnl = (Math.random() - 0.45) * (1000 + volatility * 100);
      cumulative += pnl;
      
      let regime: 'trending' | 'ranging' | 'volatile' = 'ranging';
      if (volatility > 15) regime = 'volatile';
      else if (Math.abs(pnl) > 2000) regime = 'trending';
      
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        pnl: Math.round(pnl),
        cumulative: Math.round(cumulative),
        volatility: Math.round(volatility * 10) / 10,
        regime,
      });
    }

    if (positions?.length) {
      // Use real position data if available
      const hourlyData: Record<string, { pnl: number; count: number }> = {};
      
      positions.forEach(pos => {
        const hour = new Date(pos.updated_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const totalPnl = (pos.unrealized_pnl || 0) + (pos.realized_pnl || 0);
        if (!hourlyData[hour]) {
          hourlyData[hour] = { pnl: 0, count: 0 };
        }
        hourlyData[hour].pnl += totalPnl;
        hourlyData[hour].count += 1;
      });

      let realCumulative = 0;
      return Object.entries(hourlyData).map(([time, { pnl, count }]) => {
        realCumulative += pnl;
        const volatility = Math.abs(pnl) / (count || 1) / 100;
        return { 
          time, 
          pnl: Math.round(pnl), 
          cumulative: Math.round(realCumulative),
          volatility: Math.min(volatility, 25),
          regime: (volatility > 15 ? 'volatile' : volatility > 8 ? 'trending' : 'ranging') as 'trending' | 'ranging' | 'volatile',
        };
      });
    }

    return data;
  }, [positions]);

  const currentRegime = chartData.length > 0 ? chartData[chartData.length - 1].regime : 'ranging';
  const avgVolatility = chartData.reduce((sum, d) => sum + d.volatility, 0) / chartData.length;

  const totalPnL = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0;
  const isPositive = totalPnL >= 0;

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Daily P&L Performance</h3>
          <p className="text-xs text-muted-foreground">Cumulative returns over 24h with volatility</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showVolatility ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowVolatility(!showVolatility)}
          >
            <Activity className="h-3 w-3" />
            Volatility
          </Button>
          <Badge className={cn(
            'text-xs',
            currentRegime === 'volatile' ? 'bg-destructive/20 text-destructive' :
            currentRegime === 'trending' ? 'bg-primary/20 text-primary' :
            'bg-muted text-muted-foreground'
          )}>
            {currentRegime.charAt(0).toUpperCase() + currentRegime.slice(1)}
          </Badge>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
            isPositive 
              ? "bg-success/10 text-success" 
              : "bg-destructive/10 text-destructive"
          )}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{isPositive ? '+' : ''}${totalPnL.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="95%" 
                  stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="pnl"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              width={45}
            />
            {showVolatility && (
              <YAxis 
                yAxisId="vol"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => `${value}%`}
                width={35}
              />
            )}
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'cumulative') return [`$${value.toLocaleString()}`, 'Cumulative P&L'];
                if (name === 'volatility') return [`${value}%`, 'Volatility'];
                return [value, name];
              }}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <ReferenceLine yAxisId="pnl" y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            {showVolatility && (
              <Bar
                yAxisId="vol"
                dataKey="volatility"
                fill="url(#volGradient)"
                radius={[2, 2, 0, 0]}
                opacity={0.6}
              />
            )}
            <Area
              yAxisId="pnl"
              type="monotone"
              dataKey="cumulative"
              stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              strokeWidth={2}
              fill="url(#pnlGradient)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {showVolatility && (
        <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-primary/40" />
            <span>Volatility</span>
          </div>
          <div>Avg: {avgVolatility.toFixed(1)}%</div>
        </div>
      )}
    </Card>
  );
}
