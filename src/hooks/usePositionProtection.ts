import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProtectionConfig {
  // Stop Loss
  stopLossEnabled: boolean;
  stopLossType: 'fixed' | 'trailing' | 'atr';
  stopLossPct: number;
  stopLossAtrMultiplier: number;
  
  // Take Profit
  takeProfitEnabled: boolean;
  takeProfitType: 'fixed' | 'trailing' | 'scaled';
  takeProfitPct: number;
  takeProfitLevels?: { pct: number; closeSize: number }[];
  
  // Trailing
  trailingActivationPct: number;
  trailingDistancePct: number;
  
  // Time-based
  maxHoldingTimeMinutes?: number;
  timeDecayStopEnabled: boolean;
  
  // Volatility
  volatilityAdjustEnabled: boolean;
  maxVolatilityMultiplier: number;
}

export interface ProtectedPosition {
  id: string;
  instrument: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  size: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  
  // Protection state
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  trailingStopPrice: number | null;
  trailingActivated: boolean;
  highWaterMark: number;
  lowWaterMark: number;
  
  // Alerts
  nearStopLoss: boolean;
  nearTakeProfit: boolean;
  
  // Time
  entryTime: Date;
  holdingTimeMinutes: number;
}

const DEFAULT_CONFIG: ProtectionConfig = {
  stopLossEnabled: true,
  stopLossType: 'trailing',
  stopLossPct: 2,
  stopLossAtrMultiplier: 2,
  
  takeProfitEnabled: true,
  takeProfitType: 'scaled',
  takeProfitPct: 5,
  takeProfitLevels: [
    { pct: 3, closeSize: 0.33 },
    { pct: 5, closeSize: 0.33 },
    { pct: 10, closeSize: 0.34 },
  ],
  
  trailingActivationPct: 2,
  trailingDistancePct: 1,
  
  maxHoldingTimeMinutes: 480, // 8 hours
  timeDecayStopEnabled: false,
  
  volatilityAdjustEnabled: true,
  maxVolatilityMultiplier: 2,
};

