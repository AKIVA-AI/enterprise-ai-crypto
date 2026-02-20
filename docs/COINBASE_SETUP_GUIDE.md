# Coinbase Advanced API Setup Guide

## Overview

Enterprise Crypto is now configured to use **Coinbase Advanced** as the primary trading venue. This is the recommended option for US-based traders because:

- ✅ **US Compliant** - Fully regulated US exchange
- ✅ **Perpetual Futures** - Up to 10x leverage (launched July 2025)
- ✅ **No VPN Required** - Direct access from US
- ✅ **CCXT Supported** - Full API integration

## Configuration Files

| File | Mode | Use Case |
|------|------|----------|
| `config_coinbase.json` | Futures (10x) | Primary trading with leverage |
| `config_coinbase_spot.json` | Spot | Fallback if futures has issues |

## Getting Coinbase Advanced API Keys

### Step 1: Access Coinbase Advanced

1. Go to [Coinbase Advanced](https://advanced.coinbase.com)
2. Sign in with your Coinbase account
3. Complete any required KYC/verification

### Step 2: Create API Keys

1. Click your profile icon → **Settings**
2. Go to **API** section
3. Click **+ New API Key**
4. Configure permissions:
   - ✅ **View** - Required for reading balances
   - ✅ **Trade** - Required for placing orders
   - ✅ **Perpetual Futures** - Required for leverage trading
5. Set IP whitelist (recommended for security)
6. Click **Create & Download**

### Step 3: Store Keys Securely

Your API key will look like:
```
API Key: organizations/{org_id}/apiKeys/{key_id}
Secret: -----BEGIN EC PRIVATE KEY-----...
```

**⚠️ IMPORTANT**: 
- Never share your API secret
- Store in environment variables or encrypted config
- The secret is only shown ONCE during creation

## Adding Keys to Config

Edit `user_data/config_coinbase.json`:

```json
"exchange": {
    "name": "coinbase",
    "key": "YOUR_API_KEY_HERE",
    "secret": "YOUR_API_SECRET_HERE",
    ...
}
```

Or use environment variables (recommended):
```bash
export FREQTRADE__EXCHANGE__KEY="your_api_key"
export FREQTRADE__EXCHANGE__SECRET="your_api_secret"
```

## Trading Pairs Available

Coinbase Perpetual Futures pairs:
- `BTC/USD:USD` - Bitcoin perpetual
- `ETH/USD:USD` - Ethereum perpetual
- `SOL/USD:USD` - Solana perpetual
- `XRP/USD:USD` - XRP perpetual

## Leverage Settings

Coinbase allows up to **10x leverage**. Configure in strategy:
```python
leverage = 5.0  # Conservative setting
```

## Fees

| Type | Fee Rate |
|------|----------|
| Maker | 0.4% |
| Taker | 0.6% |
| Advanced 1 (0-$1K) | 0.8% taker / 0.6% maker |

## Testing Connection

Run dry run to test:
```bash
freqtrade trade --config user_data/config_coinbase.json --strategy WhaleFlowScalper --dry-run
```

## Troubleshooting

### "Exchange not supported"
Freqtrade uses CCXT which fully supports Coinbase. Ensure you have latest versions:
```bash
pip install --upgrade ccxt freqtrade
```

### "Authentication failed"
- Check API key format (should include `organizations/...`)
- Verify permissions include Trade + Perpetual Futures
- Check IP whitelist if configured

### "Symbol not found"
For perpetuals, use format: `BTC/USD:USD` (not `BTC/USDT:USDT`)

## Next Steps

1. Get your Coinbase Advanced API keys
2. Add them to `config_coinbase.json`
3. Test with `dry_run: true` first
4. Start live trading once verified

---
*Last updated: 2026-01-03*

