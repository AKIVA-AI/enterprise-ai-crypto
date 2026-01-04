import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Calendar,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BacktestDetail, BacktestSummary } from '@/hooks/useBacktestResults';
import { Trade } from './TradeJournal';

// Report sections configuration
interface ReportSection {
  id: string;
  title: string;
  description: string;
  defaultEnabled: boolean;
  category: 'overview' | 'performance' | 'risk' | 'trades' | 'analysis';
}

const REPORT_SECTIONS: ReportSection[] = [
  {
    id: 'summary',
    title: 'Executive Summary',
    description: 'High-level overview and key metrics',
    defaultEnabled: true,
    category: 'overview',
  },
  {
    id: 'strategy',
    title: 'Strategy Configuration',
    description: 'Parameters and settings used',
    defaultEnabled: true,
    category: 'overview',
  },
  {
    id: 'performance',
    title: 'Performance Metrics',
    description: 'Returns, Sharpe ratio, and other key metrics',
    defaultEnabled: true,
    category: 'performance',
  },
  {
    id: 'equity_curve',
    title: 'Equity Curve Chart',
    description: 'Visual representation of portfolio value over time',
    defaultEnabled: true,
    category: 'performance',
  },
  {
    id: 'risk_analysis',
    title: 'Risk Analysis',
    description: 'VaR, drawdown, and risk metrics',
    defaultEnabled: true,
    category: 'risk',
  },
  {
    id: 'trade_journal',
    title: 'Trade Journal',
    description: 'Detailed list of all trades',
    defaultEnabled: false,
    category: 'trades',
  },
  {
    id: 'monthly_returns',
    title: 'Monthly Returns',
    description: 'Month-by-month performance breakdown',
    defaultEnabled: true,
    category: 'analysis',
  },
  {
    id: 'correlation_analysis',
    title: 'Correlation Analysis',
    description: 'Asset correlation and diversification metrics',
    defaultEnabled: false,
    category: 'analysis',
  },
  {
    id: 'benchmark_comparison',
    title: 'Benchmark Comparison',
    description: 'Performance vs market benchmarks',
    defaultEnabled: false,
    category: 'analysis',
  },
];

interface ExportOptions {
  includeCharts?: boolean;
  includeRawData?: boolean;
  customNotes?: string;
}

interface ReportExporterProps {
  backtest: BacktestDetail;
  trades?: Trade[];
  className?: string;
  onExport?: (format: string, sections: string[], options: ExportOptions) => void;
}

type ExportFormat = 'PDF' | 'CSV' | 'EXCEL' | 'JSON';
type ExportStatus = 'idle' | 'generating' | 'completed' | 'error';

