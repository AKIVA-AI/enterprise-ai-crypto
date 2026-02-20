# Enterprise Crypto - Environment Variables Reference

## Table of Contents
1. [Frontend Variables](#frontend-variables)
2. [Backend Variables](#backend-variables)
3. [Database Variables](#database-variables)
4. [Trading Variables](#trading-variables)
5. [Feature Flags](#feature-flags)
6. [Security Variables](#security-variables)
7. [Monitoring Variables](#monitoring-variables)

## Frontend Variables

### Supabase Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL | `https://xxx.supabase.co` | - |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | - |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key (admin) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | - |

### API Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `VITE_API_URL` | Yes | Backend API base URL | `http://localhost:8000` | `http://localhost:8000` |
| `VITE_WS_URL` | Yes | WebSocket URL for real-time data | `ws://localhost:8000` | `ws://localhost:8000` |
| `VITE_API_TIMEOUT` | No | API request timeout in milliseconds | `10000` | `10000` |

### Application Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `VITE_APP_NAME` | No | Application name | `Enterprise Crypto` | `Enterprise Crypto` |
| `VITE_APP_VERSION` | No | Application version | `1.0.0` | `1.0.0` |
| `VITE_APP_DESCRIPTION` | No | Application description | `AI-powered crypto trading platform` | - |

## Backend Variables

### Server Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `PORT` | No | Backend server port | `8000` | `8000` |
| `HOST` | No | Backend server host | `0.0.0.0` | `0.0.0.0` |
| `NODE_ENV` | No | Environment mode | `production` | `development` |
| `CORS_ORIGIN` | No | CORS allowed origins | `http://localhost:5173` | `*` |

### Database Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `DATABASE_URL` | Yes | Database connection string | `postgresql://user:pass@localhost:5432/db` | - |
| `SUPABASE_URL` | Yes | Supabase project URL | `https://xxx.supabase.co` | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | - |

### Authentication

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `JWT_SECRET` | Yes | JWT signing secret | `your-super-secret-jwt-key` | - |
| `JWT_EXPIRES_IN` | No | JWT expiration time | `24h` | `24h` |
| `REFRESH_TOKEN_EXPIRES_IN` | No | Refresh token expiration | `7d` | `7d` |

## Database Variables

### Supabase Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `SUPABASE_PROJECT_ID` | Yes | Supabase project ID | `xxx` | - |
| `SUPABASE_DB_URL` | Yes | Direct database URL | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` | - |
| `SUPABASE_DB_PASSWORD` | Yes | Database password | `your-db-password` | - |

### Connection Pool

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `DB_POOL_MIN` | No | Minimum database connections | `2` | `2` |
| `DB_POOL_MAX` | No | Maximum database connections | `10` | `10` |
| `DB_POOL_IDLE_TIMEOUT` | No | Connection idle timeout | `30000` | `30000` |

## Trading Variables

### Exchange Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `BINANCE_API_KEY` | No | Binance API key | `your-binance-api-key` | - |
| `BINANCE_SECRET_KEY` | No | Binance secret key | `your-binance-secret-key` | - |
| `COINBASE_API_KEY` | No | Coinbase API key | `your-coinbase-api-key` | - |
| `COINBASE_SECRET_KEY` | No | Coinbase secret key | `your-coinbase-secret-key` | - |
| `KRAKEN_API_KEY` | No | Kraken API key | `your-kraken-api-key` | - |
| `KRAKEN_SECRET_KEY` | No | Kraken secret key | `your-kraken-secret-key` | - |

### Trading Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `TRADING_ENABLED` | No | Enable trading features | `true` | `false` |
| `TRADING_MODE` | No | Trading mode (paper/live) | `paper` | `paper` |
| `MAX_POSITION_SIZE` | No | Maximum position size in USD | `10000` | `10000` |
| `DEFAULT_SLIPPAGE_BPS` | No | Default slippage in basis points | `5` | `5` |
| `DEFAULT_COMMISSION_BPS` | No | Default commission in basis points | `10` | `10` |

### Risk Management

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `MAX_DAILY_LOSS` | No | Maximum daily loss in USD | `1000` | `1000` |
| `MAX_DRAWDOWN_PERCENT` | No | Maximum drawdown percentage | `20` | `20` |
| `STOP_LOSS_PERCENT` | No | Default stop loss percentage | `2` | `2` |
| `TAKE_PROFIT_PERCENT` | No | Default take profit percentage | `5` | `5` |

## Feature Flags

### Core Features

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `VITE_ENABLE_TRADING` | No | Enable trading interface | `true` | `true` |
| `VITE_ENABLE_BACKTEST` | No | Enable backtesting features | `true` | `true` |
| `VITE_ENABLE_AI_FEATURES` | No | Enable AI-powered features | `true` | `true` |
| `VITE_ENABLE_PORTFOLIO` | No | Enable portfolio management | `true` | `true` |
| `VITE_ENABLE_ANALYTICS` | No | Enable analytics dashboard | `true` | `true` |

### Advanced Features

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `VITE_ENABLE_ARBITRAGE` | No | Enable arbitrage trading | `false` | `false` |
| `VITE_ENABLE_DERIVATIVES` | No | Enable derivatives trading | `false` | `false` |
| `VITE_ENABLE_SOCIAL_TRADING` | No | Enable social trading features | `false` | `false` |
| `VITE_ENABLE_API_TRADING` | No | Enable API trading | `false` | `false` |

### Development Features

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `VITE_ENABLE_DEBUG_MODE` | No | Enable debug mode | `false` | `false` |
| `VITE_ENABLE_DEV_TOOLS` | No | Enable developer tools | `false` | `false` |
| `VITE_ENABLE_MOCK_DATA` | No | Enable mock data for testing | `false` | `false` |

## Security Variables

### API Security

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `API_RATE_LIMIT` | No | API rate limit per minute | `100` | `100` |
| `API_KEY_HEADER` | No | API key header name | `X-API-Key` | `X-API-Key` |
| `ENABLE_CORS` | No | Enable CORS | `true` | `true` |
| `CORS_CREDENTIALS` | No | Allow CORS credentials | `true` | `true` |

### Encryption

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `ENCRYPTION_KEY` | No | Data encryption key | `your-32-character-encryption-key` | - |
| `ENCRYPTION_ALGORITHM` | No | Encryption algorithm | `aes-256-gcm` | `aes-256-gcm` |
| `HASH_SALT_ROUNDS` | No | Password hash salt rounds | `12` | `12` |

### SSL/TLS

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `SSL_CERT_PATH` | No | SSL certificate path | `/path/to/cert.pem` | - |
| `SSL_KEY_PATH` | No | SSL private key path | `/path/to/key.pem` | - |
| `FORCE_HTTPS` | No | Force HTTPS redirects | `true` | `false` |

## Monitoring Variables

### Logging

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `LOG_LEVEL` | No | Logging level (debug/info/warn/error) | `info` | `info` |
| `LOG_FORMAT` | No | Log format (json/text) | `json` | `json` |
| `LOG_FILE_PATH` | No | Log file path | `/var/log/enterprise-crypto.log` | - |
| `ENABLE_CONSOLE_LOG` | No | Enable console logging | `true` | `true` |

### Analytics

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `GOOGLE_ANALYTICS_ID` | No | Google Analytics tracking ID | `GA-XXXXXXXXX` | - |
| `MIXPANEL_TOKEN` | No | Mixpanel project token | `your-mixpanel-token` | - |
| `SENTRY_DSN` | No | Sentry error tracking DSN | `https://xxx@sentry.io/xxx` | - |
| `ENABLE_ERROR_REPORTING` | No | Enable error reporting | `true` | `false` |

### Health Checks

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `HEALTH_CHECK_INTERVAL` | No | Health check interval in seconds | `30` | `30` |
| `HEALTH_CHECK_TIMEOUT` | No | Health check timeout in seconds | `5` | `5` |
| `ENABLE_METRICS` | No | Enable metrics collection | `true` | `false` |
| `METRICS_PORT` | No | Metrics server port | `9090` | `9090` |

## Environment Files

### Development (.env)
```bash
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key

# API
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Features
VITE_ENABLE_TRADING=true
VITE_ENABLE_BACKTEST=true
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_DEBUG_MODE=true

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

### Staging (.env.staging)
```bash
# Supabase
VITE_SUPABASE_URL=https://staging.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=staging-service-key

# API
VITE_API_URL=https://staging-api.enterprise-crypto.com
VITE_WS_URL=wss://staging-api.enterprise-crypto.com

# Features
VITE_ENABLE_TRADING=true
VITE_ENABLE_BACKTEST=true
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_DEBUG_MODE=false

# Security
API_RATE_LIMIT=50
ENABLE_CORS=true
```

### Production (.env.production)
```bash
# Supabase
VITE_SUPABASE_URL=https://production.supabase.co
VITE_SUPABASE_ANON_KEY=production-anon-key
SUPABASE_SERVICE_ROLE_KEY=production-service-key

# API
VITE_API_URL=https://api.enterprise-crypto.com
VITE_WS_URL=wss://api.enterprise-crypto.com

# Features
VITE_ENABLE_TRADING=true
VITE_ENABLE_BACKTEST=true
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_ANALYTICS=true

# Security
API_RATE_LIMIT=100
FORCE_HTTPS=true
ENABLE_ERROR_REPORTING=true

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
LOG_LEVEL=warn
```

## Variable Validation

### Required Variables Check
```bash
# Script to check required variables
#!/bin/bash

required_vars=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "VITE_API_URL"
  "JWT_SECRET"
)

missing_vars=()

for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    missing_vars+=("$var")
  fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
  echo "Missing required environment variables:"
  printf '  %s\n' "${missing_vars[@]}"
  exit 1
fi

echo "All required environment variables are set"
```

### Type Validation
```typescript
// Environment variable validation
interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_API_URL: string;
  VITE_ENABLE_TRADING: boolean;
  VITE_ENABLE_BACKTEST: boolean;
}

function validateEnv(): EnvConfig {
  const config: Partial<EnvConfig> = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_ENABLE_TRADING: import.meta.env.VITE_ENABLE_TRADING === 'true',
    VITE_ENABLE_BACKTEST: import.meta.env.VITE_ENABLE_BACKTEST === 'true',
  };

  // Validate required fields
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_URL'];
  for (const field of required) {
    if (!config[field as keyof EnvConfig]) {
      throw new Error(`Missing required environment variable: ${field}`);
    }
  }

  return config as EnvConfig;
}
```

## Security Best Practices

### 1. Never Commit Secrets
```bash
# Add to .gitignore
.env
.env.local
.env.*.local
*.key
*.pem
```

### 2. Use Environment-Specific Files
- `.env` for local development
- `.env.staging` for staging environment
- `.env.production` for production environment

### 3. Rotate Keys Regularly
- API keys every 90 days
- JWT secrets every 180 days
- Database credentials every 180 days

### 4. Use Key Management Services
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault

## Troubleshooting

### Common Issues

1. **Missing Variables**: Check if all required variables are set
2. **Invalid URLs**: Ensure URLs are properly formatted
3. **CORS Issues**: Verify CORS origins are correctly configured
4. **Database Connections**: Check database credentials and network access

### Debug Commands
```bash
# Check current environment
printenv | grep VITE_

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Test API connectivity
curl -I $VITE_API_URL/health

# Validate environment file
node -e "console.log(JSON.stringify(process.env, null, 2))"
```

Last updated: 2025-01-04
Version: 1.0.0
