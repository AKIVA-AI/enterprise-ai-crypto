import { TrendingUp, Activity, Repeat, Coins, Flame, BarChart3 } from 'lucide-react';

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'trend' | 'mean-reversion' | 'arbitrage' | 'momentum' | 'volatility';
  icon: React.ReactNode;
  defaultConfig: {
    timeframe: string;
    riskTier: number;
    maxLeverage: number;
    maxDrawdown: number;
    parameters: Record<string, number | string | boolean | number[]>;
  };
  venueScope: string[];
  assetClass: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expectedReturn: string;
  riskProfile: string;
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'trend-following-ma',
    name: 'Trend Following (MA Crossover)',
    description: 'Classic moving average crossover strategy. Enters long when fast MA crosses above slow MA, and vice versa for shorts. Works best in trending markets.',
    category: 'trend',
    icon: <TrendingUp className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '4h',
      riskTier: 2,
      maxLeverage: 3,
      maxDrawdown: 10,
      parameters: {
        fast_period: 12,
        slow_period: 26,
        signal_period: 9,
        use_ema: true,
        min_adx: 25,
        trailing_stop_pct: 2.5,
      },
    },
    venueScope: ['binance', 'coinbase'],
    assetClass: 'Crypto',
    difficulty: 'beginner',
    expectedReturn: '15-30% annually',
    riskProfile: 'Medium drawdowns, steady gains in trends',
  },
  {
    id: 'mean-reversion-rsi',
    name: 'Mean Reversion (RSI Oversold/Overbought)',
    description: 'Buys when RSI indicates oversold conditions and sells when overbought. Includes Bollinger Band confirmation for higher probability entries.',
    category: 'mean-reversion',
    icon: <Repeat className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '1h',
      riskTier: 2,
      maxLeverage: 2,
      maxDrawdown: 8,
      parameters: {
        rsi_period: 14,
        rsi_oversold: 30,
        rsi_overbought: 70,
        bb_period: 20,
        bb_std: 2,
        min_volume_ratio: 1.5,
        take_profit_pct: 3,
      },
    },
    venueScope: ['binance', 'mexc'],
    assetClass: 'Crypto',
    difficulty: 'intermediate',
    expectedReturn: '20-40% annually',
    riskProfile: 'Quick trades, higher win rate',
  },
  {
    id: 'funding-arbitrage',
    name: 'Funding Rate Arbitrage',
    description: 'Captures funding rate differentials between perpetual futures across exchanges. Market-neutral strategy with hedged positions.',
    category: 'arbitrage',
    icon: <Coins className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '8h',
      riskTier: 1,
      maxLeverage: 5,
      maxDrawdown: 3,
      parameters: {
        min_funding_spread: 0.01,
        max_position_time_hours: 8,
        hedge_ratio: 1.0,
        min_apr_threshold: 15,
        rebalance_threshold_pct: 5,
        max_slippage_bps: 10,
      },
    },
    venueScope: ['binance', 'bybit', 'okx'],
    assetClass: 'Crypto Derivatives',
    difficulty: 'advanced',
    expectedReturn: '10-25% annually',
    riskProfile: 'Low risk, consistent returns',
  },
  {
    id: 'breakout-momentum',
    name: 'Breakout Momentum',
    description: 'Enters on confirmed breakouts from consolidation patterns with volume confirmation. Uses ATR-based stops and targets.',
    category: 'momentum',
    icon: <Activity className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '1h',
      riskTier: 3,
      maxLeverage: 4,
      maxDrawdown: 15,
      parameters: {
        lookback_period: 20,
        breakout_threshold_pct: 2,
        volume_confirmation_ratio: 2.0,
        atr_period: 14,
        stop_atr_multiplier: 1.5,
        target_atr_multiplier: 3.0,
        max_holding_hours: 48,
      },
    },
    venueScope: ['binance', 'coinbase', 'kraken'],
    assetClass: 'Crypto',
    difficulty: 'intermediate',
    expectedReturn: '30-60% annually',
    riskProfile: 'Higher volatility, explosive gains',
  },
  {
    id: 'meme-sniper',
    name: 'Meme Coin Sniper',
    description: 'Detects early momentum in meme coins using social signals and on-chain metrics. High risk, high reward with strict position sizing.',
    category: 'momentum',
    icon: <Flame className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '5m',
      riskTier: 5,
      maxLeverage: 1,
      maxDrawdown: 25,
      parameters: {
        min_viral_score: 70,
        min_social_velocity: 50,
        max_holder_concentration: 40,
        entry_size_pct: 1,
        scale_in_levels: 3,
        take_profit_levels: [50, 100, 200],
        trailing_stop_activation: 30,
        max_position_time_hours: 24,
      },
    },
    venueScope: ['raydium', 'jupiter'],
    assetClass: 'Meme Coins',
    difficulty: 'advanced',
    expectedReturn: '100%+ potential (high risk)',
    riskProfile: 'Extreme volatility, frequent losses',
  },
  {
    id: 'volatility-breakout',
    name: 'Volatility Expansion',
    description: 'Trades volatility contractions followed by expansions using Bollinger Band squeeze detection. Captures large directional moves.',
    category: 'volatility',
    icon: <BarChart3 className="h-5 w-5" />,
    defaultConfig: {
      timeframe: '4h',
      riskTier: 3,
      maxLeverage: 3,
      maxDrawdown: 12,
      parameters: {
        bb_period: 20,
        bb_std: 2,
        keltner_period: 20,
        keltner_atr_mult: 1.5,
        squeeze_lookback: 6,
        momentum_period: 12,
        min_squeeze_bars: 4,
        breakout_confirmation_bars: 2,
      },
    },
    venueScope: ['binance', 'bybit'],
    assetClass: 'Crypto',
    difficulty: 'intermediate',
    expectedReturn: '25-50% annually',
    riskProfile: 'Infrequent trades, large winners',
  },
];

export const getCategoryColor = (category: StrategyTemplate['category']) => {
  switch (category) {
    case 'trend': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'mean-reversion': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'arbitrage': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'momentum': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'volatility': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export const getDifficultyColor = (difficulty: StrategyTemplate['difficulty']) => {
  switch (difficulty) {
    case 'beginner': return 'text-success';
    case 'intermediate': return 'text-yellow-500';
    case 'advanced': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
};
