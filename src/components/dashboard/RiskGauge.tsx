import { cn } from '@/lib/utils';

interface RiskGaugeProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export function RiskGauge({ value, max = 100, label, className }: RiskGaugeProps) {
  const percentage = (value / max) * 100;
  const rotation = (percentage / 100) * 180 - 90;

  const getColor = () => {
    if (percentage < 50) return 'text-success';
    if (percentage < 75) return 'text-warning';
    return 'text-destructive';
  };

  const getGradient = () => {
    if (percentage < 50) return 'from-success to-success/50';
    if (percentage < 75) return 'from-warning to-warning/50';
    return 'from-destructive to-destructive/50';
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative w-32 h-16 overflow-hidden">
        {/* Background arc */}
        <div className="absolute inset-0 border-8 border-muted rounded-t-full border-b-0" />
        
        {/* Filled arc */}
        <div 
          className={cn(
            'absolute inset-0 border-8 rounded-t-full border-b-0 transition-all duration-500',
            percentage < 50 ? 'border-success' : percentage < 75 ? 'border-warning' : 'border-destructive'
          )}
          style={{
            clipPath: `polygon(0 100%, 0 0, ${Math.min(percentage, 50)}% 0, ${Math.min(percentage, 50)}% 100%)`,
          }}
        />
        
        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 w-1 h-14 bg-foreground origin-bottom transition-transform duration-500"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        >
          <div className="w-3 h-3 rounded-full bg-foreground -translate-x-1" />
        </div>
        
        {/* Center cover */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-card border-2 border-border" />
      </div>
      
      <div className="mt-2 text-center">
        <span className={cn('text-2xl font-mono font-bold', getColor())}>
          {value.toFixed(0)}%
        </span>
        {label && <p className="text-xs text-muted-foreground mt-1">{label}</p>}
      </div>
    </div>
  );
}
