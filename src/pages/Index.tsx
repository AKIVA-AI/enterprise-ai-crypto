import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AgentStatusGrid } from '@/components/dashboard/AgentStatusGrid';
import { PositionsTable } from '@/components/dashboard/PositionsTable';
import { RecentEvents } from '@/components/dashboard/RecentEvents';
import { RiskGauge } from '@/components/dashboard/RiskGauge';
import { dashboardMetrics } from '@/lib/mockData';
import { DollarSign, TrendingUp, Bot, AlertTriangle, Layers, Activity } from 'lucide-react';

export default function Index() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Control Center</h1>
            <p className="text-muted-foreground">Real-time overview of your crypto operations</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
            <span className="status-dot status-online" />
            <span className="text-sm font-medium text-success">All Systems Operational</span>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total AUM"
            value={`$${(dashboardMetrics.totalAum / 1000000).toFixed(2)}M`}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <MetricCard
            title="Daily P&L"
            value={`$${dashboardMetrics.dailyPnl.toLocaleString()}`}
            change={dashboardMetrics.dailyPnlPercent}
            changeLabel="today"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <MetricCard
            title="Active Strategies"
            value={dashboardMetrics.activeStrategies}
            icon={<Layers className="h-5 w-5" />}
          />
          <MetricCard
            title="Active Alerts"
            value={dashboardMetrics.alertsActive}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - positions and agents */}
          <div className="lg:col-span-2 space-y-6">
            <PositionsTable />
            <AgentStatusGrid />
          </div>

          {/* Right column - risk and events */}
          <div className="space-y-6">
            {/* Risk overview */}
            <div className="glass-panel rounded-xl p-4">
              <h3 className="font-semibold mb-4">Risk Utilization</h3>
              <RiskGauge value={dashboardMetrics.riskUtilization} label="of max exposure" />
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-mono font-bold text-foreground">
                    {dashboardMetrics.openPositions}
                  </p>
                  <p className="text-xs text-muted-foreground">Open Positions</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-mono font-bold text-foreground">
                    {dashboardMetrics.pendingOrders}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending Orders</p>
                </div>
              </div>
            </div>

            <RecentEvents />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
