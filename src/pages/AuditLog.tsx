import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Clock, 
  Shield,
  AlertTriangle,
  Info,
  ChevronRight,
  Download,
  RefreshCw,
  BookOpen,
  Zap,
  DollarSign,
  Power,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

type AuditEvent = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  user_id: string | null;
  user_email: string | null;
  book_id: string | null;
  severity: 'info' | 'warning' | 'critical';
  before_state: any;
  after_state: any;
  ip_address: string | null;
  created_at: string;
};

const actionIcons: Record<string, any> = {
  'book.freeze': Power,
  'book.unfreeze': Power,
  'capital.reallocate': DollarSign,
  'strategy.toggle': Zap,
  'kill_switch.activate': AlertTriangle,
  'kill_switch.deactivate': AlertTriangle,
  'meme.approve': BookOpen,
  'meme.reject': BookOpen,
  default: History,
};

const severityStyles = {
  info: 'bg-primary/10 text-primary border-primary/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-events', severityFilter, resourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter as 'info' | 'warning' | 'critical');
      }

      if (resourceFilter !== 'all') {
        query = query.eq('resource_type', resourceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditEvent[];
    },
  });

  // Get unique resource types
  const resourceTypes = [...new Set(events.map(e => e.resource_type))];

  // Filter by search
  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      event.action.toLowerCase().includes(searchLower) ||
      event.resource_type.toLowerCase().includes(searchLower) ||
      event.user_email?.toLowerCase().includes(searchLower) ||
      event.resource_id?.toLowerCase().includes(searchLower)
    );
  });

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Action', 'Resource', 'User', 'Severity', 'IP Address'].join(','),
      ...filteredEvents.map(e => [
        e.created_at,
        e.action,
        `${e.resource_type}:${e.resource_id || 'N/A'}`,
        e.user_email || 'System',
        e.severity,
        e.ip_address || 'N/A',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-7 w-7 text-primary" />
              Audit Log
            </h1>
            <p className="text-muted-foreground">Review privileged actions and system changes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {resourceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold">{events.length}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold">
                  {events.filter(e => e.severity === 'critical').length}
                </p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Shield className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold">
                  {events.filter(e => e.severity === 'warning').length}
                </p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold">
                  {new Set(events.map(e => e.user_id).filter(Boolean)).size}
                </p>
                <p className="text-xs text-muted-foreground">Unique Users</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading events...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No audit events found</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border">
                  {filteredEvents.map((event) => {
                    const IconComponent = actionIcons[event.action] || actionIcons.default;
                    
                    return (
                      <div 
                        key={event.id} 
                        className="p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={cn(
                            "p-2 rounded-lg border",
                            severityStyles[event.severity]
                          )}>
                            <IconComponent className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{event.action}</span>
                              <Badge variant="outline" className="text-xs">
                                {event.resource_type}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", severityStyles[event.severity])}
                              >
                                {event.severity}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              {event.user_email && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {event.user_email}
                                </span>
                              )}
                              {event.resource_id && (
                                <span className="font-mono text-xs">
                                  ID: {event.resource_id.slice(0, 8)}...
                                </span>
                              )}
                              {event.ip_address && (
                                <span className="font-mono text-xs">
                                  IP: {event.ip_address}
                                </span>
                              )}
                            </div>

                            {/* State changes */}
                            {(event.before_state || event.after_state) && (
                              <div className="mt-2 p-2 rounded-lg bg-muted/30 text-xs font-mono">
                                {event.before_state && (
                                  <div className="text-muted-foreground">
                                    Before: {JSON.stringify(event.before_state).slice(0, 100)}...
                                  </div>
                                )}
                                {event.after_state && (
                                  <div className="text-foreground">
                                    After: {JSON.stringify(event.after_state).slice(0, 100)}...
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div className="text-right text-sm text-muted-foreground flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                            </div>
                            <div className="text-xs font-mono mt-1">
                              {format(new Date(event.created_at), 'MMM d, HH:mm')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}