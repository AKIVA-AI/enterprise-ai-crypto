import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { OrderHistoryTable } from '@/components/orders/OrderHistoryTable';
import { TradingAlertsPanel } from '@/components/alerts/TradingAlertsPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crosshair, AlertOctagon, ClipboardList, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Execution() {
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Crosshair className="h-7 w-7 text-primary" />
              Execution Console
            </h1>
            <p className="text-muted-foreground">Order history, alerts, and execution controls</p>
          </div>
          <Button
            variant={killSwitchActive ? 'default' : 'destructive'}
            className={cn('gap-2', killSwitchActive && 'bg-success hover:bg-success/90')}
            onClick={() => setKillSwitchActive(!killSwitchActive)}
          >
            <AlertOctagon className="h-4 w-4" />
            {killSwitchActive ? 'Resume Trading' : 'Kill Switch'}
          </Button>
        </div>

        {killSwitchActive && (
          <div className="glass-panel rounded-xl p-4 border-warning/50 bg-warning/10">
            <div className="flex items-center gap-3">
              <AlertOctagon className="h-6 w-6 text-warning" />
              <div>
                <p className="font-semibold text-warning">Kill Switch Active</p>
                <p className="text-sm text-muted-foreground">All trading operations suspended. New orders blocked.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for Orders and Alerts */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="glass-panel">
            <TabsTrigger value="orders" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Order History
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              Trading Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrderHistoryTable />
          </TabsContent>

          <TabsContent value="alerts">
            <TradingAlertsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
