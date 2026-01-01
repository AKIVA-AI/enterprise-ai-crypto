/**
 * Trading Gate - Unified trading permission system
 * 
 * This module provides a single source of truth for trading permissions
 * across the entire application. All trading actions must pass through
 * these checks before execution.
 * 
 * Trading States (in order of restrictiveness):
 * 1. HALTED (kill switch) - No trading allowed whatsoever
 * 2. REDUCE_ONLY - Only position-closing trades allowed
 * 3. NORMAL - Full trading allowed
 * 
 * Data Quality Enforcement:
 * - Trading is BLOCKED when market data quality is 'simulated'
 * - Realtime and delayed data are acceptable for trading
 */

export type TradingState = 'halted' | 'reduce_only' | 'normal';
export type BookStatus = 'active' | 'frozen' | 'halted' | 'reduce_only';
export type OrderSide = 'buy' | 'sell';

// Data quality levels - trading MUST be blocked on 'simulated' or 'unavailable'
export type DataQuality = 'realtime' | 'delayed' | 'derived' | 'simulated' | 'unavailable';

export interface TradingGateSettings {
  globalKillSwitch: boolean;
  reduceOnlyMode: boolean;
  paperTradingMode: boolean;
}

export interface BookState {
  id: string;
  status: BookStatus;
  capitalAllocated: number;
  currentExposure: number;
  maxDrawdownLimit: number;
}

export interface Position {
  instrument: string;
  side: OrderSide;
  size: number;
}

export interface TradingGateResult {
  allowed: boolean;
  reason?: string;
  tradingState: TradingState;
  requiresPrice: boolean;
}

/**
 * Check if data quality allows trading
 * CRITICAL: Simulated data MUST NOT be used for trading decisions
 */
export function isDataQualityTradeable(quality: DataQuality): { allowed: boolean; reason?: string } {
  switch (quality) {
    case 'realtime':
    case 'delayed':
      return { allowed: true };
    case 'derived':
      return { allowed: true }; // Acceptable but log warning
    case 'simulated':
      return { allowed: false, reason: 'Trading blocked: market data is simulated/mock' };
    case 'unavailable':
      return { allowed: false, reason: 'Trading blocked: market data unavailable' };
    default:
      return { allowed: false, reason: `Unknown data quality: ${quality}` };
  }
}

/**
 * Determines the current trading state from global settings
 */
export function getTradingState(settings: TradingGateSettings): TradingState {
  if (settings.globalKillSwitch) {
    return 'halted';
  }
  if (settings.reduceOnlyMode) {
    return 'reduce_only';
  }
  return 'normal';
}

/**
 * Checks if a book allows trading based on its status
 */
export function isBookTradeable(book: BookState): { allowed: boolean; reason?: string } {
  switch (book.status) {
    case 'halted':
      return { allowed: false, reason: 'Book is halted' };
    case 'frozen':
      return { allowed: false, reason: 'Book is frozen' };
    case 'reduce_only':
      return { allowed: true }; // Reduce-only is handled at order level
    case 'active':
      return { allowed: true };
    default:
      return { allowed: false, reason: `Unknown book status: ${book.status}` };
  }
}

/**
 * Checks if an order would reduce an existing position
 */
export function isReducingOrder(
  orderSide: OrderSide,
  orderSize: number,
  existingPosition: Position | null
): boolean {
  if (!existingPosition || existingPosition.size === 0) {
    return false; // No position to reduce
  }
  
  // Opposite side trades reduce position
  return orderSide !== existingPosition.side;
}

/**
 * Main trading gate check - determines if a trade is allowed
 */
