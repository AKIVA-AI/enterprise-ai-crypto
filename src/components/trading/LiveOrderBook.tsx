import { useLiveOrderBook } from '@/hooks/useLiveOrderBook';
import { cn } from '@/lib/utils';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LiveOrderBookProps {
  symbol: string;
  depth?: number;
  className?: string;
}

export function LiveOrderBook({ symbol, depth = 10, className }: LiveOrderBookProps) {
  const { orderBook, isConnected } = useLiveOrderBook({ symbol, depth, enabled: true });

  const maxTotal = Math.max(
    orderBook?.bids[orderBook.bids.length - 1]?.total || 0,
    orderBook?.asks[orderBook.asks.length - 1]?.total || 0
  );

  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {/* Bids */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-long" />
            Bids
          </h3>
          <Badge 
            variant="outline" 
            className={cn(
              'text-xs gap-1',
              isConnected ? 'border-success/50 text-success' : 'border-destructive/50 text-destructive'
            )}
          >
            {isConnected ? <Wifi className="h-2 w-2" /> : <WifiOff className="h-2 w-2" />}
            {isConnected ? 'Live' : 'Off'}
          </Badge>
        </div>
        
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1 px-1">
            <span>Price</span>
            <span>Size</span>
            <span>Total</span>
          </div>
          {orderBook?.bids.map((level, i) => {
            const widthPercent = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0;
            return (
              <div key={i} className="relative flex items-center justify-between py-0.5 px-1">
                <div 
                  className="absolute inset-y-0 left-0 bg-long/10 rounded-r transition-all duration-150"
                  style={{ width: `${widthPercent}%` }}
                />
                <span className="relative font-mono text-long">
                  ${level.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="relative font-mono text-muted-foreground">
                  {level.size.toFixed(4)}
                </span>
                <span className="relative font-mono">
                  {level.total.toFixed(4)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Asks */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-short" />
            Asks
          </h3>
          {orderBook && (
            <span className="text-xs text-muted-foreground">
              Spread: {orderBook.spread.toFixed(2)} ({orderBook.spreadPercent.toFixed(3)}%)
            </span>
          )}
        </div>
        
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1 px-1">
            <span>Price</span>
            <span>Size</span>
            <span>Total</span>
          </div>
          {orderBook?.asks.map((level, i) => {
            const widthPercent = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0;
            return (
              <div key={i} className="relative flex items-center justify-between py-0.5 px-1">
                <div 
                  className="absolute inset-y-0 right-0 bg-short/10 rounded-l transition-all duration-150"
                  style={{ width: `${widthPercent}%` }}
                />
                <span className="relative font-mono text-short">
                  ${level.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="relative font-mono text-muted-foreground">
                  {level.size.toFixed(4)}
                </span>
                <span className="relative font-mono">
                  {level.total.toFixed(4)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
