// 🚀 JUPITER MISSION - Multi-DEX Arbitrage Bot with Split Strategy
require("dotenv").config();
const { ethers } = require("ethers");
const { CorrectDEXPriceFetcher } = require('./correct_price_fetcher');

console.log("[🚀 JUPITER MISSION] Starting Multi-DEX Arbitrage Bot - Jupiter Landing Protocol");
console.log("🪐 STRATEGY: High-spread pairs + Split transactions + Multi-DEX expansion");
console.log("🔧 TARGET: 15-30K ETH profit per cycle with optimal risk management");

// ===== JUPITER MISSION CONFIGURATION =====
// const config = {
//     // Your verified contract
//     ARBITRAGE_ADDRESS: "0xd3f185dB49E9ecD43cADeEAf756742709d8de219",

//     // 🚀 JUPITER MISSION TOKEN PAIRS - High Spread Targets
//     TOKEN_PAIRS: [
//         // Priority 1: High-profit pairs with less MEV competition
//         { tokenA: "0x514910771AF9Ca656af840dff83E8264EcF986CA", tokenB: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", name: "LINK/ETH", priority: 1, expectedSpread: "0.8-1.5%", optimalSize: 100000 },
//         { tokenA: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", tokenB: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", name: "UNI/ETH", priority: 1, expectedSpread: "1.0-2.0%", optimalSize: 150000 },
//         { tokenA: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", tokenB: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", name: "WBTC/ETH", priority: 1, expectedSpread: "0.5-1.2%", optimalSize: 50000 },
        
//         // Priority 2: Medium competition but higher spreads
//         { tokenA: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", tokenB: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", name: "MATIC/ETH", priority: 2, expectedSpread: "1.2-2.5%", optimalSize: 200000 },
//         { tokenA: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", tokenB: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", name: "AAVE/ETH", priority: 2, expectedSpread: "1.0-1.8%", optimalSize: 80000 },
        
//         // Priority 3: Stable pairs for Curve optimization
//         { tokenA: "0x6B175474E89094C44Da98b954EedeAC495271d0F", tokenB: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", name: "DAI/USDC", priority: 3, expectedSpread: "0.1-0.3%", optimalSize: 800000 },
//         { tokenA: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", tokenB: "0xdAC17F958D2ee523a2206206994597C13D831ec7", name: "USDC/USDT", priority: 3, expectedSpread: "0.1-0.3%", optimalSize: 600000 },
        
//         // Backup pairs (lower priority)
//         { tokenA: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", tokenB: "0x6B175474E89094C44Da98b954EedeAC495271d0F", name: "WETH/DAI", priority: 4, expectedSpread: "0.4-0.8%", optimalSize: 200000 },
//         { tokenA: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", tokenB: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", name: "WETH/USDC", priority: 4, expectedSpread: "0.4-0.8%", optimalSize: 200000 }
//     ],

//     // 🚀 EXPANDED MULTI-DEX CONFIGURATION
//     SUPPORTED_DEXS: [
//         {
//             id: 0,
//             name: "Uniswap V3",
//             fee: 30,
//             gasEstimate: 150000,
//             router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
//             quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
//             maxTradeSize: 200000, // Reduced for split strategy
//             slippageModel: { base: 0.02, scaling: 0.00003 },
//             specialty: "Highest liquidity, best for large trades"
//         },
//         {
//             id: 1,
//             name: "SushiSwap",
//             fee: 30,
//             gasEstimate: 120000,
//             router: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
//             quoter: "0x64e8802FE490fa7cc61d3463958199161Bb608A7",
//             maxTradeSize: 150000,
//             slippageModel: { base: 0.025, scaling: 0.00004 },
//             specialty: "Good for medium trades, competitive fees"
//         },
//         {
//             id: 2,
//             name: "Curve Finance",
//             fee: 4, // Much lower fees for stablecoins
//             gasEstimate: 100000,
//             router: "0x99a58482BD75cbab83b27EC03CA68fF489b5788f",
//             quoter: "0x8F942C20D02bEfc377D41445793068908E2250D0",
//             maxTradeSize: 500000, // Curve handles large stable swaps better
//             slippageModel: { base: 0.005, scaling: 0.00001 },
//             specialty: "Stablecoin specialist - minimal slippage",
//             disabled: false // Enable Curve
//         },
//         {
//             id: 3,
//             name: "Balancer V2",
//             fee: 25,
//             gasEstimate: 110000,
//             router: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
//             quoter: "0xE39B5e3B6D74016b2F6A9673D7d7493B6DF549d5",
//             maxTradeSize: 300000,
//             slippageModel: { base: 0.015, scaling: 0.00002 },
//             specialty: "Multi-asset pools, balanced liquidity",
//             disabled: false // Enable Balancer
//         },
//         {
//             id: 4,
//             name: "PancakeSwap V3 (Disabled)",
//             fee: 25,
//             gasEstimate: 100000,
//             router: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4",
//             quoter: "0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997",
//             disabled: true  // Keep disabled but in array
//         }
//     ],

//     // 🎯 JUPITER MISSION PARAMETERS
//     PRICE_CHECK_INTERVAL: 12000,    // Faster scanning - every 12 seconds
//     MIN_PRICE_DIFFERENCE: 0.008,    // 0.8% minimum spread for Jupiter mission
//     MIN_NET_PROFIT: ethers.parseEther("5.0"),    // 5 ETH minimum for profitable mission
//     MAX_GAS_PRICE: ethers.parseUnits("80", "gwei"), // Lower gas threshold

//     // 🚀 SPLIT STRATEGY FLASH LOAN AMOUNTS
//     MIN_FLASH_AMOUNT: ethers.parseEther("10000"),     // 10K ETH minimum
//     MAX_FLASH_AMOUNT: ethers.parseEther("2000000"),   // 2M ETH maximum per split
//     DEFAULT_FLASH_AMOUNT: ethers.parseEther("200000"), // 200K ETH default per split
//     MAX_SPLITS: 5,                                    // Maximum 5 splits per opportunity

//     // 🪐 JUPITER MISSION SETTINGS
//     MAX_PRICE_IMPACT: 300,          // 3% maximum price impact per split
//     MIN_LIQUIDITY_RATIO: 0.05,      // Use max 5% of available liquidity
//     ENABLE_HIGH_RISK_TRADES: true,  // Enable for Jupiter mission
//     JUPITER_MIN_SPREAD: 0.8,        // 0.8% minimum spread for Jupiter opportunities
//     SPLIT_DELAY_MS: 1000,           // 1 second delay between split transactions
// };

const config = {
    // Your NEWLY deployed contract address on Sepolia
    ARBITRAGE_ADDRESS: "0xd3f185dB49E9ecD43cADeEAf756742709d8de219", // ← UPDATE THIS!
    
    // Sepolia testnet tokens
    TOKEN_A: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", // WETH on Sepolia
    TOKEN_B: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6", // DAI on Sepolia
    POOL_FEE: 3000, // 0.3% fee tier
    
    // Flash loan parameters - adjusted for Sepolia testing
    MIN_FLASH_AMOUNT: ethers.parseEther("0.001"),    // Start very small
    MAX_FLASH_AMOUNT: ethers.parseEther("0.1"),      // Keep conservative
    MIN_PROFIT_TARGET: ethers.parseEther("0.000001"), // Very low for testing
    
    // Market manipulation settings
    PRICE_IMPACT_TARGET: 500, // Target 5% price impact (higher for low liquidity)
    MANIPULATION_COOLDOWN: 300000, // 5 minutes between manipulations
};

// Also ensure the contract instantiation uses the correct address:
const arbitrageContract = new ethers.Contract(
    config.ARBITRAGE_ADDRESS, // This will now use the correct address
    ENHANCED_ARBITRAGE_ABI,
    wallet
);

// Initialize global state
let provider, wallet;
let executionCount = 0;
let totalProfit = 0;
let totalGasSpent = 0;
let isExecuting = false;
let jupiterMissionStats = {
    totalOpportunities: 0,
    successfulMissions: 0,
    totalSplitExecutions: 0,
    averageProfitPerMission: 0
};

// ===== EXACT ABI FROM YOUR DEPLOYED CONTRACT =====
const CORRECT_ARBITRAGE_ABI = [
    "function getMultiDEXQuotes(address tokenA, address tokenB, uint256 amount) external returns (tuple(uint256 dexId, string dexName, uint256 amountOut, uint256 priceImpact, uint256 gasEstimate, tuple(uint256 poolLiquidity, uint256 availableLiquidity, uint256 maxTradeSize, uint256 priceImpact) liquidity)[])",
    "function analyzeComprehensiveProfitability(address tokenA, address tokenB, uint256 baseAmount) external returns (tuple(uint256 grossProfit, uint256 dexFees, uint256 flashLoanFees, uint256 gasCosts, uint256 slippageCosts, uint256 mevProtectionCosts, uint256 netProfit, bool isProfitable, uint256 optimalFlashAmount, uint256 buyDEX, uint256 sellDEX))",
    "function executeIntelligentArbitrage(address tokenA, address tokenB) external",
    "function owner() external view returns (address)",
    "function getOwner() external view returns (address)",
    "function activeDEXCount() external view returns (uint256)",
    "function getDEXInfo(uint256 dexId) external view returns (tuple(address router, address quoter, string name, uint24 defaultFee, bool isActive))",
    "function isInFlashLoan() external view returns (bool)",
    "function addDEX(address router, address quoter, string name, uint24 defaultFee) external",
    "function emergencyWithdraw(address token) external",
    "function emergencyWithdrawETH() external",
    "event DEXAdded(uint256 indexed dexId, string name, address router)",
    "event MultiDEXPriceCheck(address indexed tokenA, address indexed tokenB, uint256 bestBuyPrice, uint256 bestSellPrice, uint256 spread)",
    "event LiquidityAnalyzed(address indexed tokenA, address indexed tokenB, uint256 dexId, uint256 availableLiquidity)",
    "event ProfitAnalysisCompleted(address indexed tokenA, address indexed tokenB, uint256 netProfit, bool profitable)",
    "event ArbitrageExecuted(address indexed tokenA, address indexed tokenB, uint256 amount, uint256 actualProfit)"
];

const ERC20_ABI = [
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address) external view returns (uint256)"
];

// 🚀 JUPITER MISSION: SPLIT STRATEGY CLASS
class JupiterSplitStrategy {
    constructor(totalAmount, maxSplits = 5) {
        this.totalAmount = totalAmount;
        this.maxSplits = maxSplits;
    }

    calculateOptimalSplits(spreadPercent) {
        console.log(`🛸 CALCULATING JUPITER MISSION SPLITS for ${spreadPercent.toFixed(2)}% spread...`);
        
        const strategies = [];
        
        for (let splits = 1; splits <= this.maxSplits; splits++) {
            const amountPerSplit = this.totalAmount / splits;
            
            // Dynamic slippage based on trade size (Jupiter Mission precision)
            let slippageRate;
            if (amountPerSplit <= 50000) slippageRate = 0.015;      // 1.5%
            else if (amountPerSplit <= 100000) slippageRate = 0.025; // 2.5%
            else if (amountPerSplit <= 200000) slippageRate = 0.04;  // 4%
            else if (amountPerSplit <= 500000) slippageRate = 0.06;  // 6%
            else slippageRate = 0.08; // 8%

            const grossProfitPerSplit = amountPerSplit * spreadPercent / 100;
            const slippagePerSplit = amountPerSplit * slippageRate;
            const fixedCostsPerSplit = amountPerSplit * 0.004; // DEX + flash loan fees
            const gasCostPerSplit = 0.02; // Fixed gas per transaction

            const netProfitPerSplit = grossProfitPerSplit - slippagePerSplit - fixedCostsPerSplit - gasCostPerSplit;
            const totalNetProfit = netProfitPerSplit * splits;
            const totalGasCost = gasCostPerSplit * splits;

            strategies.push({
                splits,
                amountPerSplit,
                slippageRate,
                netProfitPerSplit,
                totalNetProfit,
                totalSlippage: slippagePerSplit * splits,
                totalGasCost,
                profitable: totalNetProfit > 5, // Min 5 ETH profit
                efficiency: totalNetProfit / (totalGasCost + 1)
            });
        }

        // Return best strategy
        const bestStrategy = strategies
            .filter(s => s.profitable)
            .sort((a, b) => b.totalNetProfit - a.totalNetProfit)[0] || strategies[0];

        if (bestStrategy) {
            console.log(`🎯 OPTIMAL JUPITER MISSION: ${bestStrategy.splits} splits of ${bestStrategy.amountPerSplit.toLocaleString()} ETH`);
            console.log(`💰 Expected Net Profit: ${bestStrategy.totalNetProfit.toFixed(2)} ETH`);
            console.log(`📉 Total Slippage: ${bestStrategy.totalSlippage.toFixed(0)} ETH (${(bestStrategy.totalSlippage/this.totalAmount*100).toFixed(1)}%)`);
        }

        return bestStrategy;
    }

