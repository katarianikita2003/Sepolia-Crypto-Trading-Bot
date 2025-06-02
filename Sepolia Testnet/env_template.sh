# .env.template - Copy this to .env and fill in your values

# ============================================================================
# CRITICAL: NEVER COMMIT YOUR ACTUAL .env FILE TO VERSION CONTROL
# ============================================================================

# Ethereum Private Key (WITHOUT 0x prefix)
# Get this from MetaMask: Account Details > Export Private Key
# REMOVE THE 0x PREFIX - should be exactly 64 characters
PRIVATE_KEY=your_64_character_private_key_here_without_0x_prefix

# Alchemy API Key (for Ethereum RPC access)
# Get free API key from: https://alchemy.com
ALCHEMY_API_KEY=your_alchemy_api_key_here

# Alchemy WebSocket URL (for real-time events)
# Format: wss://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
ALCHEMY_URL_WEBSOCKET=wss://eth-mainnet.alchemyapi.io/v2/your_alchemy_api_key_here

# Alchemy HTTP URL (for contract calls)
# Format: https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
ALCHEMY_URL=https://eth-mainnet.alchemyapi.io/v2/your_alchemy_api_key_here

# Etherscan API Key (optional, for contract verification)
# Get free API key from: https://etherscan.io/apis
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# ============================================================================
# EXAMPLE VALUES (DO NOT USE THESE IN PRODUCTION)
# ============================================================================

# Example format for PRIVATE_KEY (64 hex characters, no 0x):
# PRIVATE_KEY=abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd

# Example format for ALCHEMY_API_KEY:
# ALCHEMY_API_KEY=abc123def456ghi789

# Example format for URLs:
# ALCHEMY_URL=https://eth-mainnet.alchemyapi.io/v2/abc123def456ghi789
# ALCHEMY_URL_WEBSOCKET=wss://eth-mainnet.alchemyapi.io/v2/abc123def456ghi789

# ============================================================================
# SECURITY NOTES
# ============================================================================

# 1. NEVER share your private key with anyone
# 2. NEVER commit your .env file to Git
# 3. Use a dedicated wallet for trading (not your main wallet)
# 4. Start with small amounts for testing
# 5. Keep backups of your private key in a secure location

# ============================================================================
# HOW TO GET YOUR PRIVATE KEY FROM METAMASK
# ============================================================================

# 1. Open MetaMask
# 2. Click on the three dots menu
# 3. Click "Account Details"
# 4. Click "Export Private Key"
# 5. Enter your MetaMask password
# 6. Copy the private key (REMOVE the 0x prefix)
# 7. Paste it as PRIVATE_KEY value above

# ============================================================================
# TESTNET CONFIGURATION (for testing)
# ============================================================================

# For Goerli testnet testing:
# ALCHEMY_URL=https://eth-goerli.alchemyapi.io/v2/your_api_key
# ALCHEMY_URL_WEBSOCKET=wss://eth-goerli.alchemyapi.io/v2/your_api_key

# For Sepolia testnet testing:
# ALCHEMY_URL=https://eth-sepolia.alchemyapi.io/v2/your_api_key
# ALCHEMY_URL_WEBSOCKET=wss://eth-sepolia.alchemyapi.io/v2/your_api_key

# ============================================================================
# ADDITIONAL OPTIONAL SETTINGS
# ============================================================================

# Maximum gas price in gwei (optional, default: market rate)
# MAX_GAS_PRICE=50

# Minimum profit threshold percentage (optional, default: 0.5)
# MIN_PROFIT_THRESHOLD=0.5

# Maximum trade size in ETH (optional, default: 10)
# MAX_TRADE_SIZE=1.0

# Enable/disable paper trading mode (optional, default: false)
# PAPER_TRADING=true

# Telegram notifications (optional)
# TELEGRAM_BOT_TOKEN=your_telegram_bot_token
# TELEGRAM_CHAT_ID=your_telegram_chat_id