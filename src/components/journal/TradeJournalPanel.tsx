import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { 
  BookOpen, 
  CalendarIcon, 
  TrendingUp, 
  TrendingDown,
  Target,
  Percent,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayPnL {
  date: Date;
  pnl: number;
  tradeCount: number;
  winCount: number;
}

export function TradeJournalPanel() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [journalNote, setJournalNote] = useState('');

  // Fetch fills for P&L data
  const { data: fills = [] } = useQuery({
    queryKey: ['fills-journal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fills')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch orders for trade stats
  const { data: orders = [] } = useQuery({
    queryKey: ['orders-journal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'filled')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate P&L by day
  const dailyPnL = useMemo(() => {
    const pnlMap = new Map<string, DayPnL>();
    
    fills.forEach(fill => {
      const dateKey = format(new Date(fill.executed_at), 'yyyy-MM-dd');
      const existing = pnlMap.get(dateKey);
      
      // Simple P&L calculation (buy = negative, sell = positive for this demo)
      const tradePnl = fill.side === 'sell' 
        ? Number(fill.size) * Number(fill.price) - Number(fill.fee)
        : -(Number(fill.size) * Number(fill.price) + Number(fill.fee));
      
      if (existing) {
        existing.pnl += tradePnl;
        existing.tradeCount += 1;
        if (tradePnl > 0) existing.winCount += 1;
      } else {
        pnlMap.set(dateKey, {
          date: new Date(fill.executed_at),
          pnl: tradePnl,
          tradeCount: 1,
          winCount: tradePnl > 0 ? 1 : 0,
        });
      }
    });
    
    return pnlMap;
  }, [fills]);

  // Get days in current month with P&L data
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Performance stats
  const stats = useMemo(() => {
    const allPnL = Array.from(dailyPnL.values());
    const totalPnL = allPnL.reduce((sum, d) => sum + d.pnl, 0);
    const totalTrades = allPnL.reduce((sum, d) => sum + d.tradeCount, 0);
    const totalWins = allPnL.reduce((sum, d) => sum + d.winCount, 0);
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    const profitDays = allPnL.filter(d => d.pnl > 0).length;
    const lossDays = allPnL.filter(d => d.pnl < 0).length;
    const avgDailyPnL = allPnL.length > 0 ? totalPnL / allPnL.length : 0;
    const bestDay = allPnL.length > 0 ? Math.max(...allPnL.map(d => d.pnl)) : 0;
    const worstDay = allPnL.length > 0 ? Math.min(...allPnL.map(d => d.pnl)) : 0;

    return {
      totalPnL,
      totalTrades,
      winRate,
      profitDays,
      lossDays,
      avgDailyPnL,
      bestDay,
      worstDay,
    };
  }, [dailyPnL]);

  // Get selected day data
  const selectedDayData = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return dailyPnL.get(dateKey);
  }, [selectedDate, dailyPnL]);

  // Get trades for selected date
  const selectedDateFills = useMemo(() => {
    return fills.filter(fill => 
      isSameDay(new Date(fill.executed_at), selectedDate)
    );
  }, [fills, selectedDate]);

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Trade Journal
          </span>
          <Badge variant="outline" className="font-mono">
            {format(currentMonth, 'MMMM yyyy')}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Performance Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              Total P&L
            </div>
            <div className={cn(
              'text-lg font-mono font-bold',
              stats.totalPnL >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(0)}
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Percent className="h-3 w-3" />
              Win Rate
            </div>
            <div className={cn(
              'text-lg font-mono font-bold',
              stats.winRate >= 50 ? 'text-success' : 'text-warning'
            )}>
              {stats.winRate.toFixed(1)}%
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              Total Trades
            </div>
            <div className="text-lg font-mono font-bold">
              {stats.totalTrades}
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <BarChart3 className="h-3 w-3" />
              Avg Daily
            </div>
            <div className={cn(
              'text-lg font-mono font-bold',
              stats.avgDailyPnL >= 0 ? 'text-success' : 'text-destructive'
            )}>
              ${stats.avgDailyPnL.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Calendar P&L View */}
        <div className="rounded-lg bg-muted/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            >
              ←
            </Button>
            <span className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            >
              →
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for start of month offset */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {monthDays.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = dailyPnL.get(dateKey);
              const isSelected = isSameDay(day, selectedDate);
              
              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'aspect-square rounded-lg text-xs flex flex-col items-center justify-center transition-all',
                    isSelected && 'ring-2 ring-primary',
                    dayData ? (
                      dayData.pnl >= 0 
                        ? 'bg-success/20 hover:bg-success/30' 
                        : 'bg-destructive/20 hover:bg-destructive/30'
                    ) : 'hover:bg-muted/50'
                  )}
                >
                  <span className={cn(
                    'font-medium',
                    isSameDay(day, new Date()) && 'text-primary'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayData && (
                    <span className={cn(
                      'text-[10px] font-mono',
                      dayData.pnl >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {dayData.pnl >= 0 ? '+' : ''}{dayData.pnl > 1000 ? `${(dayData.pnl/1000).toFixed(0)}k` : dayData.pnl.toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            {selectedDayData && (
              <Badge className={cn(
                selectedDayData.pnl >= 0 
                  ? 'bg-success/20 text-success' 
                  : 'bg-destructive/20 text-destructive'
              )}>
                {selectedDayData.pnl >= 0 ? '+' : ''}${selectedDayData.pnl.toFixed(2)}
              </Badge>
            )}
          </div>

          {selectedDayData ? (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-muted/30 p-2 text-center">
                <p className="text-xs text-muted-foreground">Trades</p>
                <p className="font-mono font-semibold">{selectedDayData.tradeCount}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-2 text-center">
                <p className="text-xs text-muted-foreground">Wins</p>
                <p className="font-mono font-semibold text-success">{selectedDayData.winCount}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-2 text-center">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="font-mono font-semibold">
                  {((selectedDayData.winCount / selectedDayData.tradeCount) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No trades on this day</p>
          )}

          {/* Trades List */}
          {selectedDateFills.length > 0 && (
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {selectedDateFills.map((fill) => (
                  <div
                    key={fill.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                  >
                    <div className="flex items-center gap-2">
                      {fill.side === 'buy' ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-sm font-medium">{fill.instrument}</span>
                      <Badge variant="outline" className="text-xs">
                        {fill.side.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right text-sm">
                      <span className="font-mono">
                        {Number(fill.size).toFixed(4)} @ ${Number(fill.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Journal Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Trading Notes</label>
            <Textarea
              placeholder="Record your thoughts, observations, and lessons learned..."
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
