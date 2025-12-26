import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
  variant = 'default',
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className={cn('metric-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold font-mono tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {isPositive ? '+' : ''}
                {change.toFixed(2)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
