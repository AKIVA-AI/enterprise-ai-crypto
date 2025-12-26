import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePositions } from '@/hooks/usePositions';
import { useBooks } from '@/hooks/useBooks';
import { useLivePriceFeed } from '@/hooks/useLivePriceFeed';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetAllocation {
  asset: string;
  exposure: number;
  pnl: number;
  percentage: number;
  side: 'buy' | 'sell';
}

export function PortfolioSummaryWidget() {
  const { data: positions = [] } = usePositions();
  const { data: books = [] } = useBooks();

  // Get unique instruments for live prices
  const instruments = useMemo(() => {
    return [...new Set(positions.map(p => p.instrument.replace('/', '-')))];
  }, [positions]);

  const { prices, isConnected } = useLivePriceFeed({
    symbols: instruments,
    enabled: instruments.length > 0,
  });

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const totalCapital = books.reduce((sum, b) => sum + Number(b.capital_allocated), 0);
    
    let totalExposure = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    let longExposure = 0;
    let shortExposure = 0;

    const assetMap = new Map<string, AssetAllocation>();

    positions.forEach(pos => {
      const feedSymbol = pos.instrument.replace('/', '-');
      const livePrice = prices.get(feedSymbol);
      const currentPrice = livePrice?.price || Number(pos.mark_price);
      
      const exposure = Number(pos.size) * currentPrice;
      const entryValue = Number(pos.size) * Number(pos.entry_price);
      const unrealizedPnl = pos.side === 'buy' 
        ? exposure - entryValue 
        : entryValue - exposure;

      totalExposure += exposure;
      totalUnrealizedPnl += unrealizedPnl;
      totalRealizedPnl += Number(pos.realized_pnl);

      if (pos.side === 'buy') {
        longExposure += exposure;
      } else {
        shortExposure += exposure;
      }

      // Group by base asset
      const baseAsset = pos.instrument.split('/')[0];
      const existing = assetMap.get(baseAsset);
      if (existing) {
        existing.exposure += exposure;
        existing.pnl += unrealizedPnl;
      } else {
        assetMap.set(baseAsset, {
          asset: baseAsset,
          exposure,
          pnl: unrealizedPnl,
          percentage: 0,
          side: pos.side,
        });
      }
    });

    // Calculate percentages
    const allocations = Array.from(assetMap.values())
      .map(a => ({
        ...a,
        percentage: totalExposure > 0 ? (a.exposure / totalExposure) * 100 : 0,
      }))
      .sort((a, b) => b.exposure - a.exposure);

    const netExposure = longExposure - shortExposure;
    const exposureRatio = totalCapital > 0 ? (totalExposure / totalCapital) * 100 : 0;

    return {
      totalCapital,
      totalExposure,
      totalUnrealizedPnl,
      totalRealizedPnl,
      totalPnl: totalUnrealizedPnl + totalRealizedPnl,
      longExposure,
      shortExposure,
      netExposure,
      exposureRatio,
      allocations,
    };
  }, [positions, books, prices]);

  const {
    totalCapital,
    totalExposure,
    totalUnrealizedPnl,
    totalRealizedPnl,
    totalPnl,
    longExposure,
    shortExposure,
    netExposure,
    exposureRatio,
    allocations,
  } = portfolioMetrics;

  const pnlPercent = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Portfolio Summary
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              'font-mono',
              isConnected ? 'border-success/50 text-success' : 'border-muted'
            )}
          >
            {isConnected ? 'Live' : 'Delayed'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Capital</p>
            <p className="text-2xl font-mono font-bold">
              ${totalCapital.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total P&L</p>
            <p className={cn(
              'text-2xl font-mono font-bold',
              totalPnl >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span className="text-sm ml-1">
                ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>

        {/* Exposure Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Exposure Ratio</span>
            <span className={cn(
              'font-mono font-medium',
              exposureRatio > 100 ? 'text-warning' : ''
            )}>
              {exposureRatio.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(exposureRatio, 100)} 
            className={cn(
              'h-2',
              exposureRatio > 100 && '[&>div]:bg-warning'
            )}
          />
          {exposureRatio > 100 && (
            <div className="flex items-center gap-1 text-xs text-warning">
              <AlertTriangle className="h-3 w-3" />
              Leveraged position
            </div>
          )}
        </div>

        {/* Long/Short Split */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-success/10 border border-success/20 p-3">
            <div className="flex items-center gap-2 text-xs text-success mb-1">
              <TrendingUp className="h-3 w-3" />
              Long Exposure
            </div>
            <p className="text-lg font-mono font-semibold text-success">
              ${longExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <div className="flex items-center gap-2 text-xs text-destructive mb-1">
              <TrendingDown className="h-3 w-3" />
              Short Exposure
            </div>
            <p className="text-lg font-mono font-semibold text-destructive">
              ${shortExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Net Exposure */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <span className="text-sm text-muted-foreground">Net Exposure</span>
          <span className={cn(
            'font-mono font-semibold',
            netExposure >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {netExposure >= 0 ? '+' : ''}${netExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* P&L Breakdown */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Unrealized</span>
            <span className={cn(
              'font-mono',
              totalUnrealizedPnl >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Realized</span>
            <span className={cn(
              'font-mono',
              totalRealizedPnl >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {totalRealizedPnl >= 0 ? '+' : ''}${totalRealizedPnl.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Asset Allocation */}
        {allocations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <PieChart className="h-4 w-4 text-primary" />
              Asset Allocation
            </div>
            <div className="space-y-2">
              {allocations.slice(0, 5).map((alloc) => (
                <div key={alloc.asset} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{alloc.asset}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs font-mono',
                        alloc.pnl >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {alloc.pnl >= 0 ? '+' : ''}{alloc.pnl.toFixed(2)}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {alloc.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={alloc.percentage} 
                    className="h-1.5"
                  />
                </div>
              ))}
              {allocations.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{allocations.length - 5} more assets
                </p>
              )}
            </div>
          </div>
        )}

        {positions.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No open positions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
