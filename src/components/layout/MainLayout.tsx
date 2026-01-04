import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AICopilotSidebar } from '@/components/chat/AICopilotSidebar';
import { useAICopilot } from '@/contexts/AICopilotContext';
import { ComplianceBanner, ComplianceDisclaimer } from '@/components/compliance/ComplianceBanner';
import { RiskAlertBanner } from '@/components/risk/RiskAlertBanner';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  showComplianceBanner?: boolean;
}

export function MainLayout({ children, showComplianceBanner = false }: MainLayoutProps) {
  const { isOpen, toggle } = useAICopilot();

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className="flex flex-1 ml-64">
        <div className="flex-1 flex flex-col min-h-screen">
          <TopBar />
          {showComplianceBanner && <ComplianceBanner compact dismissible />}
          <main className="p-6 flex-1 overflow-auto">
            {/* Risk Alerts Banner - Shows critical risk warnings */}
            <RiskAlertBanner />
            {children}
          </main>
          <ComplianceDisclaimer />
        </div>
        <AICopilotSidebar isOpen={isOpen} onToggle={toggle} />
      </div>
    </div>
  );
}
