import { MainLayout } from '@/components/layout/MainLayout';
import { strategies } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Plus, Play, Pause, Settings, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const strategyTypeColors: Record<string, string> = {
  momentum: 'bg-chart-1/20 text-chart-1',
  'mean-reversion': 'bg-chart-2/20 text-chart-2',
  arbitrage: 'bg-chart-3/20 text-chart-3',
  'market-making': 'bg-chart-4/20 text-chart-4',
  'trend-following': 'bg-chart-5/20 text-chart-5',
};

export default function Strategies() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LineChart className="h-7 w-7 text-primary" />
              Strategy Library
            </h1>
            <p className="text-muted-foreground">Create, backtest, and deploy trading strategies</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Strategy
          </Button>
        </div>

        {/* Strategy cards */}
        <div className="space-y-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="glass-panel rounded-xl p-6 transition-all hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{strategy.name}</h3>
                    <Badge variant={strategy.status}>{strategy.status}</Badge>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', strategyTypeColors[strategy.type])}>
                      {strategy.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                      <p className="font-mono font-semibold text-lg">{strategy.sharpeRatio.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max Drawdown</p>
                      <p className="font-mono font-semibold text-lg text-destructive">
                        {strategy.maxDrawdown.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                      <p className="font-mono font-semibold text-lg">{strategy.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Trades</p>
                      <p className="font-mono font-semibold text-lg">{strategy.totalTrades.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">P&L</p>
                      <p className={cn(
                        'font-mono font-semibold text-lg flex items-center gap-1',
                        strategy.pnl >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {strategy.pnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        ${Math.abs(strategy.pnl).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="icon">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                  {strategy.status === 'live' ? (
                    <Button variant="outline" size="icon" className="text-warning">
                      <Pause className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="icon" className="text-success">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span>Created by {strategy.author} • {format(strategy.createdAt, 'MMM d, yyyy')}</span>
                {strategy.status === 'live' && (
                  <span className="flex items-center gap-1">
                    <span className="status-dot status-online" />
                    Running
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
