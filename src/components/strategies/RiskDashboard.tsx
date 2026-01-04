import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Target,
  Zap,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BacktestDetail } from '@/hooks/useBacktestResults';

// Risk metrics interface (would come from backend API)
export interface RiskMetrics {
  var95: number; // Value at Risk 95%
  var99: number; // Value at Risk 99%
  cvar95: number; // Conditional VaR 95%
  cvar99: number; // Conditional VaR 99%
  maxDrawdown: number;
  maxDrawdownDuration: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  volatility: number;
  beta: number;
  alpha: number;
  informationRatio: number;
  trackingError: number;
  downsideDeviation: number;
  upsideCapture: number;
  downsideCapture: number;
  correlationToMarket: number;
  skewness: number;
  kurtosis: number;
}

// Risk alert interface
export interface RiskAlert {
  id: string;
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  category: 'DRAWDOWN' | 'VOLATILITY' | 'CORRELATION' | 'CONCENTRATION' | 'LIQUIDITY';
  title: string;
  description: string;
  value: number;
  threshold: number;
  timestamp: string;
}

interface RiskDashboardProps {
  riskMetrics: RiskMetrics;
  alerts: RiskAlert[];
  backtest?: BacktestDetail;
  className?: string;
}

export function RiskDashboard({
  riskMetrics,
  alerts,
  backtest,
  className,
}: RiskDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');

  // Calculate risk scores
  const riskScores = useMemo(() => {
    const scores = {
      overall: 0,
      drawdown: 0,
      volatility: 0,
      correlation: 0,
      liquidity: 0,
    };

    // Drawdown risk (0-100)
    scores.drawdown = Math.min(100, Math.abs(riskMetrics.maxDrawdown) * 1000);
    
    // Volatility risk (0-100)
    scores.volatility = Math.min(100, riskMetrics.volatility * 500);
    
    // Correlation risk (0-100)
    scores.correlation = Math.min(100, Math.abs(riskMetrics.correlationToMarket) * 100);
    
    // Liquidity risk (simplified - would use actual liquidity metrics)
    scores.liquidity = Math.min(100, riskMetrics.beta * 50);

    // Overall risk score (weighted average)
    scores.overall = (
      scores.drawdown * 0.4 +
      scores.volatility * 0.3 +
      scores.correlation * 0.2 +
      scores.liquidity * 0.1
    );

    return scores;
  }, [riskMetrics]);

  // Get risk level
  const getRiskLevel = (score: number): { level: string; color: string; bg: string } => {
    if (score >= 80) return { level: 'HIGH', color: 'text-red-600', bg: 'bg-red-100' };
    if (score >= 60) return { level: 'MEDIUM', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 40) return { level: 'MODERATE', color: 'text-blue-600', bg: 'bg-blue-100' };
    return { level: 'LOW', color: 'text-green-600', bg: 'bg-green-100' };
  };

  // Format percentage
  const formatPercent = (value: number, decimals: number = 2): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  // Format ratio
  const formatRatio = (value: number, decimals: number = 2): string => {
    return value.toFixed(decimals);
  };

  // Get alert icon
  const getAlertIcon = (type: RiskAlert['type']) => {
    switch (type) {
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'INFO':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get alert color
  const getAlertColor = (type: RiskAlert['type']) => {
    switch (type) {
      case 'CRITICAL':
        return 'border-red-200 bg-red-50';
      case 'WARNING':
        return 'border-yellow-200 bg-yellow-50';
      case 'INFO':
        return 'border-blue-200 bg-blue-50';
    }
  };

  // Render risk score card
  const renderRiskScoreCard = (title: string, score: number, icon: React.ReactNode, description: string) => {
    const riskLevel = getRiskLevel(score);
    
    return (
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          <Badge className={cn(riskLevel.bg, riskLevel.color)}>
            {riskLevel.level}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{score.toFixed(0)}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <Progress value={score} className="h-2" />
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  };

  // Render VaR analysis
  const renderVarAnalysis = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Value at Risk (VaR)
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="font-medium">VaR 95%</span>
            <span className="font-mono text-red-600">
              {formatPercent(riskMetrics.var95)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="font-medium">VaR 99%</span>
            <span className="font-mono text-red-600">
              {formatPercent(riskMetrics.var99)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" />
          Conditional VaR (CVaR)
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="font-medium">CVaR 95%</span>
            <span className="font-mono text-red-600">
              {formatPercent(riskMetrics.cvar95)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="font-medium">CVaR 99%</span>
            <span className="font-mono text-red-600">
              {formatPercent(riskMetrics.cvar99)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render risk ratios
  const renderRiskRatios = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sharpe Ratio</span>
        </div>
        <div className="text-2xl font-bold">
          {formatRatio(riskMetrics.sharpeRatio)}
        </div>
        <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sortino Ratio</span>
        </div>
        <div className="text-2xl font-bold">
          {formatRatio(riskMetrics.sortinoRatio)}
        </div>
        <p className="text-xs text-muted-foreground">Downside risk-adjusted</p>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Calmar Ratio</span>
        </div>
        <div className="text-2xl font-bold">
          {formatRatio(riskMetrics.calmarRatio)}
        </div>
        <p className="text-xs text-muted-foreground">Return/max drawdown</p>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Information Ratio</span>
        </div>
        <div className="text-2xl font-bold">
          {formatRatio(riskMetrics.informationRatio)}
        </div>
        <p className="text-xs text-muted-foreground">Active risk-adjusted</p>
      </div>
    </div>
  );

  // Render risk alerts
  const renderRiskAlerts = () => {
    if (alerts.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No risk alerts</p>
          <p className="text-sm">
            All risk metrics are within acceptable ranges
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Alert key={alert.id} className={cn(getAlertColor(alert.type))}>
            {getAlertIcon(alert.type)}
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm">{alert.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">
                    {formatPercent(alert.value)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Threshold: {formatPercent(alert.threshold)}
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  // Render drawdown analysis
  const renderDrawdownAnalysis = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          Drawdown Metrics
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="font-medium">Max Drawdown</span>
            <span className="font-mono text-red-600">
              {formatPercent(riskMetrics.maxDrawdown)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="font-medium">Max Duration</span>
            <span className="font-mono">
              {riskMetrics.maxDrawdownDuration} days
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="font-medium">Current Drawdown</span>
            <span className="font-mono text-orange-600">
              {formatPercent(riskMetrics.maxDrawdown * 0.3)} {/* Simulated current */}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Volatility Analysis
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="font-medium">Annual Volatility</span>
            <span className="font-mono text-blue-600">
              {formatPercent(riskMetrics.volatility)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="font-medium">Downside Deviation</span>
            <span className="font-mono text-red-600">
              {formatPercent(riskMetrics.downsideDeviation)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="font-medium">Skewness</span>
            <span className="font-mono">
              {formatRatio(riskMetrics.skewness)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const overallRiskLevel = getRiskLevel(riskScores.overall);

  return (
    <Card className={cn('glass-panel', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Risk Dashboard
          <div className="group relative">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="absolute right-0 top-6 w-64 p-3 bg-popover border rounded-md shadow-md text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10">
              Comprehensive risk analysis including VaR, drawdown metrics, and real-time risk alerts.
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          Monitor risk metrics and alerts for your trading strategy
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overall Risk Score */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Overall Risk Score
            </h3>
            <Badge className={cn(overallRiskLevel.bg, overallRiskLevel.color)}>
              {overallRiskLevel.level} RISK
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{riskScores.overall.toFixed(0)}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <Progress value={riskScores.overall} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Based on drawdown, volatility, correlation, and liquidity risk factors
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="var">VaR Analysis</TabsTrigger>
            <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              {/* Risk Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderRiskScoreCard(
                  'Drawdown Risk',
                  riskScores.drawdown,
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />,
                  'Based on maximum drawdown and duration'
                )}
                {renderRiskScoreCard(
                  'Volatility Risk',
                  riskScores.volatility,
                  <Activity className="h-4 w-4 text-muted-foreground" />,
                  'Based on price volatility and variance'
                )}
                {renderRiskScoreCard(
                  'Correlation Risk',
                  riskScores.correlation,
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />,
                  'Based on market correlation and beta'
                )}
                {renderRiskScoreCard(
                  'Liquidity Risk',
                  riskScores.liquidity,
                  <Zap className="h-4 w-4 text-muted-foreground" />,
                  'Based on trading volume and spreads'
                )}
              </div>

              {/* Risk Ratios */}
              {renderRiskRatios()}
            </div>
          </TabsContent>

          <TabsContent value="var" className="mt-6">
            {renderVarAnalysis()}
          </TabsContent>

          <TabsContent value="drawdown" className="mt-6">
            {renderDrawdownAnalysis()}
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            {renderRiskAlerts()}
          </TabsContent>
        </Tabs>

        {/* Risk Summary */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-3">Risk Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Strategy:</span>
              <div className="font-medium">{backtest?.strategyName || 'N/A'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Risk Level:</span>
              <div className={cn('font-medium', overallRiskLevel.color)}>
                {overallRiskLevel.level}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Active Alerts:</span>
              <div className="font-medium">{alerts.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <div className="font-medium">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RiskDashboard;
