import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePositionProtection, type ProtectionConfig } from '@/hooks/usePositionProtection';

export function PositionProtectionPanel() {
  const [config, setConfig] = useState<Partial<ProtectionConfig>>({
    stopLossEnabled: true,
    stopLossType: 'trailing',
    stopLossPct: 2,
    takeProfitEnabled: true,
    takeProfitType: 'scaled',
    takeProfitPct: 5,
    trailingActivationPct: 2,
    trailingDistancePct: 1,
    maxHoldingTimeMinutes: 480,
  });

  const { protectedPositions, isMonitoring } = usePositionProtection(config, true);

  const updateConfig = (key: keyof ProtectionConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Position Protection
          </span>
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'ACTIVE' : 'INACTIVE'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stop Loss Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Stop Loss
            </Label>
            <Switch
              checked={config.stopLossEnabled}
              onCheckedChange={(v) => updateConfig('stopLossEnabled', v)}
            />
          </div>
          
          {config.stopLossEnabled && (
            <>
              <div className="grid grid-cols-3 gap-1">
                {(['fixed', 'trailing', 'atr'] as const).map(type => (
                  <Button
                    key={type}
                    size="sm"
                    variant={config.stopLossType === type ? 'secondary' : 'ghost'}
                    onClick={() => updateConfig('stopLossType', type)}
                    className="text-xs capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stop Distance</span>
                  <span className="font-mono">{config.stopLossPct}%</span>
                </div>
                <Slider
                  value={[config.stopLossPct || 2]}
                  onValueChange={([v]) => updateConfig('stopLossPct', v)}
                  min={0.5}
                  max={10}
                  step={0.5}
                />
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Take Profit Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-success" />
              Take Profit
            </Label>
            <Switch
              checked={config.takeProfitEnabled}
              onCheckedChange={(v) => updateConfig('takeProfitEnabled', v)}
            />
          </div>
          
          {config.takeProfitEnabled && (
            <>
              <div className="grid grid-cols-3 gap-1">
                {(['fixed', 'trailing', 'scaled'] as const).map(type => (
                  <Button
                    key={type}
                    size="sm"
                    variant={config.takeProfitType === type ? 'secondary' : 'ghost'}
                    onClick={() => updateConfig('takeProfitType', type)}
                    className="text-xs capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-mono">{config.takeProfitPct}%</span>
                </div>
                <Slider
                  value={[config.takeProfitPct || 5]}
                  onValueChange={([v]) => updateConfig('takeProfitPct', v)}
                  min={1}
                  max={20}
                  step={0.5}
                />
              </div>

              {config.takeProfitType === 'scaled' && (
                <div className="p-2 bg-muted/30 rounded text-xs space-y-1">
                  <p className="font-medium">Scaled Exits:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <span className="text-success">+3%</span>
                      <br />
                      <span className="text-muted-foreground">33%</span>
                    </div>
                    <div className="text-center">
                      <span className="text-success">+5%</span>
                      <br />
                      <span className="text-muted-foreground">33%</span>
                    </div>
                    <div className="text-center">
                      <span className="text-success">+10%</span>
                      <br />
                      <span className="text-muted-foreground">34%</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Trailing Stop Settings */}
        {config.stopLossType === 'trailing' && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-chart-4" />
              Trailing Settings
            </Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Activation</span>
                  <span className="font-mono">{config.trailingActivationPct}%</span>
                </div>
                <Slider
                  value={[config.trailingActivationPct || 2]}
                  onValueChange={([v]) => updateConfig('trailingActivationPct', v)}
                  min={0.5}
                  max={5}
                  step={0.5}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-mono">{config.trailingDistancePct}%</span>
                </div>
                <Slider
                  value={[config.trailingDistancePct || 1]}
                  onValueChange={([v]) => updateConfig('trailingDistancePct', v)}
                  min={0.25}
                  max={3}
                  step={0.25}
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Time Stop */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            Time-Based Exit
          </Label>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max Holding Time</span>
              <span className="font-mono">{config.maxHoldingTimeMinutes}m</span>
            </div>
            <Slider
              value={[config.maxHoldingTimeMinutes || 480]}
              onValueChange={([v]) => updateConfig('maxHoldingTimeMinutes', v)}
              min={30}
              max={1440}
              step={30}
            />
          </div>
        </div>

        <Separator />

        {/* Protected Positions */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Protected Positions ({protectedPositions.length})
          </Label>
          
          {protectedPositions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No open positions
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {protectedPositions.map(pos => (
                <div 
                  key={pos.id}
                  className="p-2 rounded-lg bg-muted/30 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-medium">{pos.instrument}</span>
                    <Badge 
                      variant="outline"
                      className={cn(
                        pos.side === 'buy' ? 'text-success border-success/30' : 'text-destructive border-destructive/30'
                      )}
                    >
                      {pos.side.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Entry:</span>
                      <br />
                      <span className="font-mono">${pos.entryPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current:</span>
                      <br />
                      <span className="font-mono">${pos.currentPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">P&L:</span>
                      <br />
                      <span className={cn(
                        'font-mono',
                        pos.unrealizedPnlPct >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {pos.unrealizedPnlPct >= 0 ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Protection Status */}
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    {pos.stopLossPrice && (
                      <Badge variant="outline" className="text-destructive border-destructive/30">
                        SL: ${pos.stopLossPrice.toFixed(2)}
                      </Badge>
                    )}
                    {pos.trailingActivated && (
                      <Badge variant="outline" className="text-chart-4 border-chart-4/30">
                        Trail: ${pos.trailingStopPrice?.toFixed(2)}
                      </Badge>
                    )}
                    {pos.takeProfitPrice && (
                      <Badge variant="outline" className="text-success border-success/30">
                        TP: ${pos.takeProfitPrice.toFixed(2)}
                      </Badge>
                    )}
                  </div>

                  {/* Alerts */}
                  {(pos.nearStopLoss || pos.nearTakeProfit) && (
                    <div className="flex items-center gap-1 mt-2">
                      {pos.nearStopLoss && (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-xs">Near SL</span>
                        </div>
                      )}
                      {pos.nearTakeProfit && (
                        <div className="flex items-center gap-1 text-success">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Near TP</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Holding Time */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Holding: {Math.floor(pos.holdingTimeMinutes)}m</span>
                      <span>Max: {config.maxHoldingTimeMinutes}m</span>
                    </div>
                    <Progress 
                      value={(pos.holdingTimeMinutes / (config.maxHoldingTimeMinutes || 480)) * 100}
                      className="h-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
