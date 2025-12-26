import { MainLayout } from '@/components/layout/MainLayout';
import { agents } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { Bot, RefreshCw, Power, Settings, Cpu, HardDrive, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const agentTypeLabels: Record<string, string> = {
  'market-data': 'Market Data',
  'strategy': 'Strategy',
  'execution': 'Execution',
  'risk': 'Risk Management',
  'treasury': 'Treasury',
  'mining': 'Mining',
};

export default function Agents() {
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
            <p className="text-muted-foreground">Monitor and manage your autonomous agents</p>
          </div>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent) => (
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
                    <Badge variant={agent.status}>{agent.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {agentTypeLabels[agent.type]} • v{agent.version}
                  </p>
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
                  <p className="font-mono font-medium">{agent.uptime}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Cpu className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">CPU</p>
                  <p className="font-mono font-medium">{agent.cpu}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <HardDrive className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Memory</p>
                  <p className="font-mono font-medium">{agent.memory}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Heartbeat</p>
                  <p className="font-mono font-medium text-xs">
                    {formatDistanceToNow(agent.lastHeartbeat, { addSuffix: false })}
                  </p>
                </div>
              </div>

              {/* Resource bars */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">CPU</span>
                  <Progress value={agent.cpu} className="h-2 flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">MEM</span>
                  <Progress value={agent.memory} className="h-2 flex-1" />
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
