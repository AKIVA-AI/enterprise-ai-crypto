import { useState, useEffect, useCallback, useRef } from 'react';

interface LivePrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  bid: number;
  ask: number;
  timestamp: number;
}

interface UseLivePriceFeedOptions {
  symbols: string[];
  enabled?: boolean;
}

// Map our symbols to Binance format
const toBinanceSymbol = (symbol: string): string => {
  return symbol.replace('-', '').toLowerCase();
};

// Map Binance symbol back to our format
const fromBinanceSymbol = (symbol: string): string => {
  const upper = symbol.toUpperCase();
  if (upper.endsWith('USDT')) {
    return upper.replace('USDT', '-USDT');
  }
  return upper;
};

export function useLivePriceFeed({ symbols, enabled = true }: UseLivePriceFeedOptions) {
  const [prices, setPrices] = useState<Map<string, LivePrice>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || symbols.length === 0) return;
    
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // Create streams for each symbol (ticker stream)
      const streams = symbols.map(s => `${toBinanceSymbol(s)}@ticker`).join('/');
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      
      console.log('[LivePriceFeed] Connecting to Binance WebSocket...');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[LivePriceFeed] Connected to Binance');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.data) {
            const ticker = message.data;
            const symbol = fromBinanceSymbol(ticker.s);
            
            setPrices(prev => {
              const newPrices = new Map(prev);
              newPrices.set(symbol, {
                symbol,
                price: parseFloat(ticker.c),
                change24h: parseFloat(ticker.P),
                volume24h: parseFloat(ticker.q),
                high24h: parseFloat(ticker.h),
                low24h: parseFloat(ticker.l),
                bid: parseFloat(ticker.b),
                ask: parseFloat(ticker.a),
                timestamp: ticker.E,
              });
              return newPrices;
            });
          }
        } catch (error) {
          console.error('[LivePriceFeed] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[LivePriceFeed] WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('[LivePriceFeed] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt reconnection with exponential backoff
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[LivePriceFeed] Reconnecting in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[LivePriceFeed] Connection error:', error);
      setConnectionError('Failed to connect to price feed');
    }
  }, [enabled, symbols]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    console.log('[LivePriceFeed] Disconnected');
  }, []);

  useEffect(() => {
    if (enabled && symbols.length > 0) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, symbols.join(','), connect, disconnect]);

  const getPrice = useCallback((symbol: string): LivePrice | undefined => {
    return prices.get(symbol);
  }, [prices]);

  const getAllPrices = useCallback((): LivePrice[] => {
    return Array.from(prices.values());
  }, [prices]);

  return {
    prices,
    isConnected,
    connectionError,
    getPrice,
    getAllPrices,
    connect,
    disconnect,
  };
}
