import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Radar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap, 
  Target, 
  RefreshCw,
  Filter,
  Star,
  AlertTriangle
} from 'lucide-react';
import { 
  useHighProbabilitySignals, 
  useAllScoredSignals, 
  useScanOpportunities, 
  useTradeableInstruments,
  ScoredSignal,
  FactorScores 
} from '@/hooks/useSignalScoring';

interface OpportunityScannerPanelProps {
  compact?: boolean;
}

const FACTOR_LABELS: Record<keyof FactorScores, { label: string; icon: string }> = {
  technical: { label: 'Technical', icon: '📊' },
  sentiment: { label: 'Sentiment', icon: '💬' },
  onchain: { label: 'On-Chain', icon: '⛓️' },
  derivatives: { label: 'Derivatives', icon: '📈' },
  market_structure: { label: 'Market', icon: '🏛️' }
};

export function OpportunityScannerPanel({ compact = false }: OpportunityScannerPanelProps) {
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');

  const filters = {
    tier: tierFilter !== 'all' ? parseInt(tierFilter) : undefined,
    venue: venueFilter !== 'all' ? venueFilter : undefined,
    product_type: productFilter !== 'all' ? productFilter : undefined
  };

  const { data: highProbSignals, isLoading: loadingHighProb } = useHighProbabilitySignals(filters);
  const { data: allSignals, isLoading: loadingAll } = useAllScoredSignals(filters);
  const { data: instruments } = useTradeableInstruments();
  const scanMutation = useScanOpportunities();

  const handleScan = () => {
    scanMutation.mutate(filters);
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'bearish': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 1: return <Badge variant="default" className="bg-yellow-500/20 text-yellow-500 text-xs">Tier 1</Badge>;
      case 2: return <Badge variant="secondary" className="text-xs">Tier 2</Badge>;
      default: return <Badge variant="outline" className="text-xs">Tier 3</Badge>;
    }
  };

  const renderSignalCard = (signal: ScoredSignal) => (
    <div 
      key={signal.id || signal.instrument} 
      className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{signal.instrument}</span>
          {getTierBadge(signal.tier)}
          <Badge variant="outline" className="text-xs capitalize">{signal.product_type}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {signal.is_high_probability && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
          {getDirectionIcon(signal.direction)}
          <Badge className={getDirectionColor(signal.direction)}>
            {signal.direction.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">Composite Score</span>
          <span className={`font-bold ${signal.composite_score >= 0.8 ? 'text-green-500' : signal.composite_score >= 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>
            {Math.round(signal.composite_score * 100)}%
          </span>
        </div>
        <Progress 
          value={signal.composite_score * 100} 
          className="h-2"
        />
      </div>

      {signal.factor_scores && (
        <div className="grid grid-cols-5 gap-2 mb-3">
          {(Object.entries(signal.factor_scores) as [keyof FactorScores, number][]).map(([factor, score]) => (
            <div key={factor} className="text-center">
              <div className="text-lg">{FACTOR_LABELS[factor].icon}</div>
              <div className="text-xs text-muted-foreground">{FACTOR_LABELS[factor].label}</div>
              <div className={`text-sm font-medium ${score >= 0.7 ? 'text-green-500' : score >= 0.4 ? 'text-yellow-500' : 'text-red-500'}`}>
                {Math.round(score * 100)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {signal.reasoning && (
        <p className="text-sm text-muted-foreground italic">{signal.reasoning}</p>
      )}

      {signal.expires_at && (
        <div className="mt-2 text-xs text-muted-foreground">
          Expires: {new Date(signal.expires_at).toLocaleTimeString()}
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              High Probability Trades
            </CardTitle>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleScan}
              disabled={scanMutation.isPending}
            >
              {scanMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Radar className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHighProb ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : highProbSignals && highProbSignals.length > 0 ? (
            <div className="space-y-2">
              {highProbSignals.slice(0, 3).map((signal) => (
                <div key={signal.id || signal.instrument} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{signal.instrument}</span>
                    {getDirectionIcon(signal.direction)}
                  </div>
                  <Badge variant={signal.composite_score >= 0.85 ? 'default' : 'secondary'}>
                    {Math.round(signal.composite_score * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No high-probability signals</p>
              <Button size="sm" variant="ghost" onClick={handleScan} className="mt-2">
                Scan Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Opportunity Scanner
          </CardTitle>
          <Button 
            onClick={handleScan}
            disabled={scanMutation.isPending}
            className="gap-2"
          >
            {scanMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Radar className="h-4 w-4" />
                Scan Market
              </>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 pt-2">
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="1">Tier 1</SelectItem>
              <SelectItem value="2">Tier 1-2</SelectItem>
              <SelectItem value="3">All (1-3)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={venueFilter} onValueChange={setVenueFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Venues</SelectItem>
              <SelectItem value="coinbase">Coinbase</SelectItem>
              <SelectItem value="binance">Binance</SelectItem>
              <SelectItem value="kraken">Kraken</SelectItem>
            </SelectContent>
          </Select>

          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="spot">Spot</SelectItem>
              <SelectItem value="futures">Futures</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />
          
          <Badge variant="outline" className="self-center">
            {instruments?.length || 0} instruments
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="high-prob" className="h-full">
          <TabsList className="mb-4">
            <TabsTrigger value="high-prob" className="gap-2">
              <Zap className="h-4 w-4" />
              High Probability ({highProbSignals?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />
              All Signals ({allSignals?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="high-prob" className="mt-0">
            <ScrollArea className="h-[500px]">
              {loadingHighProb ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : highProbSignals && highProbSignals.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {highProbSignals.map(renderSignalCard)}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <h3 className="font-medium mb-2">No High-Probability Signals</h3>
                  <p className="text-sm mb-4">
                    Signals with ≥80% confidence will appear here.
                  </p>
                  <Button variant="outline" onClick={handleScan}>
                    Scan for Opportunities
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[500px]">
              {loadingAll ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : allSignals && allSignals.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {allSignals.map(renderSignalCard)}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Radar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <h3 className="font-medium mb-2">No Scored Signals</h3>
                  <p className="text-sm mb-4">
                    Run a market scan to generate signal scores.
                  </p>
                  <Button variant="outline" onClick={handleScan}>
                    Start Scanning
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
