import { useQuery } from '@tanstack/react-query';
import { useCoinbaseBalances } from '@/hooks/useCoinbaseTrading';
import { useKrakenBalances } from '@/hooks/useKrakenTrading';
import { useBinanceUSAccount } from '@/hooks/useBinanceUSTrading';
import { VENUES } from '@/lib/tradingModes';

export interface ExchangeBalance {
  exchange: string;
  exchangeName: string;
  asset: string;
  available: number;
  locked: number;
  total: number;
  usdValue: number;
  isSimulated: boolean;
}

export interface AggregatedPortfolio {
  totalUsdValue: number;
  exchanges: {
    exchange: string;
    name: string;
    totalUsd: number;
    isSimulated: boolean;
    balances: ExchangeBalance[];
  }[];
  assets: {
    asset: string;
    totalAmount: number;
    totalUsd: number;
    byExchange: { exchange: string; amount: number; usd: number }[];
  }[];
  isLoading: boolean;
  hasRealData: boolean;
}

// Approximate USD prices for common assets (fallback)
const ASSET_PRICES: Record<string, number> = {
  USD: 1,
  USDT: 1,
  USDC: 1,
  BTC: 95000,
  ETH: 3400,
  SOL: 190,
  XBT: 95000, // Kraken uses XBT for BTC
  XXBT: 95000,
  ZUSD: 1,
  XXRP: 2.2,
  XETH: 3400,
  XRP: 2.2,
  DOGE: 0.32,
  AVAX: 38,
  LINK: 23,
  ADA: 0.9,
  DOT: 7,
};

function getUsdValue(asset: string, amount: number): number {
  const normalizedAsset = asset.toUpperCase().replace(/^X+|Z+$/g, '');
  const price = ASSET_PRICES[normalizedAsset] || ASSET_PRICES[asset.toUpperCase()] || 0;
  return amount * price;
}

export function useUnifiedPortfolio(): AggregatedPortfolio {
  const { data: coinbaseData, isLoading: coinbaseLoading } = useCoinbaseBalances();
  const { data: krakenData, isLoading: krakenLoading } = useKrakenBalances();
  const { data: binanceData, isLoading: binanceLoading } = useBinanceUSAccount();

  const isLoading = coinbaseLoading || krakenLoading || binanceLoading;

  // Parse Coinbase balances
  const coinbaseBalances: ExchangeBalance[] = (coinbaseData?.balances || []).map((b: any) => ({
    exchange: 'coinbase',
    exchangeName: VENUES.coinbase?.name || 'Coinbase',
    asset: b.currency,
    available: parseFloat(b.available) || 0,
    locked: parseFloat(b.hold) || 0,
    total: parseFloat(b.total) || parseFloat(b.available) + parseFloat(b.hold) || 0,
    usdValue: getUsdValue(b.currency, parseFloat(b.total) || parseFloat(b.available) || 0),
    isSimulated: coinbaseData?.simulation || false,
  })).filter((b: ExchangeBalance) => b.total > 0);

  // Parse Kraken balances
  const krakenBalances: ExchangeBalance[] = Object.entries(krakenData?.balances || {}).map(([asset, amount]) => ({
    exchange: 'kraken',
    exchangeName: VENUES.kraken?.name || 'Kraken',
    asset: asset,
    available: parseFloat(amount as string) || 0,
    locked: 0,
    total: parseFloat(amount as string) || 0,
    usdValue: getUsdValue(asset, parseFloat(amount as string) || 0),
    isSimulated: krakenData?.simulation || false,
  })).filter((b: ExchangeBalance) => b.total > 0);

  // Parse Binance.US balances
  const binanceBalances: ExchangeBalance[] = (binanceData?.balances || []).map((b: any) => ({
    exchange: 'binance_us',
    exchangeName: VENUES.binance_us?.name || 'Binance.US',
    asset: b.asset,
    available: parseFloat(b.free) || 0,
    locked: parseFloat(b.locked) || 0,
    total: (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0),
    usdValue: getUsdValue(b.asset, (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0)),
    isSimulated: binanceData?.simulated || false,
  })).filter((b: ExchangeBalance) => b.total > 0);

  // Group by exchange
  const exchanges = [
    {
      exchange: 'coinbase',
      name: VENUES.coinbase?.name || 'Coinbase',
      totalUsd: coinbaseBalances.reduce((sum, b) => sum + b.usdValue, 0),
      isSimulated: coinbaseData?.simulation || false,
      balances: coinbaseBalances,
    },
    {
      exchange: 'kraken',
      name: VENUES.kraken?.name || 'Kraken',
      totalUsd: krakenBalances.reduce((sum, b) => sum + b.usdValue, 0),
      isSimulated: krakenData?.simulation || false,
      balances: krakenBalances,
    },
    {
      exchange: 'binance_us',
      name: VENUES.binance_us?.name || 'Binance.US',
      totalUsd: binanceBalances.reduce((sum, b) => sum + b.usdValue, 0),
      isSimulated: binanceData?.simulated || false,
      balances: binanceBalances,
    },
  ].filter(e => e.balances.length > 0);

  // Aggregate by asset
  const allBalances = [...coinbaseBalances, ...krakenBalances, ...binanceBalances];
  const assetMap = new Map<string, { totalAmount: number; totalUsd: number; byExchange: { exchange: string; amount: number; usd: number }[] }>();

  allBalances.forEach(b => {
    // Normalize asset name
    const normalizedAsset = b.asset.toUpperCase().replace(/^X+|Z+$/g, '');
    const key = normalizedAsset === 'XBT' ? 'BTC' : normalizedAsset;
    
    if (!assetMap.has(key)) {
      assetMap.set(key, { totalAmount: 0, totalUsd: 0, byExchange: [] });
    }
    const entry = assetMap.get(key)!;
    entry.totalAmount += b.total;
    entry.totalUsd += b.usdValue;
    entry.byExchange.push({ exchange: b.exchange, amount: b.total, usd: b.usdValue });
  });

  const assets = Array.from(assetMap.entries())
    .map(([asset, data]) => ({ asset, ...data }))
    .sort((a, b) => b.totalUsd - a.totalUsd);

  const totalUsdValue = exchanges.reduce((sum, e) => sum + e.totalUsd, 0);
  const hasRealData = exchanges.some(e => !e.isSimulated);

  return {
    totalUsdValue,
    exchanges,
    assets,
    isLoading,
    hasRealData,
  };
}
