import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn();
  return { mockFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useStrategies, useStrategy, useCreateStrategy, useDeleteStrategy, useActiveStrategiesCount } from '../useStrategies';
import { toast } from 'sonner';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useStrategies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all strategies ordered by creation date', async () => {
    const mockStrategies = [
      { id: 's-1', name: 'BTC Momentum', status: 'live', created_at: '2026-03-20T00:00:00Z', books: { name: 'Primary' } },
      { id: 's-2', name: 'ETH Mean Reversion', status: 'paper', created_at: '2026-03-19T00:00:00Z', books: { name: 'Test' } },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockStrategies, error: null })),
      })),
    });

    const { result } = renderHook(() => useStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStrategies);
    expect(mockFrom).toHaveBeenCalledWith('strategies');
  });

  it('should handle strategies fetch error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() =>
          Promise.resolve({ data: null, error: { message: 'Permission denied' } })
        ),
      })),
    });

    const { result } = renderHook(() => useStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch a single strategy by id', async () => {
    const mockStrategy = { id: 's-1', name: 'BTC Momentum', status: 'live', books: { name: 'Primary' } };

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: mockStrategy, error: null })),
        })),
      })),
    });

    const { result } = renderHook(() => useStrategy('s-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStrategy);
  });

  it('should not fetch when id is empty', () => {
    const { result } = renderHook(() => useStrategy(''), {
      wrapper: createWrapper(),
    });

    // Query should not be enabled
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useDeleteStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a strategy and show success toast', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    });

    const { result } = renderHook(() => useDeleteStrategy(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('s-1');
    });

    expect(toast.success).toHaveBeenCalledWith('Strategy deleted successfully');
  });

  it('should show error toast on delete failure', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: { message: 'Cannot delete active strategy' } })),
      })),
    });

    const { result } = renderHook(() => useDeleteStrategy(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('s-1');
      } catch {
        // expected
      }
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to delete strategy: Cannot delete active strategy');
  });
});

describe('useActiveStrategiesCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the count of active strategies', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ count: 5, error: null })),
      })),
    });

    const { result } = renderHook(() => useActiveStrategiesCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(5);
  });
});