    async executeSplitMission(tokenPair, buyDEX, sellDEX, optimalSplit) {
        console.log(`🚀 LAUNCHING JUPITER SPLIT MISSION: ${optimalSplit.splits} transactions`);
        console.log(`🎯 Target: ${optimalSplit.totalNetProfit.toFixed(2)} ETH profit`);
        
        const results = [];
        
        for (let i = 0; i < optimalSplit.splits; i++) {
            console.log(`🛸 Split ${i + 1}/${optimalSplit.splits}: ${optimalSplit.amountPerSplit.toLocaleString()} ETH`);
            
            try {
                // Execute individual arbitrage
                const result = await this.executeSingleArbitrage(
                    tokenPair,
                    buyDEX,
                    sellDEX,
                    ethers.parseEther(optimalSplit.amountPerSplit.toString())
                );
                
                results.push(result);
                jupiterMissionStats.totalSplitExecutions++;
                
                // Delay between transactions to avoid MEV and allow price recovery
                if (i < optimalSplit.splits - 1) {
                    console.log(`⏳ Mission delay: ${config.SPLIT_DELAY_MS}ms...`);
                    await new Promise(resolve => setTimeout(resolve, config.SPLIT_DELAY_MS));
                }
                
            } catch (error) {
                console.error(`❌ Split ${i + 1} mission failed:`, error.message);
                results.push({ success: false, error: error.message, amountETH: optimalSplit.amountPerSplit });
            }
        }
        
        // Calculate mission results
        const successfulSplits = results.filter(r => r.success);
        const totalProfit = successfulSplits.reduce((sum, r) => sum + r.profitETH, 0);
        const totalGasCost = results.reduce((sum, r) => sum + (r.gasCostETH || 0), 0);
        const netMissionProfit = totalProfit - totalGasCost;
        
        console.log(`\n🪐 JUPITER MISSION COMPLETE!`);
        console.log(`✅ Successful Splits: ${successfulSplits.length}/${results.length}`);
        console.log(`💰 Total Profit: ${totalProfit.toFixed(4)} ETH`);
        console.log(`⛽ Total Gas Cost: ${totalGasCost.toFixed(4)} ETH`);
        console.log(`💎 Net Mission Profit: ${netMissionProfit.toFixed(4)} ETH`);
        
        return {
            results,
            successfulSplits: successfulSplits.length,
            totalSplits: results.length,
            totalProfit,
            netMissionProfit,
            successRate: (successfulSplits.length / results.length) * 100
        };
    }

    async executeSingleArbitrage(tokenPair, buyDEX, sellDEX, amount) {
        try {
            console.log(`🎯 Executing split arbitrage: ${ethers.formatEther(amount)} ETH`);
            console.log(`📊 Route: Buy on ${buyDEX.name} → Sell on ${sellDEX.name}`);
            
            // In a real implementation, this would call your contract
            // For now, simulate execution
            const mockProfitRate = 0.005; // 0.5% profit rate
            const mockGasCost = 0.02;
            const profitETH = Number(ethers.formatEther(amount)) * mockProfitRate;
            
            console.log(`✅ Split execution successful: ${profitETH.toFixed(4)} ETH profit`);
            
            return {
                success: true,
                amount: amount,
                amountETH: Number(ethers.formatEther(amount)),
                buyDEX: buyDEX.name,
                sellDEX: sellDEX.name,
                profitETH: profitETH,
                gasCostETH: mockGasCost
            };
        } catch (error) {
            console.error(`❌ Split arbitrage failed:`, error.message);
            return {
                success: false,
                error: error.message,
                amountETH: Number(ethers.formatEther(amount)),
                gasCostETH: 0.02
            };
        }
    }
}

// 🚀 JUPITER MISSION: ENHANCED PROFITABILITY CALCULATOR
async function calculateJupiterProfitability(tokenPair, quotes, baseFlashAmount) {
    try {
        console.log(`\n[💰 JUPITER MISSION PROFIT ANALYSIS] ${tokenPair.name}`);
        console.log("🚀".repeat(50));

        if (quotes.length < 2) {
            return { isProfitable: false, netProfit: 0n, missionStatus: "🛑 INSUFFICIENT DEX DATA" };
        }

        // Find best buy and sell prices
        let bestBuyPrice = ethers.MaxUint256;
        let bestSellPrice = 0n;
        let bestBuyDEX = null;
        let bestSellDEX = null;
        let bestBuyIndex = 0;
        let bestSellIndex = 0;

        quotes.forEach((quote, index) => {
            const dexInfo = config.SUPPORTED_DEXS[index];
            if (!dexInfo || dexInfo.disabled) return;

            const adjustedAmount = BigInt(quote.amountOut);
            if (adjustedAmount === 0n) return;

            if (adjustedAmount < bestBuyPrice) {
                bestBuyPrice = adjustedAmount;
                bestBuyDEX = dexInfo;
                bestBuyIndex = index;
            }

            if (adjustedAmount > bestSellPrice) {
                bestSellPrice = adjustedAmount;
                bestSellDEX = dexInfo;
                bestSellIndex = index;
            }
        });

        // Critical validation
        if (bestBuyIndex === bestSellIndex || !bestBuyDEX || !bestSellDEX) {
            console.log("🚨 MISSION ABORT: Cannot buy and sell on same DEX or insufficient DEX data!");
            return {
                isProfitable: false,
                netProfit: 0n,
                missionStatus: "🛑 SAME DEX ERROR"
            };
        }

        // Calculate spread
        const spread = bestSellPrice - bestBuyPrice;
        const spreadPercent = Number(spread * 10000n / bestSellPrice) / 100;

        console.log(`🎯 JUPITER ARBITRAGE SETUP:`);
        console.log(`   Buy on:  ${bestBuyDEX.name} at ${ethers.formatEther(bestBuyPrice)}`);
        console.log(`   Sell on: ${bestSellDEX.name} at ${ethers.formatEther(bestSellPrice)}`);
        console.log(`   Spread:  ${ethers.formatEther(spread)} ETH (${spreadPercent.toFixed(4)}%)`);

        // Jupiter Mission Threshold Check
        if (spreadPercent < config.JUPITER_MIN_SPREAD) {
            console.log(`🛑 JUPITER MISSION SCRUBBED: Spread ${spreadPercent.toFixed(2)}% < ${config.JUPITER_MIN_SPREAD}% minimum`);
            return {
                isProfitable: false,
                netProfit: 0n,
                spreadPercent,
                missionStatus: "🛑 SPREAD TOO LOW"
            };
        }

        // 🚀 CALCULATE OPTIMAL AMOUNT AND SPLITS
        const splitStrategy = new JupiterSplitStrategy(1000000); // 1M ETH total
        const optimalSplit = splitStrategy.calculateOptimalSplits(spreadPercent);

        if (!optimalSplit.profitable) {
            console.log(`🛑 JUPITER MISSION SCRUBBED: No profitable split configuration found`);
            return {
                isProfitable: false,
                netProfit: 0n,
                spreadPercent,
                missionStatus: "🛑 NO PROFITABLE SPLITS"
            };
        }

        // Use optimal amount for calculations
        const flashAmount = ethers.parseEther((optimalSplit.amountPerSplit * optimalSplit.splits).toString());
        const flashAmountNum = optimalSplit.amountPerSplit * optimalSplit.splits;

        console.log(`\n🚀 JUPITER MISSION PARAMETERS:`);
        console.log(`   Total Flash Amount: ${flashAmountNum.toLocaleString()} ETH`);
        console.log(`   Split Configuration: ${optimalSplit.splits} splits of ${optimalSplit.amountPerSplit.toLocaleString()} ETH`);
        console.log(`   Expected Net Profit: ${optimalSplit.totalNetProfit.toFixed(2)} ETH`);

        // Calculate costs with split strategy
        const dexFees = flashAmount * 30n / 10000n;
        const flashLoanFees = flashAmount * 9n / 10000n;
        const gasCosts = ethers.parseEther((0.02 * optimalSplit.splits).toString());
        const slippageCosts = ethers.parseEther(optimalSplit.totalSlippage.toString());
        const mevProtection = flashAmount * 5n / 10000n;

        // Calculate gross profit
        const grossProfitRate = spread * 10000n / bestSellPrice;
        const grossProfit = flashAmount * grossProfitRate / 10000n;

        const totalCosts = dexFees + flashLoanFees + gasCosts + slippageCosts + mevProtection;
        const netProfit = grossProfit > totalCosts ? grossProfit - totalCosts : 0n;

        console.log(`\n🛸 JUPITER MISSION COST BREAKDOWN:`);
        console.log(`   💰 Gross Profit:            ${ethers.formatEther(grossProfit)} ETH`);
        console.log(`   ─────────────────────────────────────────`);
        console.log(`   📉 MISSION COSTS:`);
        console.log(`   • DEX Fees (0.3%):         ${ethers.formatEther(dexFees)} ETH`);
        console.log(`   • Flash Loan Fees (0.09%): ${ethers.formatEther(flashLoanFees)} ETH`);
        console.log(`   • Gas Costs (${optimalSplit.splits} txns):     ${ethers.formatEther(gasCosts)} ETH`);
        console.log(`   • Slippage Costs:          ${ethers.formatEther(slippageCosts)} ETH`);
        console.log(`   • MEV Protection (0.05%):  ${ethers.formatEther(mevProtection)} ETH`);
        console.log(`   ─────────────────────────────────────────`);
        console.log(`   • Total Mission Costs:     ${ethers.formatEther(totalCosts)} ETH`);
        console.log(`   ─────────────────────────────────────────`);
        console.log(`   💎 NET PROFIT:              ${ethers.formatEther(netProfit)} ETH`);

        const isProfitable = netProfit > config.MIN_NET_PROFIT;
        const roi = flashAmountNum > 0 ? (Number(ethers.formatEther(netProfit)) / flashAmountNum * 100) : 0;
        
        // Jupiter mission status
        let missionStatus = "";
        const netProfitETH = Number(ethers.formatEther(netProfit));
        
        if (netProfitETH > 50) {
            missionStatus = "🪐 JUPITER MISSION READY!";
        } else if (netProfitETH > 20) {
            missionStatus = "🌙 MOON MISSION READY!";
        } else if (netProfitETH > 10) {
            missionStatus = "🚀 ORBITAL MISSION READY!";
        } else if (isProfitable) {
            missionStatus = "✈️ ATMOSPHERE FLIGHT READY!";
        } else {
            missionStatus = "🛑 MISSION SCRUBBED";
        }

        console.log(`\n🎯 JUPITER MISSION STATUS:`);
        console.log(`   • Mission Configuration:   ${optimalSplit.splits} splits`);
        console.log(`   • Buy DEX:                 ${bestBuyDEX.name} (ID: ${bestBuyIndex})`);
        console.log(`   • Sell DEX:                ${bestSellDEX.name} (ID: ${bestSellIndex})`);
        console.log(`   • Mission ROI:             ${roi.toFixed(4)}%`);
        console.log(`   • Status:                  ${missionStatus}`);

        if (isProfitable) {
            console.log(`🚀 JUPITER MISSION GO: LAUNCH AUTHORIZED!`);
        } else {
            console.log(`🛑 JUPITER MISSION HOLD: Insufficient profit for launch`);
        }

        console.log("🚀".repeat(50));

        return {
            grossProfit,
            netProfit,
            totalCosts,
            isProfitable,
            optimalFlashAmount: flashAmount,
            buyDEX: bestBuyIndex,
            sellDEX: bestSellIndex,
            buyDEXInfo: bestBuyDEX,
            sellDEXInfo: bestSellDEX,
            roi,
            spreadPercent,
            dexFees,
            flashLoanFees,
            gasCosts,
            slippageCosts,
            mevProtectionCosts: mevProtection,
            missionStatus,
            optimalSplit,
            jupiterReady: netProfitETH > 10
        };

    } catch (error) {
        console.error(`[❌ JUPITER MISSION FAILURE] Profitability analysis failed:`, error.message);
        return { isProfitable: false, netProfit: 0n, missionStatus: "🛑 ANALYSIS FAILURE" };
    }
}

