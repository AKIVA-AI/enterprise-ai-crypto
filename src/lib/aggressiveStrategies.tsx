/**
 * Aggressive Trading Strategies for High Returns (1-10% daily)
 * 
 * WARNING: These strategies carry extreme risk and can result in total loss.
 * Only use with capital you can afford to lose entirely.
 */

import { StrategyTemplate } from './strategyTemplates';
import { Flame, Zap, Target, TrendingUp, Activity } from 'lucide-react';

export interface AggressiveStrategyConfig {
  // Position sizing
  maxPositionPct: number; // % of capital per trade
  maxConcurrentPositions: number;
  compoundWins: boolean;
  
  // Leverage
  baseLeverage: number;
  maxLeverage: number;
  dynamicLeverage: boolean;
  
  // Entry
  entryConfirmations: number;
  scaleIn: boolean;
  scaleInLevels: number;
  
  // Exit
  stopLossPct: number;
  takeProfitPct: number;
  trailingEnabled: boolean;
  trailingActivationPct: number;
  trailingDistancePct: number;
  
  // Risk
  maxDailyLossPct: number;
  maxDrawdownPct: number;
  cooldownMinutes: number;
}

export const AGGRESSIVE_PRESETS: Record<string, AggressiveStrategyConfig> = {
  // Conservative aggressive - target 1-2% daily
  conservative: {
    maxPositionPct: 10,
    maxConcurrentPositions: 3,
    compoundWins: false,
    baseLeverage: 3,
    maxLeverage: 5,
    dynamicLeverage: false,
    entryConfirmations: 2,
    scaleIn: true,
    scaleInLevels: 3,
    stopLossPct: 1.5,
    takeProfitPct: 3,
    trailingEnabled: true,
    trailingActivationPct: 1.5,
    trailingDistancePct: 0.75,
    maxDailyLossPct: 3,
    maxDrawdownPct: 10,
    cooldownMinutes: 30,
  },
  
  // Moderate aggressive - target 2-5% daily
  moderate: {
    maxPositionPct: 20,
    maxConcurrentPositions: 2,
    compoundWins: true,
    baseLeverage: 5,
    maxLeverage: 10,
    dynamicLeverage: true,
    entryConfirmations: 1,
    scaleIn: true,
    scaleInLevels: 2,
    stopLossPct: 2,
    takeProfitPct: 5,
    trailingEnabled: true,
    trailingActivationPct: 2,
    trailingDistancePct: 1,
    maxDailyLossPct: 5,
    maxDrawdownPct: 15,
    cooldownMinutes: 15,
  },
  
  // Maximum aggressive - target 5-10% daily (EXTREME RISK)
  maximum: {
    maxPositionPct: 50,
    maxConcurrentPositions: 1,
    compoundWins: true,
    baseLeverage: 10,
    maxLeverage: 20,
    dynamicLeverage: true,
    entryConfirmations: 1,
    scaleIn: false,
    scaleInLevels: 1,
    stopLossPct: 3,
    takeProfitPct: 10,
    trailingEnabled: true,
    trailingActivationPct: 3,
    trailingDistancePct: 1.5,
    maxDailyLossPct: 10,
    maxDrawdownPct: 25,
    cooldownMinutes: 5,
  },
};

