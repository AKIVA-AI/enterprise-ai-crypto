import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { OrderHistoryTable } from '@/components/orders/OrderHistoryTable';
import { TradingAlertsPanel } from '@/components/alerts/TradingAlertsPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Crosshair, AlertOctagon, ClipboardList, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Execution() {
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleKillSwitchClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    setKillSwitchActive(!killSwitchActive);
    setConfirmDialogOpen(false);
  };

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
            onClick={handleKillSwitchClick}
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

        {/* Kill Switch Confirmation Dialog */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {killSwitchActive ? 'Resume Trading?' : 'Activate Kill Switch?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {killSwitchActive
                  ? 'This will resume all trading operations. Pending orders will begin processing again. Ensure market conditions are stable before resuming.'
                  : 'This will immediately halt ALL trading operations. All pending orders will be cancelled and no new orders will be accepted. This is an emergency action.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className={killSwitchActive ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
              >
                {killSwitchActive ? 'Resume Trading' : 'Activate Kill Switch'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
