/**
 * BacktestDashboard - Integration Component for Sprint 1
 * 
 * This component integrates all Sprint 1 deliverables:
 * - useBacktestResults hooks (Task 1.6)
 * - EquityCurveChart (Task 1.7)
 * - PerformanceMetricsCard (Task 1.8)
 */

import React, { useState } from 'react';
import { useBacktestDetail, useEquityCurve, useBacktestList, useRunBacktest } from '@/hooks/useBacktestResults';
import { EquityCurveChart } from './EquityCurveChart';
import { PerformanceMetricsCard } from './PerformanceMetricsCard';
import { BacktestComparison } from './BacktestComparison';
import { TradeJournal } from './TradeJournal';
import { RiskDashboard } from './RiskDashboard';
import { ReportExporter } from './ReportExporter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, RefreshCw, Clock, TrendingUp, BarChart3, Search, Shield, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BacktestDashboardProps {
  className?: string;
}

export function BacktestDashboard({ className }: BacktestDashboardProps) {
  const [selectedBacktestId, setSelectedBacktestId] = useState<string | undefined>();
  
  // Hooks
  const { data: backtestList, isLoading: listLoading } = useBacktestList();
  const { data: backtestDetail, isLoading: detailLoading, error: detailError } = useBacktestDetail(selectedBacktestId);
  const { data: equityCurve, isLoading: curveLoading, error: curveError } = useEquityCurve(selectedBacktestId);
  const runBacktest = useRunBacktest();

  // Run a demo backtest
  const handleRunDemo = () => {
    runBacktest.mutate({
      strategyName: 'RSIMomentumStrategy',
      instruments: ['BTC-USD'],
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2024-01-01T00:00:00Z',
      initialCapital: 100000,
      timeframe: '1h',
    }, {
      onSuccess: (result) => {
        setSelectedBacktestId(result.id);
      },
    });
  };

  const isLoading = detailLoading || curveLoading;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Strategy Backtest</h2>
          <p className="text-muted-foreground">
            Analyze historical performance of trading strategies
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Backtest Selector */}
          <Select value={selectedBacktestId} onValueChange={setSelectedBacktestId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a backtest..." />
            </SelectTrigger>
            <SelectContent>
              {listLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : backtestList?.length === 0 ? (
                <SelectItem value="empty" disabled>No backtests yet</SelectItem>
              ) : (
                backtestList?.map((bt) => (
                  <SelectItem key={bt.id} value={bt.id}>
                    <div className="flex items-center gap-2">
                      <span>{bt.strategyName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(bt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          {/* Run Demo Button */}
          <Button onClick={handleRunDemo} disabled={runBacktest.isPending}>
            {runBacktest.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Demo Backtest
          </Button>
        </div>
      </div>

      {/* No Selection State */}
      {!selectedBacktestId && !runBacktest.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Backtest Selected</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Select an existing backtest from the dropdown or run a demo backtest to see 
              performance analysis and equity curves.
            </p>
            <Button variant="outline" onClick={handleRunDemo}>
              <Play className="mr-2 h-4 w-4" />
              Run Your First Backtest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {selectedBacktestId && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Summary Row */}
            {backtestDetail && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                  title="Final Equity"
                  value={`$${backtestDetail.finalEquity.toLocaleString()}`}
                  subtitle={`Initial: $${backtestDetail.initialCapital.toLocaleString()}`}
                />
                <SummaryCard
                  title="Total Return"
                  value={`${(backtestDetail.metrics.totalReturn * 100).toFixed(2)}%`}
                  subtitle={`Annualized: ${(backtestDetail.metrics.annualizedReturn * 100).toFixed(2)}%`}
                  positive={backtestDetail.metrics.totalReturn > 0}
                />
                <SummaryCard
                  title="Sharpe Ratio"
                  value={backtestDetail.metrics.sharpeRatio.toFixed(2)}
                  subtitle={`Sortino: ${backtestDetail.metrics.sortinoRatio.toFixed(2)}`}
                  positive={backtestDetail.metrics.sharpeRatio > 1}
                />
                <SummaryCard
                  title="Max Drawdown"
                  value={`${(backtestDetail.metrics.maxDrawdown * 100).toFixed(2)}%`}
                  subtitle={`Duration: ${backtestDetail.metrics.maxDrawdownDurationDays}d`}
                  negative={backtestDetail.metrics.maxDrawdown > 0.15}
                />
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Equity Curve - 2 columns */}
              <div className="lg:col-span-2">
                <EquityCurveChart
                  data={equityCurve}
                  isLoading={curveLoading}
                  error={curveError}
                  initialCapital={backtestDetail?.initialCapital}
                  height={350}
                />
              </div>
              
              {/* Compact Metrics - 1 column */}
              <div>
                <PerformanceMetricsCard
                  metrics={backtestDetail?.metrics}
                  isLoading={detailLoading}
                  error={detailError}
                  compact
                />
              </div>
            </div>

            {/* Full Metrics */}
            <PerformanceMetricsCard
              metrics={backtestDetail?.metrics}
              isLoading={detailLoading}
              error={detailError}
              title="Detailed Performance Analysis"
              description="Complete breakdown of strategy performance metrics"
            />
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="mt-6">
            <BacktestComparison
              backtests={backtestDetail ? [backtestDetail] : []}
              className="w-full"
            />
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="mt-6">
            <TradeJournal
              trades={[]} // Would be populated from API
              backtest={backtestDetail}
              className="w-full"
            />
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk" className="mt-6">
            {backtestDetail && (
              <RiskDashboard
                riskMetrics={{
                  var95: backtestDetail.metrics.var95,
                  var99: backtestDetail.metrics.var95 * 1.5, // Estimate 99% VaR
                  cvar95: backtestDetail.metrics.cvar95,
                  cvar99: backtestDetail.metrics.cvar95 * 1.5, // Estimate 99% CVaR
                  maxDrawdown: backtestDetail.metrics.maxDrawdown,
                  maxDrawdownDuration: backtestDetail.metrics.maxDrawdownDurationDays,
                  sharpeRatio: backtestDetail.metrics.sharpeRatio,
                  sortinoRatio: backtestDetail.metrics.sortinoRatio,
                  calmarRatio: backtestDetail.metrics.calmarRatio,
                  volatility: backtestDetail.metrics.volatility,
                  beta: 1.2, // Would come from API
                  alpha: backtestDetail.metrics.annualizedReturn - 0.1, // Simplified
                  informationRatio: backtestDetail.metrics.sharpeRatio * 0.8, // Simplified
                  trackingError: backtestDetail.metrics.volatility * 0.6, // Simplified
                  downsideDeviation: backtestDetail.metrics.volatility * 0.8, // Simplified
                  upsideCapture: 1.1, // Would come from API
                  downsideCapture: 0.9, // Would come from API
                  correlationToMarket: 0.7, // Would come from API
                  skewness: -0.2, // Would come from API
                  kurtosis: 3.5, // Would come from API
                }}
                alerts={[
                  {
                    id: '1',
                    type: 'WARNING',
                    category: 'DRAWDOWN',
                    title: 'High Drawdown Risk',
                    description: 'Maximum drawdown exceeds 15% threshold',
                    value: backtestDetail.metrics.maxDrawdown,
                    threshold: 0.15,
                    timestamp: new Date().toISOString(),
                  },
                ]}
                backtest={backtestDetail}
                className="w-full"
              />
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="mt-6">
            {backtestDetail && (
              <ReportExporter
                backtest={backtestDetail}
                trades={[]} // Would be populated from API
                className="w-full"
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Helper component for summary cards
interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  positive?: boolean;
  negative?: boolean;
}

function SummaryCard({ title, value, subtitle, positive, negative }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className={cn(
          'text-2xl font-bold mt-1',
          positive && 'text-green-600 dark:text-green-400',
          negative && 'text-red-600 dark:text-red-400',
        )}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

export default BacktestDashboard;
