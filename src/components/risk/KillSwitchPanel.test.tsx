import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KillSwitchPanel } from './KillSwitchPanel';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ 
          data: {
            id: 'settings-1',
            global_kill_switch: false,
            reduce_only_mode: false,
            paper_trading_mode: false
          }, 
          error: null 
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('KillSwitchPanel', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const renderPanel = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <KillSwitchPanel />
      </QueryClientProvider>
    );
  };

  describe('Kill Switch Display', () => {
    it('should render kill switch panel', async () => {
      renderPanel();
      
      await waitFor(() => {
        expect(screen.getByText('Global Kill Switch')).toBeInTheDocument();
      });
    });

    it('should show SYSTEMS ACTIVE when kill switch is off', async () => {
      renderPanel();
      
      await waitFor(() => {
        expect(screen.getByText('SYSTEMS ACTIVE')).toBeInTheDocument();
      });
    });

    it('should show KILL button when kill switch is off', async () => {
      renderPanel();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /KILL/i })).toBeInTheDocument();
      });
    });

    it('should show TRADING HALTED when kill switch is on', async () => {
      // Mock kill switch active
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: {
              id: 'settings-1',
              global_kill_switch: true,
              reduce_only_mode: false,
              paper_trading_mode: false
            }, 
            error: null 
          }))
        }))
      } as any);
      
      renderPanel();
      
      await waitFor(() => {
        expect(screen.getByText('TRADING HALTED')).toBeInTheDocument();
      });
    });
  });

  describe('Kill Switch Activation', () => {
    it('should show confirmation dialog when KILL button clicked', async () => {
      renderPanel();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /KILL/i })).toBeInTheDocument();
      });

      const killButton = screen.getByRole('button', { name: /KILL/i });
      fireEvent.click(killButton);

      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent?.includes('Activate Kill Switch') || false;
        })).toBeInTheDocument();
      });
    });

    it('should show warning message in confirmation dialog', async () => {
      renderPanel();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /KILL/i })).toBeInTheDocument();
      });

      const killButton = screen.getByRole('button', { name: /KILL/i });
      fireEvent.click(killButton);

      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent?.includes('immediately halt ALL trading activity') || false;
        })).toBeInTheDocument();
      });
    });

    it('should have cancel button in confirmation dialog', async () => {
      renderPanel();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /KILL/i })).toBeInTheDocument();
      });

      const killButton = screen.getByRole('button', { name: /KILL/i });
      fireEvent.click(killButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      });
    });
  });

  describe('Security Features', () => {
    it('should require 2FA for activation', async () => {
      renderPanel();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /KILL/i })).toBeInTheDocument();
      });

      // Click KILL button
      const killButton = screen.getByRole('button', { name: /KILL/i });
      fireEvent.click(killButton);

      // Confirm in dialog
      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent?.includes('Activate Kill Switch') || false;
        })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /ACTIVATE KILL SWITCH/i });
      fireEvent.click(confirmButton);

      // 2FA dialog should appear
      await waitFor(() => {
        expect(screen.getByText(/two-factor verification/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mode Toggles', () => {
    it('should show reduce-only mode toggle', async () => {
      renderPanel();
      
      await waitFor(() => {
        expect(screen.getByText(/Reduce-Only Mode/i)).toBeInTheDocument();
      });
    });

    it('should show paper trading mode toggle', async () => {
      renderPanel();
      
      await waitFor(() => {
        expect(screen.getByText(/Paper Trading Mode/i)).toBeInTheDocument();
      });
    });
  });
});

