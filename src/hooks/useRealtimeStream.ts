/**
 * Hook for Real-time WebSocket Streams
 * 
 * Provides real-time data streaming:
 * - Market prices
 * - Trading signals
 * - Arbitrage opportunities
 * - Portfolio updates
 * - Agent status
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createWebSocket } from '@/lib/apiClient';

export type StreamType = 'market' | 'signals' | 'arbitrage' | 'portfolio' | 'agents' | 'all';

interface StreamMessage {
  stream: string;
  timestamp: string;
  data: unknown;
}

interface UseRealtimeStreamOptions {
  enabled?: boolean;
  onMessage?: (message: StreamMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useRealtimeStream(
  streamType: StreamType,
  options: UseRealtimeStreamOptions = {}
) {
  const { enabled = true, onMessage, onError, onConnect, onDisconnect } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<StreamMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const connect = useCallback(() => {
    if (!enabled) return;
    
    try {
      const ws = createWebSocket(streamType);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as StreamMessage;
          setLastMessage(message);
          onMessage?.(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = (event) => {
        setError('WebSocket error');
        onError?.(event);
      };

      ws.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();
        
        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (enabled) connect();
        }, 5000);
      };
    } catch (e) {
      setError('Failed to connect');
    }
  }, [enabled, streamType, onMessage, onError, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    send,
    reconnect: connect,
    disconnect,
  };
}

// Convenience hooks for specific streams
export function useMarketStream(onMessage?: (data: unknown) => void) {
  return useRealtimeStream('market', { onMessage: (msg) => onMessage?.(msg.data) });
}

export function useSignalsStream(onMessage?: (data: unknown) => void) {
  return useRealtimeStream('signals', { onMessage: (msg) => onMessage?.(msg.data) });
}

export function useArbitrageStream(onMessage?: (data: unknown) => void) {
  return useRealtimeStream('arbitrage', { onMessage: (msg) => onMessage?.(msg.data) });
}

export function useAgentsStream(onMessage?: (data: unknown) => void) {
  return useRealtimeStream('agents', { onMessage: (msg) => onMessage?.(msg.data) });
}