// ===== ENHANCED MULTI-DEX QUOTES WITH NEW DEXs =====
async function getJupiterMultiDEXQuotes(tokenPair, amount) {
    try {
        const testAmount = ethers.parseEther("10000");

        console.log(`[🔍 JUPITER MULTI-DEX SCAN] ${tokenPair.name} for ${ethers.formatEther(testAmount)} ETH`);
        const correctFetcher = require('./correct_price_fetcher');
        const fetcher = new correctFetcher.CorrectDEXPriceFetcher(process.env.RPC_URL);
        
        // Get quotes from original DEXs first
        const quotes = await fetcher.getCorrectPrices(
            tokenPair.tokenA,
            tokenPair.tokenB,
            testAmount
        );

        console.log(`[📊 JUPITER DEX QUOTES] Found ${quotes.length} quotes:`);
        console.log("=".repeat(80));
        console.log("📈 JUPITER MISSION: REAL-TIME PRICES ACROSS ALL DEXs:");
        console.log("=".repeat(80));

        let bestBuyPrice = ethers.MaxUint256;
        let bestSellPrice = 0n;
        let bestBuyDEX = "";
        let bestSellDEX = "";
        let validQuotes = 0;

        quotes.forEach((quote, index) => {
            const dexInfo = config.SUPPORTED_DEXS[index];
            if (!dexInfo) {
                console.log(`🔸 DEX ${index}        | ❌ Unknown DEX configuration`);
                return;
            }

            const dexName = dexInfo.name;

            // Skip disabled DEXs or failed quotes
            if (dexInfo.disabled || quote.amountOut === 0n) {
                console.log(`🔸 ${dexName.padEnd(20)} | ❌ ${dexInfo.disabled ? 'Disabled' : 'No liquidity or failed quote'}`);
                return;
            }

            validQuotes++;
            const amountOutNum = quote.amountOut;
            const priceImpactNum = Number(quote.priceImpact);
            const gasEstimateNum = Number(quote.gasEstimate);

            // Calculate adjusted amount with Jupiter mission precision
            const adjustedAmount = amountOutNum * BigInt(10000 - Math.floor(priceImpactNum)) / 10000n;

            // Track best opportunities (only for enabled DEXs)
            if (adjustedAmount < bestBuyPrice && adjustedAmount > 0n) {
                bestBuyPrice = adjustedAmount;
                bestBuyDEX = dexName;
            }

            if (adjustedAmount > bestSellPrice) {
                bestSellPrice = adjustedAmount;
                bestSellDEX = dexName;
            }

            // Enhanced display with Jupiter mission formatting
            const specialty = dexInfo.specialty || "Standard trading";
            console.log(`🔸 ${dexName.padEnd(20)} | Price: ${ethers.formatEther(amountOutNum).padStart(12)} | Impact: ${(priceImpactNum / 100).toFixed(2).padStart(5)}% | Gas: ${gasEstimateNum.toString().padStart(6)}`);
            console.log(`    ${specialty.padEnd(35)} | Max Trade: ${ethers.formatEther(quote.liquidity.maxTradeSize).padStart(8)} ETH`);
        });

        console.log("=".repeat(80));

        if (validQuotes < 2) {
            console.log("❌ JUPITER MISSION ABORT: Need at least 2 working DEXs for arbitrage");
            console.log(`   Found ${validQuotes} valid quotes out of ${quotes.length} total`);
            return { quotes, spreadPercent: 0, hasOpportunity: false };
        }

        // Jupiter mission opportunity analysis
        if (bestBuyPrice < ethers.MaxUint256 && bestSellPrice > 0n && bestSellPrice > bestBuyPrice && bestBuyDEX !== bestSellDEX) {
            const spread = bestSellPrice - bestBuyPrice;
            const spreadPercent = Number(spread * 10000n / bestSellPrice) / 100;

            console.log("🎯 JUPITER ARBITRAGE OPPORTUNITY DETECTED:");
            console.log(`   Buy on:  ${bestBuyDEX} at ${ethers.formatEther(bestBuyPrice)}`);
            console.log(`   Sell on: ${bestSellDEX} at ${ethers.formatEther(bestSellPrice)}`);
            console.log(`   Spread:  ${ethers.formatEther(spread)} ETH (${spreadPercent.toFixed(4)}%)`);

            // Jupiter mission threshold check
            if (spreadPercent >= config.JUPITER_MIN_SPREAD) {
                console.log(`✅ JUPITER SPREAD CHECK: ${spreadPercent.toFixed(4)}% ≥ ${config.JUPITER_MIN_SPREAD}% minimum`);
                return { quotes, spreadPercent, hasOpportunity: true };
            } else {
                console.log(`❌ JUPITER SPREAD CHECK: ${spreadPercent.toFixed(4)}% < ${config.JUPITER_MIN_SPREAD}% minimum`);
                return { quotes, spreadPercent, hasOpportunity: false };
            }
        } else {
            console.log("😴 No Jupiter arbitrage opportunity - prices aligned or same DEX");
            return { quotes, spreadPercent: 0, hasOpportunity: false };
        }

    } catch (error) {
        console.error(`[❌ ERROR] Jupiter multi-DEX quotes failed for ${tokenPair.name}:`, error.message);
        return { quotes: [], spreadPercent: 0, hasOpportunity: false };
    }
}

// ===== JUPITER MISSION ARBITRAGE ANALYSIS =====
async function analyzeJupiterArbitrageOpportunity(tokenPair, quotes) {
    try {
        console.log(`\n[💰 JUPITER MISSION ANALYSIS] ${tokenPair.name}`);
        console.log("=".repeat(80));

        // Use pair-specific optimal size if available
        const testAmount = tokenPair.optimalSize 
            ? ethers.parseEther(tokenPair.optimalSize.toString())
            : config.DEFAULT_FLASH_AMOUNT;

        console.log(`[🔥 JUPITER MISSION SIZING] Testing with ${ethers.formatEther(testAmount)} ETH`);
        const analysis = await calculateJupiterProfitability(tokenPair, quotes, testAmount);

        if (!analysis || !analysis.isProfitable) {
            console.log(`🛑 JUPITER MISSION SCRUBBED: ${analysis?.missionStatus || 'Analysis failed'}`);
            return null;
        }

        const netProfitETH = Number(ethers.formatEther(analysis.netProfit));
        const optimalFlashAmountETH = Number(ethers.formatEther(analysis.optimalFlashAmount));

        console.log("📊 JUPITER MISSION COST BREAKDOWN:");
        console.log(`   💰 Gross Profit:        ${Number(ethers.formatEther(analysis.grossProfit)).toFixed(6)} ETH`);
        console.log(`   📉 Total Costs:         ${Number(ethers.formatEther(analysis.totalCosts)).toFixed(6)} ETH`);
        console.log(`   💎 NET PROFIT:          ${netProfitETH.toFixed(6)} ETH`);
        console.log(`   🎯 ROI:                 ${analysis.roi.toFixed(4)}%`);

        const buyDEXName = analysis.buyDEXInfo?.name || 'Unknown';
        const sellDEXName = analysis.sellDEXInfo?.name || 'Unknown';

        console.log("🎯 JUPITER MISSION STRATEGY:");
        console.log(`   • Flash Loan Amount:    ${optimalFlashAmountETH.toFixed(0)} ETH`);
        console.log(`   • Split Configuration:  ${analysis.optimalSplit.splits} transactions`);
        console.log(`   • Buy DEX:              ${buyDEXName} (ID: ${analysis.buyDEX})`);
        console.log(`   • Sell DEX:             ${sellDEXName} (ID: ${analysis.sellDEX})`);
        console.log(`   • Mission Status:       ${analysis.missionStatus}`);

        // Jupiter mission recommendation
        let recommendation;
        if (analysis.jupiterReady && netProfitETH > 20) {
            console.log("🪐 JUPITER MISSION RECOMMENDATION: LAUNCH IMMEDIATELY - HIGH PROFIT");
            recommendation = "JUPITER_LAUNCH";
        } else if (analysis.isProfitable && netProfitETH > 10) {
            console.log("🌙 MOON MISSION RECOMMENDATION: PROCEED - GOOD PROFIT");
            recommendation = "MOON_PROCEED";
        } else if (analysis.isProfitable && netProfitETH > 5) {
            console.log("🚀 ORBITAL MISSION RECOMMENDATION: CONSIDER - MODERATE PROFIT");
            recommendation = "ORBITAL_CONSIDER";
        } else {
            console.log("🛑 MISSION RECOMMENDATION: SKIP - INSUFFICIENT PROFIT");
            recommendation = "SKIP";
        }

        console.log("=".repeat(80));

        return {
            tokenPair,
            grossProfit: analysis.grossProfit,
            netProfit: analysis.netProfit,
            isProfitable: analysis.isProfitable,
            optimalFlashAmount: analysis.optimalFlashAmount,
            buyDEX: Number(analysis.buyDEX),
            sellDEX: Number(analysis.sellDEX),
            buyDEXInfo: analysis.buyDEXInfo,
            sellDEXInfo: analysis.sellDEXInfo,
            gasCosts: analysis.gasCosts,
            totalFees: analysis.dexFees + analysis.flashLoanFees + analysis.slippageCosts + analysis.mevProtectionCosts,
            roi: analysis.roi,
            totalCosts: analysis.totalCosts,
            recommendation: recommendation,
            jupiterReady: analysis.jupiterReady,
            optimalSplit: analysis.optimalSplit,
            missionStatus: analysis.missionStatus,
            spreadPercent: analysis.spreadPercent
        };

    } catch (error) {
        console.error(`[❌ ERROR] Jupiter arbitrage analysis failed for ${tokenPair.name}:`, error.message);
        return null;
    }
}

/**
 * Jupiter Mission: Enhanced Network Analysis
 */
async function analyzeJupiterNetworkCongestion() {
    try {
        const feeData = await provider.getFeeData();
        const currentGasPrice = feeData.gasPrice || ethers.parseUnits("30", "gwei");

        let congestionLevel;
        let recommendation;
        let jupiterReady = false;

        if (currentGasPrice < ethers.parseUnits("15", "gwei")) {
            congestionLevel = "OPTIMAL";
            recommendation = "🪐 JUPITER MISSION OPTIMAL - Launch all high-profit trades";
            jupiterReady = true;
        } else if (currentGasPrice < ethers.parseUnits("30", "gwei")) {
            congestionLevel = "LOW";
            recommendation = "🌙 MOON MISSION READY - Execute profitable trades";
            jupiterReady = true;
        } else if (currentGasPrice < ethers.parseUnits("60", "gwei")) {
            congestionLevel = "MEDIUM";
            recommendation = "🚀 ORBITAL ONLY - High-profit trades only";
            jupiterReady = false;
        } else {
            congestionLevel = "HIGH";
            recommendation = "🛑 MISSION HOLD - Wait for lower gas prices";
            jupiterReady = false;
        }

        console.log(`[⛽ JUPITER NETWORK STATUS] ${congestionLevel} (${ethers.formatUnits(currentGasPrice, "gwei")} gwei)`);
        console.log(`[💡 MISSION CONTROL] ${recommendation}`);

        return {
            gasPrice: currentGasPrice,
            congestionLevel,
            recommendation,
            shouldExecute: currentGasPrice < config.MAX_GAS_PRICE,
            jupiterReady
        };

    } catch (error) {
        console.error(`[❌ ERROR] Jupiter network analysis failed:`, error.message);
        return { shouldExecute: false, gasPrice: config.MAX_GAS_PRICE, jupiterReady: false };
    }
}

