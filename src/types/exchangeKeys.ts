/**
 * Exchange Keys Types
 * 
 * Supplementary types for the user_exchange_keys table
 * until Supabase types are regenerated.
 */

export type ExchangeType = 
  | 'coinbase' 
  | 'kraken' 
  | 'binance' 
  | 'bybit' 
  | 'okx' 
  | 'mexc' 
  | 'hyperliquid';

export type PermissionType = 'read' | 'trade' | 'withdraw';

export interface UserExchangeKey {
  id: string;
  user_id: string;
  exchange: ExchangeType;
  label: string;
  api_key_encrypted: string;
  api_secret_encrypted: string;
  passphrase_encrypted: string | null;
  permissions: PermissionType[];
  is_active: boolean;
  is_validated: boolean;
  last_validated_at: string | null;
  validation_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExchangeKeyAuditLog {
  id: string;
  user_id: string;
  exchange: ExchangeType;
  action: 'created' | 'updated' | 'deleted' | 'validated' | 'validation_failed' | 'used';
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ExchangeInfo {
  id: ExchangeType;
  name: string;
  icon: string;
  recommended?: boolean;
  usCompliant: boolean;
  warning?: string;
}

export const SUPPORTED_EXCHANGES: ExchangeInfo[] = [
  { id: 'coinbase', name: 'Coinbase Advanced', icon: '🔵', recommended: true, usCompliant: true },
  { id: 'kraken', name: 'Kraken', icon: '🟣', usCompliant: true },
  { id: 'binance', name: 'Binance', icon: '🟡', usCompliant: false, warning: 'Not available in US' },
  { id: 'bybit', name: 'Bybit', icon: '🟠', usCompliant: false, warning: 'Not available in US' },
  { id: 'okx', name: 'OKX', icon: '⚫', usCompliant: false, warning: 'Not available in US' },
  { id: 'mexc', name: 'MEXC', icon: '🔷', usCompliant: false, warning: 'Not available in US' },
  { id: 'hyperliquid', name: 'Hyperliquid', icon: '💎', usCompliant: true },
];

