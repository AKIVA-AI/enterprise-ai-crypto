import { auditEvents } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Activity, AlertTriangle, Info, XCircle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function RecentEvents() {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Events
        </h3>
        <a href="/observability" className="text-xs text-primary hover:underline">
          View all
        </a>
      </div>
      <div className="space-y-3">
        {auditEvents.slice(0, 5).map((event) => {
          const Icon = severityIcons[event.severity];
          return (
            <div
              key={event.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/30',
                event.severity === 'critical' && 'border-destructive/30 bg-destructive/5',
                event.severity === 'error' && 'border-destructive/20',
                event.severity === 'warning' && 'border-warning/20'
              )}
            >
              <Icon className={cn('h-4 w-4 mt-0.5', severityColors[event.severity])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{event.action}</span>
                  <Badge variant={event.severity} className="text-xs">
                    {event.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{event.details}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{event.actor}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(event.timestamp, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