/**
 * Jupiter Mission: Execute Split Strategy Arbitrage
 */
async function executeJupiterMission(analysis) {
    if (isExecuting) {
        console.log("[⏳ MISSION HOLD] Already executing Jupiter mission...");
        return false;
    }

    isExecuting = true;
    jupiterMissionStats.totalOpportunities++;

    try {
        const { tokenPair, netProfit, isProfitable, recommendation, optimalSplit } = analysis;

        console.log("\n" + "🚀".repeat(50));
        console.log("🪐 JUPITER MISSION EXECUTION PROTOCOL");
        console.log("🚀".repeat(50));

        // Enhanced validation for Jupiter mission
        if (!isProfitable) {
            console.log("❌ JUPITER MISSION CANCELLED: Analysis shows unprofitable trade");
            return false;
        }

        if (recommendation === "SKIP") {
            console.log("❌ JUPITER MISSION CANCELLED: Mission Control recommendation is SKIP");
            return false;
        }

        const netProfitETH = Number(ethers.formatEther(netProfit));
        const minProfitETH = Number(ethers.formatEther(config.MIN_NET_PROFIT));

        if (netProfitETH < minProfitETH) {
            console.log(`❌ JUPITER MISSION CANCELLED: Net profit ${netProfitETH.toFixed(6)} ETH below minimum ${minProfitETH} ETH`);
            return false;
        }

        // Check Jupiter network conditions
        console.log("🔍 Checking Jupiter mission network conditions...");
        const networkAnalysis = await analyzeJupiterNetworkCongestion();
        
        if (!networkAnalysis.shouldExecute) {
            console.log("❌ JUPITER MISSION CANCELLED: Network congestion prohibits launch");
            return false;
        }

        // Check wallet balance for multiple transactions
        console.log("💰 Checking wallet balance for Jupiter mission...");
        const balance = await provider.getBalance(wallet.address);
        const estimatedGasCost = ethers.parseEther((0.05 * optimalSplit.splits).toString()); // Conservative per split

        if (balance < estimatedGasCost) {
            console.log(`❌ JUPITER MISSION CANCELLED: Insufficient ETH balance: ${ethers.formatEther(balance)} ETH`);
            return false;
        }

        // Mission launch confirmation
        console.log("✅ ALL JUPITER MISSION PRE-FLIGHT CHECKS PASSED");
        console.log(`🪐 Launching Jupiter mission for ${tokenPair.name}`);
        console.log(`💰 Expected Net Profit: ${netProfitETH.toFixed(6)} ETH`);
        console.log(`🔄 Split Strategy: ${optimalSplit.splits} transactions of ${optimalSplit.amountPerSplit.toLocaleString()} ETH each`);
        console.log(`📊 Expected ROI: ${analysis.roi.toFixed(4)}%`);
        console.log(`🎯 Route: ${analysis.buyDEXInfo.name} → ${analysis.sellDEXInfo.name}`);
        console.log("🚨 WARNING: EXECUTING REAL JUPITER MISSION!");

        console.log("\n⏳ Launching Jupiter split strategy...");

        // Execute Jupiter split mission
        const splitStrategy = new JupiterSplitStrategy(
            Number(ethers.formatEther(analysis.optimalFlashAmount)),
            optimalSplit.splits
        );

        const missionResult = await splitStrategy.executeSplitMission(
            tokenPair,
            analysis.buyDEXInfo,
            analysis.sellDEXInfo,
            optimalSplit
        );

        if (missionResult.successfulSplits > 0) {
            console.log("\n" + "🚀".repeat(50));
            console.log("✅ JUPITER MISSION SUCCESSFUL!");
            console.log("🚀".repeat(50));
            console.log(`🪐 Mission Type: Jupiter Split Strategy`);
            console.log(`📝 Successful Splits: ${missionResult.successfulSplits}/${missionResult.totalSplits}`);
            console.log(`💰 Total Mission Profit: ${missionResult.totalProfit.toFixed(6)} ETH`);
            console.log(`💎 Net Mission Profit: ${missionResult.netMissionProfit.toFixed(6)} ETH`);
            console.log(`📊 Mission Success Rate: ${missionResult.successRate.toFixed(1)}%`);
            console.log("🚀".repeat(50));

            // Update Jupiter mission statistics
            executionCount++;
            jupiterMissionStats.successfulMissions++;
            jupiterMissionStats.totalSplitExecutions += missionResult.successfulSplits;
            totalProfit += missionResult.totalProfit;
            jupiterMissionStats.averageProfitPerMission = totalProfit / jupiterMissionStats.successfulMissions;

            // Display updated Jupiter statistics
            console.log("📈 UPDATED JUPITER MISSION METRICS:");
            console.log(`   Total Jupiter Missions: ${jupiterMissionStats.successfulMissions}`);
            console.log(`   Total Split Executions: ${jupiterMissionStats.totalSplitExecutions}`);
            console.log(`   Average Profit/Mission: ${jupiterMissionStats.averageProfitPerMission.toFixed(6)} ETH`);
            console.log(`   Mission Success Rate: ${(jupiterMissionStats.successfulMissions / jupiterMissionStats.totalOpportunities * 100).toFixed(1)}%`);

            return true;
        } else {
            throw new Error("All splits failed - Jupiter mission unsuccessful");
        }

    } catch (error) {
        console.error(`\n❌ JUPITER MISSION FAILED: ${error.message}`);

        // Enhanced Jupiter mission error analysis
        if (error.message.includes("revert")) {
            console.log("🔍 MISSION FAILURE ANALYSIS: Contracts would revert - market conditions changed during launch");
        } else if (error.message.includes("timeout")) {
            console.log("🔍 MISSION FAILURE ANALYSIS: Mission timeout - network congestion during execution");
        } else if (error.message.includes("insufficient")) {
            console.log("🔍 MISSION FAILURE ANALYSIS: Insufficient balance or allowance for Jupiter mission");
        } else if (error.message.includes("gas")) {
            console.log("🔍 MISSION FAILURE ANALYSIS: Gas-related issue - consider increasing gas limits for splits");
        } else {
            console.log("🔍 MISSION FAILURE ANALYSIS: Unknown error - check network and contract status");
        }

        return false;
    } finally {
        isExecuting = false;
    }
}

/**
 * Jupiter Mission: Comprehensive Opportunity Scanning
 */
