const { ethers } = require('ethers');
const axios = require('axios');

// Mainnet token addresses
const TOKENS = {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86a33E6417aAb2C8a54C2C40B6Da7A8b2c44E",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
};

// DEX contract addresses
const CONTRACTS = {
    UNISWAP_V3_QUOTER: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    SUSHISWAP_ROUTER: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
    AAVE_POOL: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"
};

class RealMainnetArbitrageBot {
    constructor() {
        // Use Infura free tier (you can also use Alchemy)
        this.provider = new ethers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/2v7w7guIaS7gpQKw7GTniqIhQrwIAAn_");
        
        // For testing, we'll use a read-only connection first
        this.isReadOnly = true;
        
        this.dailyStats = {
            trades: 0,
            profit: 0,
            loss: 0,
            startTime: Date.now()
        };
    }

    async initialize() {
        console.log('🚀 REAL MAINNET ARBITRAGE SCANNER');
        console.log('📊 Fetching LIVE prices from DEXs...');
        
        try {
            const blockNumber = await this.provider.getBlockNumber();
            console.log(`🔗 Connected to Ethereum mainnet - Block: ${blockNumber}`);
            
            // Test fetching real prices
            const ethPrice = await this.getETHPriceFromAPI();
            console.log(`💰 Current ETH Price: $${ethPrice}`);
            
            return true;
        } catch (error) {
            console.error(`❌ Connection failed: ${error.message}`);
            return false;
        }
    }

    async getETHPriceFromAPI() {
        try {
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
            return response.data.ethereum.usd;
        } catch (error) {
            console.log('⚠️ CoinGecko API failed, using fallback');
            return 3800; // Fallback price
        }
    }

    async getUniswapV3Price(tokenIn, tokenOut, amountIn) {
        try {
            // Uniswap V3 Quoter ABI (simplified)
            const quoterABI = [
                "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)"
            ];
            
            const quoter = new ethers.Contract(CONTRACTS.UNISWAP_V3_QUOTER, quoterABI, this.provider);
            
            // Most liquid pool fee tier (0.3%)
            const fee = 3000;
            const amount = ethers.parseEther(amountIn.toString());
            
            // Get quote
            const amountOut = await quoter.quoteExactInputSingle.staticCall(
                tokenIn,
                tokenOut, 
                fee,
                amount,
                0 // No price limit
            );
            
            return parseFloat(ethers.formatEther(amountOut));
            
        } catch (error) {
            console.log(`⚠️ Uniswap quote failed: ${error.message}`);
            return null;
        }
    }

