import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useArbPnlAnalytics } from '@/hooks/useArbPnlAnalytics';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

export function PnLAnalyticsDashboard() {
  const {
    data,
    isLoading,
    refetch,
  } = useArbPnlAnalytics();

  const stats = data?.stats;
  const history = data?.history ?? [];
  const dailyPnL = data?.dailyPnL ?? 0;

  const chartData = history.map((entry, index) => {
    const runningPnL = history
      .slice(0, index + 1)
      .reduce((sum, e) => sum + e.pnl, 0);
    return {
      time: new Date(entry.timestamp).toLocaleTimeString(),
      pnl: entry.pnl,
      cumulative: runningPnL,
      symbol: entry.symbol,
    };
  });

  if (isLoading) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              P&L Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className={cn(
                'text-3xl font-bold font-mono',
                dailyPnL >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Today's Net P&L</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-success/10">
                <div className="text-xl font-bold text-success font-mono">
                  ${stats?.totalProfit.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-muted-foreground">Total Profit</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-destructive/10">
                <div className="text-xl font-bold text-destructive font-mono">
                  -${stats?.totalLoss.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-muted-foreground">Total Loss</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trades</span>
                <span className="font-mono">{stats?.tradesExecuted || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-mono">{stats?.winRate.toFixed(1) || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Trading Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xl font-bold">{stats?.tradesExecuted || 0}</div>
                <div className="text-xs text-muted-foreground">Trades Today</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className={cn(
                  'text-xl font-bold',
                  (stats?.winRate || 0) >= 50 ? 'text-success' : 'text-destructive'
                )}>
                  {stats?.winRate.toFixed(1) || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-success" />
                  Avg Win
                </span>
                <span className="font-mono text-success">
                  ${stats?.avgWin.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  Avg Loss
                </span>
                <span className="font-mono text-destructive">
                  -${stats?.avgLoss.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit Factor</span>
                <span className={cn(
                  'font-mono',
                  (stats?.profitFactor || 0) >= 1.5 ? 'text-success' :
                  (stats?.profitFactor || 0) >= 1 ? 'text-warning' : 'text-destructive'
                )}>
                  {stats?.profitFactor === Infinity ? 'Inf' : stats?.profitFactor.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Drawdown</span>
                <span className="font-mono text-destructive">
                  -${stats?.maxDrawdown.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 text-sm">
              <Badge variant="outline" className="gap-1 border-success text-success">
                <CheckCircle2 className="h-3 w-3" />
                {stats?.winCount || 0} Wins
              </Badge>
              <Badge variant="outline" className="gap-1 border-destructive text-destructive">
                <AlertTriangle className="h-3 w-3" />
                {stats?.lossCount || 0} Losses
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cumulative P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(var(--success))"
                    fill="url(#pnlGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Recent Trades
              </span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => refetch()}
              >
                Refresh
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(-10).reverse().map((entry) => (
                <div
                  key={entry.tradeId}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {entry.symbol}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className={cn(
                    'font-mono text-sm',
                    entry.pnl >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
