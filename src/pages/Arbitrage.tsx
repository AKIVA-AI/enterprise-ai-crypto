import { useState } from 'react';
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

// Supported exchanges with their configuration
const EXCHANGES = [
  {
    id: 'coinbase',
    name: 'Coinbase Advanced',
    icon: '🟠',
    description: 'Primary US exchange with futures',
    apiConfigured: true, // TODO: Pull from actual config
    features: ['Spot', 'Futures', 'USD pairs'],
  },
  {
    id: 'binance',
    name: 'Binance',
    icon: '🟡',
    description: 'Global exchange with deep liquidity',
    apiConfigured: false,
    features: ['Spot', 'Futures', 'USDT pairs'],
  },
  {
    id: 'kraken',
    name: 'Kraken',
    icon: '🟣',
    description: 'US-friendly with margin trading',
    apiConfigured: false,
    features: ['Spot', 'Margin', 'USD pairs'],
  },
  {
    id: 'gateio',
    name: 'Gate.io',
    icon: '🔵',
    description: 'Wide altcoin selection',
    apiConfigured: false,
    features: ['Spot', 'Futures', 'USDT pairs'],
  },
];

// Mock opportunities - will be replaced with real data
const MOCK_OPPORTUNITIES = [
  { id: '1', pair: 'BTC/USD', buyExchange: 'binance', sellExchange: 'coinbase', spread: 0.15, profit: 45.20 },
  { id: '2', pair: 'ETH/USD', buyExchange: 'kraken', sellExchange: 'binance', spread: 0.12, profit: 28.50 },
  { id: '3', pair: 'SOL/USD', buyExchange: 'gateio', sellExchange: 'coinbase', spread: 0.22, profit: 18.75 },
];

export default function Arbitrage() {
  const [isScanning, setIsScanning] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);

  // Count configured exchanges
  const configuredCount = EXCHANGES.filter(e => e.apiConfigured).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowLeftRight className="h-6 w-6 text-primary" />
              Cross-Exchange Arbitrage
            </h1>
            <p className="text-muted-foreground mt-1">
              Spot arbitrage across Coinbase, Binance, Kraken, and Gate.io
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn(
              configuredCount >= 2 ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'
            )}>
              {configuredCount}/4 Exchanges Connected
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

        {/* Exchange Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {EXCHANGES.map((exchange) => (
            <Card key={exchange.id} className={cn(
              "relative overflow-hidden transition-all",
              exchange.apiConfigured ? "border-green-500/50" : "border-border"
            )}>
              {/* Status indicator */}
              <div className={cn(
                "absolute top-3 right-3 w-3 h-3 rounded-full",
                exchange.apiConfigured ? "bg-green-500" : "bg-gray-400"
              )} />

              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">{exchange.icon}</span>
                  {exchange.name}
                </CardTitle>
                <CardDescription>{exchange.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    {exchange.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* Status */}
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

                  {/* Configure Button */}
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

        {/* Settings & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner Settings */}
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
                <span className="text-sm">Min Spread Threshold</span>
                <Badge variant="outline">0.10%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Position Size</span>
                <Badge variant="outline">$10,000</Badge>
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

          {/* Live Opportunities */}
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
                Real-time price discrepancies across exchanges
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
              ) : (
                <div className="space-y-3">
                  {MOCK_OPPORTUNITIES.map((opp) => {
                    const buyEx = EXCHANGES.find(e => e.id === opp.buyExchange);
                    const sellEx = EXCHANGES.find(e => e.id === opp.sellExchange);

                    return (
                      <div
                        key={opp.id}
                        className="p-4 rounded-lg border hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="font-mono text-base">
                              {opp.pair}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm">
                              <span>{buyEx?.icon}</span>
                              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                              <span>{sellEx?.icon}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Spread</div>
                              <div className="font-mono text-primary">{opp.spread}%</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Est. Profit</div>
                              <div className="font-mono text-green-500">${opp.profit}</div>
                            </div>
                            <Button size="sm" className="gap-1">
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