export function checkTradingGate(params: {
  settings: TradingGateSettings;
  book: BookState;
  orderSide: OrderSide;
  orderSize: number;
  orderPrice: number | null;
  existingPosition: Position | null;
  isMarketOrder: boolean;
}): TradingGateResult {
  const { settings, book, orderSide, orderSize, orderPrice, existingPosition, isMarketOrder } = params;
  
  const tradingState = getTradingState(settings);
  
  // Check 1: Global kill switch (absolutely no trading)
  if (tradingState === 'halted') {
    return {
      allowed: false,
      reason: 'Trading is halted - kill switch is active',
      tradingState,
      requiresPrice: false,
    };
  }
  
  // Check 2: Book status
  const bookCheck = isBookTradeable(book);
  if (!bookCheck.allowed) {
    return {
      allowed: false,
      reason: bookCheck.reason,
      tradingState,
      requiresPrice: false,
    };
  }
  
  // Check 3: Reduce-only mode
  const isReducing = isReducingOrder(orderSide, orderSize, existingPosition);
  
  if (tradingState === 'reduce_only' || book.status === 'reduce_only') {
    if (!isReducing) {
      return {
        allowed: false,
        reason: 'Only position-reducing trades are allowed in reduce-only mode',
        tradingState,
        requiresPrice: true,
      };
    }
  }
  
  // Check 4: Price must be resolved for risk calculations
  if (isMarketOrder && orderPrice === null) {
    return {
      allowed: false,
      reason: 'Market price must be resolved before placing order',
      tradingState,
      requiresPrice: true,
    };
  }
  
  return {
    allowed: true,
    tradingState,
    requiresPrice: isMarketOrder,
  };
}

/**
 * Calculates order notional value - NEVER uses fallback of 0
 */
export function calculateNotional(size: number, price: number | null): number | null {
  if (price === null || price <= 0) {
    return null; // Explicitly indicate price not available
  }
  return size * price;
}

/**
 * Checks exposure limits
 */
export function checkExposureLimits(params: {
  book: BookState;
  orderNotional: number;
  maxLeverage?: number;
}): { allowed: boolean; reason?: string; projectedExposure: number; maxExposure: number } {
  const { book, orderNotional, maxLeverage = 2 } = params;
  
  const projectedExposure = book.currentExposure + orderNotional;
  const maxExposure = book.capitalAllocated * maxLeverage;
  
  if (projectedExposure > maxExposure) {
    return {
      allowed: false,
      reason: `Order would exceed exposure limits (${projectedExposure.toFixed(2)} > ${maxExposure.toFixed(2)})`,
      projectedExposure,
      maxExposure,
    };
  }
  
  return {
    allowed: true,
    projectedExposure,
    maxExposure,
  };
}

/**
 * Full pre-trade validation
 */
export function validateTrade(params: {
  settings: TradingGateSettings;
  book: BookState;
  orderSide: OrderSide;
  orderSize: number;
  orderPrice: number | null;
  existingPosition: Position | null;
  isMarketOrder: boolean;
  maxLeverage?: number;
}): { allowed: boolean; reason?: string; tradingState: TradingState } {
  // First check trading gate
  const gateResult = checkTradingGate(params);
  if (!gateResult.allowed) {
    return {
      allowed: false,
      reason: gateResult.reason,
      tradingState: gateResult.tradingState,
    };
  }
  
  // Calculate notional (must have price)
  const notional = calculateNotional(params.orderSize, params.orderPrice);
  if (notional === null) {
    return {
      allowed: false,
      reason: 'Unable to calculate order value - price not available',
      tradingState: gateResult.tradingState,
    };
  }
  
  // Check exposure limits (skip for reducing orders)
  const isReducing = isReducingOrder(params.orderSide, params.orderSize, params.existingPosition);
  if (!isReducing) {
    const exposureResult = checkExposureLimits({
      book: params.book,
      orderNotional: notional,
      maxLeverage: params.maxLeverage,
    });
    
    if (!exposureResult.allowed) {
      return {
        allowed: false,
        reason: exposureResult.reason,
        tradingState: gateResult.tradingState,
      };
    }
  }
  
  return {
    allowed: true,
    tradingState: gateResult.tradingState,
  };
}
