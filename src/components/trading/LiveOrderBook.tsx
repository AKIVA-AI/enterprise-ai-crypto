import { useLiveOrderBook } from '@/hooks/useLiveOrderBook';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';
import { WebSocketHealthMonitor } from './WebSocketHealthMonitor';

interface LiveOrderBookProps {
  symbol: string;
  depth?: number;
  className?: string;
}

export function LiveOrderBook({ symbol, depth = 10, className }: LiveOrderBookProps) {
  const { 
    orderBook, 
    isConnected, 
    isConnecting,
    reconnectAttempts,
    latencyMs,
    connectionError,
    connect 
  } = useLiveOrderBook({ symbol, depth, enabled: true });

  const maxTotal = Math.max(
    orderBook?.bids[orderBook.bids.length - 1]?.total || 0,
    orderBook?.asks[orderBook.asks.length - 1]?.total || 0
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground">Order Book</h3>
        <WebSocketHealthMonitor
          isConnected={isConnected}
          isConnecting={isConnecting}
          reconnectAttempts={reconnectAttempts}
          latencyMs={latencyMs}
          error={connectionError}
          onReconnect={connect}
          compact
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Bids */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-long" />
            <span className="font-semibold text-sm">Bids</span>
            {orderBook && (
              <span className="ml-auto text-xs text-muted-foreground font-mono">
                Best: ${orderBook.bestBid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            )}
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
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-short" />
            <span className="font-semibold text-sm">Asks</span>
            {orderBook && (
              <span className="ml-auto text-xs text-muted-foreground">
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

      {/* Mid Price Display */}
      {orderBook && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-muted-foreground">Mid Price:</span>
          <span className="font-mono font-bold text-primary">
            ${orderBook.midPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}
