const { ethers } = require('ethers');
const axios = require('axios');

// Mainnet token addresses
const TOKENS = {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86a33E6417aAb2C8a54C2C40B6Da7A8b2c44E",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
};

class ReliableMainnetArbitrageBot {
    constructor() {
        this.provider = new ethers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/2v7w7guIaS7gpQKw7GTniqIhQrwIAAn_");
        this.ethPrice = 3700; // Default ETH price
    }

    async initialize() {
        console.log('🚀 RELIABLE MAINNET ARBITRAGE SCANNER v2.0');
        console.log('🔍 Using multiple reliable price sources');
        
        try {
            const blockNumber = await this.provider.getBlockNumber();
            console.log(`🔗 Connected to Ethereum mainnet - Block: ${blockNumber}`);
            
            // Get current ETH price
            this.ethPrice = await this.getETHPriceFromAPI();
            console.log(`💰 Current ETH Price: $${this.ethPrice}`);
            
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
            return 3700;
        }
    }

    async get1inchQuote(fromToken, toToken, amount) {
        try {
            const amountWei = ethers.parseEther(amount.toString());
            
            // 1inch API v5 (no API key required for quotes)
            const url = `https://api.1inch.io/v5.0/1/quote?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amountWei}`;
            
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.data && response.data.toTokenAmount) {
                const outputAmount = parseFloat(ethers.formatUnits(response.data.toTokenAmount, 6)); // USDC has 6 decimals
                return {
                    source: '1inch',
                    price: outputAmount,
                    protocols: response.data.protocols || []
                };
            }
            
            return null;
        } catch (error) {
            console.log(`⚠️ 1inch API failed: ${error.message}`);
            return null;
        }
    }

    async getParaswapQuote(fromToken, toToken, amount) {
        try {
            const amountWei = ethers.parseEther(amount.toString());
            
            // ParaSwap API
            const url = `https://apiv5.paraswap.io/prices/?srcToken=${fromToken}&destToken=${toToken}&amount=${amountWei}&srcDecimals=18&destDecimals=6&side=SELL&network=1`;
            
            const response = await axios.get(url, {
                timeout: 5000
            });
            
            if (response.data && response.data.priceRoute) {
                const outputAmount = parseFloat(ethers.formatUnits(response.data.priceRoute.destAmount, 6));
                return {
                    source: 'ParaSwap',
                    price: outputAmount,
                    exchanges: response.data.priceRoute.bestRoute?.map(r => r.exchange) || []
                };
            }
            
            return null;
        } catch (error) {
            console.log(`⚠️ ParaSwap API failed: ${error.message}`);
            return null;
        }
    }

    async getCowswapQuote(fromToken, toToken, amount) {
        try {
            const amountWei = ethers.parseEther(amount.toString());
            
            // CoW Protocol API
            const quoteRequest = {
                sellToken: fromToken,
                buyToken: toToken,
                sellAmountBeforeFee: amountWei.toString(),
                kind: 'sell'
            };
            
            const response = await axios.post('https://api.cow.fi/mainnet/api/v1/quote', quoteRequest, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data && response.data.buyAmount) {
                const outputAmount = parseFloat(ethers.formatUnits(response.data.buyAmount, 6));
                return {
                    source: 'CoW Protocol',
                    price: outputAmount,
                    feeAmount: response.data.feeAmount
                };
            }
            
            return null;
        } catch (error) {
            console.log(`⚠️ CoW Protocol API failed: ${error.message}`);
            return null;
        }
    }

    async getFilteredDEXPrices() {
        try {
            // Get prices from DEXScreener but filter properly
            const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${TOKENS.WETH}`, {
                timeout: 10000
            });
            
            if (response.data.pairs && response.data.pairs.length > 0) {
                const validPrices = response.data.pairs
                    .filter(pair => {
                        // Filter out bad data
                        const price = parseFloat(pair.priceUsd);
                        const liquidity = parseFloat(pair.liquidity?.usd || 0);
                        
                        return (
                            price > 3000 && price < 5000 && // Reasonable ETH price range
                            liquidity > 1000000 && // At least $1M liquidity
                            pair.baseToken?.address?.toLowerCase() === TOKENS.WETH.toLowerCase() &&
                            (pair.quoteToken?.symbol === 'USDC' || pair.quoteToken?.symbol === 'USDT')
                        );
                    })
                    .map(pair => ({
                        dex: pair.dexId,
                        price: parseFloat(pair.priceUsd),
                        liquidity: parseFloat(pair.liquidity?.usd || 0),
                        volume24h: parseFloat(pair.volume?.h24 || 0),
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

    async findRealArbitrageOpportunities() {
        console.log('🔍 Scanning RELIABLE price sources...');
        
        const opportunities = [];
        
        try {
            // Method 1: Check aggregator price differences
            console.log('📊 Fetching quotes from major aggregators...');
            
            const [oneInchQuote, paraswapQuote, cowswapQuote] = await Promise.allSettled([
                this.get1inchQuote(TOKENS.WETH, TOKENS.USDC, 1),
                this.getParaswapQuote(TOKENS.WETH, TOKENS.USDC, 1),
                this.getCowswapQuote(TOKENS.WETH, TOKENS.USDC, 1)
            ]);
            
            const validQuotes = [];
            
            if (oneInchQuote.status === 'fulfilled' && oneInchQuote.value) {
                validQuotes.push(oneInchQuote.value);
                console.log(`🔸 1inch: ${oneInchQuote.value.price.toFixed(2)} USDC per ETH`);
            }
            
            if (paraswapQuote.status === 'fulfilled' && paraswapQuote.value) {
                validQuotes.push(paraswapQuote.value);
                console.log(`🔸 ParaSwap: ${paraswapQuote.value.price.toFixed(2)} USDC per ETH`);
            }
            
            if (cowswapQuote.status === 'fulfilled' && cowswapQuote.value) {
                validQuotes.push(cowswapQuote.value);
                console.log(`🔸 CoW Protocol: ${cowswapQuote.value.price.toFixed(2)} USDC per ETH`);
            }
            
            if (validQuotes.length >= 2) {
                // Find best spread between aggregators
                const sortedQuotes = validQuotes.sort((a, b) => a.price - b.price);
                const lowestQuote = sortedQuotes[0];
                const highestQuote = sortedQuotes[sortedQuotes.length - 1];
                
                const priceDiff = highestQuote.price - lowestQuote.price;
                const spreadPercent = (priceDiff / lowestQuote.price) * 100;
                
                console.log(`💡 Best Aggregator Spread: ${spreadPercent.toFixed(4)}%`);
                console.log(`   Buy route: ${lowestQuote.source} at ${lowestQuote.price.toFixed(2)} USDC`);
                console.log(`   Sell route: ${highestQuote.source} at ${highestQuote.price.toFixed(2)} USDC`);
                
                if (spreadPercent > 0.1) { // 0.1% minimum spread
                    const tradeAmountETH = 0.05; // Small test trade
                    const grossProfitUSDC = tradeAmountETH * priceDiff;
                    const estimatedGasCostUSD = 25; // $25 in gas
                    const netProfitUSD = grossProfitUSDC - estimatedGasCostUSD;
                    const netProfitETH = netProfitUSD / this.ethPrice;
                    
                    console.log(`💰 Potential Profit (${tradeAmountETH} ETH trade):`);
                    console.log(`   Gross: ${grossProfitUSDC.toFixed(2)} USDC`);
                    console.log(`   Gas Cost: ~$${estimatedGasCostUSD}`);
                    console.log(`   Net: $${netProfitUSD.toFixed(2)} (${netProfitETH.toFixed(6)} ETH)`);
                    
                    if (netProfitETH > 0.001) { // At least 0.001 ETH profit
                        opportunities.push({
                            pair: 'WETH/USDC',
                            buySource: lowestQuote.source,
                            sellSource: highestQuote.source,
                            buyPrice: lowestQuote.price,
                            sellPrice: highestQuote.price,
                            spread: spreadPercent,
                            estimatedProfitETH: netProfitETH,
                            estimatedProfitUSD: netProfitUSD,
                            tradeAmount: tradeAmountETH,
                            confidence: 'HIGH' // Aggregator quotes are reliable
                        });
                    }
                }
            }
            
            // Method 2: Check filtered DEX prices
            console.log('📊 Checking filtered DEX prices...');
            const dexPrices = await this.getFilteredDEXPrices();
            
            if (dexPrices.length >= 2) {
                console.log(`📈 Found ${dexPrices.length} valid DEX prices:`);
                dexPrices.forEach(price => {
                    console.log(`   ${price.dex}: $${price.price.toFixed(2)} (Liquidity: $${(price.liquidity/1000000).toFixed(1)}M)`);
                });
                
                const sortedDEXPrices = dexPrices.sort((a, b) => a.price - b.price);
                const lowestDEX = sortedDEXPrices[0];
                const highestDEX = sortedDEXPrices[sortedDEXPrices.length - 1];
                
                const dexPriceDiff = highestDEX.price - lowestDEX.price;
                const dexSpreadPercent = (dexPriceDiff / lowestDEX.price) * 100;
                
                console.log(`💡 Best DEX Spread: ${dexSpreadPercent.toFixed(4)}%`);
                console.log(`   Buy on: ${lowestDEX.dex} at $${lowestDEX.price.toFixed(2)}`);
                console.log(`   Sell on: ${highestDEX.dex} at $${highestDEX.price.toFixed(2)}`);
                
                if (dexSpreadPercent > 0.05 && opportunities.length === 0) { // Only if no aggregator opportunity found
                    opportunities.push({
                        pair: 'WETH/USDC',
                        buySource: lowestDEX.dex,
                        sellSource: highestDEX.dex,
                        buyPrice: lowestDEX.price,
                        sellPrice: highestDEX.price,
                        spread: dexSpreadPercent,
                        tradeAmount: 0.05,
                        confidence: 'MEDIUM' // DEX prices less reliable
                    });
                }
            }
            
        } catch (error) {
            console.log(`❌ Error scanning opportunities: ${error.message}`);
        }
        
        return opportunities;
    }

    async scanContinuously() {
        console.log('🚀 Starting RELIABLE continuous scanning...');
        
        let scanCount = 0;
        
        while (true) {
            try {
                scanCount++;
                console.log(`\n📡 Scan #${scanCount} - ${new Date().toLocaleTimeString()}`);
                
                const opportunities = await this.findRealArbitrageOpportunities();
                
                if (opportunities.length > 0) {
                    const opp = opportunities[0];
                    console.log(`🎯 REAL OPPORTUNITY FOUND!`);
                    console.log(`   Pair: ${opp.pair}`);
                    console.log(`   Spread: ${opp.spread.toFixed(4)}%`);
                    console.log(`   Buy: ${opp.buySource} at $${opp.buyPrice.toFixed(2)}`);
                    console.log(`   Sell: ${opp.sellSource} at $${opp.sellPrice.toFixed(2)}`);
                    console.log(`   Confidence: ${opp.confidence}`);
                    
                    if (opp.estimatedProfitETH) {
                        console.log(`   Potential Profit: ${opp.estimatedProfitETH.toFixed(6)} ETH ($${opp.estimatedProfitUSD.toFixed(2)})`);
                    }
                    
                    console.log(`✅ This is a REAL opportunity that could be profitable!`);
                    
                } else {
                    console.log('😴 No profitable opportunities found this scan');
                }
                
                console.log('⏳ Waiting 60 seconds before next scan...');
                await new Promise(resolve => setTimeout(resolve, 60000));
                
            } catch (error) {
                console.log(`❌ Error in scan loop: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
    }
}

// Main execution
async function main() {
    console.log('🌟 RELIABLE MAINNET ARBITRAGE SCANNER v2.0');
    console.log('✅ Fixed bad data filtering');
    console.log('🎯 Using reliable aggregator APIs');
    
    const bot = new ReliableMainnetArbitrageBot();
    
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

process.on('SIGINT', () => {
    console.log('\n🛑 Shutdown signal received');
    console.log('✅ Reliable scanner stopped');
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ReliableMainnetArbitrageBot;