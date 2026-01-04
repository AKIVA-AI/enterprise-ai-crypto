import { useState, useEffect } from 'react';
import { Search, RefreshCw, TrendingUp, Target, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';

interface Opportunity {
  id: string;
  rank: number;
  strategy: string;
  pair: string;
  exchange: string;
  timeframe: string;
  score: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  profit_factor: number;
  total_trades: number;
  is_active: boolean;
}

interface ScreenerData {
  last_scan: string | null;
  total_opportunities: number;
  scan_mode: string;
  opportunities: Opportunity[];
}

export default function Screener() {
  const [data, setData] = useState<ScreenerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/screener/');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to fetch screener data:', e);
    }
    setLoading(false);
  };

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/screener/scan', { method: 'POST' });
      await res.json();
      await fetchData();
    } catch (e) {
      console.error('Failed to run scan:', e);
    }
    setScanning(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-500/10';
    if (score >= 70) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <MainLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Strategy Screener
          </h1>
          <p className="text-muted-foreground mt-1">
            Scan strategies across Coinbase pairs to find high-probability setups
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data?.scan_mode && (
            <Badge variant="outline" className="text-xs">
              Mode: {data.scan_mode}
            </Badge>
          )}
          <Button onClick={runScan} disabled={scanning}>
            <RefreshCw className={cn("h-4 w-4 mr-2", scanning && "animate-spin")} />
            {scanning ? 'Scanning...' : 'Run Scan'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{data?.total_opportunities || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground">Opportunities Found</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {data?.opportunities?.[0]?.score?.toFixed(1) || '-'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Top Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">
                {data?.opportunities?.[0]?.win_rate?.toFixed(1) || '-'}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Best Win Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">
                {data?.opportunities?.[0]?.max_drawdown?.toFixed(1) || '-'}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Lowest Drawdown</p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Opportunities</CardTitle>
          <CardDescription>
            Ranked by composite score (win rate, Sharpe ratio, drawdown)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !data?.opportunities?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No opportunities found. Click "Run Scan" to analyze strategies.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">#</th>
                    <th className="text-left py-3 px-2">Strategy</th>
                    <th className="text-left py-3 px-2">Pair</th>
                    <th className="text-right py-3 px-2">Score</th>
                    <th className="text-right py-3 px-2">Win %</th>
                    <th className="text-right py-3 px-2">Sharpe</th>
                    <th className="text-right py-3 px-2">Max DD</th>
                    <th className="text-right py-3 px-2">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {data.opportunities.map((opp) => (
                    <tr key={opp.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-mono">{opp.rank}</td>
                      <td className="py-3 px-2">
                        <Badge variant="secondary">{opp.strategy}</Badge>
                      </td>
                      <td className="py-3 px-2 font-mono">{opp.pair}</td>
                      <td className={cn("py-3 px-2 text-right font-bold", getScoreColor(opp.score))}>
                        <span className={cn("px-2 py-0.5 rounded", getScoreBg(opp.score))}>
                          {opp.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">{opp.win_rate.toFixed(1)}%</td>
                      <td className="py-3 px-2 text-right">{opp.sharpe_ratio.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-orange-500">{opp.max_drawdown.toFixed(1)}%</td>
                      <td className="py-3 px-2 text-right">{opp.total_trades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </MainLayout>
  );
}