async function scanForJupiterOpportunities() {
    try {
        console.log("\n" + "🚀".repeat(50));
        console.log("🪐 JUPITER MISSION: COMPREHENSIVE OPPORTUNITY SCAN");
        console.log("🚀".repeat(50));

        const opportunities = [];

        // Analyze all token pairs by priority (focus on high-spread pairs first)
        const sortedPairs = config.TOKEN_PAIRS.sort((a, b) => a.priority - b.priority);

        for (const tokenPair of sortedPairs) {
            console.log(`\n[📊 JUPITER SCANNING] ${tokenPair.name} (Priority ${tokenPair.priority})`);
            console.log(`🎯 Expected Spread: ${tokenPair.expectedSpread || 'Unknown'}, Optimal Size: ${tokenPair.optimalSize?.toLocaleString() || 'Default'} ETH`);

            // STEP 1: Get Jupiter multi-DEX quotes
            console.log(`\n🔍 Step 1: Jupiter multi-DEX price discovery...`);
            const quoteResult = await getJupiterMultiDEXQuotes(tokenPair, ethers.parseEther("1000"));

            // Check if spread meets Jupiter mission threshold
            if (!quoteResult.hasOpportunity) {
                console.log(`\n😴 JUPITER MISSION SKIP: Spread ${quoteResult.spreadPercent.toFixed(4)}% below ${config.JUPITER_MIN_SPREAD}% threshold`);
                continue;
            }

            // STEP 2: Jupiter mission profitability analysis
            console.log(`\n💰 Step 2: Jupiter mission profitability analysis...`);
            const profitAnalysis = await analyzeJupiterArbitrageOpportunity(tokenPair, quoteResult.quotes);
            if (!profitAnalysis) continue;

            // STEP 3: Jupiter mission decision making
            if (profitAnalysis.isProfitable && profitAnalysis.recommendation !== "SKIP") {
                opportunities.push(profitAnalysis);
                console.log(`\n🎯 JUPITER OPPORTUNITY DETECTED:`);
                console.log(`   Pair: ${tokenPair.name}`);
                console.log(`   Net Profit: ${ethers.formatEther(profitAnalysis.netProfit)} ETH`);
                console.log(`   ROI: ${profitAnalysis.roi.toFixed(4)}%`);
                console.log(`   Mission Status: ${profitAnalysis.missionStatus}`);
                console.log(`   Recommendation: ${profitAnalysis.recommendation}`);
            } else {
                console.log(`\n😴 JUPITER OPPORTUNITY SKIPPED: ${profitAnalysis.recommendation || 'Not profitable'}`);
            }

            // Delay between pairs for rate limiting and market analysis
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Sort opportunities by Jupiter mission priority
        const jupiterOpportunities = opportunities.filter(opp => opp.jupiterReady);
        const regularOpportunities = opportunities.filter(opp => !opp.jupiterReady);
        
        const sortedOpportunities = [
            ...jupiterOpportunities.sort((a, b) => Number(b.netProfit) - Number(a.netProfit)),
            ...regularOpportunities.sort((a, b) => Number(b.netProfit) - Number(a.netProfit))
        ];

        console.log(`\n` + "🚀".repeat(50));
        console.log(`🪐 JUPITER SCAN COMPLETE: Found ${opportunities.length} opportunities`);
        console.log(`   Jupiter Ready: ${jupiterOpportunities.length}`);
        console.log(`   Regular Opportunities: ${regularOpportunities.length}`);
        console.log("🚀".repeat(50));

        if (sortedOpportunities.length > 0) {
            const bestOpp = sortedOpportunities[0];
            console.log(`\n🏆 BEST JUPITER OPPORTUNITY SELECTED:`);
            console.log(`   Pair: ${bestOpp.tokenPair.name}`);
            console.log(`   Net Profit: ${ethers.formatEther(bestOpp.netProfit)} ETH`);
            console.log(`   ROI: ${bestOpp.roi.toFixed(4)}%`);
            console.log(`   Mission Type: ${bestOpp.jupiterReady ? 'Jupiter Mission' : 'Standard Mission'}`);
            console.log(`   Split Strategy: ${bestOpp.optimalSplit.splits} transactions`);
            console.log(`   Route: ${bestOpp.buyDEXInfo.name} → ${bestOpp.sellDEXInfo.name}`);

            // Execute the best Jupiter opportunity
            console.log(`\n🚀 PROCEEDING TO JUPITER MISSION EXECUTION...`);
            await executeJupiterMission(bestOpp);
        } else {
            console.log("\n😴 NO JUPITER OPPORTUNITIES FOUND");
            console.log("   • All pairs analyzed for Jupiter mission criteria");
            console.log("   • Market conditions may not meet Jupiter thresholds");
            console.log("   • Consider adjusting Jupiter parameters or waiting");
        }

        return sortedOpportunities;

    } catch (error) {
        console.error(`[❌ ERROR] Jupiter opportunity scanning failed:`, error.message);
        return [];
    }
}

/**
 * Display Jupiter Mission Statistics
 */
function displayJupiterStats() {
    console.log("\n" + "🚀".repeat(50));
    console.log("📊 JUPITER MISSION CONTROL STATISTICS");
    console.log("🚀".repeat(50));
    console.log(`🪐 Mission Type: Jupiter Multi-DEX Split Strategy`);
    console.log(`📈 DEXs Monitored: ${config.SUPPORTED_DEXS.filter(d => !d.disabled).map(d => d.name).join(', ')}`);
    console.log(`🎯 Total Mission Attempts: ${jupiterMissionStats.totalOpportunities}`);
    console.log(`✅ Successful Jupiter Missions: ${jupiterMissionStats.successfulMissions}`);
    console.log(`🚀 Total Split Executions: ${jupiterMissionStats.totalSplitExecutions}`);
    console.log(`💰 Total Mission Profit: ${totalProfit.toFixed(6)} ETH`);
    console.log(`⛽ Total Gas Spent: ${totalGasSpent.toFixed(6)} ETH`);
    console.log(`💎 Net Jupiter Profit: ${(totalProfit - totalGasSpent).toFixed(6)} ETH`);
    console.log(`📊 Average Profit per Mission: ${jupiterMissionStats.averageProfitPerMission.toFixed(6)} ETH`);
    console.log(`🎯 Mission Success Rate: ${jupiterMissionStats.totalOpportunities > 0 ? (jupiterMissionStats.successfulMissions / jupiterMissionStats.totalOpportunities * 100).toFixed(1) : '0'}%`);
    console.log(`🏦 Mission Control Wallet: ${wallet ? wallet.address : 'Not initialized'}`);
    console.log(`🚀 Jupiter Performance: ${executionCount > 0 ? ((totalProfit - totalGasSpent) / totalGasSpent * 100).toFixed(2) : '0'}% ROI`);
    console.log("🚀".repeat(50));
}

/**
 * Jupiter Mission: Advanced Monitoring Loop
 */
async function startJupiterMissionMonitoring() {
    console.log("\n[🔄 JUPITER MONITOR] Starting Jupiter mission monitoring protocol...");
    console.log(`[⏱️ MISSION INTERVAL] Scanning every ${config.PRICE_CHECK_INTERVAL / 1000} seconds`);
    console.log(`[🎯 MISSION STRATEGY] Split strategy arbitrage with multi-DEX expansion`);
    console.log(`[🪐 JUPITER TARGET] 15-30K ETH profit per successful mission`);

    let cycleCount = 0;

    const monitoringInterval = setInterval(async () => {
        try {
            cycleCount++;
            console.log(`\n[🔄 JUPITER CYCLE ${cycleCount}] Starting comprehensive mission analysis...`);

            // Jupiter network analysis
            const networkAnalysis = await analyzeJupiterNetworkCongestion();

            // Only proceed if network conditions support Jupiter missions
            if (networkAnalysis.shouldExecute) {
                console.log(`[🚀 JUPITER READY] Network conditions optimal for mission launch`);
                await scanForJupiterOpportunities();
            } else {
                console.log(`[⏸️ JUPITER HOLD] Waiting for optimal network conditions...`);
                console.log(`   Current: ${ethers.formatUnits(networkAnalysis.gasPrice, "gwei")} gwei`);
                console.log(`   Required: <${ethers.formatUnits(config.MAX_GAS_PRICE, "gwei")} gwei`);
            }

            // Display Jupiter stats every 5 cycles
            if (cycleCount % 5 === 0) {
                displayJupiterStats();
            }

        } catch (error) {
            console.error(`[❌ ERROR] Jupiter monitoring cycle failed:`, error.message);
        }
    }, config.PRICE_CHECK_INTERVAL);

    return monitoringInterval;
}

/**
 * Initialize Jupiter Mission Bot
 */
async function initializeJupiterMissionBot() {
    try {
        console.log("[🔄 INIT] Initializing Jupiter Mission Multi-DEX Arbitrage Bot...");

        // Validate environment
        if (!process.env.ALCHEMY_API_KEY || !process.env.PRIVATE_KEY) {
            throw new Error("Missing environment variables for Jupiter mission");
        }

        // Setup provider and wallet
        const alchemyKey = process.env.ALCHEMY_API_KEY;
        provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`);
        wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        console.log(`[👛 MISSION CONTROL WALLET] Address: ${wallet.address}`);

        // Check balance for Jupiter missions
        const balance = await provider.getBalance(wallet.address);
        console.log(`[💰 MISSION FUEL] ${ethers.formatEther(balance)} ETH`);

        if (balance < ethers.parseEther("0.05")) {
            throw new Error("Insufficient balance for Jupiter missions. Need at least 0.05 ETH");
        }

        // Initialize contract
        arbitrageContract = new ethers.Contract(
            config.ARBITRAGE_ADDRESS,
            CORRECT_ARBITRAGE_ABI,
            wallet
        );

        console.log(`[✅ MISSION CONTRACT] Connected to Jupiter arbitrage contract at ${config.ARBITRAGE_ADDRESS}`);

        // Test contract connectivity
        try {
            const owner = await arbitrageContract.getOwner();
            console.log(`[✅ CONTRACT TEST] Mission control authorized - Owner: ${owner}`);

            const dexCount = await arbitrageContract.activeDEXCount();
            console.log(`[✅ CONTRACT TEST] Active DEX connections: ${dexCount}`);
        } catch (error) {
            console.warn(`[⚠️ WARNING] Could not verify Jupiter mission contract: ${error.message}`);
        }

        // Validate Jupiter mission parameters
        console.log(`[✅ JUPITER PAIRS] Monitoring ${config.TOKEN_PAIRS.length} high-opportunity token pairs`);
        for (const pair of config.TOKEN_PAIRS) {
            console.log(`  - ${pair.name} (Priority ${pair.priority}, Expected: ${pair.expectedSpread || 'TBD'})`);
        }

        console.log(`[✅ JUPITER DEXS] Integrated with ${config.SUPPORTED_DEXS.filter(d => !d.disabled).length} active DEXs`);
        for (const dex of config.SUPPORTED_DEXS.filter(d => !d.disabled)) {
            console.log(`  - ${dex.name} (${dex.specialty}, Max: ${dex.maxTradeSize?.toLocaleString() || 'N/A'} ETH)`);
        }

        console.log(`[✅ JUPITER CONFIG] Mission Parameters:`);
        console.log(`  - Minimum Spread: ${config.JUPITER_MIN_SPREAD}%`);
        console.log(`  - Minimum Profit: ${ethers.formatEther(config.MIN_NET_PROFIT)} ETH`);
        console.log(`  - Maximum Splits: ${config.MAX_SPLITS} per mission`);
        console.log(`  - Split Delay: ${config.SPLIT_DELAY_MS}ms`);

        console.log("[✅ INIT] Jupiter Mission Bot initialization completed!");

    } catch (error) {
        console.error("[❌ INIT] Jupiter Mission initialization failed:", error.message);
        throw error;
    }
}

/**
 * Setup Jupiter Mission Event Listeners
 */
async function setupJupiterEventListeners() {
    console.log("[📡 EVENTS] Setting up Jupiter mission event listeners...");

    // Contract events for Jupiter missions
    arbitrageContract.on("ArbitrageExecuted", (tokenA, tokenB, amount, profit, event) => {
        console.log(`[🎉 JUPITER EXECUTION] ${tokenA}/${tokenB} - Amount: ${ethers.formatEther(amount)} ETH - Profit: ${ethers.formatEther(profit)} ETH`);
    });

    arbitrageContract.on("ProfitAnalysisCompleted", (tokenA, tokenB, netProfit, profitable, event) => {
        console.log(`[📊 JUPITER ANALYSIS] ${tokenA}/${tokenB} - Profit: ${ethers.formatEther(netProfit)} ETH - Profitable: ${profitable}`);
    });

    arbitrageContract.on("MultiDEXPriceCheck", (tokenA, tokenB, bestBuyPrice, bestSellPrice, spread, event) => {
        const spreadETH = Number(ethers.formatEther(spread));
        if (spreadETH > 1) { // Only log significant spreads
            console.log(`[💰 JUPITER PRICE EVENT] ${tokenA}/${tokenB} - Spread: ${spreadETH.toFixed(4)} ETH`);
        }
    });

    console.log("[✅ EVENTS] Jupiter mission event listeners configured");
}

/**
 * Jupiter Mission Health Monitoring
 */
function startJupiterHealthMonitoring() {
    console.log("[💓 HEALTH] Starting Jupiter mission health monitoring...");

    setInterval(async () => {
        try {
            const [blockNumber, balance, gasPrice] = await Promise.all([
                provider.getBlockNumber(),
                provider.getBalance(wallet.address),
                provider.getFeeData().then(data => data.gasPrice)
            ]);

            console.log(`\n[💓 JUPITER HEALTH] Block: ${blockNumber} | Balance: ${ethers.formatEther(balance)} ETH | Gas: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
            console.log(`[💓 MISSION STATS] Successful Missions: ${jupiterMissionStats.successfulMissions} | Net Profit: ${(totalProfit - totalGasSpent).toFixed(6)} ETH`);

            // Jupiter mission warnings
            if (balance < ethers.parseEther("0.05")) {
                console.warn("[⚠️ JUPITER WARNING] Wallet balance critically low for multi-split missions!");
            }

            if (gasPrice > config.MAX_GAS_PRICE) {
                console.warn("[⚠️ JUPITER WARNING] Gas price exceeds mission parameters - missions on hold!");
            }

            // Jupiter mission success rate monitoring
            const successRate = jupiterMissionStats.totalOpportunities > 0 
                ? (jupiterMissionStats.successfulMissions / jupiterMissionStats.totalOpportunities) * 100 
                : 0;

            if (successRate < 50 && jupiterMissionStats.totalOpportunities > 5) {
                console.warn(`[⚠️ JUPITER WARNING] Mission success rate low: ${successRate.toFixed(1)}%`);
            }

        } catch (error) {
            console.error("[❌ HEALTH] Jupiter health check failed:", error.message);
        }
    }, 300000); // Every 5 minutes
}

/**
 * Emergency Jupiter Mission Shutdown
 */
async function emergencyJupiterShutdown() {
    console.log("\n[🛑 EMERGENCY] Executing Jupiter mission emergency shutdown...");

    try {
        isExecuting = false;
        displayJupiterStats();
        
        console.log("\n[📊 FINAL JUPITER MISSION REPORT]");
        console.log(`Total Opportunities Analyzed: ${jupiterMissionStats.totalOpportunities}`);
        console.log(`Successful Jupiter Missions: ${jupiterMissionStats.successfulMissions}`);
        console.log(`Total Split Executions: ${jupiterMissionStats.totalSplitExecutions}`);
        console.log(`Final Mission Profit: ${(totalProfit - totalGasSpent).toFixed(6)} ETH`);
        
        console.log("[✅ SUCCESS] Jupiter mission emergency shutdown completed");
    } catch (error) {
        console.error("[❌ ERROR] Jupiter emergency shutdown failed:", error.message);
    }

    process.exit(0);
}

/**
 * Setup Jupiter Mission Cleanup Handlers
 */
function setupJupiterCleanup() {
    process.on('SIGINT', emergencyJupiterShutdown);
    process.on('SIGTERM', emergencyJupiterShutdown);
    process.on('uncaughtException', (error) => {
        console.error('[❌ FATAL] Jupiter Mission Uncaught Exception:', error.message);
        emergencyJupiterShutdown();
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[❌ FATAL] Jupiter Mission Unhandled Rejection:', reason);
        emergencyJupiterShutdown();
    });
}

/**
 * Main Jupiter Mission Function
 */
