import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { positions as initialPositions, orders, generatePriceUpdate, Position } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crosshair, AlertOctagon, XCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function Execution() {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!killSwitchActive) {
        setPositions((prev) =>
          prev.map((pos) => {
            const newPrice = generatePriceUpdate(pos.currentPrice, 0.002);
            const pnl = pos.side === 'long'
              ? (newPrice - pos.entryPrice) * pos.size
              : (pos.entryPrice - newPrice) * pos.size;
            const pnlPercent = (pnl / (pos.entryPrice * pos.size)) * 100;
            return { ...pos, currentPrice: newPrice, unrealizedPnl: pnl, unrealizedPnlPercent: pnlPercent };
          })
        );
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [killSwitchActive]);

  const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const totalExposure = positions.reduce((sum, p) => sum + Math.abs(p.currentPrice * p.size), 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Crosshair className="h-7 w-7 text-primary" />
              Execution Console
            </h1>
            <p className="text-muted-foreground">Real-time positions, orders, and execution controls</p>
          </div>
          <Button
            variant={killSwitchActive ? 'default' : 'destructive'}
            className={cn('gap-2', killSwitchActive && 'bg-success hover:bg-success/90')}
            onClick={() => setKillSwitchActive(!killSwitchActive)}
          >
            <AlertOctagon className="h-4 w-4" />
            {killSwitchActive ? 'Resume Trading' : 'Kill Switch'}
          </Button>
        </div>

        {killSwitchActive && (
          <div className="glass-panel rounded-xl p-4 border-warning/50 bg-warning/10">
            <div className="flex items-center gap-3">
              <AlertOctagon className="h-6 w-6 text-warning" />
              <div>
                <p className="font-semibold text-warning">Kill Switch Active</p>
                <p className="text-sm text-muted-foreground">All trading operations suspended. New orders blocked.</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="metric-card">
            <p className="text-sm text-muted-foreground">Total Exposure</p>
            <p className="text-2xl font-mono font-semibold">${totalExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-muted-foreground">Unrealized P&L</p>
            <p className={cn(
              'text-2xl font-mono font-semibold flex items-center gap-2',
              totalPnl >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {totalPnl >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              ${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-muted-foreground">Open Positions</p>
            <p className="text-2xl font-mono font-semibold">{positions.length}</p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-muted-foreground">Pending Orders</p>
            <p className="text-2xl font-mono font-semibold">{orders.filter(o => o.status === 'pending').length}</p>
          </div>
        </div>

        {/* Positions table */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Positions</h3>
            <Button variant="ghost" size="sm" className="gap-1">
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
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
                  <th className="pb-3 font-medium text-right">Leverage</th>
                  <th className="pb-3 font-medium text-right">Venue</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
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
                      <span className="text-xs ml-1">({pos.unrealizedPnlPercent >= 0 ? '+' : ''}{pos.unrealizedPnlPercent.toFixed(2)}%)</span>
                    </td>
                    <td className="py-3 text-right">{pos.leverage}x</td>
                    <td className="py-3 text-right text-muted-foreground">{pos.venue}</td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders table */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-grid">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th className="pb-3 font-medium">Symbol</th>
                  <th className="pb-3 font-medium">Side</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Size</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-right">Filled</th>
                  <th className="pb-3 font-medium text-right">Venue</th>
                  <th className="pb-3 font-medium text-right">Age</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="py-3 font-medium">{order.symbol}</td>
                    <td className="py-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        order.side === 'buy' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                      )}>
                        {order.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 uppercase text-xs">{order.type}</td>
                    <td className="py-3">
                      <Badge variant={order.status === 'filled' ? 'success' : order.status === 'pending' ? 'warning' : 'destructive'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">{order.size}</td>
                    <td className="py-3 text-right">${order.price.toLocaleString()}</td>
                    <td className="py-3 text-right">{order.filledSize}/{order.size}</td>
                    <td className="py-3 text-right text-muted-foreground">{order.venue}</td>
                    <td className="py-3 text-right text-muted-foreground text-xs">
                      {formatDistanceToNow(order.createdAt, { addSuffix: false })}
                    </td>
                    <td className="py-3 text-right">
                      {order.status === 'pending' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
