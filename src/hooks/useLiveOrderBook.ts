import { useState, useEffect, useCallback, useRef } from 'react';

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercent: number;
  lastUpdateId: number;
  timestamp: number;
}

interface UseLiveOrderBookOptions {
  symbol: string;
  depth?: number;
  enabled?: boolean;
}

// Map our symbols to Binance format
const toBinanceSymbol = (symbol: string): string => {
  return symbol.replace('-', '').toLowerCase();
};

export function useLiveOrderBook({ symbol, depth = 10, enabled = true }: UseLiveOrderBookOptions) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processOrderBook = useCallback((data: any): OrderBook => {
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    
    let bidTotal = 0;
    for (const [price, size] of data.bids.slice(0, depth)) {
      const priceNum = parseFloat(price);
      const sizeNum = parseFloat(size);
      bidTotal += sizeNum;
      bids.push({ price: priceNum, size: sizeNum, total: bidTotal });
    }
    
    let askTotal = 0;
    for (const [price, size] of data.asks.slice(0, depth)) {
      const priceNum = parseFloat(price);
      const sizeNum = parseFloat(size);
      askTotal += sizeNum;
      asks.push({ price: priceNum, size: sizeNum, total: askTotal });
    }
    
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;
    const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0;
    
    return {
      bids,
      asks,
      spread,
      spreadPercent,
      lastUpdateId: data.lastUpdateId || Date.now(),
      timestamp: Date.now(),
    };
  }, [depth]);

  const connect = useCallback(() => {
    if (!enabled || !symbol) return;
    
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const binanceSymbol = toBinanceSymbol(symbol);
      const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@depth${depth}@100ms`;
      
      console.log('[OrderBook] Connecting to depth stream:', symbol);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[OrderBook] Connected');
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setOrderBook(processOrderBook(data));
        } catch (error) {
          console.error('[OrderBook] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[OrderBook] WebSocket error:', error);
        setConnectionError('Order book connection error');
      };

      ws.onclose = (event) => {
        console.log('[OrderBook] WebSocket closed:', event.code);
        setIsConnected(false);
        
        // Reconnect after 2 seconds
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 2000);
        }
      };
    } catch (error) {
      console.error('[OrderBook] Connection error:', error);
      setConnectionError('Failed to connect to order book');
    }
  }, [enabled, symbol, depth, processOrderBook]);

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
  }, []);

  useEffect(() => {
    if (enabled && symbol) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, symbol, connect, disconnect]);

  return {
    orderBook,
    isConnected,
    connectionError,
    connect,
    disconnect,
  };
}
