const { ethers } = require('ethers');
const axios = require('axios');

class ProfitableArbitrageScanner {
    constructor() {
        this.provider = new ethers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/2v7w7guIaS7gpQKw7GTniqIhQrwIAAn_");
        this.ethPrice = 3700;
        this.walletBalance = 0.0560; // Your current balance
        
        // Trading parameters
        this.minProfitUSD = 15; // Minimum $15 profit
        this.gasEstimateUSD = 25; // Estimated gas cost
        this.maxTradeSize = Math.min(this.walletBalance * 0.8, 2); // Use max 80% of balance or 2 ETH
    }

    async initialize() {
        console.log('💰 PROFITABLE ARBITRAGE SCANNER');
        console.log('🎯 Only alerts on ACTUALLY profitable opportunities');
        console.log(`💳 Wallet Balance: ${this.walletBalance} ETH`);
        console.log(`📊 Max Trade Size: ${this.maxTradeSize} ETH`);
        console.log(`💵 Min Profit Target: $${this.minProfitUSD}`);
        
        try {
            const blockNumber = await this.provider.getBlockNumber();
            console.log(`🔗 Connected to Ethereum mainnet - Block: ${blockNumber}`);
            
            this.ethPrice = await this.getETHPrice();
            console.log(`💰 Current ETH Price: $${this.ethPrice}`);
            
            return true;
        } catch (error) {
            console.error(`❌ Connection failed: ${error.message}`);
            return false;
        }
    }

    async getETHPrice() {
        try {
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
            return response.data.ethereum.usd;
        } catch (error) {
            return 3700; // Fallback
        }
    }

    async getFilteredDEXPrices() {
        try {
            const response = await axios.get('https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', {
                timeout: 8000
            });
            
            if (response.data.pairs && response.data.pairs.length > 0) {
                const validPrices = response.data.pairs
                    .filter(pair => {
                        const price = parseFloat(pair.priceUsd);
                        const liquidity = parseFloat(pair.liquidity?.usd || 0);
                        
                        return (
                            price > 3000 && price < 5000 &&
                            liquidity > 5000000 && // At least $5M liquidity for better execution
                            pair.baseToken?.address?.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' &&
                            (pair.quoteToken?.symbol === 'USDC' || pair.quoteToken?.symbol === 'USDT')
                        );
                    })
                    .map(pair => ({
                        dex: pair.dexId,
                        price: parseFloat(pair.priceUsd),
                        liquidity: parseFloat(pair.liquidity?.usd || 0),
                        pairAddress: pair.pairAddress
                    }));
                
                return validPrices;
            }
            
            return [];
        } catch (error) {
            console.log(`⚠️ DEXScreener API failed: ${error.message}`);
            return [];
        }
    }

    calculateProfitability(buyPrice, sellPrice, tradeSize) {
        const priceDiff = sellPrice - buyPrice;
        const spreadPercent = (priceDiff / buyPrice) * 100;
        const grossProfitUSD = tradeSize * priceDiff;
        const netProfitUSD = grossProfitUSD - this.gasEstimateUSD;
        const netProfitETH = netProfitUSD / this.ethPrice;
        
        return {
            spreadPercent,
            grossProfitUSD,
            netProfitUSD,
            netProfitETH,
            profitable: netProfitUSD > this.minProfitUSD,
            roi: (netProfitUSD / (tradeSize * this.ethPrice)) * 100
        };
    }

    findOptimalTradeSize(buyPrice, sellPrice) {
        // Test different trade sizes to find the most profitable
        const testSizes = [0.1, 0.3, 0.5, 1, 1.5, 2, 3, 5];
        let bestTrade = null;
        
        for (const size of testSizes) {
            if (size > this.maxTradeSize) continue;
            
            const profit = this.calculateProfitability(buyPrice, sellPrice, size);
            
            if (profit.profitable && (!bestTrade || profit.netProfitUSD > bestTrade.netProfitUSD)) {
                bestTrade = {
                    tradeSize: size,
                    ...profit
                };
            }
        }
        
        return bestTrade;
    }

