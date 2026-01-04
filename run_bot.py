#!/usr/bin/env python3
"""
AKIVA AI - Freqtrade Bot Launcher

This launcher registers custom exchanges (including Coinbase Futures)
before starting Freqtrade.

Usage:
    python run_bot.py trade --config user_data/config_coinbase.json --strategy WhaleFlowScalper
    python run_bot.py trade --config user_data/config_coinbase.json --strategy WhaleFlowScalper --dry-run
    
Or for backtesting:
    python run_bot.py backtesting --config user_data/config_coinbase.json --strategy WhaleFlowScalper
"""

import sys
import os
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('AKIVA-AI')

def setup_custom_exchanges():
    """Register custom exchange implementations before Freqtrade starts."""
    
    # Add user_data to path for imports
    user_data_path = os.path.join(os.path.dirname(__file__), 'user_data')
    if user_data_path not in sys.path:
        sys.path.insert(0, user_data_path)
    
    # Also add the project root
    project_root = os.path.dirname(__file__)
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    
    try:
        # Import and register custom exchanges
        from user_data.exchanges.coinbase_futures import CoinbaseFutures
        import freqtrade.exchange as ft_exchanges
        
        # Register CoinbaseFutures with Freqtrade
        setattr(ft_exchanges, 'Coinbase', CoinbaseFutures)
        setattr(ft_exchanges, 'Coinbasefutures', CoinbaseFutures)
        setattr(ft_exchanges, 'CoinbaseFutures', CoinbaseFutures)
        
        logger.info("✅ AKIVA AI: Coinbase Futures support enabled!")
        logger.info("   - Perpetual futures trading: ENABLED")
        logger.info("   - Cross margin mode: ENABLED")
        logger.info("   - Max leverage: 10x")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to register custom exchanges: {e}")
        logger.error("   Falling back to default Freqtrade exchanges")
        return False


def main():
    """Main entry point - setup custom exchanges then run Freqtrade."""

    print("""
    ===========================================================
                       AKIVA AI Trading Bot
               Coinbase Advanced Futures Enabled
    ===========================================================
    """)
    
    # Setup custom exchanges
    setup_custom_exchanges()
    
    # Now run Freqtrade with the remaining arguments
    from freqtrade.main import main as ft_main
    sys.exit(ft_main(sys.argv[1:]))


if __name__ == '__main__':
    main()

