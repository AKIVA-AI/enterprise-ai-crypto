import { MainLayout } from '@/components/layout/MainLayout';
import { launchProjects, launchTasks } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Rocket, Plus, CheckCircle2, Clock, AlertCircle, Circle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const categoryColors: Record<string, string> = {
  branding: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  legal: 'bg-destructive/20 text-destructive border-destructive/30',
  tokenomics: 'bg-primary/20 text-primary border-primary/30',
  liquidity: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  marketing: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  tech: 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30',
};

const statusIcons = {
  pending: Circle,
  'in-progress': Clock,
  completed: CheckCircle2,
  blocked: AlertCircle,
};

export default function Launch() {
  const project = launchProjects[0];
  const projectTasks = launchTasks.filter(t => t.projectId === project.id);

  const tasksByCategory = projectTasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, typeof launchTasks>);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="h-7 w-7 text-primary" />
              Token Launch
            </h1>
            <p className="text-muted-foreground">Compliance-first launch readiness checklist</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Launch Project
          </Button>
        </div>

        {/* Project overview */}
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">{project.name}</h2>
                <Badge variant="secondary" className="text-base font-mono">${project.ticker}</Badge>
                <Badge variant={project.status === 'launched' ? 'success' : project.status === 'ready' ? 'online' : 'warning'}>
                  {project.status}
                </Badge>
              </div>
              {project.launchDate && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Target Launch: {format(project.launchDate, 'MMMM d, yyyy')}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold font-mono">{project.progress}%</p>
              <p className="text-sm text-muted-foreground">
                {project.completedTasks}/{project.totalTasks} tasks complete
              </p>
            </div>
          </div>
          <Progress value={project.progress} className="h-3" />
        </div>

        {/* Readiness checklist by category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(tasksByCategory).map(([category, tasks]) => {
            const completedCount = tasks.filter(t => t.status === 'completed').length;
            const categoryProgress = (completedCount / tasks.length) * 100;

            return (
              <div key={category} className="glass-panel rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-1 rounded text-xs font-medium capitalize border', categoryColors[category])}>
                      {category}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {completedCount}/{tasks.length}
                  </span>
                </div>
                <Progress value={categoryProgress} className="h-1.5 mb-4" />
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const Icon = statusIcons[task.status];
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted/30',
                          task.status === 'completed' && 'opacity-60'
                        )}
                      >
                        <Icon className={cn(
                          'h-4 w-4 flex-shrink-0',
                          task.status === 'completed' ? 'text-success' :
                          task.status === 'in-progress' ? 'text-primary' :
                          task.status === 'blocked' ? 'text-destructive' :
                          'text-muted-foreground'
                        )} />
                        <span className={cn(
                          'text-sm flex-1',
                          task.status === 'completed' && 'line-through'
                        )}>
                          {task.title}
                        </span>
                        <Badge variant={task.priority} className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Launch metrics placeholder */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-semibold mb-4">Post-Launch Monitoring</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground mb-1">Token Price</p>
              <p className="text-2xl font-mono font-bold text-muted-foreground">--</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
              <p className="text-2xl font-mono font-bold text-muted-foreground">--</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground mb-1">24h Volume</p>
              <p className="text-2xl font-mono font-bold text-muted-foreground">--</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground mb-1">Holders</p>
              <p className="text-2xl font-mono font-bold text-muted-foreground">--</p>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Metrics will populate after token launch
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
