import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { usePositions } from '@/hooks/usePositions';
import { useBooks } from '@/hooks/useBooks';
import { useLivePriceFeed } from '@/hooks/useLivePriceFeed';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Activity,
  Percent,
  BarChart3,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StressScenario {
  name: string;
  description: string;
  impact: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function PortfolioRiskAnalytics() {
  const { data: positions = [] } = usePositions();
  const { data: books = [] } = useBooks();

  // Get instruments for live prices
  const instruments = useMemo(() => {
    return [...new Set(positions.map(p => p.instrument.replace('/', '-')))];
  }, [positions]);

  const { prices, isConnected } = useLivePriceFeed({
    symbols: instruments,
    enabled: instruments.length > 0,
  });

  // Calculate risk metrics
  const riskMetrics = useMemo(() => {
    const totalCapital = books.reduce((sum, b) => sum + Number(b.capital_allocated), 0);
    
    if (positions.length === 0 || totalCapital === 0) {
      return {
        var95: 0,
        var99: 0,
        expectedShortfall: 0,
        totalExposure: 0,
        portfolioBeta: 1,
        sharpeRatio: 0,
        maxDrawdown: 0,
        concentrationRisk: 0,
        correlationMatrix: [] as { pair: string; correlation: number }[],
        stressScenarios: [] as StressScenario[],
      };
    }

    // Calculate position values and exposure
    let totalExposure = 0;
    const positionValues: { instrument: string; value: number; weight: number; volatility: number }[] = [];

    positions.forEach(pos => {
      const feedSymbol = pos.instrument.replace('/', '-');
      const livePrice = prices.get(feedSymbol);
      const currentPrice = livePrice?.price || Number(pos.mark_price);
      const value = Number(pos.size) * currentPrice;
      totalExposure += value;

      // Simulated volatility based on asset (in production, fetch real data)
      const volatilityMap: Record<string, number> = {
        'BTC': 0.45,
        'ETH': 0.55,
        'SOL': 0.75,
        'ARB': 0.85,
        'OP': 0.80,
        'AVAX': 0.70,
        'MATIC': 0.65,
        'LINK': 0.60,
      };
      const baseAsset = pos.instrument.split('/')[0];
      const volatility = volatilityMap[baseAsset] || 0.50;

      positionValues.push({
        instrument: pos.instrument,
        value,
        weight: 0, // Calculate after
        volatility,
      });
    });

    // Calculate weights
    positionValues.forEach(p => {
      p.weight = totalExposure > 0 ? p.value / totalExposure : 0;
    });

    // Portfolio volatility (simplified - assumes no correlation for demo)
    const portfolioVolatility = Math.sqrt(
      positionValues.reduce((sum, p) => sum + Math.pow(p.weight * p.volatility, 2), 0)
    );

    // VaR calculations (parametric method)
    const z95 = 1.645; // 95% confidence
    const z99 = 2.326; // 99% confidence
    const dailyVolatility = portfolioVolatility / Math.sqrt(252);
    
    const var95 = totalExposure * dailyVolatility * z95;
    const var99 = totalExposure * dailyVolatility * z99;
    const expectedShortfall = var99 * 1.25; // Approximation

    // Concentration risk (Herfindahl index)
    const concentrationRisk = positionValues.reduce((sum, p) => sum + Math.pow(p.weight, 2), 0) * 100;

    // Simulated correlation matrix (top 4 assets)
    const topAssets = positionValues.slice(0, 4).map(p => p.instrument.split('/')[0]);
    const correlationMatrix: { pair: string; correlation: number }[] = [];
    
    for (let i = 0; i < topAssets.length; i++) {
      for (let j = i + 1; j < topAssets.length; j++) {
        // Simulated correlations
        const baseCorr = 0.6 + Math.random() * 0.3;
        correlationMatrix.push({
          pair: `${topAssets[i]}/${topAssets[j]}`,
          correlation: parseFloat(baseCorr.toFixed(2)),
        });
      }
    }

    // Stress test scenarios
    const stressScenarios: StressScenario[] = [
      {
        name: 'Market Crash (-30%)',
        description: 'Broad crypto market decline',
        impact: -(totalExposure * 0.30),
        severity: 'critical',
      },
      {
        name: 'Flash Crash (-15%)',
        description: 'Sudden liquidity crisis',
        impact: -(totalExposure * 0.15),
        severity: 'high',
      },
      {
        name: 'Regulatory FUD (-10%)',
        description: 'Negative regulatory news',
        impact: -(totalExposure * 0.10),
        severity: 'medium',
      },
      {
        name: 'BTC Dominance Shift',
        description: 'Capital rotation to BTC',
        impact: -(totalExposure * 0.08),
        severity: 'low',
      },
      {
        name: 'Bull Rally (+20%)',
        description: 'Market-wide rally',
        impact: totalExposure * 0.20,
        severity: 'low',
      },
    ];

    // Simulated metrics
    const sharpeRatio = 1.2 + Math.random() * 0.8;
    const maxDrawdown = 15 + Math.random() * 10;
    const portfolioBeta = 0.9 + Math.random() * 0.3;

    return {
      var95,
      var99,
      expectedShortfall,
      totalExposure,
      portfolioBeta,
      sharpeRatio,
      maxDrawdown,
      concentrationRisk,
      correlationMatrix,
      stressScenarios,
      portfolioVolatility: portfolioVolatility * 100,
    };
  }, [positions, books, prices]);

  const totalCapital = books.reduce((sum, b) => sum + Number(b.capital_allocated), 0);
  const varRatio = totalCapital > 0 ? (riskMetrics.var95 / totalCapital) * 100 : 0;

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Portfolio Risk Analytics
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              'font-mono',
              isConnected ? 'border-success/50 text-success' : 'border-muted'
            )}
          >
            {isConnected ? 'Live' : 'Delayed'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* VaR Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <div className="flex items-center gap-2 text-xs text-destructive mb-2">
              <AlertTriangle className="h-3 w-3" />
              VaR (95%)
            </div>
            <p className="text-2xl font-mono font-bold text-destructive">
              ${riskMetrics.var95.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              1-day potential loss
            </p>
          </div>

          <div className="rounded-lg bg-warning/10 border border-warning/20 p-4">
            <div className="flex items-center gap-2 text-xs text-warning mb-2">
              <AlertTriangle className="h-3 w-3" />
              VaR (99%)
            </div>
            <p className="text-2xl font-mono font-bold text-warning">
              ${riskMetrics.var99.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Extreme scenario
            </p>
          </div>

          <div className="rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Zap className="h-3 w-3" />
              Expected Shortfall
            </div>
            <p className="text-2xl font-mono font-bold">
              ${riskMetrics.expectedShortfall.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              CVaR / Tail Risk
            </p>
          </div>
        </div>

        {/* VaR as % of Capital */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">VaR as % of Capital</span>
            <span className={cn(
              'font-mono font-medium',
              varRatio > 10 ? 'text-destructive' : varRatio > 5 ? 'text-warning' : 'text-success'
            )}>
              {varRatio.toFixed(2)}%
            </span>
          </div>
          <Progress 
            value={Math.min(varRatio, 20) * 5} 
            className={cn(
              'h-2',
              varRatio > 10 && '[&>div]:bg-destructive',
              varRatio > 5 && varRatio <= 10 && '[&>div]:bg-warning'
            )}
          />
        </div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Activity className="h-3 w-3" />
              Volatility
            </div>
            <div className="text-lg font-mono font-semibold">
              {riskMetrics.portfolioVolatility?.toFixed(1) || 0}%
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <BarChart3 className="h-3 w-3" />
              Sharpe
            </div>
            <div className={cn(
              'text-lg font-mono font-semibold',
              riskMetrics.sharpeRatio >= 1.5 ? 'text-success' : 'text-warning'
            )}>
              {riskMetrics.sharpeRatio.toFixed(2)}
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3 w-3" />
              Max DD
            </div>
            <div className="text-lg font-mono font-semibold text-destructive">
              -{riskMetrics.maxDrawdown.toFixed(1)}%
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Percent className="h-3 w-3" />
              Concentration
            </div>
            <div className={cn(
              'text-lg font-mono font-semibold',
              riskMetrics.concentrationRisk > 50 ? 'text-warning' : ''
            )}>
              {riskMetrics.concentrationRisk.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Correlation Matrix */}
        {riskMetrics.correlationMatrix.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Asset Correlations
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {riskMetrics.correlationMatrix.map((corr) => (
                <div
                  key={corr.pair}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                >
                  <span className="text-sm font-medium">{corr.pair}</span>
                  <span className={cn(
                    'font-mono text-sm',
                    corr.correlation > 0.8 ? 'text-destructive' : 
                    corr.correlation > 0.6 ? 'text-warning' : 'text-success'
                  )}>
                    {corr.correlation.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stress Test Scenarios */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Stress Test Scenarios
          </h4>
          <div className="space-y-2">
            {riskMetrics.stressScenarios.map((scenario) => (
              <div
                key={scenario.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{scenario.name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-xs',
                        scenario.severity === 'critical' && 'border-destructive text-destructive',
                        scenario.severity === 'high' && 'border-warning text-warning',
                        scenario.severity === 'medium' && 'border-muted-foreground',
                        scenario.severity === 'low' && 'border-success text-success'
                      )}
                    >
                      {scenario.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{scenario.description}</p>
                </div>
                <span className={cn(
                  'font-mono font-semibold',
                  scenario.impact >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {scenario.impact >= 0 ? '+' : ''}${scenario.impact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {positions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No positions to analyze</p>
            <p className="text-xs">Open positions to see risk metrics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
