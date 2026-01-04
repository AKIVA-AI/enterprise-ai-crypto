import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Info, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Parameter types
export type ParameterType = 'number' | 'boolean' | 'select' | 'string' | 'range';

export interface StrategyParameter {
  id: string;
  name: string;
  type: ParameterType;
  value: unknown;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue?: unknown;
  validation?: (value: unknown) => string | null;
}

interface StrategyParameterEditorProps {
  parameters: StrategyParameter[];
  onChange: (parameters: StrategyParameter[]) => void;
  className?: string;
  showAdvanced?: boolean;
}

// Default parameter templates
const DEFAULT_PARAMETERS: StrategyParameter[] = [
  {
    id: 'rsi_period',
    name: 'RSI Period',
    type: 'number',
    value: 14,
    description: 'Number of periods for RSI calculation',
    min: 2,
    max: 50,
    step: 1,
    defaultValue: 14,
  },
  {
    id: 'rsi_oversold',
    name: 'RSI Oversold Level',
    type: 'number',
    value: 30,
    description: 'RSI level considered oversold (buy signal)',
    min: 10,
    max: 40,
    step: 1,
    defaultValue: 30,
  },
  {
    id: 'rsi_overbought',
    name: 'RSI Overbought Level',
    type: 'number',
    value: 70,
    description: 'RSI level considered overbought (sell signal)',
    min: 60,
    max: 90,
    step: 1,
    defaultValue: 70,
  },
  {
    id: 'use_stop_loss',
    name: 'Use Stop Loss',
    type: 'boolean',
    value: true,
    description: 'Enable stop loss protection',
    defaultValue: true,
  },
  {
    id: 'stop_loss_percent',
    name: 'Stop Loss %',
    type: 'number',
    value: 2,
    description: 'Stop loss percentage',
    min: 0.5,
    max: 10,
    step: 0.1,
    defaultValue: 2,
  },
  {
    id: 'position_sizing',
    name: 'Position Sizing',
    type: 'select',
    value: 'fixed',
    description: 'How to determine position size',
    options: ['fixed', 'percentage', 'volatility'],
    defaultValue: 'fixed',
  },
];

