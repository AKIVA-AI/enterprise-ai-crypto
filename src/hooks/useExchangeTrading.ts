/**
 * useExchangeTrading - Unified Exchange Trading Hook
 * 
 * CONSOLIDATES: useCoinbaseTrading, useKrakenTrading, useBinanceUSTrading
 * 
 * Provides a single, type-safe interface for trading across all exchanges.
 * Uses a factory pattern to handle exchange-specific differences while
 * maintaining a consistent API.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type ExchangeType = 'coinbase' | 'kraken' | 'binance_us' | 'bybit' | 'okx' | 'mexc' | 'hyperliquid';

export interface ExchangeStatus {
  exchange: ExchangeType;
  configured: boolean;
  connected: boolean;
  accountInfo: Record<string, any> | null;
  features: {
    spot: boolean;
    futures: boolean;
    perpetuals: boolean;
    margin: boolean;
    staking?: boolean;
    options?: boolean;
  };
  regions: {
    usCompliant: boolean;
    available: string[];
  };
}

export interface ExchangeBalance {
  currency: string;
  available: number;
  locked: number;
  total: number;
}

export interface ExchangeTicker {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h?: number;
  timestamp: string;
}

export interface PlaceOrderParams {
  exchange: ExchangeType;
  symbol: string;          // Normalized: 'BTC/USD' (converted to exchange format internally)
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop-loss' | 'take-profit';
  amount: number;
  price?: number;
  leverage?: number;
  strategyId?: string;
  bookId?: string;
}

export interface OrderResult {
  success: boolean;
  orderId: string;
  mode: 'live' | 'simulation';
  exchange: ExchangeType;
  filledPrice: number;
  filledAmount: number;
  fee: number;
  latencyMs: number;
  slippageBps: number;
  message: string;
}

// Exchange-specific edge function names
const EXCHANGE_FUNCTIONS: Record<ExchangeType, string> = {
  coinbase: 'coinbase-trading',
  kraken: 'kraken-trading',
  binance_us: 'binance-us-trading',
  bybit: 'bybit-trading',
  okx: 'okx-trading',
  mexc: 'mexc-trading',
  hyperliquid: 'hyperliquid-trading',
};

// Exchange display config
const EXCHANGE_CONFIG: Record<ExchangeType, { name: string; icon: string; color: string }> = {
  coinbase: { name: 'Coinbase', icon: '🔵', color: 'blue' },
  kraken: { name: 'Kraken', icon: '🟣', color: 'purple' },
  binance_us: { name: 'Binance.US', icon: '🟡', color: 'yellow' },
  bybit: { name: 'Bybit', icon: '🟠', color: 'orange' },
  okx: { name: 'OKX', icon: '⚫', color: 'gray' },
  mexc: { name: 'MEXC', icon: '🟢', color: 'green' },
  hyperliquid: { name: 'Hyperliquid', icon: '🔷', color: 'cyan' },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function invokeExchange<T>(
  exchange: ExchangeType,
  action: string,
  params: Record<string, any> = {}
): Promise<T> {
  const functionName = EXCHANGE_FUNCTIONS[exchange];
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: { action, ...params },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// Normalize symbol formats across exchanges
function normalizeSymbol(symbol: string, exchange: ExchangeType): string {
  // Convert from standard format (BTC/USD) to exchange-specific
  const [base, quote] = symbol.replace('-', '/').split('/');
  switch (exchange) {
    case 'coinbase':
      return `${base}-${quote}`;
    case 'kraken':
      return `X${base}Z${quote}`.toUpperCase();
    case 'binance_us':
      return `${base}${quote}`;
    default:
      return symbol;
  }
}

// ============================================================================
// HOOKS
// ============================================================================

export interface UseExchangeTradingOptions {
  exchange: ExchangeType;
  enabled?: boolean;
  symbol?: string;
}

/**
 * Unified hook for exchange status
 */
export function useExchangeStatus(exchange: ExchangeType, enabled = true) {
  return useQuery({
    queryKey: ['exchange-status', exchange],
    queryFn: () => invokeExchange<ExchangeStatus>(exchange, 'status'),
    enabled,
    refetchInterval: 30000,
    select: (data) => ({ ...data, exchange }),
  });
}

/**
 * Unified hook for exchange balances
 */
export function useExchangeBalances(exchange: ExchangeType, enabled = true) {
  return useQuery({
    queryKey: ['exchange-balances', exchange],
    queryFn: async () => {
      const data = await invokeExchange<{ balances: any[]; simulation?: boolean }>(
        exchange,
        'balances'
      );
      // Normalize balance format
      const balances: ExchangeBalance[] = data.balances.map((b: any) => ({
        currency: b.currency || b.asset || Object.keys(b)[0],
        available: parseFloat(b.available || b.free || '0'),
        locked: parseFloat(b.hold || b.locked || '0'),
        total: parseFloat(b.total || b.available || '0'),
      }));
      return { balances, simulation: data.simulation || false, exchange };
    },
    enabled,
    refetchInterval: 10000,
  });
}

/**
 * Unified hook for ticker data
 */
