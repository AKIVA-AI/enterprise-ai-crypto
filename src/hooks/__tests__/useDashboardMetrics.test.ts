import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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

import { useDashboardMetrics } from '../useDashboardMetrics';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// The hook calls supabase.from(table).select(...).eq(...)  for positions/strategies/alerts/orders
// and supabase.from('books').select(...) for books (no .eq).
// All 5 calls happen in Promise.all, so mockFrom is called 5 times in order.
function setupMocks(overrides: {
  positions?: unknown[];
  strategies?: unknown[];
  alerts?: unknown[];
  orders?: unknown[];
  books?: unknown[];
} = {}) {
  const tableData: Record<string, unknown[]> = {
    positions: overrides.positions ?? [],
    strategies: overrides.strategies ?? [],
    alerts: overrides.alerts ?? [],
    orders: overrides.orders ?? [],
    books: overrides.books ?? [],
  };

  mockFrom.mockImplementation((table: string) => {
    const response = { data: tableData[table] ?? [], error: null };
    return {
      select: vi.fn(() => {
        // For 'books', .select() is the terminal call -- return promise directly
        if (table === 'books') {
          return Promise.resolve(response);
        }
        // For others, .select() returns an object with .eq()
        return {
          eq: vi.fn(() => Promise.resolve(response)),
        };
      }),
    };
  });
}

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    // Setup mocks that never resolve
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => new Promise(() => {})),
      })),
    });

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should aggregate metrics from multiple tables', async () => {
    setupMocks({
      positions: [
        { unrealized_pnl: 1500, realized_pnl: 500 },
        { unrealized_pnl: -200, realized_pnl: 300 },
      ],
      strategies: [{ id: 's-1', status: 'live' }, { id: 's-2', status: 'live' }],
      alerts: [{ id: 'a-1' }],
      orders: [{ id: 'o-1' }, { id: 'o-2' }],
      books: [
        { capital_allocated: 500000, current_exposure: 150000 },
        { capital_allocated: 300000, current_exposure: 100000 },
      ],
    });

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data!.totalAum).toBe(800000);
    expect(result.current.data!.dailyPnl).toBe(2100); // 1500+500-200+300
    expect(result.current.data!.activeStrategies).toBe(2);
    expect(result.current.data!.alertsActive).toBe(1);
    expect(result.current.data!.pendingOrders).toBe(2);
    expect(result.current.data!.openPositions).toBe(2);
  });

  it('should calculate risk utilization correctly', async () => {
    setupMocks({
      books: [{ capital_allocated: 1000000, current_exposure: 750000 }],
    });

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data!.riskUtilization).toBe(75);
  });

  it('should handle zero AUM gracefully', async () => {
    setupMocks({});

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data!.totalAum).toBe(0);
    expect(result.current.data!.dailyPnlPercent).toBe(0);
    expect(result.current.data!.riskUtilization).toBe(0);
  });

  it('should cap risk utilization at 100%', async () => {
    setupMocks({
      books: [{ capital_allocated: 100000, current_exposure: 200000 }],
    });

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data!.riskUtilization).toBe(100);
  });
});
