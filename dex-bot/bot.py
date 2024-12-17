from web3 import Web3
import web3
from eth_account import Account
import time
import os
import random
import json
from decimal import Decimal
from dotenv import load_dotenv

FACTORY_ABI = [
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
    }
]

TOKEN_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    }
]



print(f"Web3.py Version: {web3.__version__}")

# Load environment variables
load_dotenv()

def format_token_amount(amount, decimals=18):
    """Format large token amounts to be human readable"""
    if amount == 0:
        return "0"
    decimal_amount = Decimal(amount) / Decimal(10 ** decimals)
    if decimal_amount < 0.000001:
        return f"{decimal_amount:.8e}"
    return f"{decimal_amount:.6f}"

class Config:
    DEFAULT_CONFIG = {
        "factory_address": "0xf6970088B8488d44d3efe52e647A9217041142F7",
        "tokens": [
            "0x599a4b621bd55bcecd5e48a40ca230569b68fd86"
        ],
        "trading_params": {
            "min_trade_interval": 30,
            "max_trade_interval": 120,
            "min_avax": 0.001,
            "max_avax": 0.005,
            "max_avax_risk": 0.05
        }
    }
    
    def __init__(self, filename="config.json"):
        self.filename = filename
        self.load()
    
    def load(self):
        try:
            if os.path.exists(self.filename):
                with open(self.filename, 'r') as f:
                    self.data = json.load(f)
            else:
                self.data = self.DEFAULT_CONFIG
                self.save()
        except Exception as e:
            print(f"Error loading config: {e}")
            self.data = self.DEFAULT_CONFIG
    
    def save(self):
        with open(self.filename, 'w') as f:
            json.dump(self.data, f, indent=4)
    
    def add_token(self, token_address):
        token_address = token_address.lower()
        if token_address not in self.data["tokens"]:
            self.data["tokens"].append(token_address)
            self.save()
            return True
        return False
    
    def remove_token(self, token_address):
        token_address = token_address.lower()
        if token_address in self.data["tokens"]:
            self.data["tokens"].remove(token_address)
            self.save()
            return True
        return False
    
    def update_factory(self, address):
        self.data["factory_address"] = address.lower()
        self.save()

