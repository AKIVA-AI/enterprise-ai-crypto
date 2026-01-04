#!/usr/bin/env python3
"""
AKIVA AI Multi-Strategy Bot Launcher

Runs multiple FreqTrade bots simultaneously:
- Bot 1: WhaleFlowScalper on top 15 coins by volume
- Bot 2: HighWinRateScalper on top 12 coins by volume

Usage:
    python run_multi_strategy.py [--dry-run] [--live]
    python run_multi_strategy.py --bot whale     # Run only WhaleFlowScalper
    python run_multi_strategy.py --bot highwin   # Run only HighWinRateScalper
"""

import subprocess
import sys
import os
import signal
import time
import argparse
from pathlib import Path

# Bot configurations
BOTS = {
    "whale": {
        "name": "WhaleFlowScalper",
        "config": "user_data/config_coinbase.json",
        "strategy": "WhaleFlowScalper",
        "port": 8080,
    },
    "highwin": {
        "name": "HighWinRateScalper", 
        "config": "user_data/config_coinbase_highwin.json",
        "strategy": "HighWinRateScalper",
        "port": 8082,
    },
    "spot": {
        "name": "SpotTrader",
        "config": "user_data/config_coinbase_spot.json",
        "strategy": "WhaleFlowScalper",
        "port": 8081,
    },
}

processes = []

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\n🛑 Shutting down all bots...")
    for proc, name in processes:
        if proc.poll() is None:
            print(f"   Stopping {name}...")
            proc.terminate()
            proc.wait(timeout=10)
    print("✅ All bots stopped.")
    sys.exit(0)

def register_exchanges():
    """Register custom Coinbase exchanges"""
    try:
        from user_data.exchanges.coinbase_futures import CoinbaseFutures
        import freqtrade.exchange as ft_exchanges
        setattr(ft_exchanges, 'Coinbase', CoinbaseFutures)
        setattr(ft_exchanges, 'CoinbaseFutures', CoinbaseFutures)
        print("✅ Coinbase Futures exchange registered")
        return True
    except Exception as e:
        print(f"⚠️ Could not register custom exchange: {e}")
        return False

def run_bot(bot_key: str, dry_run: bool = True):
    """Launch a single bot"""
    bot = BOTS[bot_key]
    
    cmd = [
        sys.executable, "-m", "freqtrade", "trade",
        "--config", bot["config"],
        "--strategy", bot["strategy"],
    ]
    
    if dry_run:
        cmd.append("--dry-run")
    
    print(f"🚀 Starting {bot['name']} on port {bot['port']}...")
    print(f"   Config: {bot['config']}")
    print(f"   Strategy: {bot['strategy']}")
    
    proc = subprocess.Popen(cmd)
    processes.append((proc, bot['name']))
    return proc

def main():
    parser = argparse.ArgumentParser(description="AKIVA AI Multi-Strategy Bot Launcher")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Run in dry-run mode (default)")
    parser.add_argument("--live", action="store_true", help="Run in LIVE mode (caution!)")
    parser.add_argument("--bot", choices=list(BOTS.keys()), help="Run specific bot only")
    parser.add_argument("--list", action="store_true", help="List available bots")
    args = parser.parse_args()
    
    if args.list:
        print("\n📋 Available Bots:")
        for key, bot in BOTS.items():
            print(f"   {key:10} - {bot['name']} ({bot['strategy']}) on port {bot['port']}")
        return
    
    dry_run = not args.live
    
    print("=" * 60)
    print("🤖 AKIVA AI Multi-Strategy Trading System")
    print("=" * 60)
    print(f"Mode: {'DRY RUN (Paper Trading)' if dry_run else '⚠️ LIVE TRADING ⚠️'}")
    print()
    
    if args.live:
        print("⚠️  WARNING: LIVE TRADING MODE")
        print("    Real money will be used!")
        confirm = input("    Type 'YES' to confirm: ")
        if confirm != "YES":
            print("Aborted.")
            return
    
    # Register signal handler
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Register exchanges
    register_exchanges()
    
    # Start bots
    if args.bot:
        run_bot(args.bot, dry_run)
    else:
        # Run both futures strategies by default
        run_bot("whale", dry_run)
        time.sleep(2)  # Stagger startup
        run_bot("highwin", dry_run)
    
    print()
    print("✅ All bots started!")
    print("   Press Ctrl+C to stop all bots")
    print()
    
    # Wait for bots
    try:
        while True:
            for proc, name in processes:
                if proc.poll() is not None:
                    print(f"⚠️ {name} exited with code {proc.returncode}")
            time.sleep(5)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()

