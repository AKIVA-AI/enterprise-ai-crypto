import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const { mockFrom, mockInvoke } = vi.hoisted(() => {
  const mockFrom = vi.fn();
  const mockInvoke = vi.fn();
  return { mockFrom, mockInvoke };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    functions: {
      invoke: mockInvoke,
    },
  },
}));

import { useSystemHealth, useRunHealthChecks } from '../useSystemHealth';

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

describe('useSystemHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should determine overall healthy status', async () => {
    const mockComponents = [
      { id: 'h-1', component: 'database', status: 'healthy', last_check_at: '2026-03-20T12:00:00Z', details: {}, error_message: null },
      { id: 'h-2', component: 'trading_engine', status: 'healthy', last_check_at: '2026-03-20T12:00:00Z', details: {}, error_message: null },
      { id: 'h-3', component: 'risk_engine', status: 'healthy', last_check_at: '2026-03-20T12:00:00Z', details: {}, error_message: null },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn(() => Promise.resolve({ data: mockComponents, error: null })),
    });

    const { result } = renderHook(() => useSystemHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data!.overall).toBe('healthy');
    expect(result.current.data!.components).toHaveLength(3);
  });

  it('should detect degraded status', async () => {
    const mockComponents = [
      { id: 'h-1', component: 'database', status: 'healthy', last_check_at: '2026-03-20T12:00:00Z', details: {}, error_message: null },
      { id: 'h-2', component: 'market_data', status: 'degraded', last_check_at: '2026-03-20T12:00:00Z', details: {}, error_message: 'Slow response' },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn(() => Promise.resolve({ data: mockComponents, error: null })),
    });

    const { result } = renderHook(() => useSystemHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data!.overall).toBe('degraded');
  });

  it('should detect unhealthy status when any component is unhealthy', async () => {
    const mockComponents = [
      { id: 'h-1', component: 'database', status: 'healthy', last_check_at: '2026-03-20T12:00:00Z', details: {}, error_message: null },
      { id: 'h-2', component: 'trading_engine', status: 'unhealthy', last_check_at: '2026-03-20T12:00:00Z', details: {}, error_message: 'Connection refused' },
      { id: 'h-3', component: 'market_data', status: 'degraded', last_check_at: '2026-03-20T12:00:00Z', details: {}, error_message: null },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn(() => Promise.resolve({ data: mockComponents, error: null })),
    });

    const { result } = renderHook(() => useSystemHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // unhealthy takes precedence over degraded
    expect(result.current.data!.overall).toBe('unhealthy');
  });

  it('should handle empty component list', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    });

    const { result } = renderHook(() => useSystemHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data!.overall).toBe('healthy');
    expect(result.current.data!.components).toEqual([]);
  });
});

describe('useRunHealthChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should invoke the health-check edge function', async () => {
    const mockResponse = {
      success: true,
      overall: 'healthy',
      isReady: true,
      components: [],
      checkedAt: '2026-03-20T12:00:00Z',
    };

    mockInvoke.mockResolvedValue({ data: mockResponse, error: null });

    const { result } = renderHook(() => useRunHealthChecks(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const data = await result.current.mutateAsync();
      expect(data).toEqual(mockResponse);
    });

    expect(mockInvoke).toHaveBeenCalledWith('health-check');
  });

  it('should handle edge function errors', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Edge function timeout' } });

    const { result } = renderHook(() => useRunHealthChecks(), {
      wrapper: createWrapper(),
    });

    let caughtError: unknown = null;
    await act(async () => {
      try {
        await result.current.mutateAsync();
      } catch (error) {
        caughtError = error;
      }
    });

    expect(caughtError).toBeTruthy();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
