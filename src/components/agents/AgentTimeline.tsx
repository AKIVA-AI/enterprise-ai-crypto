/**
 * Agent Timeline — chronological decision history
 *
 * Shows the full lifecycle of agent decisions:
 *   signal received -> risk check -> approval -> execution
 *
 * Color-coded by outcome, filterable by agent type.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Radio,
  Shield,
  ThumbsUp,
  Zap,
  Filter,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ---- Types ----

type DecisionPhase = 'signal_received' | 'risk_check' | 'approval' | 'execution';
type DecisionOutcome = 'success' | 'rejected' | 'overridden' | 'pending';
type AgentType = 'all' | 'strategy' | 'risk' | 'execution' | 'meta-decision' | 'capital';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  agentType: AgentType;
  agentName: string;
  phase: DecisionPhase;
  action: string;
  outcome: DecisionOutcome;
  reason: string;
  durationMs: number;
  details?: Record<string, string | number>;
}

// ---- Constants ----

const PHASE_LABELS: Record<DecisionPhase, string> = {
  signal_received: 'Signal Received',
  risk_check: 'Risk Check',
  approval: 'Approval',
  execution: 'Execution',
};

const PHASE_ICONS: Record<DecisionPhase, React.ReactNode> = {
  signal_received: <Radio className="h-4 w-4" />,
  risk_check: <Shield className="h-4 w-4" />,
  approval: <ThumbsUp className="h-4 w-4" />,
  execution: <Zap className="h-4 w-4" />,
};

const OUTCOME_STYLES: Record<DecisionOutcome, { color: string; icon: React.ReactNode; label: string }> = {
  success: {
    color: 'text-success bg-success/10 border-success/20',
    icon: <CheckCircle2 className="h-4 w-4 text-success" />,
    label: 'Success',
  },
  rejected: {
    color: 'text-destructive bg-destructive/10 border-destructive/20',
    icon: <XCircle className="h-4 w-4 text-destructive" />,
    label: 'Rejected',
  },
  overridden: {
    color: 'text-warning bg-warning/10 border-warning/20',
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
    label: 'Overridden',
  },
  pending: {
    color: 'text-muted-foreground bg-muted/50 border-muted',
    icon: <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />,
    label: 'Pending',
  },
};

const AGENT_TYPE_LABELS: Record<string, string> = {
  all: 'All Agents',
  strategy: 'Strategy',
  risk: 'Risk',
  execution: 'Execution',
  'meta-decision': 'Meta-Decision',
  capital: 'Capital Allocation',
};

// ---- Demo data (will be replaced with live feed) ----

const DEMO_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 30_000),
    agentType: 'strategy',
    agentName: 'Trend Following Alpha',
    phase: 'signal_received',
    action: 'LONG BTC-USDT detected',
    outcome: 'success',
    reason: 'EMA crossover confirmed on 1H + volume spike > 2x avg',
    durationMs: 120,
    details: { pair: 'BTC-USDT', confidence: 0.87, timeframe: '1H' },
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 28_000),
    agentType: 'risk',
    agentName: 'Risk Agent',
    phase: 'risk_check',
    action: 'Pre-trade risk validation',
    outcome: 'success',
    reason: 'Position within limits (35% utilization), VaR acceptable',
    durationMs: 45,
    details: { var_1d: '$2,150', utilization: '35%' },
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 26_000),
    agentType: 'meta-decision',
    agentName: 'Meta-Decision Agent',
    phase: 'approval',
    action: 'Trade approved',
    outcome: 'success',
    reason: 'Market regime favorable, no kill switch active, capital available',
    durationMs: 30,
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 25_000),
    agentType: 'execution',
    agentName: 'Execution Agent',
    phase: 'execution',
    action: 'Executed LONG BTC-USDT 0.05 @ $42,150',
    outcome: 'success',
    reason: 'Filled via Coinbase, slippage 0.02%, TWAP algo',
    durationMs: 1_200,
    details: { venue: 'Coinbase', slippage: '0.02%', algo: 'TWAP' },
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 180_000),
    agentType: 'strategy',
    agentName: 'Mean Reversion Beta',
    phase: 'signal_received',
    action: 'SHORT SOL-USDT detected',
    outcome: 'success',
    reason: 'Bollinger band upper breach + RSI > 75',
    durationMs: 95,
    details: { pair: 'SOL-USDT', confidence: 0.72 },
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 178_000),
    agentType: 'risk',
    agentName: 'Risk Agent',
    phase: 'risk_check',
    action: 'Position blocked',
    outcome: 'rejected',
    reason: 'Reduce-only mode active for SOL exposure — max drawdown near limit',
    durationMs: 15,
    details: { current_dd: '4.2%', limit_dd: '5%' },
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 600_000),
    agentType: 'capital',
    agentName: 'Capital Allocation Agent',
    phase: 'approval',
    action: 'Rebalance: Trend Following allocation reduced',
    outcome: 'overridden',
    reason: 'Manual override by CIO — increased ETH allocation from 20% to 30%',
    durationMs: 0,
    details: { original: '20%', overridden_to: '30%', asset: 'ETH' },
  },
  {
    id: '8',
    timestamp: new Date(Date.now() - 5_000),
    agentType: 'strategy',
    agentName: 'Funding Rate Arb',
    phase: 'signal_received',
    action: 'Funding opportunity ETH-PERP',
    outcome: 'pending',
    reason: 'Awaiting risk check — funding rate 0.08% above threshold',
    durationMs: 0,
    details: { funding_rate: '0.08%', threshold: '0.05%' },
  },
];

// ---- Component ----

function formatDuration(ms: number): string {
  if (ms === 0) return '--';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function TimelineEntry({ event }: { event: TimelineEvent }) {
  const style = OUTCOME_STYLES[event.outcome];
  return (
    <div className="flex gap-4 group">
      {/* Timeline rail */}
      <div className="flex flex-col items-center">
        <div className={cn('rounded-full p-1.5 border', style.color)}>
          {style.icon}
        </div>
        <div className="w-px flex-1 bg-border/50 group-last:hidden" />
      </div>

      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-medium text-sm">{event.agentName}</span>
          <Badge variant="outline" className="text-xs gap-1">
            {PHASE_ICONS[event.phase]}
            {PHASE_LABELS[event.phase]}
          </Badge>
          <Badge
            variant="outline"
            className={cn('text-xs', style.color)}
          >
            {style.label}
          </Badge>
        </div>

        <p className="text-sm font-medium mb-1">{event.action}</p>
        <p className="text-xs text-muted-foreground mb-2">{event.reason}</p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(event.timestamp, { addSuffix: true })}
          </span>
          <span className="flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            {formatDuration(event.durationMs)}
          </span>
          {event.details && (
            <span className="hidden sm:flex items-center gap-1 text-muted-foreground/70">
              {Object.entries(event.details)
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' | ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AgentTimeline() {
  const [agentFilter, setAgentFilter] = useState<AgentType>('all');

  const filteredEvents = useMemo(
    () =>
      DEMO_EVENTS.filter(
        (e) => agentFilter === 'all' || e.agentType === agentFilter,
      ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [agentFilter],
  );

  const outcomeStats = useMemo(() => {
    const stats = { success: 0, rejected: 0, overridden: 0, pending: 0 };
    for (const e of filteredEvents) {
      stats[e.outcome]++;
    }
    return stats;
  }, [filteredEvents]);

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Agent Decision Timeline
          </CardTitle>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={agentFilter}
              onValueChange={(v) => setAgentFilter(v as AgentType)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AGENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Outcome summary badges */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className="gap-1 text-success bg-success/10">
            <CheckCircle2 className="h-3 w-3" />
            {outcomeStats.success} success
          </Badge>
          <Badge variant="outline" className="gap-1 text-destructive bg-destructive/10">
            <XCircle className="h-3 w-3" />
            {outcomeStats.rejected} rejected
          </Badge>
          <Badge variant="outline" className="gap-1 text-warning bg-warning/10">
            <AlertTriangle className="h-3 w-3" />
            {outcomeStats.overridden} overridden
          </Badge>
          {outcomeStats.pending > 0 && (
            <Badge variant="outline" className="gap-1 text-muted-foreground bg-muted/50">
              <Clock className="h-3 w-3" />
              {outcomeStats.pending} pending
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No decisions recorded for this filter.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredEvents.map((event) => (
              <TimelineEntry key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
