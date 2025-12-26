import { MainLayout } from '@/components/layout/MainLayout';
import { PositionManagementPanel } from '@/components/positions/PositionManagementPanel';
import { Briefcase } from 'lucide-react';

export default function Positions() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            Position Management
          </h1>
          <p className="text-muted-foreground">Monitor and manage all open positions with live P&L tracking</p>
        </div>

        <PositionManagementPanel />
      </div>
    </MainLayout>
  );
}
