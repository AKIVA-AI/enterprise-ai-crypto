import { ReactNode } from 'react';
import { useTradingMode } from '@/hooks/useTradingMode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, Globe, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

type TradingFeature = 'spot' | 'futures' | 'perpetuals' | 'margin' | 'staking' | 'options';

interface RestrictedFeatureGateProps {
  feature: TradingFeature;
  children: ReactNode;
  fallback?: ReactNode;
  showSwitchOption?: boolean;
}

const FEATURE_LABELS: Record<TradingFeature, string> = {
  spot: 'Spot Trading',
  futures: 'Futures Trading',
  perpetuals: 'Perpetual Swaps',
  margin: 'Margin Trading',
  staking: 'Staking',
  options: 'Options Trading',
};

const US_RESTRICTION_REASONS: Partial<Record<TradingFeature, string>> = {
  perpetuals: 'Perpetual swaps are not available to US persons due to CFTC regulations.',
  options: 'Crypto options are restricted for US retail traders.',
};

export function RestrictedFeatureGate({ 
  feature, 
  children, 
  fallback,
  showSwitchOption = false 
}: RestrictedFeatureGateProps) {
  const { canTrade, mode, toggleMode } = useTradingMode();

  const isAvailable = canTrade(feature);

  if (isAvailable) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const restrictionReason = mode === 'us' 
    ? US_RESTRICTION_REASONS[feature] || `${FEATURE_LABELS[feature]} is not available in US mode.`
    : `${FEATURE_LABELS[feature]} is not available in your current mode.`;

  return (
    <div className="relative">
      {/* Blurred children */}
      <div className="blur-sm opacity-30 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <Alert className="max-w-md border-muted">
          <Lock className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            {FEATURE_LABELS[feature]} Restricted
            {mode === 'us' && (
              <Flag className="h-3.5 w-3.5 text-blue-500" />
            )}
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="text-sm text-muted-foreground">{restrictionReason}</p>
            
            {showSwitchOption && mode === 'us' && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  If you are not a US person, you can switch to International mode:
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={toggleMode}
                >
                  <Globe className="h-3.5 w-3.5" />
                  Switch to International Mode
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

/**
 * Hook version for conditional rendering
 */
export function useFeatureAccess(feature: TradingFeature) {
  const { canTrade, mode, modeConfig } = useTradingMode();
  
  return {
    isAvailable: canTrade(feature),
    mode,
    reason: mode === 'us' 
      ? US_RESTRICTION_REASONS[feature] 
      : undefined,
    modeLabel: modeConfig.label,
  };
}
