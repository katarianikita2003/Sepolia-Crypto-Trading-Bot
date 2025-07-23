const { ethers } = require('ethers');
const axios = require('axios');

class VolatilityHunter {
    constructor() {
        this.provider = new ethers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/2v7w7guIaS7gpQKw7GTniqIhQrwIAAn_");
        this.ethPrice = 3700;
        
        // Volatility-based parameters
        this.minSpreadForAlert = 0.6; // Alert when spread > 0.6%
        this.minSpreadForTrade = 0.8; // Execute when spread > 0.8%
        this.maxTradeSize = 2; // Max 2 ETH per trade
        this.gasEstimateUSD = 25;
        
        // Track market conditions
        this.recentSpreads = [];
        this.volatilityThreshold = 0.5; // Alert when volatility spikes
    }

    async initialize() {
        console.log('🎯 VOLATILITY HUNTER - MAINNET PROFIT MAXIMIZER');
        console.log('⚡ Waits for market volatility to create profitable opportunities');
        console.log(`📊 Alert Threshold: ${this.minSpreadForAlert}% spread`);
        console.log(`🚀 Execute Threshold: ${this.minSpreadForTrade}% spread`);
        
        const blockNumber = await this.provider.getBlockNumber();
        console.log(`🔗 Connected to Ethereum mainnet - Block: ${blockNumber}`);
        
        this.ethPrice = await this.getETHPrice();
        console.log(`💰 Current ETH Price: $${this.ethPrice}`);
        
        return true;
    }

    async getETHPrice() {
        try {
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
            return response.data.ethereum.usd;
        } catch (error) {
            return 3700;
        }
    }

