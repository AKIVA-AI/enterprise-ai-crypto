// Mock data for the Crypto Ops Control Center

export type UserRole = 'admin' | 'trader' | 'researcher' | 'ops' | 'auditor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  lastActive: Date;
}

export interface Agent {
  id: string;
  name: string;
  type: 'market-data' | 'strategy' | 'execution' | 'risk' | 'treasury' | 'mining';
  status: 'online' | 'offline' | 'degraded';
  lastHeartbeat: Date;
  capabilities: string[];
  version: string;
  uptime: number;
  cpu: number;
  memory: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'momentum' | 'mean-reversion' | 'arbitrage' | 'market-making' | 'trend-following';
  status: 'draft' | 'backtesting' | 'paper' | 'live' | 'paused';
  author: string;
  createdAt: Date;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  pnl: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  leverage: number;
  venue: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop-limit';
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  size: number;
  price: number;
  filledSize: number;
  venue: string;
  createdAt: Date;
}

export interface RiskMetric {
  asset: string;
  venue: string;
  exposure: number;
  var95: number;
  var99: number;
  maxDrawdown: number;
  currentDrawdown: number;
}

export interface Wallet {
  id: string;
  name: string;
  address: string;
  network: string;
  type: 'hot' | 'cold' | 'multisig';
  balance: number;
  currency: string;
  pendingApprovals: number;
  signers: number;
  requiredSigners: number;
}

export interface LaunchTask {
  id: string;
  projectId: string;
  category: 'branding' | 'legal' | 'tokenomics' | 'liquidity' | 'marketing' | 'tech';
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: Date;
}

export interface LaunchProject {
  id: string;
  name: string;
  ticker: string;
  status: 'planning' | 'preparation' | 'ready' | 'launched';
  launchDate?: Date;
  completedTasks: number;
  totalTasks: number;
  progress: number;
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: 'auth' | 'trade' | 'config' | 'risk' | 'system' | 'launch';
  severity: 'info' | 'warning' | 'error' | 'critical';
  actor: string;
  action: string;
  details: string;
  ipAddress?: string;
}

// Seed data
export const currentUser: User = {
  id: '1',
  email: 'admin@cryptoops.io',
  name: 'Alex Chen',
  role: 'admin',
  lastActive: new Date(),
};

export const agents: Agent[] = [
  {
    id: 'agent-1',
    name: 'MarketData-Prime',
    type: 'market-data',
    status: 'online',
    lastHeartbeat: new Date(),
    capabilities: ['websocket-feeds', 'order-book-l2', 'trade-history', 'funding-rates'],
    version: '2.4.1',
    uptime: 99.98,
    cpu: 23,
    memory: 45,
  },
  {
    id: 'agent-2',
    name: 'AlphaEngine-V3',
    type: 'strategy',
    status: 'online',
    lastHeartbeat: new Date(Date.now() - 5000),
    capabilities: ['signal-generation', 'portfolio-optimization', 'risk-scoring'],
    version: '3.1.0',
    uptime: 99.95,
    cpu: 67,
    memory: 72,
  },
  {
    id: 'agent-3',
    name: 'ExecutionBot-Turbo',
    type: 'execution',
    status: 'online',
    lastHeartbeat: new Date(Date.now() - 2000),
    capabilities: ['smart-routing', 'twap', 'vwap', 'iceberg', 'pov'],
    version: '4.0.2',
    uptime: 99.99,
    cpu: 34,
    memory: 28,
  },
  {
    id: 'agent-4',
    name: 'RiskGuard-Pro',
    type: 'risk',
    status: 'online',
    lastHeartbeat: new Date(Date.now() - 1000),
    capabilities: ['real-time-var', 'exposure-monitoring', 'circuit-breakers', 'drawdown-limits'],
    version: '2.8.0',
    uptime: 100,
    cpu: 12,
    memory: 35,
  },
  {
    id: 'agent-5',
    name: 'TreasuryVault-Secure',
    type: 'treasury',
    status: 'online',
    lastHeartbeat: new Date(Date.now() - 8000),
    capabilities: ['balance-tracking', 'transfer-approval', 'multi-sig', 'cold-storage'],
    version: '1.5.3',
    uptime: 100,
    cpu: 8,
    memory: 15,
  },
  {
    id: 'agent-6',
    name: 'MiningOps-Monitor',
    type: 'mining',
    status: 'degraded',
    lastHeartbeat: new Date(Date.now() - 30000),
    capabilities: ['hashrate-monitoring', 'pool-management', 'profit-switching'],
    version: '1.2.0',
    uptime: 98.5,
    cpu: 5,
    memory: 12,
  },
];

