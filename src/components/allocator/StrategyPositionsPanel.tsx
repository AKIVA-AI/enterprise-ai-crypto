import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers } from 'lucide-react';
import { useStrategyPositions } from '@/hooks/useStrategyPositions';

export function StrategyPositionsPanel() {
  const { data: positions, isLoading } = useStrategyPositions();

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Strategy Positions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((idx) => (
              <Skeleton key={idx} className="h-10 w-full" />
            ))}
          </div>
        ) : (positions ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground">No strategy positions yet.</div>
        ) : (
          <ScrollArea className="h-56">
            <div className="space-y-2 pr-3">
              {(positions ?? []).map((pos) => (
                <div key={pos.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">
                      {pos.strategies?.name ?? pos.strategy_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pos.instruments?.common_symbol ?? pos.instrument_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">Spot {pos.spot_position.toFixed(4)}</Badge>
                    <Badge variant="outline">Deriv {pos.deriv_position.toFixed(4)}</Badge>
                    <Badge variant="secondary">Hedge {pos.hedged_ratio.toFixed(3)}</Badge>
                    <Badge variant="outline">{pos.avg_entry_basis_bps.toFixed(2)} bps</Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
