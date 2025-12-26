import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bot,
  LineChart,
  Crosshair,
  Shield,
  Rocket,
  Wallet,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { currentUser } from '@/lib/mockData';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Strategies', href: '/strategies', icon: LineChart },
  { name: 'Execution', href: '/execution', icon: Crosshair },
  { name: 'Risk', href: '/risk', icon: Shield },
  { name: 'Token Launch', href: '/launch', icon: Rocket },
  { name: 'Treasury', href: '/treasury', icon: Wallet },
  { name: 'Observability', href: '/observability', icon: Activity },
];

const roleColors: Record<string, string> = {
  admin: 'bg-primary/20 text-primary',
  trader: 'bg-success/20 text-success',
  researcher: 'bg-chart-4/20 text-chart-4',
  ops: 'bg-warning/20 text-warning',
  auditor: 'bg-muted-foreground/20 text-muted-foreground',
};

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CO</span>
              </div>
              <span className="font-semibold text-sidebar-foreground">CryptoOps</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary'
                )}
              >
                <item.icon size={20} className={cn(isActive && 'text-primary')} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-medium text-sm">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {currentUser.name}
                </p>
                <span className={cn('text-xs px-1.5 py-0.5 rounded', roleColors[currentUser.role])}>
                  {currentUser.role}
                </span>
              </div>
              <button className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground">
                <Settings size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-medium text-sm">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
