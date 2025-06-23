#!/usr/bin/env python3
"""
Simple Volume Bot for DEX Testing
Creates trading volume by randomly buying/selling tokens and occasionally creating new ones.
"""

import json
import os
import random
import time
import argparse
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

class SimpleVolumeBot:
    def __init__(self, min_trade=None, max_trade=None, min_interval=None, max_interval=None, create_chance=None, private_key_arg=None):
        # Load config
        self.private_key = private_key_arg or os.getenv('BOT_PRIVATE_KEY')
        self.factory_address = os.getenv('NEXT_PUBLIC_TESTNET_FACTORY_ADDRESS')
        
        if not self.private_key:
            raise ValueError("BOT_PRIVATE_KEY not found in .env or not provided via --private-key argument")
        if not self.factory_address:
            raise ValueError("NEXT_PUBLIC_TESTNET_FACTORY_ADDRESS not found in .env")
        
        # Setup Web3
        self.rpc_url = "https://avax-fuji.g.alchemy.com/v2/7NBTdVMFlqXaf5D-r-0kb73aehWeZ1Aj"
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        if not self.private_key.startswith('0x'):
            self.private_key = f"0x{self.private_key}"
        
        self.account = Account.from_key(self.private_key)
        
        # Contract ABIs
        self.factory_abi = [
            {
                "inputs": [
                    {"internalType": "string", "name": "name", "type": "string"},
                    {"internalType": "string", "name": "symbol", "type": "string"},
                    {"internalType": "string", "name": "imageUrl", "type": "string"},
                    {"internalType": "address", "name": "burnManager", "type": "address"}
                ],
                "name": "createToken",
                "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
                "name": "buy",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "token", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "sell",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getAllTokens",
                "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "tokenAddress", "type": "address"}],
                "name": "lastPrice",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "tokenAddress", "type": "address"}],
                "name": "getTokenState",
                "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        self.token_abi = [
            {
                "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "name",
                "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "symbol",
                "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        # Initialize contract
        self.factory_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(self.factory_address),
            abi=self.factory_abi
        )
        
        # Trading parameters (can be overridden)
        self.min_trade_amount = min_trade or 0.001  # 0.001 AVAX
        self.max_trade_amount = max_trade or 0.01   # 0.01 AVAX
        self.min_interval = min_interval or 10      # 10 seconds between trades
        self.max_interval = max_interval or 60      # 60 seconds between trades
        
        # Token creation parameters
        self.create_token_chance = create_chance or 0.05  # 5% chance to create new token each cycle
        
        # Track balances
        self.starting_balance = self.get_avax_balance()
        
        # Display account info BEFORE refreshing token list
        print(f"🤖 Simple Volume Bot initialized")
        print(f"📍 Account: {self.account.address}")
        print(f"🏭 Factory: {self.factory_address}")
        print(f"💰 Starting Balance: {self.starting_balance:.6f} AVAX")
        print(f"⚙️  Settings:")
        print(f"   💸 Trade size: {self.min_trade_amount:.4f} - {self.max_trade_amount:.4f} AVAX")
        print(f"   ⏰ Interval: {self.min_interval}s - {self.max_interval}s")
        print(f"   🎲 Token creation chance: {self.create_token_chance*100:.1f}%")

        # Load tokens from factory contract
        self.refresh_token_list()
        
        print(f"🪙 Found {len(self.tokens)} tokens")

    def refresh_token_list(self):
        """Get list of all tokens from the factory contract"""
        try:
            print("🔄 Fetching tokens from factory contract...")
            token_addresses = self.factory_contract.functions.getAllTokens().call()
            
            self.tokens = []
            for address in token_addresses:
                try:
                    # Get token info
                    token_contract = self.w3.eth.contract(
                        address=self.w3.to_checksum_address(address),
                        abi=self.token_abi
                    )
                    
                    name = token_contract.functions.name().call()
                    symbol = token_contract.functions.symbol().call()
                    
                    # Get token state (1 = TRADING, 2 = GOAL_REACHED, etc.)
                    state = self.factory_contract.functions.getTokenState(address).call()
                    
                    # Only include trading tokens
                    if state in [1, 4]:  # TRADING or RESUMED
                        token_info = {
                            "address": address,
                            "name": name,
                            "symbol": symbol,
                            "state": state
                        }
                        self.tokens.append(token_info)
                        print(f"  ✅ {name} ({symbol}) - {address}")
                    else:
                        print(f"  ⏭️  Skipping {address} (state: {state})")
                        
                except Exception as e:
                    print(f"  ❌ Error reading token {address}: {e}")
            
            print(f"📊 Loaded {len(self.tokens)} tradeable tokens")
            
        except Exception as e:
            print(f"❌ Error fetching tokens from factory: {e}")
            self.tokens = []

    def get_token_price(self, token_address):
        """Get current token price from factory"""
        try:
            price_wei = self.factory_contract.functions.lastPrice(
                self.w3.to_checksum_address(token_address)
            ).call()
            return float(self.w3.from_wei(price_wei, 'ether'))
        except Exception as e:
            print(f"❌ Error getting price for {token_address}: {e}")
            return 0.0

    def get_avax_balance(self):
        """Get AVAX balance"""
        balance_wei = self.w3.eth.get_balance(self.account.address)
        return float(self.w3.from_wei(balance_wei, 'ether'))

    def get_token_balance(self, token_address):
        """Get token balance"""
        try:
            token_contract = self.w3.eth.contract(
                address=self.w3.to_checksum_address(token_address),
                abi=self.token_abi
            )
            return token_contract.functions.balanceOf(self.account.address).call()
        except Exception as e:
            print(f"❌ Error getting token balance for {token_address}: {e}")
            return 0

    def create_random_token(self):
        """Create a new random token with clever names and real images"""
        try:
            # Themed token collections with clever names
            token_themes = {
                "space": {
                    "names": ["StarForge", "CosmoVault", "NebulaRise", "GalaxyShift", "OrbitCoin", 
                             "AstroLaunch", "SolarFlare", "MeteorStrike", "VoidWalker", "SpaceForce"],
                    "symbols": ["STAR", "COSMO", "NOVA", "ORBIT", "SOLAR", "ASTRO", "VOID", "SPACE", "LUNA", "MARS"],
                    "images": ["galaxy", "space", "planet", "star", "nebula", "rocket", "astronaut", "satellite"]
                },
                "nature": {
                    "names": ["ThunderStorm", "OceanWave", "MountainPeak", "ForestGreen", "DesertSand",
                             "RiverFlow", "SkyHigh", "EarthCore", "WindStorm", "SunRise"],
                    "symbols": ["STORM", "WAVE", "PEAK", "FOREST", "SAND", "RIVER", "SKY", "EARTH", "WIND", "SUN"],
                    "images": ["nature", "forest", "ocean", "mountain", "storm", "sunset", "tree", "landscape"]
                },
                "crypto": {
                    "names": ["DiamondHands", "MoonLambo", "RocketFuel", "GemHunter", "ChartKing",
                             "BullRun", "DipBuyer", "HODLStrong", "ApeToken", "DegenCoin"],
                    "symbols": ["DIAM", "MOON", "ROCKET", "GEM", "CHART", "BULL", "DIP", "HODL", "APE", "DEGEN"],
                    "images": ["diamond", "rocket", "chart", "bull", "gem", "coin", "money", "gold"]
                },
                "tech": {
                    "names": ["CyberNet", "DataStream", "CodeForge", "ByteShift", "PixelCraft",
                             "CloudNine", "NetCore", "TechFlow", "DigitalAge", "BinaryCode"],
                    "symbols": ["CYBER", "DATA", "CODE", "BYTE", "PIXEL", "CLOUD", "NET", "TECH", "DIGI", "BIN"],
                    "images": ["computer", "technology", "robot", "circuit", "digital", "cyber", "matrix", "code"]
                },
                "fantasy": {
                    "names": ["DragonFire", "MagicSpell", "WizardGold", "PhoenixRise", "MysticRune",
                             "CrystalShard", "ShadowBlade", "ElvenCoin", "DwarfGold", "OrcSlayer"],
                    "symbols": ["DRAG", "MAGIC", "WIZ", "FIRE", "RUNE", "CRYST", "SHADE", "ELF", "DWARF", "ORC"],
                    "images": ["dragon", "magic", "crystal", "fire", "fantasy", "wizard", "castle", "sword"]
                },
                "gaming": {
                    "names": ["PowerUp", "BossRaid", "LevelMax", "QuestGold", "PlayerOne",
                             "GameOver", "HighScore", "SpeedRun", "NoobSlayer", "ProGamer"],
                    "symbols": ["PWR", "BOSS", "LVL", "QUEST", "P1", "GAME", "SCORE", "SPEED", "NOOB", "PRO"],
                    "images": ["game", "controller", "arcade", "pixel", "joystick", "gaming", "player", "console"]
                }
            }
            
            # Pick random theme
            theme_name = random.choice(list(token_themes.keys()))
            theme = token_themes[theme_name]
            
            # Generate unique name with minimal numbers
            base_name = random.choice(theme["names"])
            symbol_base = random.choice(theme["symbols"])
            
            # Sometimes add a small number, sometimes use name as-is
            if random.random() < 0.3:  # 30% chance of adding a number
                number = random.randint(2, 9)  # Small single digit
                name = f"{base_name}{number}"
            else:
                name = base_name  # Use name as-is
            
            # Symbol gets a small number more often to ensure uniqueness
            if random.random() < 0.7:  # 70% chance of number in symbol
                symbol = f"{symbol_base}{random.randint(2, 9)}"
            else:
                symbol = symbol_base
            
            # Get themed image from Lorem Picsum (free, no rate limits)
            image_keyword = random.choice(theme["images"])
            # Generate a unique seed based on the token name for consistent images
            seed = hash(name) % 10000
            image_size = random.choice([200, 300, 400])  # Vary image sizes
            
            # Lorem Picsum provides beautiful, random images
            image_url = f"https://picsum.photos/seed/{seed}_{image_keyword}/{image_size}/{image_size}"
            
            print(f"🎨 Creating {theme_name}-themed token: {name} ({symbol})")
            print(f"🖼️  Image: {image_url}")
            
            # Zero address for burn manager (no burn manager)
            burn_manager = "0x0000000000000000000000000000000000000000"
            
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            gas_price = self.w3.eth.gas_price
            
            # Build transaction
            txn = self.factory_contract.functions.createToken(
                name, symbol, image_url, burn_manager
            ).build_transaction({
                'from': self.account.address,
                'gas': 3000000,
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': 43113
            })
            
            # Sign and send
            signed_txn = self.account.sign_transaction(txn)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            print(f"🔄 Creating token {name} ({symbol})...")
            print(f"📝 TX: {self.w3.to_hex(tx_hash)}")
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                print(f"✅ Token created: {name} ({symbol}) - Theme: {theme_name}")
                
                # Refresh token list to include the new token
                print("🔄 Refreshing token list after creation...")
                self.refresh_token_list()
                print(f"📊 Now tracking {len(self.tokens)} tokens")
                return True
            else:
                print(f"❌ Token creation failed")
                return False
                
        except Exception as e:
            print(f"❌ Error creating token: {e}")
            return False

    def execute_buy(self, token_address, amount_avax):
        """Execute a buy order"""
        try:
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            gas_price = self.w3.eth.gas_price
            amount_wei = self.w3.to_wei(amount_avax, 'ether')
            
            txn = self.factory_contract.functions.buy(
                self.w3.to_checksum_address(token_address)
            ).build_transaction({
                'from': self.account.address,
                'value': amount_wei,
                'gas': 500000,
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': 43113
            })
            
            signed_txn = self.account.sign_transaction(txn)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            print(f"🟢 BUY: {amount_avax:.4f} AVAX for {token_address[:10]}...")
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            if receipt.status == 1:
                print(f"✅ Buy successful - TX: {self.w3.to_hex(tx_hash)}")
                return True
            else:
                print(f"❌ Buy failed")
                return False
                
        except Exception as e:
            print(f"❌ Buy error: {e}")
            return False

    def execute_sell(self, token_address, amount_tokens):
        """Execute a sell order"""
        try:
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            gas_price = self.w3.eth.gas_price
            
            txn = self.factory_contract.functions.sell(
                self.w3.to_checksum_address(token_address),
                amount_tokens
            ).build_transaction({
                'from': self.account.address,
                'gas': 500000,
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': 43113
            })
            
            signed_txn = self.account.sign_transaction(txn)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            print(f"🔴 SELL: {amount_tokens/1e18:.4f} tokens for {token_address[:10]}...")
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            if receipt.status == 1:
                print(f"✅ Sell successful - TX: {self.w3.to_hex(tx_hash)}")
                return True
            else:
                print(f"❌ Sell failed")
                return False
                
        except Exception as e:
            print(f"❌ Sell error: {e}")
            return False

    def random_trade_cycle(self):
        """Execute one random trading cycle"""
        current_balance = self.get_avax_balance()
        
        # Refresh token list every 20 cycles or if we have no tokens
        if not hasattr(self, 'cycle_count'):
            self.cycle_count = 0
        self.cycle_count += 1
        
        if self.cycle_count % 20 == 0 or not self.tokens:
            print("🔄 Refreshing token list...")
            self.refresh_token_list()
        
        # Check if we should create a new token
        if random.random() < self.create_token_chance and current_balance > 0.1:
            print(f"🎲 Creating new token...")
            self.create_random_token()
            return
        
        # Skip if no tokens or low balance
        if not self.tokens or current_balance < self.min_trade_amount * 2:
            print(f"⏭️  Skipping: No tokens ({len(self.tokens)}) or low balance ({current_balance:.6f} AVAX)")
            return
        
        # Pick a random token
        token = random.choice(self.tokens)
        token_address = token["address"]
        token_name = token.get("name", "Unknown")
        token_symbol = token.get("symbol", "???")
        
        print(f"🎯 Selected token: {token_name} ({token_symbol}) - {token_address}")
        
        # Get current price and token balance
        current_price = self.get_token_price(token_address)
        token_balance = self.get_token_balance(token_address)
        current_avax = self.get_avax_balance()
        
        print(f"💰 Current AVAX balance: {current_avax:.6f}")
        print(f"🪙 Token balance: {token_balance/1e18:.6f} {token_symbol}")
        print(f"💵 Current price: {current_price:.8f} AVAX")
        
        # Decide: buy or sell
        if token_balance > 1000:  # Have some tokens (accounting for 18 decimals)
            action = random.choice(['buy', 'sell'])
        else:
            action = 'buy'
        
        print(f"🎲 Action: {action.upper()}")
        
        if action == 'buy':
            # Random buy amount
            amount = random.uniform(self.min_trade_amount, 
                                  min(self.max_trade_amount, current_balance * 0.1))
            print(f"💸 Buying with {amount:.6f} AVAX")
            self.execute_buy(token_address, amount)
            
        else:  # sell
            # Sell random percentage of holdings
            sell_percentage = random.uniform(0.1, 0.8)
            amount_to_sell = int(token_balance * sell_percentage)
            if amount_to_sell > 0:
                print(f"💰 Selling {amount_to_sell/1e18:.6f} {token_symbol} ({sell_percentage*100:.1f}%)")
                self.execute_sell(token_address, amount_to_sell)
            else:
                print(f"⏭️  Not enough tokens to sell")

    def run_volume_bot(self):
        """Main bot loop"""
        print(f"\n🚀 Starting volume bot...")
        print(f"⚡ Will trade every {self.min_interval}-{self.max_interval} seconds")
        print(f"🎯 {self.create_token_chance*100}% chance to create new token each cycle")
        print(f"💰 Trade size: {self.min_trade_amount}-{self.max_trade_amount} AVAX")
        print(f"Press Ctrl+C to stop\n")
        
        cycle_count = 0
        
        try:
            while True:
                cycle_count += 1
                timestamp = datetime.now().strftime("%H:%M:%S")
                print(f"\n[{timestamp}] 🔄 Cycle #{cycle_count}")
                
                # Execute trading cycle
                self.random_trade_cycle()
                
                # Status update every 10 cycles
                if cycle_count % 10 == 0:
                    balance = self.get_avax_balance()
                    print(f"\n📊 Status Update - Cycle #{cycle_count}")
                    print(f"💰 Balance: {balance:.6f} AVAX")
                    print(f"🪙 Tokens available: {len(self.tokens)}")
                    if self.tokens:
                        print("📋 Token list:")
                        for i, token in enumerate(self.tokens[:5]):  # Show first 5
                            balance = self.get_token_balance(token["address"])
                            print(f"  {i+1}. {token['name']} ({token['symbol']}) - Balance: {balance/1e18:.4f}")
                        if len(self.tokens) > 5:
                            print(f"  ... and {len(self.tokens)-5} more tokens")
                    print("-" * 50)
                
                # Random delay
                delay = random.randint(self.min_interval, self.max_interval)
                print(f"⏳ Waiting {delay}s...")
                time.sleep(delay)
                
        except KeyboardInterrupt:
            print(f"\n🛑 Bot stopped by user after {cycle_count} cycles")
            ending_balance = self.get_avax_balance()
            balance_change = ending_balance - self.starting_balance
            print(f"📊 FINAL SUMMARY")
            print(f"💰 Starting balance: {self.starting_balance:.6f} AVAX")
            print(f"💰 Ending balance: {ending_balance:.6f} AVAX")
            if balance_change >= 0:
                print(f"📈 Profit: +{balance_change:.6f} AVAX (+{(balance_change/self.starting_balance)*100:.2f}%)")
            else:
                print(f"📉 Loss: {balance_change:.6f} AVAX ({(balance_change/self.starting_balance)*100:.2f}%)")
            print(f"🔄 Total cycles completed: {cycle_count}")
        except Exception as e:
            print(f"\n💥 Bot crashed: {e}")
            ending_balance = self.get_avax_balance()
            print(f"💰 Balance at crash: {ending_balance:.6f} AVAX")
        finally:
            print(f"👋 Bot session ended")

