import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BacktestRequest } from '@/hooks/useBacktestResults';

interface StrategyConfigFormProps {
  onSubmit: (config: BacktestRequest) => void;
  isLoading?: boolean;
  initialValues?: Partial<BacktestRequest>;
  className?: string;
}

// Available timeframes
const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
];

// Common trading pairs
const TRADING_PAIRS = [
  { value: 'BTC-USD', label: 'BTC/USD' },
  { value: 'ETH-USD', label: 'ETH/USD' },
  { value: 'SOL-USD', label: 'SOL/USD' },
  { value: 'ADA-USD', label: 'ADA/USD' },
  { value: 'DOT-USD', label: 'DOT/USD' },
  { value: 'LINK-USD', label: 'LINK/USD' },
  { value: 'MATIC-USD', label: 'MATIC/USD' },
  { value: 'AVAX-USD', label: 'AVAX/USD' },
];

export function StrategyConfigForm({
  onSubmit,
  isLoading = false,
  initialValues = {},
  className,
}: StrategyConfigFormProps) {
  const [formData, setFormData] = useState<BacktestRequest>({
    strategyName: initialValues.strategyName || '',
    instruments: initialValues.instruments || ['BTC-USD'],
    startDate: initialValues.startDate || '',
    endDate: initialValues.endDate || '',
    initialCapital: initialValues.initialCapital || 100000,
    timeframe: initialValues.timeframe || '1h',
    slippageBps: initialValues.slippageBps || 5,
    commissionBps: initialValues.commissionBps || 10,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BacktestRequest, string>>>({});

  // Date picker states
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialValues.startDate ? new Date(initialValues.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialValues.endDate ? new Date(initialValues.endDate) : undefined
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BacktestRequest, string>> = {};

    if (!formData.strategyName.trim()) {
      newErrors.strategyName = 'Strategy name is required';
    }

    if (formData.instruments.length === 0) {
      newErrors.instruments = 'At least one instrument is required';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (startDate && endDate && startDate >= endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.initialCapital || formData.initialCapital <= 0) {
      newErrors.initialCapital = 'Initial capital must be greater than 0';
    }

    if (!formData.timeframe) {
      newErrors.timeframe = 'Timeframe is required';
    }

    if (formData.slippageBps !== undefined && formData.slippageBps < 0) {
      newErrors.slippageBps = 'Slippage cannot be negative';
    }

    if (formData.commissionBps !== undefined && formData.commissionBps < 0) {
      newErrors.commissionBps = 'Commission cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submissionData: BacktestRequest = {
      ...formData,
      startDate: startDate?.toISOString() || '',
      endDate: endDate?.toISOString() || '',
    };

    onSubmit(submissionData);
  };

  const handleInputChange = (field: keyof BacktestRequest, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInstrumentToggle = (instrument: string) => {
    setFormData(prev => ({
      ...prev,
      instruments: prev.instruments.includes(instrument)
        ? prev.instruments.filter(i => i !== instrument)
        : [...prev.instruments, instrument]
    }));
  };

  return (
    <Card className={cn('glass-panel', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Strategy Configuration
          <div className="group relative">
            <Info className="h-4 w-4 text-muted-foreground" />
            <div className="absolute right-0 top-6 w-64 p-3 bg-popover border rounded-md shadow-md text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10">
              Configure your backtest parameters including symbols, timeframe, date range, and capital settings.
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          Set up the parameters for your strategy backtest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Strategy Name */}
          <div className="space-y-2">
            <Label htmlFor="strategyName">Strategy Name</Label>
            <Input
              id="strategyName"
              placeholder="e.g., RSIMomentumStrategy"
              value={formData.strategyName}
              onChange={(e) => handleInputChange('strategyName', e.target.value)}
              className={cn(errors.strategyName && 'border-destructive')}
            />
            {errors.strategyName && (
              <p className="text-sm text-destructive">{errors.strategyName}</p>
            )}
          </div>

          {/* Instruments */}
          <div className="space-y-2">
            <Label>Trading Instruments</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TRADING_PAIRS.map((pair) => (
                <Button
                  key={pair.value}
                  type="button"
                  variant={formData.instruments.includes(pair.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleInstrumentToggle(pair.value)}
                  className={cn(
                    'text-xs',
                    formData.instruments.includes(pair.value) && 'bg-primary'
                  )}
                >
                  {pair.label}
                </Button>
              ))}
            </div>
            {errors.instruments && (
              <p className="text-sm text-destructive">{errors.instruments}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground',
                      errors.startDate && 'border-destructive'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setStartDateOpen(false);
                      handleInputChange('startDate', date?.toISOString() || '');
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground',
                      errors.endDate && 'border-destructive'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setEndDateOpen(false);
                      handleInputChange('endDate', date?.toISOString() || '');
                    }}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Timeframe and Initial Capital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select
                value={formData.timeframe}
                onValueChange={(value) => handleInputChange('timeframe', value)}
              >
                <SelectTrigger className={cn(errors.timeframe && 'border-destructive')}>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timeframe && (
                <p className="text-sm text-destructive">{errors.timeframe}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialCapital">Initial Capital ($)</Label>
              <Input
                id="initialCapital"
                type="number"
                min="1000"
                step="1000"
                value={formData.initialCapital}
                onChange={(e) => handleInputChange('initialCapital', Number(e.target.value))}
                className={cn(errors.initialCapital && 'border-destructive')}
              />
              {errors.initialCapital && (
                <p className="text-sm text-destructive">{errors.initialCapital}</p>
              )}
            </div>
          </div>

          {/* Trading Costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slippageBps">Slippage (bps)</Label>
              <Input
                id="slippageBps"
                type="number"
                min="0"
                step="1"
                value={formData.slippageBps}
                onChange={(e) => handleInputChange('slippageBps', Number(e.target.value))}
                className={cn(errors.slippageBps && 'border-destructive')}
              />
              {errors.slippageBps && (
                <p className="text-sm text-destructive">{errors.slippageBps}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissionBps">Commission (bps)</Label>
              <Input
                id="commissionBps"
                type="number"
                min="0"
                step="1"
                value={formData.commissionBps}
                onChange={(e) => handleInputChange('commissionBps', Number(e.target.value))}
                className={cn(errors.commissionBps && 'border-destructive')}
              />
              {errors.commissionBps && (
                <p className="text-sm text-destructive">{errors.commissionBps}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Running Backtest...
              </>
            ) : (
              'Run Backtest'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default StrategyConfigForm;
