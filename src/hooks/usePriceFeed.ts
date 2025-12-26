import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface PriceUpdate {
  instrument: string;
  price: number;
  bid: number;
  ask: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
}

interface UsePriceFeedOptions {
  instruments: string[];
  enabled?: boolean;
}

// Simulated WebSocket for demo - in production, connect to real exchange feeds
const DEMO_BASE_PRICES: Record<string, number> = {
  'BTC-USD': 43250,
  'ETH-USD': 2280,
  'SOL-USD': 98.5,
  'AVAX-USD': 35.2,
  'MATIC-USD': 0.82,
  'LINK-USD': 14.5,
  'ARB-USD': 1.12,
  'OP-USD': 2.85,
};

export function usePriceFeed({ instruments, enabled = true }: UsePriceFeedOptions) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const basePricesRef = useRef<Map<string, number>>(new Map());

  // Initialize base prices
  useEffect(() => {
    instruments.forEach(inst => {
      if (!basePricesRef.current.has(inst)) {
        basePricesRef.current.set(inst, DEMO_BASE_PRICES[inst] || 100);
      }
    });
  }, [instruments]);

  const simulatePriceUpdate = useCallback(() => {
    setPrices(prevPrices => {
      const newPrices = new Map(prevPrices);
      
      instruments.forEach(instrument => {
        const basePrice = basePricesRef.current.get(instrument) || 100;
        const prevUpdate = newPrices.get(instrument);
        const prevPrice = prevUpdate?.price || basePrice;
        
        // Simulate realistic price movement (±0.1% per tick)
        const volatility = 0.001;
        const change = prevPrice * volatility * (Math.random() * 2 - 1);
        const newPrice = Math.max(prevPrice + change, basePrice * 0.8);
        
        // Calculate spread (tighter for major pairs)
        const spreadBps = instrument.includes('BTC') || instrument.includes('ETH') ? 1 : 3;
        const spread = newPrice * (spreadBps / 10000);
        
        const change24h = ((newPrice - basePrice) / basePrice) * 100;
        
        newPrices.set(instrument, {
          instrument,
          price: newPrice,
          bid: newPrice - spread / 2,
          ask: newPrice + spread / 2,
          change24h,
          volume24h: Math.random() * 100000000,
          timestamp: Date.now(),
        });
      });
      
      return newPrices;
    });
  }, [instruments]);

  const connect = useCallback(() => {
    if (!enabled || instruments.length === 0) return;

    console.log('[PriceFeed] Connecting to price feed...');
    setConnectionError(null);

    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      console.log('[PriceFeed] Connected');
      
      // Initial price update
      simulatePriceUpdate();
      
      // Start price updates every 500ms
      intervalRef.current = setInterval(simulatePriceUpdate, 500);
    }, 500);
  }, [enabled, instruments, simulatePriceUpdate]);

  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
    console.log('[PriceFeed] Disconnected');
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  const getPrice = useCallback((instrument: string): PriceUpdate | undefined => {
    return prices.get(instrument);
  }, [prices]);

  const getAllPrices = useCallback((): PriceUpdate[] => {
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

// Hook for subscribing to a single instrument's price
export function useInstrumentPrice(instrument: string, enabled = true) {
  const { getPrice, isConnected } = usePriceFeed({ 
    instruments: [instrument], 
    enabled 
  });
  
  return {
    price: getPrice(instrument),
    isConnected,
  };
}