export const strategies: Strategy[] = [
  {
    id: 'strat-1',
    name: 'BTC-ETH Momentum Alpha',
    description: 'Cross-asset momentum strategy exploiting BTC/ETH correlation breakdowns',
    type: 'momentum',
    status: 'live',
    author: 'Alex Chen',
    createdAt: new Date('2024-01-15'),
    sharpeRatio: 2.45,
    maxDrawdown: -8.2,
    winRate: 62.5,
    totalTrades: 1847,
    pnl: 425000,
  },
  {
    id: 'strat-2',
    name: 'Perp Funding Arb',
    description: 'Funding rate arbitrage across perpetual venues',
    type: 'arbitrage',
    status: 'live',
    author: 'Sarah Kim',
    createdAt: new Date('2024-02-20'),
    sharpeRatio: 3.12,
    maxDrawdown: -2.1,
    winRate: 78.3,
    totalTrades: 3421,
    pnl: 892000,
  },
  {
    id: 'strat-3',
    name: 'Altcoin Mean Reversion',
    description: 'Statistical arbitrage on mid-cap altcoins',
    type: 'mean-reversion',
    status: 'paper',
    author: 'Mike Ross',
    createdAt: new Date('2024-03-10'),
    sharpeRatio: 1.89,
    maxDrawdown: -12.5,
    winRate: 55.2,
    totalTrades: 523,
    pnl: 0,
  },
  {
    id: 'strat-4',
    name: 'DEX-CEX Spread Hunter',
    description: 'Cross-venue price discrepancy exploitation',
    type: 'arbitrage',
    status: 'backtesting',
    author: 'Lisa Wang',
    createdAt: new Date('2024-04-01'),
    sharpeRatio: 4.21,
    maxDrawdown: -1.8,
    winRate: 85.1,
    totalTrades: 156,
    pnl: 0,
  },
];

export const positions: Position[] = [
  {
    id: 'pos-1',
    symbol: 'BTC-PERP',
    side: 'long',
    size: 2.5,
    entryPrice: 67250,
    currentPrice: 68420,
    unrealizedPnl: 2925,
    unrealizedPnlPercent: 1.74,
    leverage: 3,
    venue: 'Binance',
  },
  {
    id: 'pos-2',
    symbol: 'ETH-PERP',
    side: 'long',
    size: 15,
    entryPrice: 3420,
    currentPrice: 3485,
    unrealizedPnl: 975,
    unrealizedPnlPercent: 1.90,
    leverage: 2,
    venue: 'OKX',
  },
  {
    id: 'pos-3',
    symbol: 'SOL-PERP',
    side: 'short',
    size: 100,
    entryPrice: 148.50,
    currentPrice: 145.20,
    unrealizedPnl: 330,
    unrealizedPnlPercent: 2.22,
    leverage: 5,
    venue: 'Bybit',
  },
  {
    id: 'pos-4',
    symbol: 'ARB-SPOT',
    side: 'long',
    size: 50000,
    entryPrice: 1.12,
    currentPrice: 1.08,
    unrealizedPnl: -2000,
    unrealizedPnlPercent: -3.57,
    leverage: 1,
    venue: 'Coinbase',
  },
];

export const orders: Order[] = [
  {
    id: 'ord-1',
    symbol: 'BTC-PERP',
    side: 'buy',
    type: 'limit',
    status: 'pending',
    size: 0.5,
    price: 66500,
    filledSize: 0,
    venue: 'Binance',
    createdAt: new Date(Date.now() - 300000),
  },
  {
    id: 'ord-2',
    symbol: 'ETH-PERP',
    side: 'sell',
    type: 'stop-limit',
    status: 'pending',
    size: 5,
    price: 3300,
    filledSize: 0,
    venue: 'OKX',
    createdAt: new Date(Date.now() - 600000),
  },
  {
    id: 'ord-3',
    symbol: 'SOL-SPOT',
    side: 'buy',
    type: 'market',
    status: 'filled',
    size: 25,
    price: 145.80,
    filledSize: 25,
    venue: 'Kraken',
    createdAt: new Date(Date.now() - 900000),
  },
];

export const riskMetrics: RiskMetric[] = [
  { asset: 'BTC', venue: 'Binance', exposure: 168550, var95: 8427, var99: 12641, maxDrawdown: 15, currentDrawdown: 2.3 },
  { asset: 'ETH', venue: 'OKX', exposure: 52275, var95: 3141, var99: 4711, maxDrawdown: 20, currentDrawdown: 4.1 },
  { asset: 'SOL', venue: 'Bybit', exposure: 14520, var95: 1452, var99: 2178, maxDrawdown: 25, currentDrawdown: 0 },
  { asset: 'ARB', venue: 'Coinbase', exposure: 54000, var95: 5400, var99: 8100, maxDrawdown: 30, currentDrawdown: 8.2 },
];

