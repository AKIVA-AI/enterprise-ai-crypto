import { cn } from '@/lib/utils';
import { TrendingUp, Zap, Users, Droplets } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type MemeProject = Database['public']['Tables']['meme_projects']['Row'];

interface MemeScorePanelProps {
  project: MemeProject;
}

interface ScoreCardProps {
  icon: typeof TrendingUp;
  label: string;
  value: number;
  maxValue?: number;
  suffix?: string;
  inverted?: boolean;
  description: string;
}

function ScoreCard({ icon: Icon, label, value, maxValue = 100, suffix = '', inverted, description }: ScoreCardProps) {
  const percentage = inverted ? (100 - value) / 100 : value / maxValue;
  const displayValue = inverted ? 100 - value : value;
  
  const getColor = (pct: number) => {
    if (pct >= 0.7) return { bg: 'bg-success/20', text: 'text-success', bar: 'bg-success' };
    if (pct >= 0.5) return { bg: 'bg-warning/20', text: 'text-warning', bar: 'bg-warning' };
    return { bg: 'bg-destructive/20', text: 'text-destructive', bar: 'bg-destructive' };
  };

  const colors = getColor(percentage);

  return (
    <div className={cn('glass-panel rounded-lg p-3', colors.bg.replace('/20', '/5'))}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-1.5 rounded-md', colors.bg)}>
          <Icon className={cn('h-3.5 w-3.5', colors.text)} />
        </div>
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1.5">
        <span className={cn('text-2xl font-mono font-semibold', colors.text)}>
          {value.toFixed(0)}
        </span>
        <span className="text-muted-foreground text-xs">{suffix || `/ ${maxValue}`}</span>
      </div>
      <div className="h-1 bg-muted/50 rounded-full overflow-hidden mb-2">
        <div 
          className={cn('h-full transition-all duration-500 ease-out', colors.bar)} 
          style={{ width: `${percentage * 100}%` }} 
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function MemeScorePanel({ project }: MemeScorePanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        Project Scores
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard
          icon={TrendingUp}
          label="Viral Score"
          value={project.viral_score}
          description="Social media traction and meme potential"
        />
        <ScoreCard
          icon={Zap}
          label="Social Velocity"
          value={project.social_velocity}
          description="Rate of community growth and engagement"
        />
        <ScoreCard
          icon={Users}
          label="Holder Distribution"
          value={project.holder_concentration}
          inverted
          suffix="%"
          description="Lower concentration = better distribution"
        />
        <ScoreCard
          icon={Droplets}
          label="Liquidity Signal"
          value={project.liquidity_signal === 'strong' ? 100 : project.liquidity_signal === 'moderate' ? 60 : 30}
          description={`Liquidity depth: ${project.liquidity_signal || 'unknown'}`}
        />
      </div>
    </div>
  );
}