// High-frequency scalping opportunities
export const HIGH_RETURN_STRATEGIES: StrategyTemplate[] = [
  {
    id: 'momentum-scalp',
    name: 'Momentum Scalping',
    description: 'Ultra-short-term momentum trades on 1m/5m timeframes. Captures micro-moves with tight stops. Requires sub-second execution.',
    category: 'momentum',
    tier: 'professional',
    icon: <Zap className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '1m',
      riskTier: 5,
      maxLeverage: 10,
      maxDrawdown: 5,
      parameters: {
        rsi_period: 7,
        rsi_oversold: 25,
        rsi_overbought: 75,
        volume_spike_threshold: 3.0,
        min_move_pct: 0.1,
        take_profit_pct: 0.3,
        stop_loss_pct: 0.15,
        max_hold_minutes: 15,
        trades_per_hour_limit: 10,
        cool_down_seconds: 60,
      },
    },
    venueScope: ['binance', 'bybit'],
    assetClass: 'Crypto',
    difficulty: 'advanced',
    expectedReturn: '1-5% daily (high risk)',
    riskProfile: 'Very high frequency, many small gains/losses',
    capitalRequirement: '$5,000+',
  },
  {
    id: 'breakout-leverage',
    name: 'Leveraged Breakout',
    description: 'Trades confirmed breakouts with 5-10x leverage. Uses ATR-based stops. High risk/reward with strict position limits.',
    category: 'momentum',
    tier: 'professional',
    icon: <TrendingUp className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '15m',
      riskTier: 5,
      maxLeverage: 10,
      maxDrawdown: 10,
      parameters: {
        consolidation_periods: 12,
        breakout_threshold_atr: 1.5,
        volume_confirmation: 2.5,
        leverage_base: 5,
        leverage_on_confirmation: 10,
        stop_loss_atr: 1.0,
        take_profit_atr: 3.0,
        trail_activation_atr: 2.0,
        max_positions: 1,
      },
    },
    venueScope: ['binance', 'bybit', 'okx'],
    assetClass: 'Crypto Perpetuals',
    difficulty: 'advanced',
    expectedReturn: '2-10% daily (extreme risk)',
    riskProfile: 'Few trades, large moves, leverage amplified',
    capitalRequirement: '$10,000+',
  },
  {
    id: 'funding-capture',
    name: 'Aggressive Funding Capture',
    description: 'Holds positions through funding payments when rates are extreme. Leveraged to capture funding with hedged exposure.',
    category: 'arbitrage',
    tier: 'professional',
    icon: <Target className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '8h',
      riskTier: 3,
      maxLeverage: 10,
      maxDrawdown: 3,
      parameters: {
        min_funding_rate: 0.03, // 3% annualized
        extreme_funding_rate: 0.1, // 10% annualized
        base_position_pct: 20,
        extreme_position_pct: 40,
        hedge_ratio: 1.0,
        max_funding_periods: 3,
        exit_before_funding: false,
        leverage: 5,
      },
    },
    venueScope: ['binance', 'bybit', 'hyperliquid'],
    assetClass: 'Crypto Perpetuals',
    difficulty: 'intermediate',
    expectedReturn: '0.5-2% per funding period',
    riskProfile: 'Low risk per trade, leveraged returns',
    capitalRequirement: '$25,000+',
  },
  {
    id: 'volatility-expansion',
    name: 'Volatility Expansion Trade',
    description: 'Enters when volatility is low and expanding. Uses straddle-like positioning to profit from large moves in either direction.',
    category: 'volatility',
    tier: 'professional',
    icon: <Activity className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '4h',
      riskTier: 4,
      maxLeverage: 5,
      maxDrawdown: 8,
      parameters: {
        bb_squeeze_periods: 20,
        squeeze_threshold: 0.5,
        entry_on_expansion: true,
        straddle_distance_pct: 1,
        position_each_side: true,
        stop_loss_combined_pct: 2,
        take_profit_per_leg: 5,
        close_other_on_trigger: true,
      },
    },
    venueScope: ['binance', 'bybit', 'deribit'],
    assetClass: 'Crypto Derivatives',
    difficulty: 'advanced',
    expectedReturn: '3-8% on expansion events',
    riskProfile: 'Infrequent but large wins, controlled loss',
    capitalRequirement: '$15,000+',
  },
  {
    id: 'meme-momentum',
    name: 'Meme Coin Momentum',
    description: 'Rides momentum waves in high-volatility meme coins. Extremely high risk with potential for 10x+ returns but also 100% loss.',
    category: 'momentum',
    tier: 'retail',
    icon: <Flame className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '5m',
      riskTier: 5,
      maxLeverage: 1, // No leverage on memes
      maxDrawdown: 50,
      parameters: {
        min_viral_score: 80,
        min_volume_usd_24h: 1000000,
        entry_on_breakout: true,
        breakout_threshold_pct: 10,
        scale_in: true,
        scale_levels: [10, 20, 30],
        take_profit_levels: [25, 50, 100, 200],
        stop_loss_pct: 15,
        trailing_activation: 30,
        max_position_pct: 5,
      },
    },
    venueScope: ['raydium', 'jupiter', 'uniswap'],
    assetClass: 'Meme Coins',
    difficulty: 'advanced',
    expectedReturn: '10-100%+ potential (EXTREME RISK)',
    riskProfile: 'Gambling-tier risk, only play with loss capital',
    capitalRequirement: 'Only what you can lose',
  },
];

// Calculate expected return based on strategy parameters
export function calculateExpectedReturn(config: AggressiveStrategyConfig): {
  dailyReturnLow: number;
  dailyReturnHigh: number;
  winRateRequired: number;
  tradesPerDay: number;
  riskOfRuin: number;
} {
  const avgLeverage = (config.baseLeverage + config.maxLeverage) / 2;
  const riskReward = config.takeProfitPct / config.stopLossPct;
  const winRateRequired = 1 / (1 + riskReward);
  
  // Simplified expected return calculation
  const avgWin = config.takeProfitPct * avgLeverage * (config.maxPositionPct / 100);
  const avgLoss = config.stopLossPct * avgLeverage * (config.maxPositionPct / 100);
  
  // Assuming 50% win rate as baseline
  const winRate = 0.5;
  const expectedPerTrade = (winRate * avgWin) - ((1 - winRate) * avgLoss);
  
  const tradesPerDay = 1440 / (config.cooldownMinutes + 30); // Rough estimate
  
  return {
    dailyReturnLow: expectedPerTrade * Math.min(tradesPerDay, 5) * 0.5,
    dailyReturnHigh: expectedPerTrade * Math.min(tradesPerDay, 10),
    winRateRequired: winRateRequired * 100,
    tradesPerDay: Math.min(tradesPerDay, 20),
    riskOfRuin: config.maxLeverage > 10 ? 0.8 : config.maxLeverage > 5 ? 0.5 : 0.3,
  };
}

// Risk warnings for aggressive trading
export const AGGRESSIVE_TRADING_WARNINGS = [
  '⚠️ 1-10% daily returns require extreme leverage and risk',
  '💀 Risk of total capital loss is HIGH (30-80%+ probability)',
  '📉 Most traders lose money attempting these strategies',
  '🎰 Returns are NOT consistent - expect large variance',
  '⏱️ Requires constant monitoring and fast execution',
  '💸 Only trade with capital you can afford to lose 100%',
  '🧠 Emotional discipline is critical - no revenge trading',
  '📊 Backtest extensively before live deployment',
];