class TradingBot:
    def __init__(self):
        # Initialize config
        self.config = Config()
        
        # Connect to Avalanche Fuji testnet
        self.RPC_URL = "https://avax-fuji.g.alchemy.com/v2/7NBTdVMFlqXaf5D-r-0kb73aehWeZ1Aj"
        self.w3 = Web3(Web3.HTTPProvider(self.RPC_URL))
        
        # Load private key
        self.private_key = os.getenv('BOT_PRIVATE_KEY')
        if not self.private_key:
            raise ValueError("Please set BOT_PRIVATE_KEY in .env file")
        
        # Ensure private key has 0x prefix
        if not self.private_key.startswith('0x'):
            self.private_key = f"0x{self.private_key}"
        
        self.account = Account.from_key(self.private_key)
        
        # Initialize contract
        self.update_contracts()
        
        # Set trading parameters from config
        self.update_trading_params()

    def update_contracts(self):
        """Update contract instances from config"""
        self.factory_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(self.config.data["factory_address"]),
            abi=FACTORY_ABI
        )

    def update_trading_params(self):
        """Update trading parameters from config"""
        params = self.config.data["trading_params"]
        self.min_trade_interval = params["min_trade_interval"]
        self.max_trade_interval = params["max_trade_interval"]
        self.min_avax = params["min_avax"]
        self.max_avax = params["max_avax"]
        self.max_avax_risk = params["max_avax_risk"]

    def get_account_balance(self):
        return self.w3.eth.get_balance(self.account.address)

    def get_token_balance(self, token_address):
        token_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(token_address),
            abi=TOKEN_ABI
        )
        return token_contract.functions.balanceOf(self.account.address).call()

    def log_balances(self, token_address, action=""):
        """Log AVAX and token balances with proper formatting"""
        avax_balance = self.w3.from_wei(self.get_account_balance(), 'ether')
        token_balance = self.get_token_balance(token_address)
        
        print(f"\n💰 Current balances {action}:")
        print(f"AVAX: {avax_balance:.6f}")
        print(f"Token: {format_token_amount(token_balance)}")
        
        return avax_balance, token_balance

    def execute_buy(self, token_address, amount):
        try:
            # Log before balances
            print("\n📊 Balances before buy:")
            avax_before, token_before = self.log_balances(token_address, "before")
            
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            gas_price = self.w3.eth.gas_price
            
            # Build buy transaction
            buy_txn = self.factory_contract.functions.buy(
                self.w3.to_checksum_address(token_address)
            ).build_transaction({
                'from': self.account.address,
                'value': amount,
                'gas': 500000,
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': 43113  # Fuji testnet
            })
            
            # Sign and send transaction
            signed_txn = self.account.sign_transaction(buy_txn)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            print(f"🔄 Transaction sent: {self.w3.to_hex(tx_hash)}")
            
            # Wait for transaction receipt
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Log after balances
            print("\n📊 Balances after buy:")
            avax_after, token_after = self.log_balances(token_address, "after")
            
            print(f"\n✅ Buy successful!")
            print(f"Amount spent: {self.w3.from_wei(amount, 'ether')} AVAX")
            print(f"Tokens received: {format_token_amount(token_after - token_before)}")
            print(f"TX: https://testnet.snowtrace.io/tx/{self.w3.to_hex(tx_hash)}")
            return True
            
        except Exception as e:
            print(f"\n❌ Buy failed: {str(e)}")
            return False

    def execute_sell(self, token_address, amount):
        try:
            # Log before balances
            print("\n📊 Balances before sell:")
            avax_before, token_before = self.log_balances(token_address, "before")
            
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            gas_price = self.w3.eth.gas_price
            
            # Build sell transaction
            sell_txn = self.factory_contract.functions.sell(
                self.w3.to_checksum_address(token_address),
                amount
            ).build_transaction({
                'from': self.account.address,
                'gas': 500000,
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': 43113  # Fuji testnet
            })
            
            # Sign and send transaction
            signed_txn = self.account.sign_transaction(sell_txn)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            print(f"🔄 Transaction sent: {self.w3.to_hex(tx_hash)}")
            
            # Wait for transaction receipt
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Log after balances
            print("\n📊 Balances after sell:")
            avax_after, token_after = self.log_balances(token_address, "after")
            
            print(f"\n✅ Sell successful!")
            print(f"Tokens sold: {format_token_amount(amount)}")
            print(f"AVAX received: {avax_after - avax_before:.6f}")
            print(f"TX: https://testnet.snowtrace.io/tx/{self.w3.to_hex(tx_hash)}")
            return True
            
        except Exception as e:
            print(f"\n❌ Sell failed: {str(e)}")
            return False

    def auto_trade(self, token_index):
        tokens = self.config.data["tokens"]
        if token_index < 0 or token_index >= len(tokens):
            print("Invalid token index")
            return

        token_address = tokens[token_index]
        print(f"\n🤖 Starting auto trading for token {token_index + 1}")
        print(f"Token address: {token_address}")

        while True:
            try:
                # Check balances
                avax_balance = self.w3.from_wei(self.get_account_balance(), 'ether')
                token_balance = self.get_token_balance(token_address)
                
                print(f"\n💰 Current balances:")
                print(f"AVAX: {avax_balance:.6f}")
                print(f"Token: {format_token_amount(token_balance)}")

                # Decide to buy or sell
                if token_balance > 0:
                    action = random.choice(['buy', 'sell'])
                else:
                    action = 'buy'

                if action == 'buy' and avax_balance > self.min_avax:
                    # Calculate buy amount
                    max_possible = min(float(avax_balance), self.max_avax_risk)
                    amount = random.uniform(self.min_avax, min(self.max_avax, max_possible))
                    amount_wei = self.w3.to_wei(amount, 'ether')
                    
                    print(f"\n🛒 Attempting buy of {amount:.6f} AVAX")
                    self.execute_buy(token_address, amount_wei)

                elif action == 'sell' and token_balance > 0:
                    # Sell a random portion of holdings
                    amount = random.randint(1, token_balance)
                    print(f"\n💰 Attempting sell of {format_token_amount(amount)} tokens")
                    self.execute_sell(token_address, amount)

                # Random delay before next trade
                delay = random.randint(self.min_trade_interval, self.max_trade_interval)
                print(f"\n⏳ Waiting {delay} seconds until next trade...")
                time.sleep(delay)

            except KeyboardInterrupt:
                print("\n🛑 Stopping auto trading...")
                break
            except Exception as e:
                print(f"\n⚠️ Error: {str(e)}")
                print("Waiting 30 seconds before retrying...")
                time.sleep(30)

    def config_menu(self):
        while True:
            print("\n=== Configuration Menu ===")
            print("1. View current config")
            print("2. Add token")
            print("3. Remove token")
            print("4. Update factory address")
            print("5. Back to main menu")
            
            choice = input("\nChoose option (1-5): ").strip()
            
            if choice == "1":
                print("\nCurrent configuration:")
                print(json.dumps(self.config.data, indent=2))
                
            elif choice == "2":
                token = input("Enter token address: ").strip()
                if self.config.add_token(token):
                    print("Token added successfully")
                else:
                    print("Token already exists")
                    
            elif choice == "3":
                print("\nAvailable tokens:")
                for i, token in enumerate(self.config.data["tokens"], 1):
                    print(f"{i}. {token}")
                idx = input("\nEnter token number to remove: ").strip()
                try:
                    idx = int(idx) - 1
                    token = self.config.data["tokens"][idx]
                    if self.config.remove_token(token):
                        print("Token removed successfully")
                    else:
                        print("Token not found")
                except (ValueError, IndexError):
                    print("Invalid input")
                    
            elif choice == "4":
                address = input("Enter new factory address: ").strip()
                self.config.update_factory(address)
                self.update_contracts()
                print("Factory address updated successfully")
                
            elif choice == "5":
                break

    def manual_trade(self):
        while True:
            tokens = self.config.data["tokens"]
            print("\n=== Available Tokens ===")
            for i, token in enumerate(tokens, 1):
                balance = self.get_token_balance(token)
                print(f"{i}. Token {i} - Balance: {format_token_amount(balance)}")
            
            print("\nOptions:")
            print("1. Manual Buy")
            print("2. Manual Sell")
            print("3. Auto Trade")
            print("4. Configuration")
            print("5. Exit")
            
            action = input("\nChoose action (1-5): ").strip()
            if action == "5":
                print("Exiting...")
                break

            if action == "4":
                self.config_menu()
                continue

            if action not in ["1", "2", "3"]:
                print("Invalid choice")
                continue

            if not tokens:
                print("No tokens configured. Please add tokens in the configuration menu.")
                continue

            token_num = int(input(f"Select token number (1-{len(tokens)}): ").strip())
            if token_num < 1 or token_num > len(tokens):
                print("Invalid token number")
                continue

            if action == "3":
                self.auto_trade(token_num - 1)
                continue
                
            token_address = tokens[token_num - 1]

            if action == "1":  # Manual Buy
                avax_balance = self.w3.from_wei(self.get_account_balance(), 'ether')
                print(f"Available AVAX balance: {avax_balance:.6f}")
                amount = float(input("Enter amount of AVAX to spend: ").strip())
                if amount > avax_balance:
                    print("Insufficient balance")
                    continue
                amount_wei = self.w3.to_wei(amount, 'ether')
                self.execute_buy(token_address, amount_wei)

            elif action == "2":  # Manual Sell
                token_balance = self.get_token_balance(token_address)
                print(f"Available token balance: {format_token_amount(token_balance)}")
                amount = int(input("Enter amount of tokens to sell: ").strip())
                if amount > token_balance:
                    print("Insufficient balance")
                    continue
                self.execute_sell(token_address, amount)


# Add this at the end of the file
if __name__ == "__main__":
    bot = TradingBot()
    bot.manual_trade()

print("Script execution completed.")