export function ReportExporter({
  backtest,
  trades = [],
  className,
  onExport,
}: ReportExporterProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PDF');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(REPORT_SECTIONS.filter(s => s.defaultEnabled).map(s => s.id))
  );
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Toggle section selection
  const toggleSection = (sectionId: string) => {
    const newSections = new Set(selectedSections);
    if (newSections.has(sectionId)) {
      newSections.delete(sectionId);
    } else {
      newSections.add(sectionId);
    }
    setSelectedSections(newSections);
  };

  // Toggle all sections in a category
  const toggleCategory = (category: ReportSection['category'], enabled: boolean) => {
    const categorySections = REPORT_SECTIONS.filter(s => s.category === category);
    const newSections = new Set(selectedSections);
    
    categorySections.forEach(section => {
      if (enabled) {
        newSections.add(section.id);
      } else {
        newSections.delete(section.id);
      }
    });
    
    setSelectedSections(newSections);
  };

  // Handle export
  const handleExport = async () => {
    if (selectedSections.size === 0) {
      setExportError('Please select at least one section to export');
      return;
    }

    setExportStatus('generating');
    setExportProgress(0);
    setExportError(null);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Prepare export data
      const exportData = {
        backtest,
        trades,
        sections: Array.from(selectedSections),
        format: selectedFormat,
        options: {
          includeCharts: selectedFormat !== 'CSV',
          includeRawData: selectedFormat === 'EXCEL' || selectedFormat === 'JSON',
          timestamp: new Date().toISOString(),
        },
      };

      // Call export handler or default export
      if (onExport) {
        await onExport(selectedFormat, Array.from(selectedSections), exportData.options);
      } else {
        // Default export behavior
        await performDefaultExport(exportData);
      }

      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('completed');

      // Reset status after delay
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
      }, 3000);
    } catch (error) {
      setExportStatus('error');
      setExportError(error instanceof Error ? error.message : 'Export failed');
    }
  };

  // Default export implementation
  const performDefaultExport = async (data: {
    backtest: BacktestDetail;
    trades: Trade[];
    sections: string[];
    format: ExportFormat;
    options: ExportOptions & { timestamp: string };
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would call the backend API
    console.log('Exporting data:', data);
  };

  // Get format icon
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'PDF':
        return <FileText className="h-4 w-4" />;
      case 'CSV':
      case 'EXCEL':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'JSON':
        return <FileImage className="h-4 w-4" />;
    }
  };

  // Get format description
  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case 'PDF':
        return 'Professional report with charts and formatting';
      case 'CSV':
        return 'Raw data in comma-separated values format';
      case 'EXCEL':
        return 'Spreadsheet with multiple sheets and formulas';
      case 'JSON':
        return 'Structured data format for programmatic use';
    }
  };

  // Render section selection
  const renderSectionSelection = () => {
    const categories = Array.from(new Set(REPORT_SECTIONS.map(s => s.category)));
    
    return (
      <div className="space-y-6">
        {categories.map(category => {
          const categorySections = REPORT_SECTIONS.filter(s => s.category === category);
          const allSelected = categorySections.every(s => selectedSections.has(s.id));
          const someSelected = categorySections.some(s => selectedSections.has(s.id));

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium capitalize">{category}</h4>
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleCategory(category, checked as boolean)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categorySections.map(section => (
                  <div key={section.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={section.id}
                      checked={selectedSections.has(section.id)}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <div className="flex-1">
                      <label htmlFor={section.id} className="font-medium text-sm cursor-pointer">
                        {section.title}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render export status
  const renderExportStatus = () => {
    switch (exportStatus) {
      case 'generating':
        return (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Generating report...</p>
                <Progress value={exportProgress} className="w-full" />
              </div>
            </AlertDescription>
          </Alert>
        );
      case 'completed':
        return (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Report generated successfully!
            </AlertDescription>
          </Alert>
        );
      case 'error':
        return (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {exportError}
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={cn('glass-panel', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Report Exporter
          <div className="group relative">
            <Download className="h-4 w-4 text-muted-foreground" />
            <div className="absolute right-0 top-6 w-64 p-3 bg-popover border rounded-md shadow-md text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10">
              Export comprehensive backtest reports in multiple formats with customizable sections.
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          Generate professional reports with customizable sections and formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="mt-6">
            <div className="space-y-6">
              {renderSectionSelection()}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedSections.size} of {REPORT_SECTIONS.length} sections selected
                </div>
                <Button
                  onClick={() => setSelectedSections(new Set(REPORT_SECTIONS.map(s => s.id)))}
                  variant="outline"
                  size="sm"
                >
                  Select All
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="format" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['PDF', 'CSV', 'EXCEL', 'JSON'] as ExportFormat[]).map(format => (
                  <div
                    key={format}
                    className={cn(
                      'p-4 border rounded-lg cursor-pointer transition-colors',
                      selectedFormat === format
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setSelectedFormat(format)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {getFormatIcon(format)}
                      <div className="flex-1">
                        <h4 className="font-medium">{format}</h4>
                        <p className="text-xs text-muted-foreground">
                          {getFormatDescription(format)}
                        </p>
                      </div>
                      {selectedFormat === format && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Export Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-charts" defaultChecked />
                    <label htmlFor="include-charts" className="text-sm">
                      Include charts and visualizations
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-raw-data" />
                    <label htmlFor="include-raw-data" className="text-sm">
                      Include raw data tables
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-metadata" defaultChecked />
                    <label htmlFor="include-metadata" className="text-sm">
                      Include metadata and timestamps
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="compress-output" />
                    <label htmlFor="compress-output" className="text-sm">
                      Compress output file
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <div className="space-y-6">
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Report Preview</p>
                <p className="text-sm">
                  Preview of your generated report will appear here
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Status */}
        {renderExportStatus()}

        {/* Export Actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Strategy: {backtest.strategyName}</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Format: {selectedFormat}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Sections: {selectedSections.size}</span>
            </div>
          </div>
          
          <Button
            onClick={handleExport}
            disabled={exportStatus === 'generating' || selectedSections.size === 0}
            className="min-w-[120px]"
          >
            {exportStatus === 'generating' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReportExporter;