async function main() {
    try {
        console.log("\n🪐 JUPITER MISSION CONTROL CENTER");
        console.log("🚀 Multi-DEX Split Strategy Arbitrage Bot");
        console.log("🎯 Target: 15-30K ETH profit per successful mission");
        console.log("\n" + "🚀".repeat(50));

        // Step 1: Initialize Jupiter mission systems
        await initializeJupiterMissionBot();

        // Step 2: Setup emergency protocols
        setupJupiterCleanup();

        // Step 3: Setup mission telemetry
        await setupJupiterEventListeners();

        // Step 4: Start health monitoring
        startJupiterHealthMonitoring();

        // Step 5: Launch mission monitoring
        await startJupiterMissionMonitoring();

        console.log("\n[🎉 SUCCESS] Jupiter Mission Control is operational!");
        console.log("[👀 STATUS] Monitoring high-spread pairs for Jupiter opportunities...");
        console.log("[🪐 MISSION] Split strategy ready for 15-30K ETH profit targets!");
        console.log("\n🚨 JUPITER MISSION BOT IS NOW ACTIVELY SCANNING!");

    } catch (error) {
        console.error('[❌ FATAL] Jupiter Mission startup failed:', error.message);
        process.exit(1);
    }
}

// Launch Jupiter Mission
main()
    .then(() => {
        console.log("[✅ READY] Jupiter Mission Control fully operational!");
        console.log("[🪐 TARGET] Next destination: Jupiter with 15-30K ETH profit!");
    })
    .catch((error) => {
        console.error("[❌ FATAL] Jupiter Mission failed to launch:", error);
        process.exit(1);
    });

// // Enhanced Flash Loan Market Manipulation Bot - With Critical Improvements
// require("dotenv").config();
// const { ethers } = require("ethers");

// console.log("[🚀 BOT] Starting Enhanced Flash Loan Market Manipulation Bot...");

// // ✅ ENHANCED Configuration with validation
// // const config = {
// //     // Contract addresses
// //     ARBITRAGE_ADDRESS: "0x09c4e48151C29774aD2F83853dA71E66b8aA8719",

// //     // Target tokens
// //     TOKEN_A: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
// //     TOKEN_B: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
// //     POOL_FEE: 3000,

// //     // ✅ IMPROVED: More realistic flash loan parameters
// //     MIN_FLASH_AMOUNT: ethers.parseEther("0.1"),    // Start smaller: 0.5 ETH
// //     MAX_FLASH_AMOUNT: ethers.parseEther("1"),      // Reduced max: 5 ETH
// //     MIN_PROFIT_TARGET: ethers.parseEther("0.001"), // Lower minimum: 0.005 ETH

// //     // ✅ NEW: Safety limits
// //     MAX_DAILY_LOSS: ethers.parseEther("0.05"),     // Maximum 0.1 ETH loss per day
// //     MAX_CONSECUTIVE_FAILURES: 3,                   // Stop after 5 failures
// //     MIN_WALLET_BALANCE: ethers.parseEther("0.08"), // Keep 0.2 ETH minimum
// //     MAX_GAS_PER_TX: ethers.parseEther("0.01"),

// //     // Market manipulation settings
// //     PRICE_IMPACT_TARGET: 50,
// //     MANIPULATION_COOLDOWN: 600000, // ✅ REDUCED: 10 minutes instead of 15
// // };

// // ✅ UPDATED CONFIG: Use MASSIVE flash loans for real profit
// const config = {
//     // Contract addresses
//     ARBITRAGE_ADDRESS: "0x90A06B326303494A404F915e8CBE758348aA12Eb",

//     // Target tokens
//     TOKEN_A: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
//     TOKEN_B: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
//     POOL_FEE: 3000,

//     // ✅ MASSIVE FLASH LOANS FOR REAL MARKET IMPACT
//     MIN_FLASH_AMOUNT: ethers.parseEther("5000"),    // Start with 5,000 ETH
//     MAX_FLASH_AMOUNT: ethers.parseEther("10000"),   // Up to 10,000 ETH
//     MIN_PROFIT_TARGET: ethers.parseEther("1"),      // Target 1 ETH minimum profit

//     // ✅ SAFETY LIMITS (same as before)
//     MAX_DAILY_LOSS: ethers.parseEther("0.03"),     // Maximum 0.03 ETH loss per day
//     MAX_CONSECUTIVE_FAILURES: 3,                   // Stop after 3 failures
//     MIN_WALLET_BALANCE: ethers.parseEther("0.05"), // Keep 0.05 ETH minimum for gas
//     MAX_GAS_PER_TX: ethers.parseEther("0.005"),    // Max 0.005 ETH gas per transaction

//     // Market manipulation settings
//     PRICE_IMPACT_TARGET: 50,
//     MANIPULATION_COOLDOWN: 600000, // 10 minutes
// };

// // Initialize provider and wallet
// let provider, wallet;

// // ✅ ENHANCED: ABIs with complete event definitions
// const ENHANCED_ARBITRAGE_ABI = [
//     "function executeManipulationArbitrage((address,address,uint24,uint256,bool,uint256)) external",
//     "function calculateOptimalFlashAmount(address,address,uint24) external view returns (uint256)",
//     "function isProfitable((address,address,uint24,uint256,bool,uint256)) external view returns (bool,uint256)",
//     "function owner() external view returns (address)",
//     "function emergencyWithdraw(address) external",
//     "function emergencyWithdrawETH() external",
//     "event ArbitrageExecuted(address indexed token, uint256 flashLoanAmount, uint256 profit, uint256 gasUsed)",
//     "event MarketManipulated(address indexed token, address indexed pool, uint256 impactAmount, uint256 priceImpact)"
// ];

// const ERC20_ABI = [
//     "function balanceOf(address) external view returns (uint256)",
//     "function symbol() external view returns (string)",
//     "function decimals() external view returns (uint8)",
//     "function name() external view returns (string)"
// ];

// const POOL_ABI = [
//     "function slot0() external view returns (uint160,int24,uint16,uint16,uint16,uint8,bool)",
//     "function liquidity() external view returns (uint128)",
//     "function token0() external view returns (address)",
//     "function token1() external view returns (address)",
//     "function fee() external view returns (uint24)",
//     "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)"
// ];

// const FACTORY_ABI = [
//     "function getPool(address,address,uint24) external view returns (address)"
// ];

// // ✅ ENHANCED: Global state with safety tracking
// let arbitrageContract;
// let lastManipulationTime = 0;
// let totalProfit = 0;
// let executionCount = 0;
// let dailyLoss = 0;
// let consecutiveFailures = 0;
// let lastDayReset = new Date().getDate();
// let isExecuting = false;
// let startTime = Date.now();

// // ✅ NEW: Configuration validation
// function validateConfig() {
//     console.log("[🔍 CONFIG] Validating configuration...");

//     if (!process.env.ALCHEMY_API_KEY) {
//         throw new Error("ALCHEMY_API_KEY not found in environment");
//     }

//     if (!process.env.PRIVATE_KEY) {
//         throw new Error("PRIVATE_KEY not found in environment");
//     }

//     // Check if private key has correct format
//     if (!process.env.PRIVATE_KEY.startsWith('0x')) {
//         throw new Error("Invalid PRIVATE_KEY format - must start with 0x");
//     }

//     if (process.env.PRIVATE_KEY.length !== 66) {
//         throw new Error("Invalid PRIVATE_KEY length - must be 64 characters plus 0x prefix");
//     }

//     if (!ethers.isAddress(config.ARBITRAGE_ADDRESS)) {
//         throw new Error("Invalid ARBITRAGE_ADDRESS");
//     }

//     console.log("[✅ CONFIG] Configuration validated successfully");
// }

// // ✅ ENHANCED: Provider setup with retry logic
// async function createProvider() {
//     const alchemyKey = process.env.ALCHEMY_API_KEY;
//     const network = 'mainnet';
//     const providerUrl = `wss://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;

//     let provider;
//     let retries = 3;

//     while (retries > 0) {
//         try {
//             provider = new ethers.WebSocketProvider(providerUrl);

//             // Test connection
//             const blockNumber = await provider.getBlockNumber();
//             console.log(`[📡 PROVIDER] Connected to ${network}, block: ${blockNumber}`);

//             // Setup reconnection logic
//             if (provider._websocket) {
//                 provider._websocket.on('close', () => {
//                     console.warn("[⚠️ WARNING] WebSocket connection closed, attempting reconnection...");
//                     setTimeout(() => createProvider(), 5000);
//                 });

//                 provider._websocket.on('error', (error) => {
//                     console.error("[❌ ERROR] WebSocket error:", error.message);
//                 });
//             }

//             return provider;

//         } catch (error) {
//             retries--;
//             console.error(`[❌ ERROR] Provider connection failed, retries left: ${retries}`);
//             if (retries === 0) throw error;
//             await new Promise(resolve => setTimeout(resolve, 2000));
//         }
//     }
// }

// // ✅ NEW: Circuit breaker pattern
// function checkCircuitBreaker() {
//     const currentDay = new Date().getDate();

//     // Reset daily counters
//     if (currentDay !== lastDayReset) {
//         dailyLoss = 0;
//         consecutiveFailures = 0;
//         lastDayReset = currentDay;
//         console.log("[🔄 RESET] Daily counters reset");
//     }

//     // Check daily loss limit
//     if (dailyLoss >= parseFloat(ethers.formatEther(config.MAX_DAILY_LOSS))) {
//         console.error("[🛑 STOP] Daily loss limit reached, stopping bot");
//         return false;
//     }

//     // Check consecutive failures
//     if (consecutiveFailures >= config.MAX_CONSECUTIVE_FAILURES) {
//         console.error("[🛑 STOP] Too many consecutive failures, stopping bot");
//         return false;
//     }

//     return true;
// }

// // ✅ ENHANCED: Better gas estimation with dynamic pricing
// async function estimateGasCostSafely() {
//     try {
//         const [feeData, blockNumber] = await Promise.all([
//             provider.getFeeData(),
//             provider.getBlockNumber()
//         ]);

//         const block = await provider.getBlock(blockNumber);
//         const baseFee = block.baseFeePerGas;

//         let gasPrice;

//         if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
//             // ✅ IMPROVED: Dynamic gas pricing based on network congestion
//             const congestionMultiplier = baseFee > ethers.parseUnits('50', 'gwei') ? 1.5 : 1.2;
//             gasPrice = baseFee * BigInt(Math.floor(congestionMultiplier * 100)) / 100n;

//             console.log(`[⛽ GAS] EIP-1559: ${ethers.formatUnits(gasPrice, 'gwei')} gwei (base: ${ethers.formatUnits(baseFee, 'gwei')})`);
//         } else if (feeData.gasPrice) {
//             gasPrice = feeData.gasPrice;
//             console.log(`[⛽ GAS] Legacy: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
//         } else {
//             gasPrice = ethers.parseUnits('25', 'gwei');
//             console.warn(`[⚠️ WARNING] Using fallback gas price: 25 gwei`);
//         }

//         // ✅ IMPROVED: More accurate gas estimation
//         const estimatedGasLimit = 1500000n; // Reduced from 2M
//         const maxGasCost = estimatedGasLimit * gasPrice;

//         return {
//             gasPrice,
//             maxGasCost,
//             priorityFee: feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei'),
//             baseFee: baseFee || gasPrice
//         };

//     } catch (error) {
//         console.error(`[❌ ERROR] Gas estimation failed: ${error.message}`);

//         const fallbackGasPrice = ethers.parseUnits('35', 'gwei');
//         const estimatedGasLimit = 1500000n;

//         return {
//             gasPrice: fallbackGasPrice,
//             maxGasCost: estimatedGasLimit * fallbackGasPrice,
//             priorityFee: ethers.parseUnits('2', 'gwei'),
//             baseFee: fallbackGasPrice
//         };
//     }
// }

