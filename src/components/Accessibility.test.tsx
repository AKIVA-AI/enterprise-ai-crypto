import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from './dashboard/MetricCard';
import { RiskGauge } from './dashboard/RiskGauge';
import { SystemStatusBanner } from './dashboard/SystemStatusBanner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase for SystemStatusBanner
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: { global_kill_switch: false, reduce_only_mode: false, paper_trading_mode: false },
          error: null,
        })),
        eq: vi.fn(() => ({
          in: vi.fn(async () => ({ data: [], error: null })),
        })),
        in: vi.fn(async () => ({ data: [], error: null })),
      })),
    })),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Accessibility — ARIA attributes', () => {
  describe('MetricCard', () => {
    it('has role="region" and aria-label from title', () => {
      render(<MetricCard title="Total P&L" value="$12,345" />);
      const region = screen.getByRole('region', { name: /total p&l/i });
      expect(region).toBeInTheDocument();
    });

    it('has aria-live="polite" for value updates', () => {
      render(<MetricCard title="Exposure" value="$50,000" change={2.5} />);
      const liveRegion = screen.getByText('$50,000').closest('[aria-live]');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('RiskGauge', () => {
    it('has role="meter" with aria-valuenow', () => {
      render(<RiskGauge value={65} max={100} label="Portfolio Risk" />);
      const meter = screen.getByRole('meter');
      expect(meter).toHaveAttribute('aria-valuenow', '65');
      expect(meter).toHaveAttribute('aria-valuemin', '0');
      expect(meter).toHaveAttribute('aria-valuemax', '100');
    });

    it('has aria-label describing the gauge', () => {
      render(<RiskGauge value={30} max={100} label="VaR Risk" />);
      const meter = screen.getByRole('meter');
      expect(meter).toHaveAttribute('aria-label', 'VaR Risk');
    });
  });

  describe('SystemStatusBanner', () => {
    it('has role="status" for live system state', async () => {
      render(
        <Wrapper>
          <SystemStatusBanner />
        </Wrapper>
      );
      // The banner should have role="status" when rendered
      const statusEl = await screen.findByRole('status');
      expect(statusEl).toBeInTheDocument();
    });

    it('has aria-live="polite" for status updates', async () => {
      render(
        <Wrapper>
          <SystemStatusBanner />
        </Wrapper>
      );
      const statusEl = await screen.findByRole('status');
      expect(statusEl).toHaveAttribute('aria-live', 'polite');
    });
  });
});
