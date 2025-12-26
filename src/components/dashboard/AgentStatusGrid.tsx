import { agents } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Bot, Cpu, HardDrive } from 'lucide-react';

const agentTypeIcons: Record<string, string> = {
  'market-data': '📊',
  'strategy': '🧠',
  'execution': '⚡',
  'risk': '🛡️',
  'treasury': '🏦',
  'mining': '⛏️',
};

export function AgentStatusGrid() {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Agent Fleet
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {agents.filter(a => a.status === 'online').length}/{agents.length} online
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              'p-3 rounded-lg border transition-all',
              agent.status === 'online'
                ? 'bg-success/5 border-success/20'
                : agent.status === 'degraded'
                ? 'bg-warning/5 border-warning/20'
                : 'bg-destructive/5 border-destructive/20'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{agentTypeIcons[agent.type]}</span>
              <Badge variant={agent.status}>{agent.status}</Badge>
            </div>
            <p className="text-sm font-medium truncate">{agent.name}</p>
            <p className="text-xs text-muted-foreground mb-2">v{agent.version}</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Cpu className="h-3 w-3 text-muted-foreground" />
                <Progress value={agent.cpu} className="h-1 flex-1" />
                <span className="font-mono w-8 text-right">{agent.cpu}%</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <HardDrive className="h-3 w-3 text-muted-foreground" />
                <Progress value={agent.memory} className="h-1 flex-1" />
                <span className="font-mono w-8 text-right">{agent.memory}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
