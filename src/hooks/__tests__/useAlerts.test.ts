import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

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

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

import { useAlerts, useUnreadAlertsCount, useMarkAlertRead } from '../useAlerts';

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

describe('useAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch alerts ordered by creation date', async () => {
    const mockAlerts = [
      { id: 'a-1', title: 'Price Alert', severity: 'high', is_read: false, created_at: '2026-03-20T12:00:00Z' },
      { id: 'a-2', title: 'Risk Alert', severity: 'critical', is_read: true, created_at: '2026-03-20T11:00:00Z' },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockAlerts, error: null })),
      })),
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAlerts);
    expect(result.current.data).toHaveLength(2);
  });

  it('should apply limit when provided', async () => {
    const mockLimitFn = vi.fn(() => Promise.resolve({ data: [], error: null }));
    const mockOrderFn = vi.fn(() => ({ limit: mockLimitFn }));

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        order: mockOrderFn,
      })),
    });

    renderHook(() => useAlerts(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockLimitFn).toHaveBeenCalledWith(5);
    });
  });

  it('should subscribe to realtime alert inserts', () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    });

    renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    expect(mockChannel).toHaveBeenCalledWith('alerts-changes');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'alerts',
      }),
      expect.any(Function)
    );
  });

  it('should handle fetch error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() =>
          Promise.resolve({ data: null, error: { message: 'Table not found' } })
        ),
      })),
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useUnreadAlertsCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return unread alert count', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ count: 7, error: null })),
      })),
    });

    const { result } = renderHook(() => useUnreadAlertsCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(7);
  });

  it('should return zero when no unread alerts', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
      })),
    });

    const { result } = renderHook(() => useUnreadAlertsCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(0);
  });
});

describe('useMarkAlertRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark an alert as read', async () => {
    const mockEq = vi.fn(() => Promise.resolve({ error: null }));
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: mockEq,
      })),
    });

    const { result } = renderHook(() => useMarkAlertRead(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('a-1');
    });

    expect(mockFrom).toHaveBeenCalledWith('alerts');
    expect(mockEq).toHaveBeenCalledWith('id', 'a-1');
  });
});
