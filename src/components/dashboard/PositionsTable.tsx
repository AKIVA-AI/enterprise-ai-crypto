import { useState, useEffect } from 'react';
import { positions as initialPositions, generatePriceUpdate, Position } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>(initialPositions);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => {
          const newPrice = generatePriceUpdate(pos.currentPrice, 0.002);
          const pnl = pos.side === 'long'
            ? (newPrice - pos.entryPrice) * pos.size
            : (pos.entryPrice - newPrice) * pos.size;
          const pnlPercent = (pnl / (pos.entryPrice * pos.size)) * 100;
          
          return {
            ...pos,
            currentPrice: newPrice,
            unrealizedPnl: pnl,
            unrealizedPnlPercent: pnlPercent,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Open Positions</h3>
        <div className={cn(
          'flex items-center gap-1 text-sm font-mono font-medium',
          totalPnl >= 0 ? 'text-success' : 'text-destructive'
        )}>
          {totalPnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          ${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full data-grid">
          <thead>
            <tr className="text-muted-foreground text-left">
              <th className="pb-3 font-medium">Symbol</th>
              <th className="pb-3 font-medium">Side</th>
              <th className="pb-3 font-medium text-right">Size</th>
              <th className="pb-3 font-medium text-right">Entry</th>
              <th className="pb-3 font-medium text-right">Current</th>
              <th className="pb-3 font-medium text-right">uPnL</th>
              <th className="pb-3 font-medium text-right">%</th>
              <th className="pb-3 font-medium text-right">Venue</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr key={pos.id} className="border-t border-border/50 hover:bg-muted/30">
                <td className="py-3 font-medium">{pos.symbol}</td>
                <td className="py-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    pos.side === 'long' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                  )}>
                    {pos.side.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 text-right">{pos.size.toLocaleString()}</td>
                <td className="py-3 text-right">${pos.entryPrice.toLocaleString()}</td>
                <td className="py-3 text-right">${pos.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className={cn(
                  'py-3 text-right font-medium',
                  pos.unrealizedPnl >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={cn(
                  'py-3 text-right font-medium',
                  pos.unrealizedPnlPercent >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {pos.unrealizedPnlPercent >= 0 ? '+' : ''}{pos.unrealizedPnlPercent.toFixed(2)}%
                </td>
                <td className="py-3 text-right text-muted-foreground">{pos.venue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