export function useExchangeTicker(exchange: ExchangeType, symbol: string, enabled = true) {
  const exchangeSymbol = normalizeSymbol(symbol, exchange);

  return useQuery({
    queryKey: ['exchange-ticker', exchange, symbol],
    queryFn: async () => {
      const data = await invokeExchange<any>(exchange, 'ticker', {
        pair: exchangeSymbol,
        product_id: exchangeSymbol,
        symbol: exchangeSymbol,
      });
      // Normalize ticker format
      return {
        symbol,
        bid: parseFloat(data.bid || data.b?.[0] || '0'),
        ask: parseFloat(data.ask || data.a?.[0] || '0'),
        last: parseFloat(data.last || data.c?.[0] || '0'),
        volume24h: parseFloat(data.volume_24h || data.v?.[1] || '0'),
        high24h: parseFloat(data.high_24h || data.h?.[1] || '0'),
        low24h: parseFloat(data.low_24h || data.l?.[1] || '0'),
        timestamp: data.timestamp || new Date().toISOString(),
        exchange,
      } as ExchangeTicker & { exchange: ExchangeType };
    },
    enabled: enabled && !!symbol,
    refetchInterval: 5000,
  });
}

/**
 * Unified hook for placing orders
 */
export function useExchangePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PlaceOrderParams): Promise<OrderResult> => {
      const exchangeSymbol = normalizeSymbol(params.symbol, params.exchange);

      const data = await invokeExchange<any>(params.exchange, 'place-order', {
        // Coinbase format
        instrument: exchangeSymbol,
        product_id: exchangeSymbol,
        side: params.side,
        size: params.amount,
        order_type: params.type,
        // Kraken format
        pair: exchangeSymbol,
        type: params.side,
        ordertype: params.type,
        volume: params.amount.toString(),
        price: params.price?.toString(),
        leverage: params.leverage?.toString(),
        // Common
        book_id: params.bookId,
        strategy_id: params.strategyId,
      });

      return {
        success: data.success ?? true,
        orderId: data.order_id || data.txid || data.orderId,
        mode: data.mode || 'simulation',
        exchange: params.exchange,
        filledPrice: parseFloat(data.filled_price || data.price || '0'),
        filledAmount: parseFloat(data.filled_size || data.vol_exec || '0'),
        fee: parseFloat(data.fee || '0'),
        latencyMs: data.latency_ms || 0,
        slippageBps: data.slippage_bps || 0,
        message: data.message || `Order placed on ${EXCHANGE_CONFIG[params.exchange].name}`,
      };
    },
    onSuccess: (result) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['exchange-balances', result.exchange] });
      queryClient.invalidateQueries({ queryKey: ['trading-positions'] });
      queryClient.invalidateQueries({ queryKey: ['trading-orders'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      const config = EXCHANGE_CONFIG[result.exchange];
      const icon = result.mode === 'live' ? config.icon : '📋';
      toast.success(`${icon} ${result.message}`, {
        description: `${result.filledAmount} @ $${result.filledPrice.toFixed(2)} | Fee: $${result.fee.toFixed(2)}`,
      });
    },
    onError: (error: Error, variables) => {
      const config = EXCHANGE_CONFIG[variables.exchange];
      toast.error(`${config.name} Order Failed`, {
        description: error.message,
      });
    },
  });
}

/**
 * Unified hook for cancelling orders
 */
export function useExchangeCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ exchange, orderId }: { exchange: ExchangeType; orderId: string }) => {
      return invokeExchange(exchange, 'cancel-order', {
        order_id: orderId,
        txid: orderId,
      });
    },
    onSuccess: (_, { exchange }) => {
      queryClient.invalidateQueries({ queryKey: ['exchange-orders', exchange] });
      toast.success('Order cancelled');
    },
    onError: (error: Error) => {
      toast.error('Failed to cancel order', { description: error.message });
    },
  });
}

/**
 * Unified hook for open orders
 */
export function useExchangeOrders(exchange: ExchangeType, symbol?: string, enabled = true) {
  return useQuery({
    queryKey: ['exchange-orders', exchange, symbol],
    queryFn: () => invokeExchange(exchange, 'orders', {
      ...(symbol && { product_id: normalizeSymbol(symbol, exchange), pair: normalizeSymbol(symbol, exchange) }),
    }),
    enabled,
    refetchInterval: 5000,
  });
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * All-in-one trading hook for a specific exchange
 */
export function useExchangeTrading({ exchange, symbol = 'BTC/USD', enabled = true }: UseExchangeTradingOptions) {
  const status = useExchangeStatus(exchange, enabled);
  const balances = useExchangeBalances(exchange, enabled);
  const ticker = useExchangeTicker(exchange, symbol, enabled);
  const orders = useExchangeOrders(exchange, symbol, enabled);
  const placeOrder = useExchangePlaceOrder();
  const cancelOrder = useExchangeCancelOrder();

  return {
    // Status
    status: status.data,
    isConnected: status.data?.connected ?? false,
    isConfigured: status.data?.configured ?? false,

    // Data
    balances: balances.data?.balances ?? [],
    isSimulation: balances.data?.simulation ?? true,
    ticker: ticker.data,
    orders: orders.data,

    // Loading states
    isLoading: status.isLoading || balances.isLoading,
    isTickerLoading: ticker.isLoading,

    // Actions
    placeOrder: (params: Omit<PlaceOrderParams, 'exchange'>) =>
      placeOrder.mutateAsync({ ...params, exchange }),
    cancelOrder: (orderId: string) =>
      cancelOrder.mutateAsync({ exchange, orderId }),

    // Mutation states
    isPlacingOrder: placeOrder.isPending,
    isCancellingOrder: cancelOrder.isPending,

    // Config
    config: EXCHANGE_CONFIG[exchange],
  };
}

// Export config for use in components
export { EXCHANGE_CONFIG, EXCHANGE_FUNCTIONS };

