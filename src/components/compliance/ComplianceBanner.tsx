import { useState } from 'react';
import { useTradingMode } from '@/hooks/useTradingMode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Globe, 
  Flag, 
  AlertTriangle, 
  X, 
  Info,
  Scale,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplianceBannerProps {
  dismissible?: boolean;
  compact?: boolean;
}

export function ComplianceBanner({ dismissible = true, compact = false }: ComplianceBannerProps) {
  const { mode, modeConfig, detectedRegion, isAutoDetected } = useTradingMode();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isUS = mode === 'us';

  if (compact) {
    return (
      <div className={cn(
        "flex items-center justify-between px-3 py-2 text-xs border-b",
        isUS 
          ? "bg-blue-500/5 border-blue-500/20" 
          : "bg-amber-500/5 border-amber-500/20"
      )}>
        <div className="flex items-center gap-2">
          {isUS ? (
            <>
              <Flag className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-blue-500 font-medium">US Compliant Mode</span>
              <Badge variant="outline" className="text-[10px] h-4 border-blue-500/30 text-blue-500">
                SEC/CFTC
              </Badge>
            </>
          ) : (
            <>
              <Globe className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-amber-500 font-medium">International Mode</span>
              <Badge variant="outline" className="text-[10px] h-4 border-amber-500/30 text-amber-500">
                Full Access
              </Badge>
            </>
          )}
        </div>
        {dismissible && (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setDismissed(true)}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert className={cn(
      "mb-4",
      isUS 
        ? "border-blue-500/30 bg-blue-500/5" 
        : "border-amber-500/30 bg-amber-500/5"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {isUS ? (
            <ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5" />
          ) : (
            <Globe className="h-5 w-5 text-amber-500 mt-0.5" />
          )}
          <div className="space-y-1">
            <AlertTitle className={cn(
              "flex items-center gap-2",
              isUS ? "text-blue-500" : "text-amber-500"
            )}>
              {modeConfig.label}
              {isAutoDetected && detectedRegion && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  Auto-detected: {detectedRegion.country}
                </Badge>
              )}
            </AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              {isUS ? (
                <>
                  Trading with US-compliant exchanges (Coinbase, Kraken, Binance.US). 
                  Perpetuals and options are restricted. All activities comply with SEC/CFTC regulations.
                </>
              ) : (
                <>
                  Full access to global exchanges including derivatives and perpetuals. 
                  <span className="text-amber-500 font-medium"> You are responsible for ensuring compliance with your local regulations.</span>
                </>
              )}
            </AlertDescription>
            <div className="flex items-center gap-3 mt-2 text-xs">
              {isUS ? (
                <>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Scale className="h-3 w-3" />
                    <span>SEC/CFTC Compliant</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>Form 1099 Reporting</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-amber-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Not available for US persons</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>KYC may be required</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {dismissible && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 shrink-0" 
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

export function ComplianceDisclaimer() {
  const { mode } = useTradingMode();
  
  return (
    <div className="text-[10px] text-muted-foreground/60 text-center py-2 border-t border-border/50">
      {mode === 'us' ? (
        <>
          Trading cryptocurrencies involves risk. This platform connects to US-regulated exchanges. 
          Consult a financial advisor before trading. Not investment advice.
        </>
      ) : (
        <>
          International trading includes unregulated venues. You are responsible for compliance with your local laws.
          This platform does not provide services to US persons for restricted products.
        </>
      )}
    </div>
  );
}
