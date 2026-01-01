/**
 * useTradingGate - React hook for trading permission checks
 * 
 * Provides real-time trading state and validation utilities
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useCallback } from 'react';
import {
  TradingState,
  TradingGateSettings,
  BookState,
  Position,
  OrderSide,
  getTradingState,
  validateTrade,
  isReducingOrder,
} from '@/lib/tradingGate';

export interface UseTradingGateResult {
  // Current state
  tradingState: TradingState;
  isHalted: boolean;
  isReduceOnly: boolean;
  isPaperMode: boolean;
  isLoading: boolean;
  
  // Settings
  settings: TradingGateSettings | null;
  
  // Validation
  canTrade: (params: {
    bookId: string;
    orderSide: OrderSide;
    orderSize: number;
    orderPrice: number | null;
    instrument: string;
    isMarketOrder?: boolean;
  }) => Promise<{ allowed: boolean; reason?: string }>;
  
  // Utilities
  isPositionReducing: (orderSide: OrderSide, instrument: string, bookId: string) => Promise<boolean>;
}

export function useTradingGate(): UseTradingGateResult {
  // Fetch global settings
  const { data: globalSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['global-settings-gate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('global_kill_switch, reduce_only_mode, paper_trading_mode')
        .single();
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Poll every 5 seconds for kill switch changes
    staleTime: 2000,
  });
  
  // Derive settings object
  const settings: TradingGateSettings | null = useMemo(() => {
    if (!globalSettings) return null;
    return {
      globalKillSwitch: globalSettings.global_kill_switch ?? false,
      reduceOnlyMode: globalSettings.reduce_only_mode ?? false,
      paperTradingMode: globalSettings.paper_trading_mode ?? true,
    };
  }, [globalSettings]);
  
  // Derive trading state
  const tradingState: TradingState = useMemo(() => {
    if (!settings) return 'halted'; // Default to halted if unknown
    return getTradingState(settings);
  }, [settings]);
  
  // Check if order would reduce position
  const isPositionReducing = useCallback(async (
    orderSide: OrderSide,
    instrument: string,
    bookId: string
  ): Promise<boolean> => {
    const { data: position } = await supabase
      .from('positions')
      .select('side, size')
      .eq('book_id', bookId)
      .eq('instrument', instrument)
      .eq('is_open', true)
      .single();
    
    if (!position) return false;
    
    return isReducingOrder(orderSide, 0, {
      instrument,
      side: position.side as OrderSide,
      size: Number(position.size),
    });
  }, []);
  
  // Main validation function
  const canTrade = useCallback(async (params: {
    bookId: string;
    orderSide: OrderSide;
    orderSize: number;
    orderPrice: number | null;
    instrument: string;
    isMarketOrder?: boolean;
  }): Promise<{ allowed: boolean; reason?: string }> => {
    if (!settings) {
      return { allowed: false, reason: 'Trading settings not loaded' };
    }
    
    // Fetch book
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('id, status, capital_allocated, current_exposure, max_drawdown_limit')
      .eq('id', params.bookId)
      .single();
    
    if (bookError || !bookData) {
      return { allowed: false, reason: 'Book not found' };
    }
    
    const book: BookState = {
      id: bookData.id,
      status: bookData.status as any,
      capitalAllocated: Number(bookData.capital_allocated),
      currentExposure: Number(bookData.current_exposure),
      maxDrawdownLimit: Number(bookData.max_drawdown_limit),
    };
    
    // Fetch existing position
    const { data: positionData } = await supabase
      .from('positions')
      .select('side, size, instrument')
      .eq('book_id', params.bookId)
      .eq('instrument', params.instrument)
      .eq('is_open', true)
      .single();
    
    const existingPosition: Position | null = positionData ? {
      instrument: positionData.instrument,
      side: positionData.side as OrderSide,
      size: Number(positionData.size),
    } : null;
    
    // Run validation
    const result = validateTrade({
      settings,
      book,
      orderSide: params.orderSide,
      orderSize: params.orderSize,
      orderPrice: params.orderPrice,
      existingPosition,
      isMarketOrder: params.isMarketOrder ?? true,
    });
    
    return {
      allowed: result.allowed,
      reason: result.reason,
    };
  }, [settings]);
  
  return {
    tradingState,
    isHalted: tradingState === 'halted',
    isReduceOnly: tradingState === 'reduce_only',
    isPaperMode: settings?.paperTradingMode ?? true,
    isLoading: settingsLoading,
    settings,
    canTrade,
    isPositionReducing,
  };
}