def main():
    print("=" * 50)
    print("🤖 SIMPLE VOLUME BOT FOR DEX TESTING")
    print("=" * 50)
    
    # Add command line argument parsing
    parser = argparse.ArgumentParser(description='Simple Volume Bot for DEX Testing')
    parser.add_argument('--min-trade', type=float, help='Minimum trade amount in AVAX (default: 0.001)')
    parser.add_argument('--max-trade', type=float, help='Maximum trade amount in AVAX (default: 0.01)')
    parser.add_argument('--min-interval', type=int, help='Minimum seconds between trades (default: 10)')
    parser.add_argument('--max-interval', type=int, help='Maximum seconds between trades (default: 60)')
    parser.add_argument('--create-chance', type=float, help='Chance to create new token (0-1, default: 0.05)')
    parser.add_argument('--auto', action='store_true', help='Start bot automatically without menu')
    parser.add_argument('--private-key', type=str, help='Override BOT_PRIVATE_KEY from .env file with this key')
    
    args = parser.parse_args()
    
    try:
        bot = SimpleVolumeBot(
            min_trade=args.min_trade,
            max_trade=args.max_trade,
            min_interval=args.min_interval,
            max_interval=args.max_interval,
            create_chance=args.create_chance,
            private_key_arg=args.private_key
        )
        
        if args.auto:
            print("\n🚀 Auto-starting volume bot...")
            bot.run_volume_bot()
        else:
            print("\nOptions:")
            print("1. Start volume bot")
            print("2. Create one token")
            print("3. Manual trade")
            print("4. Exit")
            
            choice = input("\nSelect option (1-4): ").strip()
            
            if choice == "1":
                bot.run_volume_bot()
            elif choice == "2":
                bot.create_random_token()
            elif choice == "3":
                print("Manual trading not implemented in simple version")
            elif choice == "4":
                print("👋 Goodbye!")
            else:
                print("❌ Invalid choice")
                
    except Exception as e:
        print(f"💥 Error: {e}")

if __name__ == "__main__":
    main()