export const wallets: Wallet[] = [
  {
    id: 'wallet-1',
    name: 'Hot Wallet - Trading',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8d7b2',
    network: 'Ethereum',
    type: 'hot',
    balance: 1250000,
    currency: 'USDC',
    pendingApprovals: 0,
    signers: 1,
    requiredSigners: 1,
  },
  {
    id: 'wallet-2',
    name: 'Treasury Vault',
    address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    network: 'Ethereum',
    type: 'multisig',
    balance: 15800000,
    currency: 'USDC',
    pendingApprovals: 2,
    signers: 5,
    requiredSigners: 3,
  },
  {
    id: 'wallet-3',
    name: 'Cold Storage - BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    network: 'Bitcoin',
    type: 'cold',
    balance: 125.5,
    currency: 'BTC',
    pendingApprovals: 0,
    signers: 5,
    requiredSigners: 4,
  },
  {
    id: 'wallet-4',
    name: 'Operations - Solana',
    address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
    network: 'Solana',
    type: 'hot',
    balance: 8500,
    currency: 'SOL',
    pendingApprovals: 1,
    signers: 2,
    requiredSigners: 2,
  },
];

export const launchProjects: LaunchProject[] = [
  {
    id: 'launch-1',
    name: 'Nexus Protocol',
    ticker: 'NXS',
    status: 'preparation',
    launchDate: new Date('2025-02-15'),
    completedTasks: 18,
    totalTasks: 32,
    progress: 56,
  },
];

export const launchTasks: LaunchTask[] = [
  { id: 'task-1', projectId: 'launch-1', category: 'branding', title: 'Logo and visual identity', status: 'completed', priority: 'high' },
  { id: 'task-2', projectId: 'launch-1', category: 'branding', title: 'Website design', status: 'completed', priority: 'high' },
  { id: 'task-3', projectId: 'launch-1', category: 'legal', title: 'Legal opinion letter', status: 'in-progress', priority: 'critical' },
  { id: 'task-4', projectId: 'launch-1', category: 'legal', title: 'Terms of service', status: 'completed', priority: 'high' },
  { id: 'task-5', projectId: 'launch-1', category: 'tokenomics', title: 'Token distribution plan', status: 'completed', priority: 'critical' },
  { id: 'task-6', projectId: 'launch-1', category: 'tokenomics', title: 'Vesting schedules', status: 'completed', priority: 'high' },
  { id: 'task-7', projectId: 'launch-1', category: 'liquidity', title: 'DEX liquidity provision', status: 'in-progress', priority: 'critical' },
  { id: 'task-8', projectId: 'launch-1', category: 'liquidity', title: 'CEX listing applications', status: 'pending', priority: 'high' },
  { id: 'task-9', projectId: 'launch-1', category: 'marketing', title: 'Community building', status: 'in-progress', priority: 'medium' },
  { id: 'task-10', projectId: 'launch-1', category: 'tech', title: 'Smart contract audit', status: 'in-progress', priority: 'critical' },
];

export const auditEvents: AuditEvent[] = [
  {
    id: 'evt-1',
    timestamp: new Date(Date.now() - 60000),
    type: 'trade',
    severity: 'info',
    actor: 'ExecutionBot-Turbo',
    action: 'ORDER_FILLED',
    details: 'Market buy 25 SOL @ $145.80 on Kraken',
    ipAddress: '10.0.1.42',
  },
  {
    id: 'evt-2',
    timestamp: new Date(Date.now() - 120000),
    type: 'risk',
    severity: 'warning',
    actor: 'RiskGuard-Pro',
    action: 'EXPOSURE_ALERT',
    details: 'ARB exposure approaching 80% of limit',
  },
  {
    id: 'evt-3',
    timestamp: new Date(Date.now() - 300000),
    type: 'auth',
    severity: 'info',
    actor: 'Alex Chen',
    action: 'LOGIN',
    details: 'Admin login successful',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'evt-4',
    timestamp: new Date(Date.now() - 600000),
    type: 'config',
    severity: 'info',
    actor: 'Sarah Kim',
    action: 'STRATEGY_UPDATE',
    details: 'Updated risk parameters for Perp Funding Arb',
  },
  {
    id: 'evt-5',
    timestamp: new Date(Date.now() - 900000),
    type: 'system',
    severity: 'error',
    actor: 'MiningOps-Monitor',
    action: 'CONNECTION_LOST',
    details: 'Lost connection to mining pool stratum+tcp://pool.example.com:3333',
  },
  {
    id: 'evt-6',
    timestamp: new Date(Date.now() - 1200000),
    type: 'trade',
    severity: 'critical',
    actor: 'RiskGuard-Pro',
    action: 'CIRCUIT_BREAKER',
    details: 'Circuit breaker triggered: rapid price movement detected on BTC-PERP',
  },
];

// Dashboard metrics
export const dashboardMetrics = {
  totalAum: 28450000,
  dailyPnl: 125420,
  dailyPnlPercent: 0.44,
  openPositions: 4,
  activeStrategies: 2,
  agentsOnline: 5,
  agentsTotal: 6,
  pendingOrders: 2,
  riskUtilization: 68,
  alertsActive: 3,
};

// Helper to generate random price updates
export function generatePriceUpdate(basePrice: number, volatility: number = 0.001): number {
  const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
  return basePrice + change;
}
