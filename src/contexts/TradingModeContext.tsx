import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TradingMode, 
  TradingModeConfig, 
  TRADING_MODES, 
  VenueConfig,
  ArbitrageStrategy,
  getVenuesForMode,
  getIntegratedVenuesForMode,
  getArbitrageStrategiesForMode,
} from '@/lib/tradingModes';
import { validateTradeCompliance, ComplianceCheckResult } from '@/lib/complianceEnforcement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TradingModeContextValue {
  // Current mode
  mode: TradingMode;
  modeConfig: TradingModeConfig;
  
  // Detection - now server-assisted
  detectedRegion: { country: string; isUS: boolean } | null;
  isAutoDetected: boolean;
  
  // Mode management
  setMode: (mode: TradingMode) => void;
  toggleMode: () => void;
  resetToAutoDetect: () => void;
  
  // Venue helpers
  availableVenues: VenueConfig[];
  integratedVenues: VenueConfig[];
  defaultVenue: string;
  
  // Feature checks
  canTrade: (feature: 'spot' | 'futures' | 'perpetuals' | 'margin' | 'staking' | 'options') => boolean;
  availableArbitrageStrategies: ArbitrageStrategy[];
  
  // Compliance validation (for UI hints - server enforces)
  validateCompliance: (params: {
    venue: string;
    instrument: string;
    leverage?: number;
    isPerp?: boolean;
    isMargin?: boolean;
  }) => ComplianceCheckResult;
  
  // Loading state
  isLoading: boolean;
}

const TradingModeContext = createContext<TradingModeContextValue | null>(null);

const MODE_STORAGE_KEY = 'trading_mode_preference';
const AUTO_DETECT_KEY = 'trading_mode_auto_detect';

/**
 * Detect user region server-side via Edge Function
 * Falls back to 'international' mode if detection fails
 * 
 * NOTE: This is for UX convenience only. 
 * Server-side enforcement happens at trade execution time.
 */
async function detectRegionServerSide(): Promise<{ country: string; isUS: boolean }> {
  try {
    // Try server-side detection via Edge Function
    const { data, error } = await supabase.functions.invoke('trading-api', {
      body: { action: 'detect_region' },
    });
    
    if (!error && data?.country) {
      return {
        country: data.country,
        isUS: data.isUS ?? false,
      };
    }
    
    // Fallback: default to international (less restrictive, server enforces if needed)
    console.log('Region detection unavailable, defaulting to international mode');
    return { country: 'Unknown', isUS: false };
  } catch (error) {
    console.warn('Region detection failed:', error);
    // Default to international - server will enforce restrictions if needed
    return { country: 'Unknown', isUS: false };
  }
}

export function TradingModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mode, setModeState] = useState<TradingMode>('international');
  const [detectedRegion, setDetectedRegion] = useState<{ country: string; isUS: boolean } | null>(null);
  const [isAutoDetected, setIsAutoDetected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preference or detect region
  useEffect(() => {
    async function initializeMode() {
      setIsLoading(true);
      
      try {
        // Check for saved preference
        const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as TradingMode | null;
        const savedAutoDetect = localStorage.getItem(AUTO_DETECT_KEY);
        
        if (savedMode && savedAutoDetect === 'false') {
          setModeState(savedMode);
          setIsAutoDetected(false);
        } else {
          // Auto-detect region via server
          const region = await detectRegionServerSide();
          setDetectedRegion(region);
          setModeState(region.isUS ? 'us' : 'international');
          setIsAutoDetected(true);
        }
      } catch (error) {
        console.error('Failed to initialize trading mode:', error);
        // Default to international mode - server enforces restrictions
        setModeState('international');
      } finally {
        setIsLoading(false);
      }
    }
    
    initializeMode();
  }, [user?.id]);

  const setMode = useCallback((newMode: TradingMode) => {
    setModeState(newMode);
    setIsAutoDetected(false);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
    localStorage.setItem(AUTO_DETECT_KEY, 'false');
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'us' ? 'international' : 'us';
    setMode(newMode);
  }, [mode, setMode]);

  const resetToAutoDetect = useCallback(async () => {
    localStorage.removeItem(MODE_STORAGE_KEY);
    localStorage.setItem(AUTO_DETECT_KEY, 'true');
    
    const region = await detectRegionServerSide();
    setDetectedRegion(region);
    setModeState(region.isUS ? 'us' : 'international');
    setIsAutoDetected(true);
  }, []);

  const modeConfig = TRADING_MODES[mode];
  const availableVenues = getVenuesForMode(mode);
  const integratedVenues = getIntegratedVenuesForMode(mode);
  const availableArbitrageStrategies = getArbitrageStrategiesForMode(mode);
  const defaultVenue = mode === 'us' ? 'coinbase' : 'binance';

  const canTrade = useCallback((feature: 'spot' | 'futures' | 'perpetuals' | 'margin' | 'staking' | 'options') => {
    return modeConfig.features[feature];
  }, [modeConfig]);

  // Compliance validation for UI hints
  const validateCompliance = useCallback((params: {
    venue: string;
    instrument: string;
    leverage?: number;
    isPerp?: boolean;
    isMargin?: boolean;
  }): ComplianceCheckResult => {
    return validateTradeCompliance({
      mode,
      ...params,
    });
  }, [mode]);

  const value = useMemo<TradingModeContextValue>(
    () => ({
      mode,
      modeConfig,
      detectedRegion,
      isAutoDetected,
      setMode,
      toggleMode,
      resetToAutoDetect,
      availableVenues,
      integratedVenues,
      defaultVenue,
      canTrade,
      availableArbitrageStrategies,
      validateCompliance,
      isLoading,
    }),
    [
      mode, modeConfig, detectedRegion, isAutoDetected,
      setMode, toggleMode, resetToAutoDetect,
      availableVenues, integratedVenues, defaultVenue,
      canTrade, availableArbitrageStrategies, validateCompliance,
      isLoading,
    ],
  );

  return (
    <TradingModeContext.Provider value={value}>
      {children}
    </TradingModeContext.Provider>
  );
}

export function useTradingMode() {
  const context = useContext(TradingModeContext);
  if (!context) {
    throw new Error('useTradingMode must be used within a TradingModeProvider');
  }
  return context;
}