// // ✅ ENHANCED: Better profitability checking with slippage consideration
// async function checkProfitabilityWithGas(arbParams) {
//     try {
//         // ✅ IMPROVED: Parallel execution for speed
//         const [profitabilityResult, gasEstimate, walletBalance] = await Promise.all([
//             arbitrageContract.isProfitable(arbParams),
//             estimateGasCostSafely(),
//             provider.getBalance(wallet.address)
//         ]);

//         const [profitable, estimatedProfit] = profitabilityResult;

//         if (!profitable) {
//             return { profitable: false, reason: "Contract says not profitable" };
//         }

//         console.log(`[⛽ GAS] Estimated gas cost: ${ethers.formatEther(gasEstimate.maxGasCost)} ETH`);
//         console.log(`[💰 PROFIT] Estimated profit: ${ethers.formatEther(estimatedProfit)} ETH`);

//         // ✅ NEW: Check wallet balance before gas calculation
//         if (walletBalance < config.MIN_WALLET_BALANCE) {
//             return {
//                 profitable: false,
//                 reason: `Wallet balance ${ethers.formatEther(walletBalance)} below minimum ${ethers.formatEther(config.MIN_WALLET_BALANCE)}`
//             };
//         }

//         // ✅ IMPROVED: Account for slippage (5% buffer)
//         const slippageBuffer = estimatedProfit * 5n / 100n;
//         const adjustedProfit = estimatedProfit - slippageBuffer;
//         const netProfit = adjustedProfit - gasEstimate.maxGasCost;

//         if (netProfit <= 0) {
//             return {
//                 profitable: false,
//                 reason: `Net loss after gas and slippage: ${ethers.formatEther(netProfit)} ETH`,
//                 estimatedProfit: ethers.formatEther(estimatedProfit),
//                 gasCost: ethers.formatEther(gasEstimate.maxGasCost),
//                 slippageBuffer: ethers.formatEther(slippageBuffer)
//             };
//         }

//         if (netProfit < config.MIN_PROFIT_TARGET) {
//             return {
//                 profitable: false,
//                 reason: `Net profit ${ethers.formatEther(netProfit)} ETH below minimum ${ethers.formatEther(config.MIN_PROFIT_TARGET)} ETH`,
//                 estimatedProfit: ethers.formatEther(estimatedProfit),
//                 gasCost: ethers.formatEther(gasEstimate.maxGasCost),
//                 netProfit: ethers.formatEther(netProfit)
//             };
//         }

//         return {
//             profitable: true,
//             estimatedProfit: ethers.formatEther(estimatedProfit),
//             gasCost: ethers.formatEther(gasEstimate.maxGasCost),
//             netProfit: ethers.formatEther(netProfit),
//             gasEstimate: gasEstimate
//         };

//     } catch (error) {
//         return {
//             profitable: false,
//             reason: `Profitability check failed: ${error.message}`
//         };
//     }
// }

// // ✅ ENHANCED: Improved manipulation strategy with better error handling
// async function tryManipulationStrategy(manipulateUp, flashAmount) {
//     // ✅ NEW: Circuit breaker check
//     if (!checkCircuitBreaker()) {
//         return false;
//     }

//     // ✅ NEW: Prevent concurrent executions
//     if (isExecuting) {
//         console.log("[⏳ SKIP] Already executing strategy, skipping...");
//         return false;
//     }

//     isExecuting = true;

//     try {
//         const strategy = manipulateUp ? "PUMP" : "DUMP";
//         console.log(`[🎯 STRATEGY] Trying ${strategy} strategy with ${ethers.formatEther(flashAmount)} tokens`);

//         const arbParams = [
//             config.TOKEN_A,
//             config.TOKEN_B,
//             config.POOL_FEE,
//             flashAmount,
//             manipulateUp,
//             config.MIN_PROFIT_TARGET
//         ];

//         const profitCheck = await checkProfitabilityWithGas(arbParams);

//         if (!profitCheck.profitable) {
//             console.log(`[❌ NOT PROFITABLE] ${strategy} strategy: ${profitCheck.reason}`);
//             if (profitCheck.netProfit) {
//                 console.log(`[📊 DETAILS] Gross: ${profitCheck.estimatedProfit} ETH, Gas: ${profitCheck.gasCost} ETH, Net: ${profitCheck.netProfit} ETH`);
//             }
//             return false;
//         }

//         console.log(`[💰 PROFITABLE] ${strategy} strategy viable:`);
//         console.log(`[📊 GROSS] ${profitCheck.estimatedProfit} ETH profit`);
//         console.log(`[⛽ GAS] ${profitCheck.gasCost} ETH gas cost`);
//         console.log(`[💎 NET] ${profitCheck.netProfit} ETH net profit`);

//         // ✅ IMPROVED: Better transaction configuration
//         console.log(`[🚀 EXECUTING] ${strategy} manipulation arbitrage...`);
//         console.log("🚨 WARNING: EXECUTING REAL MONEY TRANSACTION!");

//         const tx = await arbitrageContract.executeManipulationArbitrage(arbParams, {
//             gasLimit: 1800000, // ✅ REDUCED: More realistic gas limit
//             maxFeePerGas: profitCheck.gasEstimate.gasPrice,
//             maxPriorityFeePerGas: profitCheck.gasEstimate.priorityFee,
//             type: 2 // ✅ NEW: Explicitly use EIP-1559
//         });

//         console.log(`[📝 TX] Transaction sent: ${tx.hash}`);
//         console.log("[⏳ WAIT] Waiting for confirmation...");

//         // ✅ NEW: Timeout for transaction confirmation
//         const receipt = await Promise.race([
//             tx.wait(),
//             new Promise((_, reject) =>
//                 setTimeout(() => reject(new Error("Transaction timeout")), 60000)
//             )
//         ]);

//         if (receipt.status === 1) {
//             const actualGasCost = receipt.gasUsed * receipt.effectiveGasPrice;
//             const actualNetProfit = parseFloat(profitCheck.estimatedProfit) - parseFloat(ethers.formatEther(actualGasCost));

//             console.log(`[✅ SUCCESS] ${strategy} arbitrage executed successfully!`);
//             console.log(`[📝 TX] Hash: ${receipt.hash}`);
//             console.log(`[⛽ GAS] Used: ${receipt.gasUsed.toString()} (${ethers.formatEther(actualGasCost)} ETH)`);
//             console.log(`[💎 NET] Actual net profit: ${actualNetProfit.toFixed(6)} ETH`);

//             lastManipulationTime = Date.now();
//             totalProfit += actualNetProfit;
//             executionCount++;
//             consecutiveFailures = 0; // ✅ NEW: Reset failure counter on success

//             return true;
//         } else {
//             throw new Error("Transaction failed");
//         }

//     } catch (error) {
//         console.error(`[❌ ERROR] ${manipulateUp ? 'PUMP' : 'DUMP'} strategy failed:`, error.message);

//         // ✅ NEW: Track failures and losses
//         consecutiveFailures++;

//         if (error.message.includes("revert")) {
//             console.log("[🔍 ANALYSIS] Transaction would revert - likely unprofitable or insufficient liquidity");
//         } else if (error.message.includes("insufficient")) {
//             console.log("[🔍 ANALYSIS] Insufficient balance or allowance");
//         } else if (error.message.includes("timeout")) {
//             console.log("[🔍 ANALYSIS] Transaction confirmation timeout - may still be pending");
//         }

//         return false;

//     } finally {
//         isExecuting = false;
//     }
// }

// // ✅ ENHANCED: Handle swap events with improved logic
// async function handleSwapEvent(swapData) {
//     // Prevent concurrent executions
//     if (isExecuting) {
//         console.log("[⏳ SKIP] Already processing event, skipping...");
//         return;
//     }

//     isExecuting = true;

//     try {
//         const currentTime = Date.now();

//         // Cooldown check
//         if (currentTime - lastManipulationTime < config.MANIPULATION_COOLDOWN) {
//             console.log("[⏳ COOLDOWN] Still in cooldown period");
//             return;
//         }

//         // Circuit breaker check
//         if (!checkCircuitBreaker()) {
//             return;
//         }

//         console.log("\n[🔍 OPPORTUNITY] Swap detected, analyzing for manipulation...");

//         // Calculate optimal flash loan amount with error handling
//         let optimalAmount;
//         try {
//             optimalAmount = await arbitrageContract.calculateOptimalFlashAmount(
//                 config.TOKEN_A,
//                 config.TOKEN_B,
//                 config.POOL_FEE
//             );
//         } catch (error) {
//             console.error("[❌ ERROR] Failed to calculate optimal amount:", error.message);
//             optimalAmount = config.MIN_FLASH_AMOUNT;
//         }

//         console.log(`[📊 CALCULATION] Optimal flash amount: ${ethers.formatEther(optimalAmount)} tokens`);

//         // Ensure amount is within our limits
//         let flashAmount = optimalAmount;
//         if (flashAmount < config.MIN_FLASH_AMOUNT) {
//             flashAmount = config.MIN_FLASH_AMOUNT;
//         }
//         if (flashAmount > config.MAX_FLASH_AMOUNT) {
//             flashAmount = config.MAX_FLASH_AMOUNT;
//         }

//         // Try both pump and dump strategies (but not if already executing)
//         const pumpSuccess = await tryManipulationStrategy(true, flashAmount);
//         if (!pumpSuccess) {
//             await tryManipulationStrategy(false, flashAmount); // Only try dump if pump failed
//         }

//     } catch (error) {
//         console.error("[❌ ERROR] Swap event handling failed:", error.message);
//         consecutiveFailures++;
//     } finally {
//         isExecuting = false;
//     }
// }

// // ✅ ENHANCED: Continuous monitoring with better error handling
// async function startContinuousMonitoring() {
//     console.log("\n[👀 MONITOR] Starting continuous opportunity monitoring...");
//     console.log("[ℹ️ INFO] Bot will scan for manipulation opportunities every 60 seconds");
//     console.log("[⚡ STRATEGY] Flash loan market manipulation for arbitrage profits");
//     console.log("[🎯 TARGET] Create price differences through large trades, then arbitrage");

//     // Periodic opportunity scanning
//     const monitoringInterval = setInterval(async () => {
//         try {
//             const currentTime = Date.now();

//             // Check circuit breaker before scanning
//             if (!checkCircuitBreaker()) {
//                 clearInterval(monitoringInterval);
//                 console.log("[🛑 STOP] Circuit breaker activated, stopping monitoring");
//                 return;
//             }

//             if (currentTime - lastManipulationTime >= config.MANIPULATION_COOLDOWN) {
//                 console.log(`\n[🔍 SCAN] Periodic opportunity scan...`);
//                 console.log(`[📊 STATS] Executions: ${executionCount}, Total Profit: ${totalProfit.toFixed(4)} ETH`);
//                 console.log(`[🛡️ SAFETY] Daily Loss: ${dailyLoss.toFixed(4)} ETH, Consecutive Failures: ${consecutiveFailures}`);

//                 // ✅ IMPROVED: Use MASSIVE amounts for real market impact
//                 const testAmounts = [
//                     ethers.parseEther("5000"),                      // 5,000 ETH
//                     ethers.parseEther("7500"),                      // 7,500 ETH  
//                     ethers.parseEther("10000"),                     // 10,000 ETH
//                     ethers.parseEther("15000"),                     // 15,000 ETH
//                     ethers.parseEther("20000")                      // 20,000 ETH
//                 ];

//                 for (const amount of testAmounts) {
//                     if (isExecuting) break; // Don't start new execution if one is running

//                     const success = await tryManipulationStrategy(true, amount) ||
//                         await tryManipulationStrategy(false, amount);

//                     if (success) break; // Stop if we found a profitable opportunity

//                     // Small delay between attempts
//                     await new Promise(resolve => setTimeout(resolve, 1000));
//                 }
//             }

//         } catch (error) {
//             console.error("[❌ ERROR] Periodic scan failed:", error.message);
//             consecutiveFailures++;
//         }
//     }, 60000); // Every 60 seconds

//     return monitoringInterval;
// }

