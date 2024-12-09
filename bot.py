from web3 import Web3
import web3
from eth_account import Account
import time
import os
import random
from dotenv import load_dotenv

print(f"Web3.py Version: {web3.__version__}")

# Load environment variables
load_dotenv()

# Connect to Avalanche Fuji testnet
RPC_URL = "https://avax-fuji.g.alchemy.com/v2/7NBTdVMFlqXaf5D-r-0kb73aehWeZ1Aj"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# No middleware manipulation needed - using default middleware

# Convert addresses to checksum format
FACTORY_ADDRESS = w3.to_checksum_address("0xf6970088B8488d44d3efe52e647A9217041142F7")
TOKENS = [
    w3.to_checksum_address("0x599a4b621bd55bcecd5e48a40ca230569b68fd86"),  # Token 1
]

FACTORY_ABI = [
    {
        "inputs": [{"internalType": "address","name": "tokenAddress","type": "address"}],
        "name": "buy",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address","name": "tokenAddress","type": "address"},{"internalType": "uint256","name": "tokenAmount","type": "uint256"}],
        "name": "sell",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

TOKEN_ABI = [
    {
        "inputs": [{"internalType": "address","name": "account","type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

class TradingBot:
    def __init__(self):
        self.private_key = os.getenv('BOT_PRIVATE_KEY')
        if not self.private_key:
            raise ValueError("Please set BOT_PRIVATE_KEY in .env file")
        
        # Ensure private key has 0x prefix
        if not self.private_key.startswith('0x'):
            self.private_key = f"0x{self.private_key}"
        
        self.account = Account.from_key(self.private_key)
        self.factory_contract = w3.eth.contract(
            address=FACTORY_ADDRESS,
            abi=FACTORY_ABI
        )
        
        # Auto trading parameters
        self.min_trade_interval = 30
        self.max_trade_interval = 120
        self.min_avax = 0.001
        self.max_avax = 0.005
        self.max_avax_risk = 0.05

    def get_account_balance(self):
        return w3.eth.get_balance(self.account.address)

    def get_token_balance(self, token_address):
        token_contract = w3.eth.contract(
            address=token_address,
            abi=TOKEN_ABI
        )
        return token_contract.functions.balanceOf(self.account.address).call()

    def execute_buy(self, token_address, amount):
        try:
            nonce = w3.eth.get_transaction_count(self.account.address)
            gas_price = w3.eth.gas_price
            
            # Build buy transaction
            buy_txn = self.factory_contract.functions.buy(
                token_address
            ).build_transaction({
                'from': self.account.address,
                'value': amount,
                'gas': 500000,
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': 43113  # Fuji testnet
            })
            
            # Sign transaction
            signed_txn = self.account.sign_transaction(buy_txn)
            
            # Send transaction
            tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)  # Changed from rawTransaction to raw_transaction
            print(f"Transaction sent: {w3.to_hex(tx_hash)}")
            
            # Wait for transaction receipt
            tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            
            print(f"\n✅ Buy successful!")
            print(f"Amount: {w3.from_wei(amount, 'ether')} AVAX")
            print(f"TX: https://testnet.snowtrace.io/tx/{w3.to_hex(tx_hash)}")
            return True
            
        except Exception as e:
            print(f"\n❌ Buy failed: {str(e)}")
            return False

    def execute_sell(self, token_address, amount):
        try:
            nonce = w3.eth.get_transaction_count(self.account.address)
            gas_price = w3.eth.gas_price
            
            # Build sell transaction
            sell_txn = self.factory_contract.functions.sell(
                token_address,
                amount
            ).build_transaction({
                'from': self.account.address,
                'gas': 500000,
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': 43113  # Fuji testnet
            })
            
            # Sign transaction
            signed_txn = self.account.sign_transaction(sell_txn)
            
            # Send transaction
            tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)  # Changed from rawTransaction to raw_transaction
            print(f"Transaction sent: {w3.to_hex(tx_hash)}")
            
            # Wait for transaction receipt
            tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            
            print(f"\n✅ Sell successful!")
            print(f"Amount: {amount} tokens")
            print(f"TX: https://testnet.snowtrace.io/tx/{w3.to_hex(tx_hash)}")
            return True
            
        except Exception as e:
            print(f"\n❌ Sell failed: {str(e)}")
            return False

    def auto_trade(self, token_index):
        if token_index < 0 or token_index >= len(TOKENS):
            print("Invalid token index")
            return

        token_address = TOKENS[token_index]
        print(f"\n🤖 Starting auto trading for token {token_index + 1}")
        print(f"Token address: {token_address}")

        while True:
            try:
                # Check AVAX balance
                avax_balance = w3.from_wei(self.get_account_balance(), 'ether')
                token_balance = self.get_token_balance(token_address)
                
                print(f"\n💰 Current balances:")
                print(f"AVAX: {avax_balance:.4f}")
                print(f"Token: {token_balance}")

                # Decide to buy or sell
                if token_balance > 0:
                    action = random.choice(['buy', 'sell'])
                else:
                    action = 'buy'

                if action == 'buy' and avax_balance > self.min_avax:
                    # Calculate buy amount
                    max_possible = min(float(avax_balance), self.max_avax_risk)
                    amount = random.uniform(self.min_avax, min(self.max_avax, max_possible))
                    amount_wei = w3.to_wei(amount, 'ether')
                    
                    print(f"\n🛒 Attempting buy of {amount:.4f} AVAX")
                    self.execute_buy(token_address, amount_wei)

                elif action == 'sell' and token_balance > 0:
                    # Sell a random portion of holdings
                    amount = random.randint(1, token_balance)
                    print(f"\n💰 Attempting sell of {amount} tokens")
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

    def manual_trade(self):
        while True:
            print("\n=== Available Tokens ===")
            for i, token in enumerate(TOKENS, 1):
                balance = self.get_token_balance(token)
                print(f"{i}. Token {i} - Balance: {balance}")
            
            print("\nOptions:")
            print("1. Manual Buy")
            print("2. Manual Sell")
            print("3. Auto Trade")
            print("4. Exit")
            
            action = input("\nChoose action (1-4): ").strip()
            if action == "4":
                print("Exiting...")
                break

            if action not in ["1", "2", "3"]:
                print("Invalid choice")
                continue

            token_num = int(input(f"Select token number (1-{len(TOKENS)}): ").strip())
            if token_num < 1 or token_num > len(TOKENS):
                print("Invalid token number")
                continue

            if action == "3":
                self.auto_trade(token_num - 1)
                continue
                
            token_address = TOKENS[token_num - 1]
            
            if action == "1":  # Buy
                amount = input("Enter AVAX amount: ").strip()
                try:
                    amount_wei = w3.to_wei(float(amount), 'ether')
                    self.execute_buy(token_address, amount_wei)
                except ValueError:
                    print("Invalid amount")
                    
            elif action == "2":  # Sell
                balance = self.get_token_balance(token_address)
                if balance == 0:
                    print("No tokens to sell")
                    continue
                    
                print(f"Current balance: {balance}")
                amount = input(f"Enter amount to sell (max {balance}): ").strip()
                try:
                    amount = int(amount)
                    if amount > balance:
                        print("Amount exceeds balance")
                        continue
                    self.execute_sell(token_address, amount)
                except ValueError:
                    print("Invalid amount")

def main():
    bot = TradingBot()
    print(f"\n🤖 Bot started")
    print(f"📫 Address: {bot.account.address}")
    bot.manual_trade()

if __name__ == "__main__":
    main()