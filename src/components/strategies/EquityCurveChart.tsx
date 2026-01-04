import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { EquityPoint } from '@/hooks/useBacktestResults';

interface EquityCurveChartProps {
  data: EquityPoint[] | undefined;
  isLoading?: boolean;
  error?: Error | null;
  initialCapital?: number;
  title?: string;
  description?: string;
  showDrawdown?: boolean;
  height?: number;
}

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format date for axis
const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

// Format percent
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

// Custom tooltip
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color?: string;
    payload: EquityPoint & { drawdownArea: number };
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">
        {new Date(data.timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
      <div className="space-y-1">
        <p className="text-primary">
          Equity: <span className="font-medium">{formatCurrency(data.equity)}</span>
        </p>
        <p className="text-muted-foreground">
          Cash: {formatCurrency(data.cash)}
        </p>
        <p className="text-muted-foreground">
          Position: {formatCurrency(data.positionValue)}
        </p>
        {data.drawdown > 0 && (
          <p className="text-destructive">
            Drawdown: {formatPercent(data.drawdown)}
          </p>
        )}
      </div>
    </div>
  );
};

export function EquityCurveChart({
  data,
  isLoading = false,
  error = null,
  initialCapital = 100000,
  title = 'Equity Curve',
  description = 'Portfolio value over time',
  showDrawdown = true,
  height = 400,
}: EquityCurveChartProps) {
  // Process data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((point) => ({
      ...point,
      // Convert drawdown to negative for area chart below axis
      drawdownArea: showDrawdown ? -point.drawdown * point.equity : 0,
    }));
  }, [data, showDrawdown]);
  
  // Calculate Y axis domain
  const yDomain = useMemo(() => {
    if (!chartData.length) return [0, initialCapital * 1.2];
    
    const equities = chartData.map((d) => d.equity);
    const minEquity = Math.min(...equities);
    const maxEquity = Math.max(...equities);
    const padding = (maxEquity - minEquity) * 0.1;
    
    return [
      Math.floor((minEquity - padding) / 1000) * 1000,
      Math.ceil((maxEquity + padding) / 1000) * 1000,
    ];
  }, [chartData, initialCapital]);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load equity curve: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            No equity data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            
            <YAxis
              domain={yDomain}
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference line at initial capital */}
            <ReferenceLine
              y={initialCapital}
              stroke="#888"
              strokeDasharray="5 5"
              label={{ value: 'Initial', position: 'right', fontSize: 10 }}
            />
            
            {/* Equity line */}
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            
            {/* Drawdown area (optional) */}
            {showDrawdown && (
              <Area
                type="monotone"
                dataKey="drawdownArea"
                fill="#ef444433"
                stroke="none"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default EquityCurveChart;