export function usePositionProtection(
  config: Partial<ProtectionConfig> = {},
  enabled: boolean = true
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [protectedPositions, setProtectedPositions] = useState<ProtectedPosition[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const highWaterMarks = useRef<Map<string, number>>(new Map());
  const lowWaterMarks = useRef<Map<string, number>>(new Map());
  const queryClient = useQueryClient();

  // Calculate stop loss price
  const calculateStopLoss = useCallback((
    entryPrice: number,
    currentPrice: number,
    side: 'buy' | 'sell',
    atr?: number
  ): number => {
    if (!mergedConfig.stopLossEnabled) return 0;

    let stopDistance: number;
    
    if (mergedConfig.stopLossType === 'atr' && atr) {
      stopDistance = atr * mergedConfig.stopLossAtrMultiplier;
    } else {
      stopDistance = entryPrice * (mergedConfig.stopLossPct / 100);
    }

    return side === 'buy' 
      ? entryPrice - stopDistance 
      : entryPrice + stopDistance;
  }, [mergedConfig]);

  // Calculate take profit price
  const calculateTakeProfit = useCallback((
    entryPrice: number,
    side: 'buy' | 'sell'
  ): number => {
    if (!mergedConfig.takeProfitEnabled) return 0;

    const tpDistance = entryPrice * (mergedConfig.takeProfitPct / 100);
    return side === 'buy' 
      ? entryPrice + tpDistance 
      : entryPrice - tpDistance;
  }, [mergedConfig]);

  // Calculate trailing stop
  const calculateTrailingStop = useCallback((
    entryPrice: number,
    currentPrice: number,
    highWaterMark: number,
    lowWaterMark: number,
    side: 'buy' | 'sell'
  ): { price: number; activated: boolean } => {
    if (mergedConfig.stopLossType !== 'trailing') {
      return { price: 0, activated: false };
    }

    const activationDistance = entryPrice * (mergedConfig.trailingActivationPct / 100);
    const trailingDistance = highWaterMark * (mergedConfig.trailingDistancePct / 100);

    if (side === 'buy') {
      const activated = currentPrice >= entryPrice + activationDistance;
      const trailingStop = activated ? highWaterMark - trailingDistance : 0;
      return { price: trailingStop, activated };
    } else {
      const activated = currentPrice <= entryPrice - activationDistance;
      const trailingStop = activated ? lowWaterMark + trailingDistance : 0;
      return { price: trailingStop, activated };
    }
  }, [mergedConfig]);

  // Check if position should be closed
  const checkProtectionTriggers = useCallback(async (
    position: ProtectedPosition
  ): Promise<'stop_loss' | 'take_profit' | 'time_stop' | null> => {
    const { currentPrice, side, stopLossPrice, takeProfitPrice, trailingStopPrice } = position;

    // Check stop loss
    if (stopLossPrice) {
      if (side === 'buy' && currentPrice <= stopLossPrice) {
        return 'stop_loss';
      }
      if (side === 'sell' && currentPrice >= stopLossPrice) {
        return 'stop_loss';
      }
    }

    // Check trailing stop
    if (trailingStopPrice && position.trailingActivated) {
      if (side === 'buy' && currentPrice <= trailingStopPrice) {
        return 'stop_loss';
      }
      if (side === 'sell' && currentPrice >= trailingStopPrice) {
        return 'stop_loss';
      }
    }

    // Check take profit
    if (takeProfitPrice) {
      if (side === 'buy' && currentPrice >= takeProfitPrice) {
        return 'take_profit';
      }
      if (side === 'sell' && currentPrice <= takeProfitPrice) {
        return 'take_profit';
      }
    }

    // Check time stop
    if (mergedConfig.maxHoldingTimeMinutes && 
        position.holdingTimeMinutes >= mergedConfig.maxHoldingTimeMinutes) {
      return 'time_stop';
    }

    return null;
  }, [mergedConfig]);

  // Close position
  const closePosition = useCallback(async (
    positionId: string,
    reason: 'stop_loss' | 'take_profit' | 'time_stop' | 'manual',
    closeSize?: number
  ) => {
    try {
      // Update position in database
      const { error } = await supabase
        .from('positions')
        .update({ 
          is_open: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', positionId);

      if (error) throw error;

      const reasonText = {
        stop_loss: '🛑 Stop Loss',
        take_profit: '✅ Take Profit',
        time_stop: '⏰ Time Stop',
        manual: '👤 Manual',
      };

      toast.success(`Position Closed: ${reasonText[reason]}`, {
        description: `Position ${positionId.slice(0, 8)} closed`,
      });

      queryClient.invalidateQueries({ queryKey: ['positions'] });
      
      return true;
    } catch (error) {
      console.error('Failed to close position:', error);
      return false;
    }
  }, [queryClient]);

  // Monitor positions
  const monitorPositions = useCallback(async (
    positions: Array<{
      id: string;
      instrument: string;
      side: 'buy' | 'sell';
      entry_price: number;
      mark_price: number;
      size: number;
      unrealized_pnl: number;
      created_at: string;
    }>
  ) => {
    const protected_: ProtectedPosition[] = [];

    for (const pos of positions) {
      const side = pos.side as 'buy' | 'sell';
      const entryPrice = pos.entry_price;
      const currentPrice = pos.mark_price;
      
      // Update high/low water marks
      const prevHigh = highWaterMarks.current.get(pos.id) || currentPrice;
      const prevLow = lowWaterMarks.current.get(pos.id) || currentPrice;
      const newHigh = Math.max(prevHigh, currentPrice);
      const newLow = Math.min(prevLow, currentPrice);
      highWaterMarks.current.set(pos.id, newHigh);
      lowWaterMarks.current.set(pos.id, newLow);

      // Calculate protection levels
      const stopLossPrice = calculateStopLoss(entryPrice, currentPrice, side);
      const takeProfitPrice = calculateTakeProfit(entryPrice, side);
      const trailing = calculateTrailingStop(entryPrice, currentPrice, newHigh, newLow, side);

      const unrealizedPnlPct = ((currentPrice - entryPrice) / entryPrice) * 100 * (side === 'buy' ? 1 : -1);
      const entryTime = new Date(pos.created_at);
      const holdingTimeMinutes = (Date.now() - entryTime.getTime()) / 1000 / 60;

      // Check proximity to levels
      const distanceToSl = stopLossPrice ? Math.abs(currentPrice - stopLossPrice) / currentPrice : 1;
      const distanceToTp = takeProfitPrice ? Math.abs(takeProfitPrice - currentPrice) / currentPrice : 1;

      const protectedPos: ProtectedPosition = {
        id: pos.id,
        instrument: pos.instrument,
        side,
        entryPrice,
        currentPrice,
        size: pos.size,
        unrealizedPnl: pos.unrealized_pnl,
        unrealizedPnlPct,
        stopLossPrice,
        takeProfitPrice,
        trailingStopPrice: trailing.price,
        trailingActivated: trailing.activated,
        highWaterMark: newHigh,
        lowWaterMark: newLow,
        nearStopLoss: distanceToSl < 0.005, // Within 0.5%
        nearTakeProfit: distanceToTp < 0.005,
        entryTime,
        holdingTimeMinutes,
      };

      // Check triggers
      const trigger = await checkProtectionTriggers(protectedPos);
      if (trigger) {
        console.log(`[Protection] Trigger: ${trigger} for ${pos.instrument}`);
        await closePosition(pos.id, trigger);
      } else {
        protected_.push(protectedPos);
      }
    }

    setProtectedPositions(protected_);
  }, [calculateStopLoss, calculateTakeProfit, calculateTrailingStop, checkProtectionTriggers, closePosition]);

  // Start/stop monitoring
  useEffect(() => {
    if (!enabled) {
      setIsMonitoring(false);
      return;
    }

    setIsMonitoring(true);

    // Subscribe to position changes
    const channel = supabase
      .channel('position-protection')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'positions', filter: 'is_open=eq.true' },
        async () => {
          // Refetch positions and run protection checks
          const { data } = await supabase
            .from('positions')
            .select('*')
            .eq('is_open', true);
          
          if (data) {
            await monitorPositions(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      setIsMonitoring(false);
    };
  }, [enabled, monitorPositions]);

  return {
    protectedPositions,
    isMonitoring,
    config: mergedConfig,
    closePosition,
    monitorPositions,
  };
}

// Hook for managing scaled take profit exits
export function useScaledExits(positionId: string) {
  const [exitLevels, setExitLevels] = useState<Array<{
    pct: number;
    size: number;
    triggered: boolean;
    filledAt?: Date;
  }>>([
    { pct: 3, size: 0.33, triggered: false },
    { pct: 5, size: 0.33, triggered: false },
    { pct: 10, size: 0.34, triggered: false },
  ]);

  const checkScaledExits = useCallback((currentPnlPct: number) => {
    setExitLevels(prev => 
      prev.map(level => {
        if (!level.triggered && currentPnlPct >= level.pct) {
          toast.success(`Scaled Exit Triggered: ${level.pct}%`, {
            description: `Closing ${(level.size * 100).toFixed(0)}% of position`,
          });
          return { ...level, triggered: true, filledAt: new Date() };
        }
        return level;
      })
    );
  }, []);

  return {
    exitLevels,
    checkScaledExits,
    nextLevel: exitLevels.find(l => !l.triggered),
    completedLevels: exitLevels.filter(l => l.triggered),
  };
}

// Hook for break-even stop management
export function useBreakEvenStop(
  entryPrice: number,
  currentPrice: number,
  side: 'buy' | 'sell',
  activationPct: number = 1 // Move to break-even after 1% profit
) {
  const [breakEvenActive, setBreakEvenActive] = useState(false);
  const [breakEvenPrice, setBreakEvenPrice] = useState<number | null>(null);

  useEffect(() => {
    const pnlPct = ((currentPrice - entryPrice) / entryPrice) * 100 * (side === 'buy' ? 1 : -1);
    
    if (pnlPct >= activationPct && !breakEvenActive) {
      setBreakEvenActive(true);
      // Set break-even slightly above entry (cover fees)
      const buffer = entryPrice * 0.001; // 0.1% buffer
      setBreakEvenPrice(side === 'buy' ? entryPrice + buffer : entryPrice - buffer);
      
      toast.info('Break-Even Stop Activated', {
        description: `Stop moved to ${entryPrice.toFixed(2)} after ${activationPct}% gain`,
      });
    }
  }, [entryPrice, currentPrice, side, activationPct, breakEvenActive]);

  return {
    breakEvenActive,
    breakEvenPrice,
  };
}
