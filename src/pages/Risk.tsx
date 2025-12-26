import { MainLayout } from '@/components/layout/MainLayout';
import { riskMetrics } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, Settings, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const circuitBreakers = [
  { name: 'Max Drawdown', threshold: 15, current: 8.2, unit: '%', status: 'ok' },
  { name: 'Daily Loss Limit', threshold: 100000, current: 45200, unit: '$', status: 'ok' },
  { name: 'Position Concentration', threshold: 40, current: 32, unit: '%', status: 'warning' },
  { name: 'Leverage Limit', threshold: 10, current: 5, unit: 'x', status: 'ok' },
];

export default function Risk() {
  const totalExposure = riskMetrics.reduce((sum, r) => sum + r.exposure, 0);
  const totalVar95 = riskMetrics.reduce((sum, r) => sum + r.var95, 0);
  const totalVar99 = riskMetrics.reduce((sum, r) => sum + r.var99, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              Risk Management
            </h1>
            <p className="text-muted-foreground">Exposure monitoring, VaR analysis, and circuit breakers</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Risk Settings
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="metric-card">
            <p className="text-sm text-muted-foreground">Total Exposure</p>
            <p className="text-2xl font-mono font-semibold">${totalExposure.toLocaleString()}</p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-muted-foreground">VaR (95%)</p>
            <p className="text-2xl font-mono font-semibold text-warning">${totalVar95.toLocaleString()}</p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-muted-foreground">VaR (99%)</p>
            <p className="text-2xl font-mono font-semibold text-destructive">${totalVar99.toLocaleString()}</p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-muted-foreground">Active Limits</p>
            <p className="text-2xl font-mono font-semibold">{circuitBreakers.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exposure by asset */}
          <div className="glass-panel rounded-xl p-4">
            <h3 className="font-semibold mb-4">Exposure by Asset</h3>
            <div className="space-y-4">
              {riskMetrics.map((metric) => {
                const exposurePercent = (metric.exposure / totalExposure) * 100;
                return (
                  <div key={`${metric.asset}-${metric.venue}`} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.asset}</span>
                        <span className="text-muted-foreground">• {metric.venue}</span>
                      </div>
                      <span className="font-mono">${metric.exposure.toLocaleString()}</span>
                    </div>
                    <Progress value={exposurePercent} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>VaR95: ${metric.var95.toLocaleString()}</span>
                      <span>Drawdown: {metric.currentDrawdown.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Circuit breakers */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Circuit Breakers
              </h3>
            </div>
            <div className="space-y-4">
              {circuitBreakers.map((breaker) => {
                const usage = (breaker.current / breaker.threshold) * 100;
                return (
                  <div key={breaker.name} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{breaker.name}</span>
                      <Badge variant={breaker.status === 'ok' ? 'success' : breaker.status === 'warning' ? 'warning' : 'destructive'}>
                        {breaker.status}
                      </Badge>
                    </div>
                    <Progress 
                      value={usage} 
                      className={cn(
                        'h-2 mb-2',
                        usage > 80 ? '[&>div]:bg-destructive' : usage > 60 ? '[&>div]:bg-warning' : ''
                      )} 
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Current: {breaker.current.toLocaleString()}{breaker.unit}
                      </span>
                      <span className="text-muted-foreground">
                        Limit: {breaker.threshold.toLocaleString()}{breaker.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Risk matrix */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="font-semibold mb-4">Risk Exposure Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full data-grid">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium">Venue</th>
                  <th className="pb-3 font-medium text-right">Exposure</th>
                  <th className="pb-3 font-medium text-right">VaR (95%)</th>
                  <th className="pb-3 font-medium text-right">VaR (99%)</th>
                  <th className="pb-3 font-medium text-right">Max DD</th>
                  <th className="pb-3 font-medium text-right">Current DD</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {riskMetrics.map((metric) => (
                  <tr key={`${metric.asset}-${metric.venue}`} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="py-3 font-medium">{metric.asset}</td>
                    <td className="py-3 text-muted-foreground">{metric.venue}</td>
                    <td className="py-3 text-right font-mono">${metric.exposure.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-warning">${metric.var95.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-destructive">${metric.var99.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono">{metric.maxDrawdown}%</td>
                    <td className={cn(
                      'py-3 text-right font-mono flex items-center justify-end gap-1',
                      metric.currentDrawdown > metric.maxDrawdown * 0.5 ? 'text-warning' : ''
                    )}>
                      {metric.currentDrawdown > 0 && <TrendingDown className="h-3 w-3" />}
                      {metric.currentDrawdown.toFixed(1)}%
                    </td>
                    <td className="py-3 text-right">
                      <Badge variant={metric.currentDrawdown < metric.maxDrawdown * 0.5 ? 'success' : metric.currentDrawdown < metric.maxDrawdown * 0.8 ? 'warning' : 'destructive'}>
                        {metric.currentDrawdown < metric.maxDrawdown * 0.5 ? 'healthy' : metric.currentDrawdown < metric.maxDrawdown * 0.8 ? 'elevated' : 'critical'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