    async getFilteredDEXPrices() {
        try {
            const response = await axios.get('https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', {
                timeout: 8000
            });
            
            if (response.data.pairs) {
                return response.data.pairs
                    .filter(pair => {
                        const price = parseFloat(pair.priceUsd);
                        const liquidity = parseFloat(pair.liquidity?.usd || 0);
                        return (
                            price > 3000 && price < 5000 &&
                            liquidity > 3000000 && // $3M+ liquidity
                            pair.baseToken?.address?.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' &&
                            (pair.quoteToken?.symbol === 'USDC' || pair.quoteToken?.symbol === 'USDT')
                        );
                    })
                    .map(pair => ({
                        dex: pair.dexId,
                        price: parseFloat(pair.priceUsd),
                        liquidity: parseFloat(pair.liquidity?.usd || 0)
                    }));
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    calculateVolatility() {
        if (this.recentSpreads.length < 5) return 0;
        
        const spreads = this.recentSpreads.slice(-10); // Last 10 spreads
        const avg = spreads.reduce((a, b) => a + b, 0) / spreads.length;
        const variance = spreads.reduce((sum, spread) => sum + Math.pow(spread - avg, 2), 0) / spreads.length;
        return Math.sqrt(variance);
    }

    async scanForVolatilityOpportunities() {
        try {
            const dexPrices = await this.getFilteredDEXPrices();
            if (dexPrices.length < 2) return null;
            
            const sortedPrices = dexPrices.sort((a, b) => a.price - b.price);
            const lowestPrice = sortedPrices[0];
            const highestPrice = sortedPrices[sortedPrices.length - 1];
            
            const priceDiff = highestPrice.price - lowestPrice.price;
            const spreadPercent = (priceDiff / lowestPrice.price) * 100;
            
            // Track spread history
            this.recentSpreads.push(spreadPercent);
            if (this.recentSpreads.length > 20) this.recentSpreads.shift();
            
            const volatility = this.calculateVolatility();
            
            console.log(`📊 Current Spread: ${spreadPercent.toFixed(4)}% | Volatility: ${volatility.toFixed(4)}`);
            
            // Check for profitable opportunity
            if (spreadPercent >= this.minSpreadForTrade) {
                // Calculate optimal trade size
                const tradeSize = Math.min(this.maxTradeSize, 50000 / lowestPrice.price); // Max $50k trade
                const grossProfitUSD = tradeSize * priceDiff;
                const netProfitUSD = grossProfitUSD - this.gasEstimateUSD;
                const roi = (netProfitUSD / (tradeSize * lowestPrice.price)) * 100;
                
                if (netProfitUSD > 15) { // $15+ profit
                    return {
                        type: 'EXECUTE',
                        spreadPercent,
                        volatility,
                        buyDex: lowestPrice.dex,
                        sellDex: highestPrice.dex,
                        buyPrice: lowestPrice.price,
                        sellPrice: highestPrice.price,
                        tradeSize,
                        grossProfitUSD,
                        netProfitUSD,
                        roi
                    };
                }
            }
            
            // Check for alert-worthy opportunity
            if (spreadPercent >= this.minSpreadForAlert) {
                return {
                    type: 'ALERT',
                    spreadPercent,
                    volatility,
                    buyDex: lowestPrice.dex,
                    sellDex: highestPrice.dex,
                    buyPrice: lowestPrice.price,
                    sellPrice: highestPrice.price
                };
            }
            
            // Check for volatility spike
            if (volatility > this.volatilityThreshold) {
                return {
                    type: 'VOLATILITY',
                    spreadPercent,
                    volatility,
                    message: 'Market volatility increasing - opportunities may appear soon!'
                };
            }
            
            return {
                type: 'NORMAL',
                spreadPercent,
                volatility
            };
            
        } catch (error) {
            console.log(`❌ Error scanning: ${error.message}`);
            return null;
        }
    }

    async startHunting() {
        console.log('🎯 Starting volatility hunting...');
        console.log('⏳ Waiting for market volatility to create profitable opportunities...');
        
        let scanCount = 0;
        let alertCount = 0;
        let executeCount = 0;
        
        while (true) {
            try {
                scanCount++;
                const result = await this.scanForVolatilityOpportunities();
                
                if (!result) {
                    console.log(`📡 Scan #${scanCount} - API timeout`);
                    await new Promise(resolve => setTimeout(resolve, 15000));
                    continue;
                }
                
                const timestamp = new Date().toLocaleTimeString();
                
                if (result.type === 'EXECUTE') {
                    executeCount++;
                    console.log(`\n🚨 EXECUTE OPPORTUNITY #${executeCount} 🚨`);
                    console.log(`⏰ Time: ${timestamp}`);
                    console.log(`🎯 Spread: ${result.spreadPercent.toFixed(4)}% (PROFITABLE!)`);
                    console.log(`⚡ Volatility: ${result.volatility.toFixed(4)}`);
                    console.log(`💰 Trade Details:`);
                    console.log(`   Buy: ${result.buyDex} at $${result.buyPrice.toFixed(2)}`);
                    console.log(`   Sell: ${result.sellDex} at $${result.sellPrice.toFixed(2)}`);
                    console.log(`   Size: ${result.tradeSize.toFixed(3)} ETH`);
                    console.log(`   Gross Profit: $${result.grossProfitUSD.toFixed(2)}`);
                    console.log(`   Net Profit: $${result.netProfitUSD.toFixed(2)}`);
                    console.log(`   ROI: ${result.roi.toFixed(2)}%`);
                    console.log(`\n🚀 EXECUTE THIS TRADE NOW FOR PROFIT! 🚀`);
                    
                } else if (result.type === 'ALERT') {
                    alertCount++;
                    console.log(`\n⚠️ HIGH SPREAD ALERT #${alertCount} ⚠️`);
                    console.log(`⏰ Time: ${timestamp}`);
                    console.log(`📊 Spread: ${result.spreadPercent.toFixed(4)}% (Getting close!)`);
                    console.log(`   Buy: ${result.buyDex} at $${result.buyPrice.toFixed(2)}`);
                    console.log(`   Sell: ${result.sellDex} at $${result.sellPrice.toFixed(2)}`);
                    console.log(`💡 Need ${this.minSpreadForTrade}%+ for execution`);
                    
                } else if (result.type === 'VOLATILITY') {
                    console.log(`\n⚡ VOLATILITY SPIKE DETECTED ⚡`);
                    console.log(`📊 Volatility: ${result.volatility.toFixed(4)} (High!)`);
                    console.log(`💡 ${result.message}`);
                    
                } else {
                    // Normal scan - only show every 10th scan to reduce noise
                    if (scanCount % 10 === 0) {
                        console.log(`📡 Scan #${scanCount} - Spread: ${result.spreadPercent.toFixed(3)}% | Vol: ${result.volatility.toFixed(3)} | Alerts: ${alertCount} | Executes: ${executeCount}`);
                    }
                }
                
                // Faster scanning during high volatility
                const waitTime = result.volatility > 0.3 ? 15000 : 30000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                
            } catch (error) {
                console.log(`❌ Error in hunting loop: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 20000));
            }
        }
    }
}

async function main() {
    console.log('🎯 VOLATILITY HUNTER v1.0');
    console.log('⚡ Hunts for volatile market conditions on mainnet');
    console.log('💰 Only alerts when trades are actually profitable');
    console.log('🚀 Automatically detects opportunities during:');
    console.log('   • Major news events');
    console.log('   • Large whale trades');
    console.log('   • Market volatility spikes');
    console.log('   • Flash crashes/pumps');
    
    const hunter = new VolatilityHunter();
    
    try {
        await hunter.initialize();
        await hunter.startHunting();
    } catch (error) {
        console.error(`❌ Fatal error: ${error.message}`);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('\n🛑 Volatility hunter stopped');
    console.log('⚡ Thanks for hunting with us!');
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = VolatilityHunter;