    async scanForProfitableOpportunities() {
        console.log('🔍 Scanning for PROFITABLE opportunities...');
        
        try {
            const dexPrices = await this.getFilteredDEXPrices();
            
            if (dexPrices.length < 2) {
                console.log('⚠️ Insufficient price data');
                return null;
            }
            
            // Sort prices to find best spread
            const sortedPrices = dexPrices.sort((a, b) => a.price - b.price);
            const lowestPrice = sortedPrices[0];
            const highestPrice = sortedPrices[sortedPrices.length - 1];
            
            console.log(`📊 Price Range: $${lowestPrice.price.toFixed(2)} - $${highestPrice.price.toFixed(2)}`);
            console.log(`   Buy: ${lowestPrice.dex} ($${(lowestPrice.liquidity/1000000).toFixed(1)}M liquidity)`);
            console.log(`   Sell: ${highestPrice.dex} ($${(highestPrice.liquidity/1000000).toFixed(1)}M liquidity)`);
            
            // Find optimal trade size
            const optimalTrade = this.findOptimalTradeSize(lowestPrice.price, highestPrice.price);
            
            if (optimalTrade) {
                return {
                    buyDex: lowestPrice.dex,
                    sellDex: highestPrice.dex,
                    buyPrice: lowestPrice.price,
                    sellPrice: highestPrice.price,
                    ...optimalTrade
                };
            }
            
            // Show why it's not profitable
            const basicCalc = this.calculateProfitability(lowestPrice.price, highestPrice.price, 1);
            console.log(`📊 Spread Analysis (1 ETH trade):`);
            console.log(`   Spread: ${basicCalc.spreadPercent.toFixed(4)}%`);
            console.log(`   Gross Profit: $${basicCalc.grossProfitUSD.toFixed(2)}`);
            console.log(`   Gas Cost: $${this.gasEstimateUSD}`);
            console.log(`   Net Profit: $${basicCalc.netProfitUSD.toFixed(2)}`);
            console.log(`   ❌ Not profitable (need >$${this.minProfitUSD})`);
            
            return null;
            
        } catch (error) {
            console.log(`❌ Error scanning: ${error.message}`);
            return null;
        }
    }

    async startScanning() {
        console.log('🚀 Starting profitable opportunity scanner...');
        
        let scanCount = 0;
        let totalOpportunities = 0;
        
        while (true) {
            try {
                scanCount++;
                console.log(`\n📡 Scan #${scanCount} - ${new Date().toLocaleTimeString()}`);
                
                const opportunity = await this.scanForProfitableOpportunities();
                
                if (opportunity) {
                    totalOpportunities++;
                    console.log(`\n🎯 PROFITABLE OPPORTUNITY #${totalOpportunities} FOUND!`);
                    console.log(`💰 Trade Details:`);
                    console.log(`   Pair: WETH/USDC`);
                    console.log(`   Buy: ${opportunity.buyDex} at $${opportunity.buyPrice.toFixed(2)}`);
                    console.log(`   Sell: ${opportunity.sellDex} at $${opportunity.sellPrice.toFixed(2)}`);
                    console.log(`   Optimal Size: ${opportunity.tradeSize} ETH`);
                    console.log(`   Spread: ${opportunity.spreadPercent.toFixed(4)}%`);
                    console.log(`   Gross Profit: $${opportunity.grossProfitUSD.toFixed(2)}`);
                    console.log(`   Gas Cost: $${this.gasEstimateUSD}`);
                    console.log(`   Net Profit: $${opportunity.netProfitUSD.toFixed(2)} (${opportunity.netProfitETH.toFixed(4)} ETH)`);
                    console.log(`   ROI: ${opportunity.roi.toFixed(2)}%`);
                    console.log(`\n🚨 EXECUTE THIS TRADE FOR REAL PROFIT! 🚨`);
                    
                    // In a real implementation, you could:
                    // 1. Send alert notification
                    // 2. Execute the trade automatically
                    // 3. Log to database
                    console.log(`📝 Recommendation: Execute ${opportunity.tradeSize} ETH arbitrage trade`);
                    
                } else {
                    console.log(`😴 No profitable opportunities this scan (${totalOpportunities} total found)`);
                }
                
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
    console.log('💰 PROFITABLE ARBITRAGE SCANNER v1.0');
    console.log('🎯 Only alerts when trades are actually profitable');
    console.log('💡 Accounts for gas costs and minimum profit targets');
    
    const scanner = new ProfitableArbitrageScanner();
    
    try {
        const initialized = await scanner.initialize();
        if (initialized) {
            await scanner.startScanning();
        }
    } catch (error) {
        console.error(`❌ Fatal error: ${error.message}`);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('\n🛑 Profitable scanner stopped');
    console.log('💰 Thanks for using the profitable arbitrage scanner!');
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ProfitableArbitrageScanner;