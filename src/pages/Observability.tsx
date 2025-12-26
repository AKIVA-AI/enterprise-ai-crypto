import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { auditEvents, agents, AuditEvent } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Search, Filter, Download, AlertTriangle, Info, XCircle, AlertOctagon, RefreshCw, Wifi, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  critical: AlertOctagon,
};

const severityColors = {
  info: 'text-primary',
  warning: 'text-warning',
  error: 'text-destructive',
  critical: 'text-destructive',
};

const typeLabels: Record<string, string> = {
  auth: 'Authentication',
  trade: 'Trading',
  config: 'Configuration',
  risk: 'Risk Management',
  system: 'System',
  launch: 'Token Launch',
};

export default function Observability() {
  const [events, setEvents] = useState<AuditEvent[]>(auditEvents);
  const [filter, setFilter] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  // Simulate new events coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent: AuditEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date(),
        type: ['trade', 'system', 'risk'][Math.floor(Math.random() * 3)] as AuditEvent['type'],
        severity: ['info', 'info', 'info', 'warning'][Math.floor(Math.random() * 4)] as AuditEvent['severity'],
        actor: agents[Math.floor(Math.random() * agents.length)].name,
        action: ['HEARTBEAT', 'DATA_SYNC', 'SIGNAL_GENERATED', 'PRICE_UPDATE'][Math.floor(Math.random() * 4)],
        details: 'Routine system operation completed successfully',
      };
      setEvents(prev => [newEvent, ...prev].slice(0, 50));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = filter === '' || 
      event.action.toLowerCase().includes(filter.toLowerCase()) ||
      event.details.toLowerCase().includes(filter.toLowerCase()) ||
      event.actor.toLowerCase().includes(filter.toLowerCase());
    const matchesSeverity = !selectedSeverity || event.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const severityCounts = events.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-7 w-7 text-primary" />
              Observability
            </h1>
            <p className="text-muted-foreground">Event logs, alerts, and system health monitoring</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>

        {/* System health */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">API Health</span>
            </div>
            <p className="text-2xl font-mono font-semibold text-success">100%</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg Latency</span>
            </div>
            <p className="text-2xl font-mono font-semibold">23ms</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Failed Orders</span>
            </div>
            <p className="text-2xl font-mono font-semibold">0</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">Warnings</span>
            </div>
            <p className="text-2xl font-mono font-semibold text-warning">{severityCounts.warning || 0}</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-2">
              <AlertOctagon className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Critical</span>
            </div>
            <p className="text-2xl font-mono font-semibold text-destructive">{severityCounts.critical || 0}</p>
          </div>
        </div>

        {/* Event log */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 bg-muted/50"
              />
            </div>
            <div className="flex items-center gap-2">
              {(['info', 'warning', 'error', 'critical'] as const).map((severity) => (
                <Button
                  key={severity}
                  variant={selectedSeverity === severity ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity(selectedSeverity === severity ? null : severity)}
                  className={cn(
                    'capitalize',
                    selectedSeverity === severity && severityColors[severity]
                  )}
                >
                  {severity}
                  {severityCounts[severity] && (
                    <span className="ml-1 text-xs">({severityCounts[severity]})</span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filteredEvents.map((event) => {
              const Icon = severityIcons[event.severity];
              return (
                <div
                  key={event.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/30 font-mono text-sm',
                    event.severity === 'critical' && 'bg-destructive/5 border-l-2 border-destructive',
                    event.severity === 'error' && 'bg-destructive/5',
                    event.severity === 'warning' && 'bg-warning/5'
                  )}
                >
                  <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', severityColors[event.severity])} />
                  <span className="text-muted-foreground w-20 flex-shrink-0">
                    {format(event.timestamp, 'HH:mm:ss')}
                  </span>
                  <Badge variant={event.severity} className="flex-shrink-0">
                    {event.severity}
                  </Badge>
                  <span className="px-2 py-0.5 rounded bg-muted text-xs flex-shrink-0">
                    {typeLabels[event.type] || event.type}
                  </span>
                  <span className="font-medium flex-shrink-0">{event.action}</span>
                  <span className="text-muted-foreground truncate flex-1">{event.details}</span>
                  <span className="text-muted-foreground text-xs flex-shrink-0">{event.actor}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filteredEvents.length} of {events.length} events</span>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Live updates enabled</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
