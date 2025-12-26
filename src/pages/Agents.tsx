import { MainLayout } from '@/components/layout/MainLayout';
import { useAgents, useUpdateAgentStatus } from '@/hooks/useAgents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Bot, RefreshCw, Power, Settings, Cpu, HardDrive, Clock, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

const agentTypeLabels: Record<string, string> = {
  'market-data': 'Market Data',
  'strategy': 'Strategy',
  'execution': 'Execution',
  'risk': 'Risk Management',
  'treasury': 'Treasury',
  'ops': 'Operations',
};

const agentTypeColors: Record<string, string> = {
  'market-data': 'bg-chart-1/20 text-chart-1',
  'strategy': 'bg-chart-2/20 text-chart-2',
  'execution': 'bg-chart-3/20 text-chart-3',
  'risk': 'bg-chart-4/20 text-chart-4',
  'treasury': 'bg-chart-5/20 text-chart-5',
  'ops': 'bg-primary/20 text-primary',
};

export default function Agents() {
  const { data: agents, isLoading, refetch, isRefetching } = useAgents();
  const updateStatus = useUpdateAgentStatus();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    refetch();
  };

  const toggleAgentPower = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    await updateStatus.mutateAsync({ id: agentId, status: newStatus });
  };

  const onlineCount = agents?.filter(a => a.status === 'online').length || 0;
  const totalCount = agents?.length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-7 w-7 text-primary" />
              Agent Registry
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage your autonomous agents 
              <span className="ml-2 text-sm">
                ({onlineCount}/{totalCount} online)
              </span>
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isRefetching}>
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Status
          </Button>
        </div>

        {/* Agent cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-panel rounded-xl p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-16" />
                  ))}
                </div>
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : agents?.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Agents Registered</h3>
            <p className="text-muted-foreground">
              Agents will appear here once they connect to the system.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents?.map((agent) => (
              <div
                key={agent.id}
                className={cn(
                  'glass-panel rounded-xl p-6 transition-all hover:border-primary/30',
                  agent.status === 'online' && 'border-success/20',
                  agent.status === 'degraded' && 'border-warning/20',
                  agent.status === 'offline' && 'border-destructive/20'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <Badge variant={agent.status as 'online' | 'offline' | 'degraded'}>{agent.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', agentTypeColors[agent.type])}>
                        {agentTypeLabels[agent.type] || agent.type}
                      </span>
                      <span className="text-sm text-muted-foreground">v{agent.version}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        'h-8 w-8',
                        agent.status === 'online' ? 'text-success hover:text-destructive' : 'text-muted-foreground hover:text-success'
                      )}
                      onClick={() => toggleAgentPower(agent.id, agent.status)}
                      disabled={updateStatus.isPending}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="font-mono font-medium">{Number(agent.uptime).toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <Cpu className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">CPU</p>
                    <p className="font-mono font-medium">{Number(agent.cpu_usage).toFixed(0)}%</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <HardDrive className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Memory</p>
                    <p className="font-mono font-medium">{Number(agent.memory_usage).toFixed(0)}%</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Heartbeat</p>
                    <p className="font-mono font-medium text-xs">
                      {formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: false })}
                    </p>
                  </div>
                </div>

                {/* Resource bars */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12">CPU</span>
                    <Progress value={Number(agent.cpu_usage)} className="h-2 flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12">MEM</span>
                    <Progress value={Number(agent.memory_usage)} className="h-2 flex-1" />
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Capabilities</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities?.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Error message if degraded/offline */}
                {agent.error_message && (
                  <div className="mt-4 p-2 rounded bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-destructive">{agent.error_message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
