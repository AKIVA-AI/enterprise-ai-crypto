import { MainLayout } from '@/components/layout/MainLayout';
import { CapitalAllocatorPanel } from '@/components/allocator/CapitalAllocatorPanel';
import { PortfolioAnalyticsPanel } from '@/components/portfolio/PortfolioAnalyticsPanel';
import { TradeJournalPanel } from '@/components/journal/TradeJournalPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, BookOpen, Compass } from 'lucide-react';

export default function Analytics() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Portfolio Analytics
          </h1>
          <p className="text-muted-foreground">Performance metrics, trade journal, and risk attribution</p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="glass-panel">
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="journal" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Trade Journal
            </TabsTrigger>
            <TabsTrigger value="allocator" className="gap-2">
              <Compass className="h-4 w-4" />
              Allocator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <PortfolioAnalyticsPanel />
          </TabsContent>

          <TabsContent value="journal">
            <TradeJournalPanel />
          </TabsContent>

          <TabsContent value="allocator">
            <CapitalAllocatorPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
