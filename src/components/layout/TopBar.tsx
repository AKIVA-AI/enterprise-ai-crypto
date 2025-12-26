import { Bell, Search, Wifi, WifiOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function TopBar() {
  const [time, setTime] = useState(new Date());
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex h-full items-center justify-between px-6">
        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents, strategies, positions..."
            className="pl-10 bg-muted/50 border-muted focus:border-primary"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
            {connected ? (
              <>
                <Wifi className="h-4 w-4 text-success" />
                <span className="text-xs font-medium text-success">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="text-xs font-medium text-destructive">Disconnected</span>
              </>
            )}
          </div>

          {/* Time */}
          <div className="font-mono text-sm text-muted-foreground">
            {time.toLocaleTimeString('en-US', { hour12: false })}
            <span className="text-xs ml-1">UTC</span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>
        </div>
      </div>
    </header>
  );
}