    async get1InchPrice(tokenFrom, tokenTo, amount) {
        try {
            // 1inch aggregator API for best prices
            const amountWei = ethers.parseEther(amount.toString()).toString();
            
            const url = `https://api.1inch.dev/swap/v5.2/1/quote?src=${tokenFrom}&dst=${tokenTo}&amount=${amountWei}`;
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': 'Bearer YOUR_1INCH_API_KEY' // You'd need to get this
                }
            });
            
            return parseFloat(ethers.formatEther(response.data.toAmount));
            
        } catch (error) {
            console.log(`⚠️ 1inch API failed: ${error.message}`);
            return null;
        }
    }

    async getPriceFromDEXScreener(pair) {
        try {
            // DEXScreener API for real-time prices
            const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${pair}`);
            
            if (response.data.pairs && response.data.pairs.length > 0) {
                return response.data.pairs.map(p => ({
                    dex: p.dexId,
                    price: parseFloat(p.priceUsd),
                    liquidity: parseFloat(p.liquidity?.usd || 0),
                    volume24h: parseFloat(p.volume?.h24 || 0)
                }));
            }
            
            return null;
        } catch (error) {
            console.log(`⚠️ DEXScreener failed: ${error.message}`);
            return null;
        }
    }

    async findRealArbitrageOpportunities() {
        console.log('🔍 Scanning REAL DEX prices...');
        
        try {
            // Get WETH prices from multiple sources
            console.log('📊 Fetching WETH/USDC prices from DEXs...');
            
            // Method 1: Try DEXScreener for multiple DEX prices
            const wethPrices = await this.getPriceFromDEXScreener(TOKENS.WETH);
            
            if (wethPrices && wethPrices.length >= 2) {
                console.log(`📈 Found ${wethPrices.length} price sources:`);
                
                wethPrices.forEach((price, i) => {
                    console.log(`   ${price.dex}: $${price.price.toFixed(2)} (Liquidity: $${(price.liquidity/1000000).toFixed(1)}M)`);
                });
                
                // Find best arbitrage opportunity
                const sortedPrices = wethPrices.sort((a, b) => a.price - b.price);
                const lowestPrice = sortedPrices[0];
                const highestPrice = sortedPrices[sortedPrices.length - 1];
                
                const priceDiff = highestPrice.price - lowestPrice.price;
                const spreadPercent = (priceDiff / lowestPrice.price) * 100;
                
                console.log(`💡 Best Spread: ${spreadPercent.toFixed(3)}% ($${priceDiff.toFixed(2)})`);
                console.log(`   Buy on: ${lowestPrice.dex} at $${lowestPrice.price.toFixed(2)}`);
                console.log(`   Sell on: ${highestPrice.dex} at $${highestPrice.price.toFixed(2)}`);
                
                // Calculate potential profit for small trade
                if (spreadPercent > 0.3) { // 0.3% minimum spread
                    const tradeAmountETH = 0.1; // Small test trade
                    const grossProfitUSD = tradeAmountETH * lowestPrice.price * (spreadPercent / 100);
                    const estimatedGasCostUSD = 20; // ~$20 in gas fees
                    const netProfitUSD = grossProfitUSD - estimatedGasCostUSD;
                    const netProfitETH = netProfitUSD / lowestPrice.price;
                    
                    console.log(`💰 Potential Profit (0.1 ETH trade):`);
                    console.log(`   Gross: $${grossProfitUSD.toFixed(2)} (${(grossProfitUSD/lowestPrice.price).toFixed(4)} ETH)`);
                    console.log(`   Gas Cost: ~$${estimatedGasCostUSD}`);
                    console.log(`   Net: $${netProfitUSD.toFixed(2)} (${netProfitETH.toFixed(4)} ETH)`);
                    
                    if (netProfitETH > 0.005) { // At least 0.005 ETH profit
                        return [{
                            pair: 'WETH/USDC',
                            buyDex: lowestPrice.dex,
                            sellDex: highestPrice.dex,
                            buyPrice: lowestPrice.price,
                            sellPrice: highestPrice.price,
                            spread: spreadPercent,
                            estimatedProfitETH: netProfitETH,
                            estimatedProfitUSD: netProfitUSD,
                            tradeAmount: tradeAmountETH
                        }];
                    }
                }
            }
            
            // Method 2: Try direct Uniswap quotes
            console.log('📊 Trying direct Uniswap V3 quotes...');
            const uniPrice = await this.getUniswapV3Price(TOKENS.WETH, TOKENS.USDC, 1);
            if (uniPrice) {
                console.log(`🦄 Uniswap V3: 1 WETH = ${uniPrice.toFixed(2)} USDC`);
            }
            
        } catch (error) {
            console.log(`❌ Error scanning opportunities: ${error.message}`);
        }
        
        return [];
    }

    async scanContinuously() {
        console.log('🚀 Starting continuous REAL market scanning...');
        
        let scanCount = 0;
        
        while (true) {
            try {
                scanCount++;
                console.log(`\n📡 Scan #${scanCount} - ${new Date().toLocaleTimeString()}`);
                
                const opportunities = await this.findRealArbitrageOpportunities();
                
                if (opportunities.length > 0) {
                    console.log(`🎯 OPPORTUNITY FOUND!`);
                    const opp = opportunities[0];
                    console.log(`   Pair: ${opp.pair}`);
                    console.log(`   Spread: ${opp.spread.toFixed(3)}%`);
                    console.log(`   Potential Profit: ${opp.estimatedProfitETH.toFixed(4)} ETH ($${opp.estimatedProfitUSD.toFixed(2)})`);
                    console.log(`   Buy: ${opp.buyDex} at $${opp.buyPrice.toFixed(2)}`);
                    console.log(`   Sell: ${opp.sellDex} at $${opp.sellPrice.toFixed(2)}`);
                    
                    // For now, just log the opportunity
                    // In real implementation, you'd execute the trade here
                    console.log(`⚠️ OPPORTUNITY DETECTED - WOULD EXECUTE TRADE HERE`);
                    
                } else {
                    console.log('😴 No profitable opportunities found this scan');
                }
                
                // Wait 45 seconds between scans (to avoid rate limits)
                console.log('⏳ Waiting 45 seconds before next scan...');
                await new Promise(resolve => setTimeout(resolve, 45000));
                
            } catch (error) {
                console.log(`❌ Error in scan loop: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
    }
}

// Main execution
async function main() {
    console.log('🌟 REAL MAINNET ARBITRAGE SCANNER STARTING...');
    console.log('📊 This version fetches REAL prices from DEXs');
    console.log('💡 No trading yet - just opportunity detection');
    
    const bot = new RealMainnetArbitrageBot();
    
    try {
        const initialized = await bot.initialize();
        if (initialized) {
            await bot.scanContinuously();
        }
    } catch (error) {
        console.error(`❌ Fatal error: ${error.message}`);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutdown signal received');
    console.log('👋 Thanks for testing the REAL price scanner!');
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RealMainnetArbitrageBot;