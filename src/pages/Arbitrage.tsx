import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeftRight,
  Zap,
  RefreshCw,
  CheckCircle2,
  Circle,
  Activity,
  Play,
  Pause,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExchangeKeys } from '@/hooks/useExchangeKeys';
import { useInstruments } from '@/hooks/useInstruments';
import { useSpotArbSpreads } from '@/hooks/useSpotArbSpreads';
import { useVenues } from '@/hooks/useVenues';

const FALLBACK_EXCHANGES = [
  {
    id: 'coinbase',
    name: 'Coinbase Advanced',
    description: 'Primary US spot venue',
    features: ['Spot', 'USD pairs'],
  },
  {
    id: 'kraken',
    name: 'Kraken',
    description: 'US-friendly with deep liquidity',
    features: ['Spot', 'USD pairs'],
  },
];

const normalizeExchangeId = (name: string) =>
  name.toLowerCase().replace(' advanced', '').replace(/\s+/g, '_');

export default function Arbitrage() {
  const [isScanning, setIsScanning] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);

  const { keys } = useExchangeKeys();
  const { data: venues } = useVenues();
  const { data: instruments } = useInstruments();
  const { data: spreads, isLoading } = useSpotArbSpreads(isScanning);

  const configuredSet = useMemo(() => {
    return new Set(keys.filter((key) => key.is_active).map((key) => key.exchange));
  }, [keys]);

  const exchangeCards = useMemo(() => {
    if (!venues || venues.length === 0) {
      return FALLBACK_EXCHANGES.map((exchange) => ({
        ...exchange,
        apiConfigured: configuredSet.has(exchange.id),
      }));
    }

    return venues.map((venue) => ({
      id: normalizeExchangeId(venue.name),
      name: venue.name,
      description: venue.status === 'healthy' ? 'Venue healthy' : 'Venue degraded',
      apiConfigured: configuredSet.has(normalizeExchangeId(venue.name)),
      features: ['Spot'],
    }));
  }, [venues, configuredSet]);

  const configuredCount = exchangeCards.filter((exchange) => exchange.apiConfigured).length;

  const instrumentMap = useMemo(() => {
    const map = new Map<string, string>();
    instruments?.forEach((instrument) => {
      map.set(instrument.id, instrument.common_symbol || instrument.venue_symbol);
    });
    return map;
  }, [instruments]);

  const venueMap = useMemo(() => {
    const map = new Map<string, string>();
    venues?.forEach((venue) => {
      map.set(venue.id, venue.name);
    });
    return map;
  }, [venues]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowLeftRight className="h-6 w-6 text-primary" />
              Cross-Exchange Arbitrage
            </h1>
            <p className="text-muted-foreground mt-1">
              Spot-only arbitrage across compliant venues
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={cn(
                configuredCount >= 2
                  ? 'border-green-500 text-green-500'
                  : 'border-yellow-500 text-yellow-500'
              )}
            >
              {configuredCount}/{exchangeCards.length} Exchanges Connected
            </Badge>
            <Button
              variant={isScanning ? 'outline' : 'default'}
              onClick={() => setIsScanning(!isScanning)}
              disabled={configuredCount < 2}
              className="gap-2"
            >
              {isScanning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isScanning ? 'Pause' : 'Start Scanning'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {exchangeCards.map((exchange) => (
            <Card
              key={exchange.id}
              className={cn(
                'relative overflow-hidden transition-all',
                exchange.apiConfigured ? 'border-green-500/50' : 'border-border'
              )}
            >
              <div
                className={cn(
                  'absolute top-3 right-3 w-3 h-3 rounded-full',
                  exchange.apiConfigured ? 'bg-green-500' : 'bg-gray-400'
                )}
              />

              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {exchange.name}
                </CardTitle>
                <CardDescription>{exchange.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {exchange.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">API Status</span>
                    {exchange.apiConfigured ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Circle className="h-3 w-3 mr-1" />
                        Not Configured
                      </Badge>
                    )}
                  </div>

                  {!exchange.apiConfigured && (
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Settings className="h-4 w-4" />
                      Configure API
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Scanner Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-Execute Trades</span>
                <Switch
                  checked={autoExecute}
                  onCheckedChange={setAutoExecute}
                  disabled={configuredCount < 2}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Min Edge Threshold</span>
                <Badge variant="outline">6 bps</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Position Size</span>
                <Badge variant="outline">$50,000</Badge>
              </div>

              {configuredCount < 2 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm">
                  <p className="text-yellow-600 dark:text-yellow-400">
                    Connect at least 2 exchanges to enable arbitrage scanning.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Live Opportunities
                </span>
                {isScanning && (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription>
                Real-time price discrepancies across venues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configuredCount < 2 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Connect exchanges to see opportunities</p>
                  <p className="text-sm">At least 2 exchanges required</p>
                </div>
              ) : !isScanning ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Pause className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Scanner is paused</p>
                  <p className="text-sm">Click "Start Scanning" to find opportunities</p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin opacity-30" />
                  <p className="font-medium">Loading opportunities</p>
                  <p className="text-sm">Fetching latest spread data</p>
                </div>
              ) : (spreads ?? []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No actionable spreads</p>
                  <p className="text-sm">Waiting for market dislocations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(spreads ?? []).map((opp) => {
                    const instrument = instrumentMap.get(opp.instrument_id) ?? 'Unknown';
                    const buyVenue = venueMap.get(opp.buy_venue_id) ?? 'Unknown';
                    const sellVenue = venueMap.get(opp.sell_venue_id) ?? 'Unknown';

                    return (
                      <div
                        key={opp.id}
                        className="p-4 rounded-lg border hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="font-mono text-base">
                              {instrument}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm">
                              <span>{buyVenue}</span>
                              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                              <span>{sellVenue}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Spread</div>
                              <div className="font-mono text-primary">
                                {opp.executable_spread_bps.toFixed(2)} bps
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Net Edge</div>
                              <div className="font-mono text-green-500">
                                {opp.net_edge_bps.toFixed(2)} bps
                              </div>
                            </div>
                            <Button size="sm" className="gap-1" disabled>
                              <Zap className="h-3 w-3" />
                              Execute
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
