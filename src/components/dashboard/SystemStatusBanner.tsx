import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, ShieldAlert, ShieldOff, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

type SystemState = 'operational' | 'degraded' | 'critical';

export function SystemStatusBanner() {
  const { data } = useQuery({
    queryKey: ['system-status-banner'],
    queryFn: async () => {
      const [settingsRes, alertsRes, booksRes] = await Promise.all([
        supabase.from('global_settings').select('global_kill_switch, reduce_only_mode, paper_trading_mode').single(),
        supabase.from('alerts').select('id, severity').eq('is_resolved', false).in('severity', ['critical', 'warning']),
        supabase.from('books').select('id, status').in('status', ['frozen', 'halted']),
      ]);

      const settings = settingsRes.data;
      const critAlerts = (alertsRes.data || []).filter(a => a.severity === 'critical').length;
      const frozenBooks = (booksRes.data || []).length;

      let state: SystemState = 'operational';
      const flags: string[] = [];

      if (settings?.global_kill_switch) { state = 'critical'; flags.push('Kill Switch ON'); }
      if (settings?.reduce_only_mode) { state = state === 'critical' ? 'critical' : 'degraded'; flags.push('Reduce-Only'); }
      if (settings?.paper_trading_mode) flags.push('Paper Mode');
      if (frozenBooks > 0) { state = state === 'critical' ? 'critical' : 'degraded'; flags.push(`${frozenBooks} frozen`); }
      if (critAlerts > 0) { state = state === 'critical' ? 'critical' : 'degraded'; flags.push(`${critAlerts} critical`); }

      return { state, flags, paper: settings?.paper_trading_mode };
    },
    refetchInterval: 15000,
  });

  if (!data) return null;

  const config: Record<SystemState, { icon: typeof ShieldCheck; bg: string; text: string; label: string }> = {
    operational: { icon: ShieldCheck, bg: 'bg-success/10 border-success/20', text: 'text-success', label: 'All Systems Operational' },
    degraded: { icon: ShieldAlert, bg: 'bg-warning/10 border-warning/20', text: 'text-warning', label: 'Degraded' },
    critical: { icon: ShieldOff, bg: 'bg-destructive/10 border-destructive/20', text: 'text-destructive', label: 'Critical' },
  };

  const c = config[data.state];
  const Icon = c.icon;

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium', c.bg, c.text)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{c.label}</span>
      {data.flags.length > 0 && (
        <div className="flex items-center gap-1.5 ml-1">
          {data.flags.map(f => (
            <span key={f} className="px-1.5 py-0.5 rounded bg-background/50 text-[10px] uppercase tracking-wider">{f}</span>
          ))}
        </div>
      )}
      {data.state === 'operational' && <Activity className="h-3 w-3 animate-pulse ml-auto opacity-60" />}
    </div>
  );
}
