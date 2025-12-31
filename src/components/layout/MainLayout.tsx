import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AICopilotSidebar } from '@/components/chat/AICopilotSidebar';
import { useAICopilot } from '@/contexts/AICopilotContext';
import { ComplianceBanner, ComplianceDisclaimer } from '@/components/compliance/ComplianceBanner';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  showComplianceBanner?: boolean;
}

export function MainLayout({ children, showComplianceBanner = false }: MainLayoutProps) {
  const { isOpen, toggle } = useAICopilot();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <div
        className={cn(
          'pl-64 transition-all duration-300 flex-1 flex flex-col',
          isOpen ? 'pr-80' : 'pr-0'
        )}
      >
        <TopBar />
        {showComplianceBanner && <ComplianceBanner compact dismissible />}
        <main className="p-6 flex-1">
          {children}
        </main>
        <ComplianceDisclaimer />
      </div>
      <AICopilotSidebar isOpen={isOpen} onToggle={toggle} />
    </div>
  );
}