export function StrategyParameterEditor({
  parameters,
  onChange,
  className,
  showAdvanced = false,
}: StrategyParameterEditorProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateParameter = useCallback((param: StrategyParameter): string | null => {
    if (param.required && (param.value === null || param.value === undefined || param.value === '')) {
      return `${param.name} is required`;
    }

    if (param.type === 'number') {
      const numValue = Number(param.value);
      if (isNaN(numValue)) {
        return `${param.name} must be a valid number`;
      }
      if (param.min !== undefined && numValue < param.min) {
        return `${param.name} must be at least ${param.min}`;
      }
      if (param.max !== undefined && numValue > param.max) {
        return `${param.name} must be at most ${param.max}`;
      }
    }

    if (param.type === 'select' && param.options && typeof param.value === 'string' && !param.options.includes(param.value)) {
      return `${param.name} must be one of: ${param.options.join(', ')}`;
    }

    if (param.validation) {
      return param.validation(param.value);
    }

    return null;
  }, []);

  const updateParameter = useCallback((id: string, updates: Partial<StrategyParameter>) => {
    const newParameters = parameters.map(param => {
      if (param.id === id) {
        const updatedParam = { ...param, ...updates };
        const error = validateParameter(updatedParam);
        
        setErrors(prev => {
          const newErrors = { ...prev };
          if (error) {
            newErrors[id] = error;
          } else {
            delete newErrors[id];
          }
          return newErrors;
        });

        return updatedParam;
      }
      return param;
    });

    onChange(newParameters);
  }, [parameters, onChange, validateParameter]);

  const addParameter = useCallback(() => {
    const newParam: StrategyParameter = {
      id: `param_${Date.now()}`,
      name: 'New Parameter',
      type: 'number',
      value: 0,
      description: 'Parameter description',
      defaultValue: 0,
    };

    onChange([...parameters, newParam]);
  }, [parameters, onChange]);

  const removeParameter = useCallback((id: string) => {
    const newParameters = parameters.filter(param => param.id !== id);
    onChange(newParameters);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  }, [parameters, onChange]);

  const resetToDefaults = useCallback(() => {
    const resetParameters = parameters.map(param => ({
      ...param,
      value: param.defaultValue,
    }));
    onChange(resetParameters);
    setErrors({});
  }, [parameters, onChange]);

  const loadDefaults = useCallback(() => {
    onChange(DEFAULT_PARAMETERS);
    setErrors({});
  }, [onChange]);

  const renderParameterInput = (param: StrategyParameter) => {
    const error = errors[param.id];

    switch (param.type) {
      case 'number':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={param.id} className="text-sm font-medium">
                {param.name}
                {param.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {param.description && (
                <div className="group relative">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <div className="absolute right-0 top-4 w-48 p-2 bg-popover border rounded-md shadow-md text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {param.description}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                id={param.id}
                type="number"
                value={String(param.value)}
                onChange={(e) => updateParameter(param.id, { value: Number(e.target.value) })}
                min={param.min}
                max={param.max}
                step={param.step}
                className={cn(error && 'border-destructive')}
              />
              {param.min !== undefined && param.max !== undefined && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {param.min} - {param.max}
                </span>
              )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor={param.id} className="text-sm font-medium">
                  {param.name}
                </Label>
                {param.description && (
                  <div className="group relative">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <div className="absolute right-0 top-4 w-48 p-2 bg-popover border rounded-md shadow-md text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {param.description}
                    </div>
                  </div>
                )}
              </div>
              <Switch
                id={param.id}
                checked={Boolean(param.value)}
                onCheckedChange={(checked) => updateParameter(param.id, { value: checked })}
              />
            </div>
            {param.description && (
              <p className="text-xs text-muted-foreground ml-1">{param.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={param.id} className="text-sm font-medium">
                {param.name}
                {param.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {param.description && (
                <div className="group relative">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <div className="absolute right-0 top-4 w-48 p-2 bg-popover border rounded-md shadow-md text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {param.description}
                  </div>
                </div>
              )}
            </div>
            <Select
              value={String(param.value)}
              onValueChange={(value) => updateParameter(param.id, { value })}
            >
              <SelectTrigger className={cn(error && 'border-destructive')}>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={param.id} className="text-sm font-medium">
                {param.name}
                {param.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Badge variant="outline" className="text-xs">
                {String(param.value)}
              </Badge>
              {param.description && (
                <div className="group relative">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <div className="absolute right-0 top-4 w-48 p-2 bg-popover border rounded-md shadow-md text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {param.description}
                  </div>
                </div>
              )}
            </div>
            <Slider
              value={[Number(param.value)]}
              onValueChange={([value]) => updateParameter(param.id, { value })}
              min={param.min}
              max={param.max}
              step={param.step || 1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{param.min}</span>
              <span>{param.max}</span>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );

      case 'string':
      default:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={param.id} className="text-sm font-medium">
                {param.name}
                {param.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {param.description && (
                <div className="group relative">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <div className="absolute right-0 top-4 w-48 p-2 bg-popover border rounded-md shadow-md text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {param.description}
                  </div>
                </div>
              )}
            </div>
            <Input
              id={param.id}
              value={String(param.value)}
              onChange={(e) => updateParameter(param.id, { value: e.target.value })}
              placeholder={param.description}
              className={cn(error && 'border-destructive')}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );
    }
  };

  const basicParameters = parameters.filter(p => !p.id.startsWith('advanced_'));
  const advancedParameters = parameters.filter(p => p.id.startsWith('advanced_'));

  return (
    <Card className={cn('glass-panel', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Strategy Parameters
              <div className="group relative">
                <Info className="h-4 w-4 text-muted-foreground" />
                <div className="absolute right-0 top-6 w-64 p-3 bg-popover border rounded-md shadow-md text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  Configure strategy-specific parameters. These values will be used during backtest execution.
                </div>
              </div>
            </CardTitle>
            <CardDescription>
              Fine-tune your strategy parameters for optimal performance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDefaults}
              className="text-xs"
            >
              Load Defaults
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              disabled={parameters.length === 0}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addParameter}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {parameters.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No parameters configured</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={loadDefaults}>
                Load Default Parameters
              </Button>
              <Button variant="outline" size="sm" onClick={addParameter}>
                <Plus className="h-3 w-3 mr-1" />
                Add Custom Parameter
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="basic" className="w-full">
            {(showAdvanced && advancedParameters.length > 0) && (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic ({basicParameters.length})</TabsTrigger>
                <TabsTrigger value="advanced">Advanced ({advancedParameters.length})</TabsTrigger>
              </TabsList>
            )}
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              {basicParameters.map((param) => (
                <div key={param.id} className="group relative">
                  {renderParameterInput(param)}
                  {!param.required && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParameter(param.id)}
                      className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>

            {showAdvanced && (
              <TabsContent value="advanced" className="space-y-4 mt-4">
                {advancedParameters.map((param) => (
                  <div key={param.id} className="group relative">
                    {renderParameterInput(param)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParameter(param.id)}
                      className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </TabsContent>
            )}
          </Tabs>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium mb-1">
              Please fix the following errors:
            </p>
            <ul className="text-xs text-destructive space-y-1">
              {Object.entries(errors).map(([id, error]) => (
                <li key={id}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StrategyParameterEditor;
