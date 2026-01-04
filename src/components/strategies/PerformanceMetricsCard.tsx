import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown, Activity, Target, Shield, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformanceMetrics } from '@/hooks/useBacktestResults';

interface PerformanceMetricsCardProps {
  metrics: PerformanceMetrics | undefined | null;
  isLoading?: boolean;
  error?: Error | null;
  title?: string;
  description?: string;
  compact?: boolean;
}

interface MetricItemProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  good?: boolean;
  bad?: boolean;
  neutral?: boolean;
  tooltip?: string;
}

// Format helpers
const formatPercent = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Single metric display
function MetricItem({ label, value, icon, good, bad, neutral }: MetricItemProps) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          'text-lg font-semibold',
          good && 'text-green-600 dark:text-green-400',
          bad && 'text-red-600 dark:text-red-400',
          neutral && 'text-foreground'
        )}
      >
        {value}
      </span>
    </div>
  );
}

// Loading skeleton
function MetricsSkeleton({ compact }: { compact: boolean }) {
  const count = compact ? 6 : 12;
  return (
    <div className={cn(
      'grid gap-4',
      compact ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export function PerformanceMetricsCard({
  metrics,
  isLoading = false,
  error = null,
  title = 'Performance Metrics',
  description = 'Key performance indicators',
  compact = false,
}: PerformanceMetricsCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {!compact && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <MetricsSkeleton compact={compact} />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load metrics: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No metrics available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine if values are good/bad
  const isSharpeGood = metrics.sharpeRatio > 1;
  const isSharpeBad = metrics.sharpeRatio < 0;
  const isReturnGood = metrics.totalReturn > 0;
  const isReturnBad = metrics.totalReturn < 0;
  const isDrawdownBad = metrics.maxDrawdown > 0.2;
  const isWinRateGood = metrics.winRate > 0.5;
  const isProfitFactorGood = metrics.profitFactor > 1.5;

  // Compact view (6 metrics)
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <MetricItem
              label="Total Return"
              value={formatPercent(metrics.totalReturn)}
              icon={<TrendingUp className="h-3 w-3" />}
              good={isReturnGood}
              bad={isReturnBad}
            />
            <MetricItem
              label="Sharpe"
              value={formatNumber(metrics.sharpeRatio)}
              icon={<Activity className="h-3 w-3" />}
              good={isSharpeGood}
              bad={isSharpeBad}
            />
            <MetricItem
              label="Max DD"
              value={formatPercent(metrics.maxDrawdown)}
              icon={<TrendingDown className="h-3 w-3" />}
              bad={isDrawdownBad}
              neutral={!isDrawdownBad}
            />
            <MetricItem
              label="Win Rate"
              value={formatPercent(metrics.winRate)}
              icon={<Target className="h-3 w-3" />}
              good={isWinRateGood}
              neutral={!isWinRateGood}
            />
            <MetricItem
              label="Trades"
              value={metrics.totalTrades}
              icon={<BarChart3 className="h-3 w-3" />}
              neutral
            />
            <MetricItem
              label="Profit Factor"
              value={formatNumber(metrics.profitFactor)}
              icon={<Shield className="h-3 w-3" />}
              good={isProfitFactorGood}
              neutral={!isProfitFactorGood}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view (all metrics)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Returns Section */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Returns</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricItem
                label="Total Return"
                value={formatPercent(metrics.totalReturn)}
                good={isReturnGood}
                bad={isReturnBad}
              />
              <MetricItem
                label="Annualized"
                value={formatPercent(metrics.annualizedReturn)}
                good={metrics.annualizedReturn > 0}
                bad={metrics.annualizedReturn < 0}
              />
              <MetricItem
                label="Volatility"
                value={formatPercent(metrics.volatility)}
                neutral
              />
              <MetricItem
                label="Max Drawdown"
                value={formatPercent(metrics.maxDrawdown)}
                bad={isDrawdownBad}
                neutral={!isDrawdownBad}
              />
            </div>
          </div>

          {/* Risk-Adjusted Section */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Risk-Adjusted</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricItem
                label="Sharpe Ratio"
                value={formatNumber(metrics.sharpeRatio)}
                good={isSharpeGood}
                bad={isSharpeBad}
              />
              <MetricItem
                label="Sortino Ratio"
                value={formatNumber(metrics.sortinoRatio)}
                good={metrics.sortinoRatio > 1}
                bad={metrics.sortinoRatio < 0}
              />
              <MetricItem
                label="Calmar Ratio"
                value={formatNumber(metrics.calmarRatio)}
                good={metrics.calmarRatio > 1}
                neutral={metrics.calmarRatio <= 1 && metrics.calmarRatio >= 0}
              />
              <MetricItem
                label="DD Duration"
                value={`${metrics.maxDrawdownDurationDays}d`}
                bad={metrics.maxDrawdownDurationDays > 30}
                neutral={metrics.maxDrawdownDurationDays <= 30}
              />
            </div>
          </div>

          {/* Trade Statistics Section */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Trade Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricItem
                label="Total Trades"
                value={metrics.totalTrades}
                neutral
              />
              <MetricItem
                label="Win Rate"
                value={formatPercent(metrics.winRate)}
                good={isWinRateGood}
                neutral={!isWinRateGood}
              />
              <MetricItem
                label="Profit Factor"
                value={formatNumber(metrics.profitFactor)}
                good={isProfitFactorGood}
                neutral={!isProfitFactorGood}
              />
              <MetricItem
                label="Avg Win/Loss"
                value={`${formatCurrency(metrics.avgWin)} / ${formatCurrency(metrics.avgLoss)}`}
                neutral
              />
            </div>
          </div>

          {/* Risk Metrics Section */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Risk Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricItem
                label="VaR (95%)"
                value={formatPercent(metrics.var95)}
                bad={metrics.var95 > 0.05}
                neutral={metrics.var95 <= 0.05}
              />
              <MetricItem
                label="CVaR (95%)"
                value={formatPercent(metrics.cvar95)}
                bad={metrics.cvar95 > 0.08}
                neutral={metrics.cvar95 <= 0.08}
              />
              <MetricItem
                label="Largest Win"
                value={formatCurrency(metrics.avgWin * 2)}
                good
              />
              <MetricItem
                label="Largest Loss"
                value={formatCurrency(metrics.avgLoss * 2)}
                bad
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PerformanceMetricsCard;
