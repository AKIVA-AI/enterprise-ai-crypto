import { useState } from 'react';
import { STRATEGY_TEMPLATES, getCategoryColor, getDifficultyColor, StrategyTemplate } from '@/lib/strategyTemplates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Zap, 
  Clock, 
  Shield, 
  TrendingUp,
  ChevronRight,
  Settings2,
} from 'lucide-react';

interface StrategyTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: StrategyTemplate) => void;
}

export function StrategyTemplateSelector({ 
  open, 
  onOpenChange,
  onSelectTemplate,
}: StrategyTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<StrategyTemplate | null>(null);

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'trend', label: 'Trend Following' },
    { id: 'mean-reversion', label: 'Mean Reversion' },
    { id: 'arbitrage', label: 'Arbitrage' },
    { id: 'momentum', label: 'Momentum' },
    { id: 'volatility', label: 'Volatility' },
  ];

  const filteredTemplates = STRATEGY_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: StrategyTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Strategy Templates
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-6 w-full">
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="flex-1 overflow-y-auto mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(template => (
                  <Card
                    key={template.id}
                    className={cn(
                      'p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md',
                      previewTemplate?.id === template.id && 'border-primary'
                    )}
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg border',
                          getCategoryColor(template.category)
                        )}>
                          {template.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{template.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px]">
                              {template.category}
                            </Badge>
                            <span className={cn('text-[10px] font-medium', getDifficultyColor(template.difficulty))}>
                              {template.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {template.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {template.defaultConfig.timeframe}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        Tier {template.defaultConfig.riskTier}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        {template.expectedReturn}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No templates found matching your criteria
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!previewTemplate}
              onClick={() => previewTemplate && handleUseTemplate(previewTemplate)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-lg">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg border', getCategoryColor(previewTemplate.category))}>
                    {previewTemplate.icon}
                  </div>
                  {previewTemplate.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {previewTemplate.description}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Timeframe</p>
                    <p className="font-medium">{previewTemplate.defaultConfig.timeframe}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Max Leverage</p>
                    <p className="font-medium">{previewTemplate.defaultConfig.maxLeverage}x</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Max Drawdown</p>
                    <p className="font-medium">{previewTemplate.defaultConfig.maxDrawdown}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Risk Tier</p>
                    <p className="font-medium">Tier {previewTemplate.defaultConfig.riskTier}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-2">Default Parameters</p>
                  <div className="p-3 rounded-lg bg-muted/30 max-h-32 overflow-y-auto">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(previewTemplate.defaultConfig.parameters, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Expected Return: </span>
                    <span className="font-medium text-success">{previewTemplate.expectedReturn}</span>
                  </div>
                  <Badge className={getDifficultyColor(previewTemplate.difficulty)}>
                    {previewTemplate.difficulty}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  {previewTemplate.riskProfile}
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Back
                </Button>
                <Button onClick={() => handleUseTemplate(previewTemplate)}>
                  <Zap className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
