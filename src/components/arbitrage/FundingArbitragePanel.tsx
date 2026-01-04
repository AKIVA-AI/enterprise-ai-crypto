import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Zap,
  Target,
  Percent,
  ArrowRightLeft,
  ShieldAlert,
  Globe
} from 'lucide-react';
import {
  useFundingOpportunities,
  useActiveFundingPositions,
  FundingOpportunity,
  FundingPosition
} from '@/hooks/useFundingArbitrage';
import { formatDistanceToNow } from 'date-fns';
import { useTradingMode } from '@/hooks/useTradingMode';

interface FundingArbitragePanelProps {
  compact?: boolean;
}

export function FundingArbitragePanel({ compact = false }: FundingArbitragePanelProps) {
  const { mode } = useTradingMode();
  const isUSMode = mode === 'us';

  const { data: oppData, isLoading: loadingOpps, refetch: refetchOpps } = useFundingOpportunities();
  const { data: positions, isLoading: loadingPositions } = useActiveFundingPositions();

  useEffect(() => {
    if (isUSMode) return;
    const interval = setInterval(() => refetchOpps(), 30000);
    return () => clearInterval(interval);
  }, [isUSMode, refetchOpps]);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return <Badge className="bg-green-500/20 text-green-500">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-500">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-500/20 text-red-500">High Risk</Badge>;
      default:
        return null;
    }
  };

  const renderOpportunityCard = (opp: FundingOpportunity) => (
    <div
      key={`${opp.symbol}-${opp.spotVenue}-${opp.perpVenue}`}
      className="p-4 border rounded-lg bg-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{opp.symbol}</span>
          {getRiskBadge(opp.riskLevel)}
        </div>
        <div className="flex items-center gap-2">
          {opp.fundingRate > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`font-mono font-bold ${opp.fundingRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {(opp.fundingRate * 100).toFixed(4)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Est. APY</p>
          <p className={`font-bold ${opp.estimatedApy > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {opp.estimatedApy.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Next Funding</p>
          <p className="text-sm font-medium">
            {formatDistanceToNow(new Date(opp.nextFundingTime), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <ArrowRightLeft className="h-3 w-3" />
          <span>{opp.spotVenue} vs {opp.perpVenue}</span>
        </div>
        <span className="capitalize">{opp.direction.replace(/_/g, ' ')}</span>
      </div>

      {opp.isActionable && (
        <Button size="sm" className="w-full mt-3 gap-2" disabled>
          <Zap className="h-3 w-3" />
          OMS Execution Required
        </Button>
      )}
    </div>
  );

  const renderPositionCard = (pos: FundingPosition) => (
    <div key={pos.id} className="p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">{pos.symbol}</span>
        <Badge variant={pos.status === 'simulated' ? 'secondary' : 'default'}>
          {pos.status}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Size</p>
          <p className="font-mono">${pos.quantity.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Spread</p>
          <p className="font-mono">{pos.spread_percent.toFixed(3)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Net P&L</p>
          <p className={`font-mono ${pos.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${pos.net_profit.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>{pos.buy_exchange} vs {pos.sell_exchange}</span>
        <span>{formatDistanceToNow(new Date(pos.created_at), { addSuffix: true })}</span>
      </div>
    </div>
  );

  const USRestrictionMessage = () => (
    <Alert className="border-yellow-500/50 bg-yellow-500/10">
      <ShieldAlert className="h-5 w-5 text-yellow-500" />
      <AlertTitle className="text-yellow-500">US Trading Mode Active</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        Funding rate arbitrage requires perpetual futures, which are not available to US users due to regulatory restrictions.
        This feature is only available in <span className="font-medium text-foreground">International Mode</span>.
        <div className="mt-3 flex items-center gap-2 text-xs">
          <Globe className="h-4 w-4" />
          <span>Switch to International Mode in Settings to access this feature.</span>
        </div>
      </AlertDescription>
    </Alert>
  );

  if (compact) {
    if (isUSMode) {
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Funding Arbitrage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-yellow-500">
              <ShieldAlert className="h-4 w-4" />
              <span>Not available in US Mode</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Funding Arbitrage
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetchOpps()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingOpps ? (
            <Skeleton className="h-24 w-full" />
          ) : oppData?.opportunities?.filter(o => o.isActionable).slice(0, 2).map(opp => (
            <div key={opp.symbol} className="flex items-center justify-between p-2 border rounded mb-2">
              <div>
                <span className="font-medium">{opp.symbol}</span>
                <span className={`ml-2 text-sm ${opp.estimatedApy > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {opp.estimatedApy.toFixed(1)}% APY
                </span>
              </div>
              <Button size="sm" variant="outline" disabled>
                <Zap className="h-3 w-3" />
              </Button>
            </div>
          )) || (
            <p className="text-sm text-muted-foreground text-center py-4">
              No actionable opportunities
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isUSMode) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Funding Rate Arbitrage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <USRestrictionMessage />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Funding Rate Arbitrage
          </CardTitle>
          <Button
            variant="outline"
            onClick={() => refetchOpps()}
            disabled={loadingOpps}
          >
            {loadingOpps ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Alert className="mt-3 border border-border bg-muted/30">
          <AlertTitle className="text-sm">Execution handled by OMS</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            This panel is read-only until OMS execution wiring is exposed in the UI.
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="opportunities">
          <TabsList className="mb-4">
            <TabsTrigger value="opportunities" className="gap-2">
              <Target className="h-4 w-4" />
              Opportunities ({oppData?.actionable || 0})
            </TabsTrigger>
            <TabsTrigger value="positions" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Positions ({positions?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities">
            <ScrollArea className="h-[500px]">
              {loadingOpps ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
              ) : oppData?.opportunities?.length ? (
                <div className="space-y-4 pr-4">
                  {oppData.opportunities.map(renderOpportunityCard)}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Percent className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No funding opportunities found</p>
                  <Button variant="outline" onClick={() => refetchOpps()} className="mt-4">
                    Scan Again
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="positions">
            <ScrollArea className="h-[500px]">
              {loadingPositions ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-28 w-full" />)}
                </div>
              ) : positions?.length ? (
                <div className="space-y-4 pr-4">
                  {positions.map(renderPositionCard)}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No active positions</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