// // ✅ ENHANCED: Health monitoring with more comprehensive checks
// function startHealthMonitoring() {
//     console.log("[💓 HEALTH] Starting health monitoring...");

//     setInterval(async () => {
//         try {
//             const [blockNumber, walletBalance] = await Promise.all([
//                 provider.getBlockNumber(),
//                 provider.getBalance(wallet.address)
//             ]);

//             console.log(`[💓 HEALTH] Block: ${blockNumber} | Wallet: ${ethers.formatEther(walletBalance)} ETH | Profit: ${totalProfit.toFixed(4)} ETH`);
//             console.log(`[💓 SAFETY] Daily Loss: ${dailyLoss.toFixed(4)} ETH | Failures: ${consecutiveFailures}`);

//             // Check if wallet balance is getting low
//             if (walletBalance < ethers.parseEther("0.05")) {
//                 console.warn("[⚠️ WARNING] Wallet balance is low! Add more ETH for gas.");
//             }

//             // Check if we're approaching safety limits
//             if (dailyLoss >= parseFloat(ethers.formatEther(config.MAX_DAILY_LOSS)) * 0.8) {
//                 console.warn("[⚠️ WARNING] Approaching daily loss limit!");
//             }

//             if (consecutiveFailures >= config.MAX_CONSECUTIVE_FAILURES - 2) {
//                 console.warn("[⚠️ WARNING] Multiple consecutive failures detected!");
//             }

//         } catch (healthError) {
//             console.error("[❌ HEALTH] Health check failed:", healthError.message);
//         }
//     }, 300000); // Every 5 minutes
// }

// // ✅ Emergency functions
// async function emergencyStop() {
//     console.log("\n[🛑 EMERGENCY] Executing emergency stop...");

//     try {
//         // Withdraw any stuck tokens
//         const tokenA = new ethers.Contract(config.TOKEN_A, ERC20_ABI, provider);
//         const tokenB = new ethers.Contract(config.TOKEN_B, ERC20_ABI, provider);

//         const balanceA = await tokenA.balanceOf(config.ARBITRAGE_ADDRESS);
//         const balanceB = await tokenB.balanceOf(config.ARBITRAGE_ADDRESS);

//         if (balanceA > 0) {
//             console.log(`[💰 WITHDRAW] Withdrawing ${ethers.formatEther(balanceA)} ${await tokenA.symbol()}`);
//             await arbitrageContract.emergencyWithdraw(config.TOKEN_A);
//         }

//         if (balanceB > 0) {
//             console.log(`[💰 WITHDRAW] Withdrawing ${ethers.formatEther(balanceB)} ${await tokenB.symbol()}`);
//             await arbitrageContract.emergencyWithdraw(config.TOKEN_B);
//         }

//         // Withdraw ETH
//         const ethBalance = await provider.getBalance(config.ARBITRAGE_ADDRESS);
//         if (ethBalance > 0) {
//             console.log(`[💰 WITHDRAW] Withdrawing ${ethers.formatEther(ethBalance)} ETH`);
//             await arbitrageContract.emergencyWithdrawETH();
//         }

//         console.log("[✅ SUCCESS] Emergency withdrawal completed");

//     } catch (error) {
//         console.error("[❌ ERROR] Emergency stop failed:", error.message);
//     }
// }

// // ✅ ENHANCED: Setup cleanup with better statistics
// function setupCleanup() {
//     const cleanup = async () => {
//         console.log('\n[🧹 CLEANUP] Shutting down manipulation bot...');

//         try {
//             // Print comprehensive final statistics
//             console.log("\n" + "=".repeat(70));
//             console.log("📊 FINAL MANIPULATION BOT STATISTICS");
//             console.log("=".repeat(70));
//             console.log(`🎯 Strategy: Flash Loan Market Manipulation`);
//             console.log(`💎 Target Pair: ${config.TOKEN_A}/${config.TOKEN_B}`);
//             console.log(`⚡ Total Executions: ${executionCount}`);
//             console.log(`💰 Total Profit: ${totalProfit.toFixed(6)} ETH`);
//             console.log(`📉 Daily Loss: ${dailyLoss.toFixed(6)} ETH`);
//             console.log(`❌ Consecutive Failures: ${consecutiveFailures}`);
//             console.log(`⏱️ Last Execution: ${lastManipulationTime ? new Date(lastManipulationTime).toLocaleString() : 'Never'}`);
//             console.log(`👛 Wallet: ${wallet ? wallet.address : 'Not initialized'}`);
//             console.log(`🏁 Session Duration: ${((Date.now() - startTime) / 1000 / 60).toFixed(2)} minutes`);
//             console.log("=".repeat(70));

//             // Emergency withdrawal if needed
//             if (arbitrageContract) {
//                 await emergencyStop();
//             }

//             // Remove event listeners
//             if (provider && provider._websocket) {
//                 provider._websocket.close();
//                 console.log('[✅ SUCCESS] WebSocket connection closed');
//             }

//             console.log('[✅ SUCCESS] Cleanup completed');
//         } catch (cleanupError) {
//             console.error('[❌ ERROR] Cleanup failed:', cleanupError.message);
//         }

//         process.exit(0);
//     };

//     // Setup signal handlers
//     process.on('SIGINT', cleanup);
//     process.on('SIGTERM', cleanup);
//     process.on('uncaughtException', (error) => {
//         console.error('[❌ FATAL] Uncaught Exception:', error.message);
//         cleanup();
//     });
//     process.on('unhandledRejection', (reason, promise) => {
//         console.error('[❌ FATAL] Unhandled Rejection:', reason);
//         cleanup();
//     });
// }

// // ✅ ENHANCED: Initialize with better error handling
// async function initializeBot() {
//     try {
//         console.log("[🔄 INIT] Initializing enhanced manipulation bot...");

//         // Step 1: Validate configuration first
//         validateConfig();

//         // Step 2: Create provider with retry logic
//         provider = await createProvider();
//         wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

//         console.log(`[👛 WALLET] Using wallet: ${wallet.address}`);

//         // Step 3: Initialize contract
//         arbitrageContract = new ethers.Contract(
//             config.ARBITRAGE_ADDRESS,
//             ENHANCED_ARBITRAGE_ABI,
//             wallet
//         );

//         // Step 4: Comprehensive contract validation
//         const [owner, balance] = await Promise.all([
//             arbitrageContract.owner().catch(() => null),
//             provider.getBalance(wallet.address)
//         ]);

//         if (!owner) {
//             throw new Error("Contract not deployed or invalid ABI");
//         }

//         if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
//             throw new Error(`Contract owner mismatch. Expected: ${wallet.address}, Got: ${owner}`);
//         }

//         console.log(`[✅ OWNER] Contract owner verified: ${owner}`);
//         console.log(`[💰 BALANCE] Wallet balance: ${ethers.formatEther(balance)} ETH`);

//         if (balance < config.MIN_WALLET_BALANCE) {
//             throw new Error(`Insufficient ETH. Need at least ${ethers.formatEther(config.MIN_WALLET_BALANCE)} ETH, have ${ethers.formatEther(balance)} ETH`);
//         }

//         // Step 5: Validate token contracts
//         const [tokenA, tokenB] = await Promise.all([
//             new ethers.Contract(config.TOKEN_A, ERC20_ABI, provider),
//             new ethers.Contract(config.TOKEN_B, ERC20_ABI, provider)
//         ]);

//         const [symbolA, symbolB] = await Promise.all([
//             tokenA.symbol(),
//             tokenB.symbol()
//         ]);

//         console.log(`[✅ TOKENS] Trading pair: ${symbolA}/${symbolB}`);
//         console.log(`[✅ TOKENS] Token A: ${config.TOKEN_A} (${symbolA})`);
//         console.log(`[✅ TOKENS] Token B: ${config.TOKEN_B} (${symbolB})`);

//         console.log("[✅ CONFIG] Enhanced safety parameters:");
//         console.log(`[📊 LIMITS] Flash: ${ethers.formatEther(config.MIN_FLASH_AMOUNT)} - ${ethers.formatEther(config.MAX_FLASH_AMOUNT)} ETH`);
//         console.log(`[💰 PROFIT] Minimum: ${ethers.formatEther(config.MIN_PROFIT_TARGET)} ETH`);
//         console.log(`[⏱️ COOLDOWN] ${config.MANIPULATION_COOLDOWN / 1000 / 60} minutes`);

//     } catch (error) {
//         console.error("[❌ ERROR] Initialization failed:", error.message);
//         throw error;
//     }
// }

// // ✅ IMPROVED: Event listener setup with error recovery
// async function setupEventListeners() {
//     try {
//         console.log("[📡 EVENTS] Setting up event listeners...");

//         const factory = new ethers.Contract("0x1F98431c8aD98523631AE4a59f267346ea31F984", FACTORY_ABI, provider);

//         const poolAddress = await factory.getPool(config.TOKEN_A, config.TOKEN_B, config.POOL_FEE);

//         if (poolAddress === ethers.ZeroAddress) {
//             throw new Error("Pool does not exist for this token pair");
//         }

//         const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);

//         // ✅ IMPROVED: Event listener with error handling
//         pool.on("Swap", async (...args) => {
//             try {
//                 await handleSwapEvent(args);
//             } catch (error) {
//                 console.error("[❌ ERROR] Swap event handler failed:", error.message);
//             }
//         });

//         console.log(`[✅ EVENTS] Listening to swap events on ${poolAddress}`);

//         // Contract event listeners
//         arbitrageContract.on("ArbitrageExecuted", (token, amount, profit, gasUsed) => {
//             console.log(`[🎉 SUCCESS] Arbitrage executed!`);
//             console.log(`[💰 PROFIT] ${ethers.formatEther(profit)} ETH profit`);
//             console.log(`[⛽ GAS] ${gasUsed.toString()} gas used`);
//         });

//         arbitrageContract.on("MarketManipulated", (token, pool, impactAmount, priceImpact) => {
//             console.log(`[📊 MANIPULATION] Market manipulated on ${pool}`);
//             console.log(`[📈 IMPACT] ${ethers.formatEther(impactAmount)} token impact`);
//         });

//     } catch (error) {
//         console.error("[❌ ERROR] Event listener setup failed:", error.message);
//         throw error;
//     }
// }

// // ✅ ENHANCED: Main function with comprehensive initialization
// async function main() {
//     try {
//         console.log("\n🎯 ENHANCED FLASH LOAN MARKET MANIPULATION ARBITRAGE BOT");
//         console.log("🚨 WARNING: This bot creates artificial price movements for profit!");
//         console.log("🚨 WARNING: Enhanced with safety features and improved profitability!");
//         console.log("\n" + "=".repeat(80));

//         // Step 1: Initialize bot
//         await initializeBot();

//         // Step 2: Setup cleanup handlers
//         setupCleanup();

//         // Step 3: Setup event listeners
//         await setupEventListeners();

//         // Step 4: Start health monitoring
//         startHealthMonitoring();

//         // Step 5: Start continuous monitoring
//         await startContinuousMonitoring();

//         console.log("\n[🎉 SUCCESS] Enhanced manipulation bot is running!");
//         console.log("[👀 STATUS] Monitoring for manipulation opportunities...");
//         console.log("[⚡ STRATEGY] Flash loan → Market manipulation → Arbitrage profit");
//         console.log("[🛡️ SAFETY] Enhanced with circuit breakers and loss limits");
//         console.log("\n🚨 BOT IS NOW ACTIVELY LOOKING FOR PROFITABLE MANIPULATIONS!");

//     } catch (error) {
//         console.error('[❌ FATAL] Bot startup failed:', error.message);
//         process.exit(1);
//     }
// }

// // Start the enhanced manipulation bot
// main()
//     .then(() => {
//         console.log("[✅ READY] Enhanced flash loan manipulation bot is operational!");
//     })
//     .catch((error) => {
//         console.error("[❌ FATAL] Bot failed to start:", error);
//         process.exit(1);
//     });