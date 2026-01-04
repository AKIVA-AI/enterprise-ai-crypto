import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { UnifiedSpotTrader } from '@/components/trading/UnifiedSpotTrader';
import { PositionProtectionPanel } from '@/components/trading/PositionProtectionPanel';
import { OrderFlowPanel } from '@/components/trading/OrderFlowPanel';
import { RiskSimulator } from '@/components/risk/RiskSimulator';
import { ModeAwareSafetyBanner } from '@/components/mode/ModeAwareSafetyBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  ArrowRightLeft,
  Zap,
  Clock,
  ExternalLink,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { useInstruments } from '@/hooks/useInstruments';
import { useSpotArbSpreads } from '@/hooks/useSpotArbSpreads';
import { useVenues } from '@/hooks/useVenues';
import { Link } from 'react-router-dom';

export default function Trade() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const { data: spreads, isFetching: spreadsFetching } = useSpotArbSpreads(true);
  const { data: venues } = useVenues();
  const { data: instruments } = useInstruments();

  const venueMap = useMemo(() => {
    const map = new Map<string, string>();
    venues?.forEach((venue) => {
      map.set(venue.id, venue.name);
    });
    return map;
  }, [venues]);

  const instrumentMap = useMemo(() => {
    const map = new Map<string, string>();
    instruments?.forEach((instrument) => {
      map.set(instrument.id, instrument.common_symbol || instrument.venue_symbol);
    });
    return map;
  }, [instruments]);

  const topOpportunities = useMemo(() => {
    return (spreads ?? [])
      .filter((opp) => opp.net_edge_bps > 2)
      .slice(0, 3);
  }, [spreads]);

  const venueStatusLabel = (status?: string) => {
    if (!status) return 'Unknown';
    if (status === 'healthy') return 'Healthy';
    if (status === 'degraded') return 'Degraded';
    if (status === 'offline') return 'Offline';
    return status;
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 space-y-6">
        <ModeAwareSafetyBanner />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Trade</h1>
            <p className="text-muted-foreground">
              Risk-managed execution with full transparency
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/arbitrage" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Arbitrage Dashboard
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <UnifiedSpotTrader />
            <OrderFlowPanel symbol={selectedSymbol} />
          </div>

          <div className="space-y-4">
            <PositionProtectionPanel />
            <RiskSimulator />
          </div>

          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Quick Trade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AVAX'].map((symbol) => (
                    <Button
                      key={symbol}
                      variant={selectedSymbol === symbol ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSymbol(symbol)}
                      className="text-xs"
                    >
                      {symbol}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-success" />
                    Arbitrage Opportunities
                  </span>
                  {spreadsFetching && (
                    <Badge variant="outline" className="text-[10px] animate-pulse">
                      Scanning
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topOpportunities.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p>No arbitrage opportunities detected</p>
                    <p className="text-xs mt-1">Edges below 2 bps threshold</p>
                  </div>
                ) : (
                  topOpportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {instrumentMap.get(opp.instrument_id) ?? 'Unknown'}
                        </span>
                        <Badge
                          variant={opp.net_edge_bps > 6 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          +{opp.net_edge_bps.toFixed(2)} bps
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-success" />
                          {venueMap.get(opp.buy_venue_id) ?? 'Unknown'}
                        </span>
                        <span>to</span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-destructive rotate-180" />
                          {venueMap.get(opp.sell_venue_id) ?? 'Unknown'}
                        </span>
                        <span className="ml-auto font-mono text-success">
                          {opp.executable_spread_bps.toFixed(2)} bps
                        </span>
                      </div>
                    </div>
                  ))
                )}

                {topOpportunities.length > 0 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link to="/arbitrage">
                      View All Opportunities
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Exchange Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(venues ?? []).length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No venue health data yet.
                  </div>
                ) : (
                  venues?.map((venue) => {
                    const isOnline = venue.status === 'healthy';
                    const isDegraded = venue.status === 'degraded';
                    const statusColor = isOnline
                      ? 'bg-success animate-pulse'
                      : isDegraded
                        ? 'bg-yellow-500'
                        : 'bg-destructive';

                    return (
                      <div
                        key={venue.id}
                        className="flex items-center justify-between py-1.5 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>{venue.name}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                          <span className="text-xs text-muted-foreground">
                            {venueStatusLabel(venue.status)}
                            {venue.latency_ms ? ` • ${Math.round(venue.latency_ms)}ms` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
