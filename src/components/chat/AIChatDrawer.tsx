import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTradingCopilot } from '@/hooks/useTradingCopilot';
import { cn } from '@/lib/utils';
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  User,
  Lightbulb,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const QUICK_PROMPTS = [
  { label: 'Market Analysis', prompt: 'Give me a quick analysis of the current market conditions and any notable signals.' },
  { label: 'Trading Ideas', prompt: 'Based on current signals, what are the best trading opportunities right now?' },
  { label: 'Risk Assessment', prompt: 'What are the key risks I should be aware of in the current market?' },
  { label: 'BTC Outlook', prompt: 'What is the current outlook for Bitcoin based on the latest intelligence data?' },
  { label: 'Portfolio Review', prompt: 'Review my current positions and suggest any adjustments.' },
  { label: 'Strategy Status', prompt: 'Give me a status update on all active strategies and their performance.' },
];

interface AIChatDrawerProps {
  defaultInstrument?: string;
}

export function AIChatDrawer({ defaultInstrument = 'BTC-USDT' }: AIChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isTyping,
    sendMessage,
    isSending,
    clearMessages,
  } = useTradingCopilot();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || isSending) return;

    sendMessage({
      message: input.trim(),
      context: { instrument: defaultInstrument },
    });
    setInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage({
      message: prompt,
      context: { instrument: defaultInstrument },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, string> = {
      low: 'bg-success/20 text-success border-success/30',
      moderate: 'bg-warning/20 text-warning border-warning/30',
      high: 'bg-destructive/20 text-destructive border-destructive/30',
    };
    return variants[risk] || variants.moderate;
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 gap-0"
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:w-[440px] p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Trading Copilot
                <Badge variant="secondary" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              </SheetTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearMessages}
                disabled={messages.length === 0}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Messages Area */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                  <h3 className="font-semibold mb-2">Welcome to AI Trading Copilot</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    I can help you with market analysis, trading ideas, risk assessment, and strategy optimization.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-4 w-4" />
                    Quick prompts:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((item) => (
                      <Button
                        key={item.label}
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickPrompt(item.prompt)}
                        disabled={isSending}
                        className="text-xs justify-start h-auto py-2 px-3"
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg p-3 space-y-2',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                      {/* Insights badges for assistant messages */}
                      {msg.role === 'assistant' && msg.insights && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/30">
                          {msg.insights.suggested_actions.map((action) => (
                            <Badge
                              key={action}
                              variant="outline"
                              className={cn(
                                'text-xs',
                                action === 'BUY' && 'text-success border-success/30',
                                action === 'SELL' && 'text-destructive border-destructive/30',
                                action === 'HOLD' && 'text-muted-foreground'
                              )}
                            >
                              {action === 'BUY' && <TrendingUp className="h-3 w-3 mr-1" />}
                              {action === 'SELL' && <TrendingDown className="h-3 w-3 mr-1" />}
                              {action}
                            </Badge>
                          ))}
                          <Badge
                            variant="outline"
                            className={cn('text-xs', getRiskBadge(msg.insights.risk_level))}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {msg.insights.risk_level} risk
                          </Badge>
                          {msg.insights.mentioned_instruments.slice(0, 3).map((inst) => (
                            <Badge key={inst} variant="secondary" className="text-xs">
                              {inst}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <span className="text-xs opacity-60 block">
                        {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Ask about markets, strategies, or risk..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isSending}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim() || isSending}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI-powered insights based on your market data and signals
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}