import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Hoist mock functions so they are available in vi.mock factory
const { mockFrom, mockChannel, mockOn, mockSubscribe, mockRemoveChannel } = vi.hoisted(() => {
  const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
  const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
  const mockChannel = vi.fn().mockReturnValue({ on: mockOn });
  const mockRemoveChannel = vi.fn();
  const mockFrom = vi.fn();
  return { mockFrom, mockChannel, mockOn, mockSubscribe, mockRemoveChannel };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

import { usePositions } from '../usePositions';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('usePositions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => new Promise(() => {})), // never resolves
        })),
      })),
    });

    const { result } = renderHook(() => usePositions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should fetch open positions successfully', async () => {
    const mockPositions = [
      { id: 'pos-1', symbol: 'BTC-USDT', side: 'long', quantity: 1.5, is_open: true, venues: { name: 'Binance' } },
      { id: 'pos-2', symbol: 'ETH-USDT', side: 'short', quantity: 10, is_open: true, venues: { name: 'Coinbase' } },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: mockPositions, error: null })),
        })),
      })),
    });

    const { result } = renderHook(() => usePositions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPositions);
    expect(result.current.data).toHaveLength(2);
  });

  it('should handle fetch error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: null, error: { message: 'Database connection failed' } })
          ),
        })),
      })),
    });

    const { result } = renderHook(() => usePositions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should subscribe to realtime position changes', () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    });

    renderHook(() => usePositions(), {
      wrapper: createWrapper(),
    });

    expect(mockChannel).toHaveBeenCalledWith('positions-changes');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'positions',
      }),
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('should return empty array when no positions exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    });

    const { result } = renderHook(() => usePositions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});
