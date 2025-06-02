// Manipulation Bot - Flash Loan Market Manipulation Strategy
require("dotenv").config();
const { ethers } = require("ethers");

console.log("[🚀 BOT] Starting Flash Loan Market Manipulation Bot...");

// Configuration
const config = {
    // Your deployed enhanced contract address
    ARBITRAGE_ADDRESS: "0x6334Dc7611AFD44A6bc608192CE82D948b420258", // Update after deployment
    
    // Target tokens (use high liquidity pairs)
    TOKEN_A: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", // WETH
    TOKEN_B: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6", // DAI
    POOL_FEE: 3000, // 0.3% fee tier
    
    // Flash loan parameters
    MIN_FLASH_AMOUNT: ethers.parseEther("0.001"),    // Minimum 10 ETH equivalent
    MAX_FLASH_AMOUNT: ethers.parseEther("0.1"),  // Maximum 1000 ETH equivalent
    MIN_PROFIT_TARGET: ethers.parseEther("0.000001"),  // Minimum 0.1 ETH profit
    
    // Market manipulation settings
    PRICE_IMPACT_TARGET: 500, // Target 2% price impact
    MANIPULATION_COOLDOWN: 300000, // 5 minutes between manipulations
};

// Setup provider
const alchemyKey = process.env.ALCHEMY_API_KEY;
const network = 'sepolia';

let providerUrl;
if (network === 'sepolia') {
    providerUrl = `wss://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
} else {
    providerUrl = `wss://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
}

const provider = new ethers.WebSocketProvider(providerUrl);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

console.log(`[📡 PROVIDER] Connected to ${network}`);
console.log(`[👛 WALLET] Using wallet: ${wallet.address}`);

// Enhanced Arbitrage Contract ABI
const ENHANCED_ARBITRAGE_ABI = [
    "function executeManipulationArbitrage((address,address,uint24,uint256,bool,uint256)) external",
    "function calculateOptimalFlashAmount(address,address,uint24) external view returns (uint256)",
    "function isProfitable((address,address,uint24,uint256,bool,uint256)) external view returns (bool,uint256)",
    "function owner() external view returns (address)",
    "function emergencyWithdraw(address) external",
    "function emergencyWithdrawETH() external",
    "event ArbitrageExecuted(address indexed token, uint256 flashLoanAmount, uint256 profit, uint256 gasUsed)",
    "event MarketManipulated(address indexed token, address indexed pool, uint256 impactAmount, uint256 priceImpact)"
];

// Token ABI
const ERC20_ABI = [
    "function balanceOf(address) external view returns (uint256)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
];

// Uniswap Pool ABI
const POOL_ABI = [
    "function slot0() external view returns (uint160,int24,uint16,uint16,uint16,uint8,bool)",
    "function liquidity() external view returns (uint128)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)"
];

// Factory ABI
const FACTORY_ABI = [
    "function getPool(address,address,uint24) external view returns (address)"
];

// Global state
let arbitrageContract;
let lastManipulationTime = 0;
let totalProfit = 0;
let executionCount = 0;

/**
 * Initialize contracts and validate setup
 */
// Corrected initialization section
async function initializeBot() {
  try {
    console.log("[🔄 INIT] Initializing manipulation bot...");
    
    // Initialize with verified Sepolia address
    arbitrageContract = new ethers.Contract(
    "0x6334Dc7611AFD44A6bc608192CE82D948b420258",
    ENHANCED_ARBITRAGE_ABI,
    wallet
    );

    // Validate ownership
    const owner = await arbitrageContract.owner();
    console.log(`[✅ OWNER] Contract owner: ${owner}`);
    
    // Rest of initialization...
  } catch (error) {
    console.error("[❌ ERROR] Initialization failed:", error);
    throw error;
  }
}


/**
 * Setup event listeners for opportunities
 */
function setupEventListeners() {
    console.log("[📡 EVENTS] Setting up event listeners...");
    
    // Listen to swap events on the target pool
    const factory = new ethers.Contract("0x1F98431c8aD98523631AE4a59f267346ea31F984", FACTORY_ABI, provider);
    
    factory.getPool(config.TOKEN_A, config.TOKEN_B, config.POOL_FEE)
        .then(poolAddress => {
            const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
            
            // Listen for swap events (opportunities for manipulation)
            pool.on("Swap", async (...args) => {
                await handleSwapEvent(args);
            });
            
            console.log(`[✅ EVENTS] Listening to swap events on ${poolAddress}`);
        });
    
    // Listen to our contract events
    arbitrageContract.on("ArbitrageExecuted", (token, amount, profit, gasUsed) => {
        console.log(`[🎉 SUCCESS] Arbitrage executed!`);
        console.log(`[💰 PROFIT] ${ethers.formatEther(profit)} ETH profit`);
        console.log(`[⛽ GAS] ${gasUsed.toString()} gas used`);
        
        totalProfit += parseFloat(ethers.formatEther(profit));
        executionCount++;
    });
    
    arbitrageContract.on("MarketManipulated", (token, pool, impactAmount, priceImpact) => {
        console.log(`[📊 MANIPULATION] Market manipulated on ${pool}`);
        console.log(`[📈 IMPACT] ${ethers.formatEther(impactAmount)} token impact`);
    });
}

/**
 * Handle swap events - look for manipulation opportunities
 */
async function handleSwapEvent(swapData) {
    try {
        const currentTime = Date.now();
        
        // Cooldown check
        if (currentTime - lastManipulationTime < config.MANIPULATION_COOLDOWN) {
            console.log("[⏳ COOLDOWN] Still in cooldown period");
            return;
        }
        
        console.log("\n[🔍 OPPORTUNITY] Swap detected, analyzing for manipulation...");
        
        // Calculate optimal flash loan amount
        const optimalAmount = await arbitrageContract.calculateOptimalFlashAmount(
            config.TOKEN_A,
            config.TOKEN_B,
            config.POOL_FEE
        );
        
        console.log(`[📊 CALCULATION] Optimal flash amount: ${ethers.formatEther(optimalAmount)} tokens`);
        
        // Ensure amount is within our limits
        let flashAmount = optimalAmount;
        if (flashAmount < config.MIN_FLASH_AMOUNT) {
            flashAmount = config.MIN_FLASH_AMOUNT;
        }
        if (flashAmount > config.MAX_FLASH_AMOUNT) {
            flashAmount = config.MAX_FLASH_AMOUNT;
        }
        
        // Try both pump and dump strategies
        await tryManipulationStrategy(true, flashAmount);  // Pump strategy
        await tryManipulationStrategy(false, flashAmount); // Dump strategy
        
    } catch (error) {
        console.error("[❌ ERROR] Swap event handling failed:", error.message);
    }
}

/**
 * Try a manipulation strategy
 */
async function tryManipulationStrategy(manipulateUp, flashAmount) {
    try {
        const strategy = manipulateUp ? "PUMP" : "DUMP";
        console.log(`[🎯 STRATEGY] Trying ${strategy} strategy with ${ethers.formatEther(flashAmount)} tokens`);
        
        // Prepare arbitrage parameters
        const arbParams = [
            config.TOKEN_A,
            config.TOKEN_B,
            config.POOL_FEE,
            flashAmount,
            manipulateUp,
            config.MIN_PROFIT_TARGET
        ];
        
        // Check if profitable before executing
        const [profitable, estimatedProfit] = await arbitrageContract.isProfitable(arbParams);
        
        if (!profitable) {
            console.log(`[❌ NOT PROFITABLE] ${strategy} strategy not profitable`);
            return false;
        }
        
        console.log(`[💰 PROFITABLE] Estimated profit: ${ethers.formatEther(estimatedProfit)} ETH`);
        
        // Check wallet balance for gas
        const balance = await provider.getBalance(wallet.address);
        const requiredGas = ethers.parseEther("0.1"); // Require 0.1 ETH for gas
        
        if (balance < requiredGas) {
            console.log(`[❌ LOW BALANCE] Insufficient ETH for gas: ${ethers.formatEther(balance)}`);
            return false;
        }
        
        // Execute the manipulation arbitrage
        console.log(`[🚀 EXECUTING] ${strategy} manipulation arbitrage...`);
        console.log("🚨 WARNING: EXECUTING REAL MONEY TRANSACTION!");
        
        const gasPrice = await provider.getFeeData();
        
        const tx = await arbitrageContract.executeManipulationArbitrage(arbParams, {
            gasLimit: 2000000, // High gas limit for complex operations
            maxFeePerGas: gasPrice.maxFeePerGas,
            maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas
        });
        
        console.log(`[📝 TX] Transaction sent: ${tx.hash}`);
        console.log("[⏳ WAIT] Waiting for confirmation...");
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log(`[✅ SUCCESS] ${strategy} arbitrage executed successfully!`);
            console.log(`[📝 TX] Hash: ${receipt.hash}`);
            console.log(`[⛽ GAS] Used: ${receipt.gasUsed.toString()}`);
            
            lastManipulationTime = Date.now();
            return true;
        } else {
            throw new Error("Transaction failed");
        }
        
    } catch (error) {
        console.error(`[❌ ERROR] ${manipulateUp ? 'PUMP' : 'DUMP'} strategy failed:`, error.message);
        
        // Handle specific errors
        if (error.message.includes("revert")) {
            console.log("[🔍 ANALYSIS] Transaction would revert - likely unprofitable or insufficient liquidity");
        }
        if (error.message.includes("insufficient")) {
            console.log("[🔍 ANALYSIS] Insufficient balance or allowance");
        }
        
        return false;
    }
}

/**
 * Monitor continuously for opportunities
 */
async function startContinuousMonitoring() {
    console.log("\n[👀 MONITOR] Starting continuous opportunity monitoring...");
    console.log("[ℹ️ INFO] Bot will scan for manipulation opportunities every 60 seconds");
    console.log("[⚡ STRATEGY] Flash loan market manipulation for arbitrage profits");
    console.log("[🎯 TARGET] Create price differences through large trades, then arbitrage");
    
    // Periodic opportunity scanning
    setInterval(async () => {
        try {
            const currentTime = Date.now();
            
            if (currentTime - lastManipulationTime >= config.MANIPULATION_COOLDOWN) {
                console.log(`\n[🔍 SCAN] Periodic opportunity scan...`);
                console.log(`[📊 STATS] Executions: ${executionCount}, Total Profit: ${totalProfit.toFixed(4)} ETH`);
                
                // Try manipulation with different amounts
                const testAmounts = [
                    config.MIN_FLASH_AMOUNT,
                    ethers.parseEther("50"),
                    ethers.parseEther("100"),
                    config.MAX_FLASH_AMOUNT
                ];
                
                for (const amount of testAmounts) {
                    const success = await tryManipulationStrategy(true, amount) || 
                                   await tryManipulationStrategy(false, amount);
                    
                    if (success) break; // Stop if we found a profitable opportunity
                }
            }
            
        } catch (error) {
            console.error("[❌ ERROR] Periodic scan failed:", error.message);
        }
    }, 60000); // Every 60 seconds
}

/**
 * Emergency functions
 */
async function emergencyStop() {
    console.log("\n[🛑 EMERGENCY] Executing emergency stop...");
    
    try {
        // Withdraw any stuck tokens
        const tokenA = new ethers.Contract(config.TOKEN_A, ERC20_ABI, provider);
        const tokenB = new ethers.Contract(config.TOKEN_B, ERC20_ABI, provider);
        
        const balanceA = await tokenA.balanceOf(config.ARBITRAGE_ADDRESS);
        const balanceB = await tokenB.balanceOf(config.ARBITRAGE_ADDRESS);
        
        if (balanceA > 0) {
            console.log(`[💰 WITHDRAW] Withdrawing ${ethers.formatEther(balanceA)} ${await tokenA.symbol()}`);
            await arbitrageContract.emergencyWithdraw(config.TOKEN_A);
        }
        
        if (balanceB > 0) {
            console.log(`[💰 WITHDRAW] Withdrawing ${ethers.formatEther(balanceB)} ${await tokenB.symbol()}`);
            await arbitrageContract.emergencyWithdraw(config.TOKEN_B);
        }
        
        // Withdraw ETH
        const ethBalance = await provider.getBalance(config.ARBITRAGE_ADDRESS);
        if (ethBalance > 0) {
            console.log(`[💰 WITHDRAW] Withdrawing ${ethers.formatEther(ethBalance)} ETH`);
            await arbitrageContract.emergencyWithdrawETH();
        }
        
        console.log("[✅ SUCCESS] Emergency withdrawal completed");
        
    } catch (error) {
        console.error("[❌ ERROR] Emergency stop failed:", error.message);
    }
}

/**
 * Print bot statistics
 */
function printStatistics() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 MANIPULATION BOT STATISTICS");
    console.log("=".repeat(60));
    console.log(`🎯 Strategy: Flash Loan Market Manipulation`);
    console.log(`💎 Target Pair: ${config.TOKEN_A}/${config.TOKEN_B}`);
    console.log(`⚡ Executions: ${executionCount}`);
    console.log(`💰 Total Profit: ${totalProfit.toFixed(6)} ETH`);
    console.log(`⏱️ Last Execution: ${lastManipulationTime ? new Date(lastManipulationTime).toLocaleString() : 'Never'}`);
    console.log(`👛 Wallet: ${wallet.address}`);
    console.log("=".repeat(60));
}

/**
 * Setup cleanup handlers
 */
function setupCleanup() {
    const cleanup = async () => {
        console.log('\n[🧹 CLEANUP] Shutting down manipulation bot...');
        
        try {
            printStatistics();
            
            // Remove event listeners
            if (provider._websocket) {
                provider._websocket.close();
                console.log('[✅ SUCCESS] WebSocket connection closed');
            }
            
            console.log('[✅ SUCCESS] Cleanup completed');
        } catch (cleanupError) {
            console.error('[❌ ERROR] Cleanup failed:', cleanupError.message);
        }
        
        process.exit(0);
    };

    // Setup signal handlers
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', (error) => {
        console.error('[❌ FATAL] Uncaught Exception:', error.message);
        cleanup();
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[❌ FATAL] Unhandled Rejection:', reason);
        cleanup();
    });
}

/**
 * Health monitoring
 */
function startHealthMonitoring() {
    console.log("[💓 HEALTH] Starting health monitoring...");

    setInterval(async () => {
        try {
            const blockNumber = await provider.getBlockNumber();
            const walletBalance = await provider.getBalance(wallet.address);
            
            console.log(`[💓 HEALTH] Block: ${blockNumber} | Wallet: ${ethers.formatEther(walletBalance)} ETH | Profit: ${totalProfit.toFixed(4)} ETH`);
            
            // Check if wallet balance is getting low
            if (walletBalance < ethers.parseEther("0.05")) {
                console.warn("[⚠️ WARNING] Wallet balance is low! Add more ETH for gas.");
            }
            
        } catch (healthError) {
            console.error("[❌ HEALTH] Health check failed:", healthError.message);
        }
    }, 300000); // Every 5 minutes
}

/**
 * Main function
 */
async function main() {
    try {
        console.log("\n🎯 FLASH LOAN MARKET MANIPULATION ARBITRAGE BOT");
        console.log("🚨 WARNING: This bot creates artificial price movements for profit!");
        console.log("🚨 WARNING: This is for educational purposes - use at your own risk!");
        console.log("\n" + "=".repeat(80));
        
        // Step 1: Initialize
        await initializeBot();
        
        // Step 2: Setup cleanup
        setupCleanup();
        
        // Step 3: Start monitoring
        startHealthMonitoring();
        
        // Step 4: Start continuous monitoring
        await startContinuousMonitoring();
        
        console.log("\n[🎉 SUCCESS] Manipulation bot is running!");
        console.log("[👀 STATUS] Monitoring for manipulation opportunities...");
        console.log("[⚡ STRATEGY] Flash loan → Market manipulation → Arbitrage profit");
        console.log("[🎯 METHOD] Create price differences through large trades");
        console.log("\n🚨 BOT IS NOW ACTIVELY LOOKING FOR PROFITABLE MANIPULATIONS!");
        
    } catch (error) {
        console.error('[❌ FATAL] Bot startup failed:', error.message);
        process.exit(1);
    }
}

// Start the manipulation bot
main()
    .then(() => {
        console.log("[✅ READY] Flash loan manipulation bot is operational!");
    })
    .catch((error) => {
        console.error("[❌ FATAL] Bot failed to start:", error);
        process.exit(1);
    });


// // Updated Real Bot - With Arbitrage Execution
// require("dotenv").config();

// // ✅ Load dependencies
// console.log("[🚀 BOT] Starting REAL MONEY Arbitrage Bot...");

// let serverModule, ethers, config, helpers, initialization, realArbitrage;
// try {
//     serverModule = require('./helpers/server');
//     ethers = require("ethers");
//     config = require('./config.json');
//     helpers = require('./helpers/helpers');
//     initialization = require('./helpers/initialization');
//     realArbitrage = require('./helpers/real_arbitrage_helpers');
//     console.log("[✅ SUCCESS] All modules loaded successfully");
// } catch (importError) {
//     console.error("[❌ FATAL] Import failed:", importError.message);
//     process.exit(1);
// }

// // ✅ Extract functionality
// const { getPoolContract, calculatePrice, calculateDifference } = helpers;
// const { provider, uniswap, sushiswap } = initialization;
// const { executeArbitrageOpportunity, validateArbitrageContract } = realArbitrage;

// /**
//  * ✅ Get token contracts and information
//  */
// const getTokenAndContract = async (token0Address, token1Address, provider) => {
//     try {
//         console.log(`[🔍 TOKENS] Loading token contracts...`);
        
//         // ERC20 ABI for basic token operations
//         const ERC20_ABI = [
//             "function name() view returns (string)",
//             "function symbol() view returns (string)",
//             "function decimals() view returns (uint8)",
//             "function totalSupply() view returns (uint256)",
//             "function balanceOf(address) view returns (uint256)"
//         ];

//         // Create token contracts
//         const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, provider);
//         const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, provider);

//         // Get token information
//         const [token0Symbol, token0Decimals, token1Symbol, token1Decimals] = await Promise.all([
//             token0Contract.symbol(),
//             token0Contract.decimals(),
//             token1Contract.symbol(),
//             token1Contract.decimals()
//         ]);

//         const token0 = {
//             address: token0Address,
//             contract: token0Contract,
//             symbol: token0Symbol,
//             decimals: Number(token0Decimals)
//         };

//         const token1 = {
//             address: token1Address,
//             contract: token1Contract,
//             symbol: token1Symbol,
//             decimals: Number(token1Decimals)
//         };

//         console.log(`[✅ TOKENS] Token0: ${token0.symbol} (${token0.decimals} decimals)`);
//         console.log(`[✅ TOKENS] Token1: ${token1.symbol} (${token1.decimals} decimals)`);

//         return { token0, token1 };

//     } catch (error) {
//         console.error('[❌ ERROR] Failed to load token contracts:', error.message);
//         throw error;
//     }
// };




// /**
//  * ✅ Full system validation
//  */
// const runFullValidation = async (arbFor, arbAgainst, poolFee) => {
//     try {
//         console.log('[🔍 VALIDATION] Starting full system validation...');

//         // Validate token addresses
//         if (!ethers.isAddress(arbFor) || !ethers.isAddress(arbAgainst)) {
//             console.error('[❌ VALIDATION] Invalid token addresses');
//             return false;
//         }

//         // Test provider connection
//         const blockNumber = await provider.getBlockNumber();
//         console.log(`[✅ PROVIDER] Connected to block: ${blockNumber}`);

//         // Validate pool fee
//         if (![500, 3000, 10000].includes(poolFee)) {
//             console.error('[❌ VALIDATION] Invalid pool fee, must be 500, 3000, or 10000');
//             return false;
//         }

//         // Test contract connections
//         if (!uniswap || !sushiswap) {
//             console.error('[❌ VALIDATION] DEX connections failed');
//             return false;
//         }

//         console.log('[✅ VALIDATION] All systems validated successfully');
//         return true;

//     } catch (error) {
//         console.error('[❌ VALIDATION] Validation failed:', error.message);
//         return false;
//     }
// };

// // ✅ Configuration with validation
// const ARB_FOR = config?.TOKENS?.ARB_FOR;
// const ARB_AGAINST = config?.TOKENS?.ARB_AGAINST;
// const POOL_FEE = config?.TOKENS?.POOL_FEE;
// const PRICE_DIFFERENCE = config?.PROJECT_SETTINGS?.PRICE_DIFFERENCE || 0.1;

// if (!ARB_FOR || !ARB_AGAINST || !POOL_FEE) {
//     console.error("[❌ FATAL] Token configuration missing");
//     process.exit(1);
// }

// console.log("[🚨 WARNING] REAL MONEY MODE ENABLED - TRADES WILL USE ACTUAL FUNDS!");
// console.log(`[📋 CONFIG] Trading ${ARB_AGAINST}/${ARB_FOR} with ${POOL_FEE} fee`);

// // ✅ Global state
// let isExecuting = false;
// let pools = { uPool: null, sPool: null };
// let tokens = { token0: null, token1: null };
// let arbitrageStats = {
//     totalOpportunities: 0,
//     executedTrades: 0,
//     successfulTrades: 0,
//     totalProfit: 0,
//     totalGasSpent: 0
// };

// /**
//  * ✅ Enhanced cleanup with proper error handling
//  */
// function setupCleanup() {
//     const cleanup = async () => {
//         console.log('\n[🧹 CLEANUP] Shutting down bot...');

//         try {
//             // Print final statistics
//             console.log("\n[📊 FINAL STATS]");
//             console.log(`Total Opportunities: ${arbitrageStats.totalOpportunities}`);
//             console.log(`Executed Trades: ${arbitrageStats.executedTrades}`);
//             console.log(`Successful Trades: ${arbitrageStats.successfulTrades}`);
//             console.log(`Total Profit: ${arbitrageStats.totalProfit.toFixed(6)} ETH`);
//             console.log(`Total Gas Spent: ${arbitrageStats.totalGasSpent.toFixed(6)} ETH`);
//             console.log(`Net Result: ${(arbitrageStats.totalProfit - arbitrageStats.totalGasSpent).toFixed(6)} ETH`);

//             // Remove event listeners
//             if (pools.uPool && typeof pools.uPool.removeAllListeners === 'function') {
//                 pools.uPool.removeAllListeners();
//                 console.log('[✅ SUCCESS] Uniswap listeners removed');
//             }

//             if (pools.sPool && typeof pools.sPool.removeAllListeners === 'function') {
//                 pools.sPool.removeAllListeners();
//                 console.log('[✅ SUCCESS] SushiSwap listeners removed');
//             }

//             // Close provider connections
//             if (provider && typeof provider.destroy === 'function') {
//                 provider.destroy();
//                 console.log('[✅ SUCCESS] Provider connection closed');
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

// /**
//  * ✅ Enhanced price checking with real arbitrage execution
//  */
// const checkPricesAndExecute = async (uPool, sPool, token0, token1) => {
//     try {
//         console.log(`[🔍 PRICES] Checking prices for arbitrage opportunity...`);

//         // Get current block for reference
//         const blockNumber = await provider.getBlockNumber();
//         console.log(`[📊 BLOCK] Current block: ${blockNumber}`);

//         // Calculate prices with error handling
//         let uniPrice, sushiPrice;

//         try {
//             uniPrice = await calculatePrice(uPool, token0, token1, uniswap.name);
//             if (uniPrice <= 0) {
//                 console.warn(`[⚠️ WARNING] Invalid Uniswap price: ${uniPrice}`);
//                 return { opportunity: false };
//             }
//             console.log(`[✅ UNISWAP] Price: ${uniPrice} ${token1.symbol}/${token0.symbol}`);
//         } catch (uniError) {
//             console.error(`[❌ ERROR] Uniswap price calculation failed:`, uniError.message);
//             return { opportunity: false };
//         }

//         try {
//             sushiPrice = await calculatePrice(sPool, token0, token1, sushiswap.name);
//             if (sushiPrice <= 0) {
//                 console.warn(`[⚠️ WARNING] Invalid SushiSwap price: ${sushiPrice}`);
//                 return { opportunity: false };
//             }
//             console.log(`[✅ SUSHISWAP] Price: ${sushiPrice} ${token1.symbol}/${token0.symbol}`);
//         } catch (sushiError) {
//             console.error(`[❌ ERROR] SushiSwap price calculation failed:`, sushiError.message);
//             return { opportunity: false };
//         }

//         // Calculate price difference
//         const priceDiff = await calculateDifference(uniPrice, sushiPrice);
//         console.log(`[📊 DIFFERENCE] ${priceDiff}% price difference`);

//         // Update statistics
//         arbitrageStats.totalOpportunities++;

//         // Check if arbitrage opportunity exists
//         if (Math.abs(priceDiff) >= PRICE_DIFFERENCE) {
//             console.log(`[🎯 OPPORTUNITY] Arbitrage opportunity detected!`);
//             console.log(`[📈 DIRECTION] ${priceDiff > 0 ? 'Buy on SushiSwap, Sell on Uniswap' : 'Buy on Uniswap, Sell on SushiSwap'}`);
//             console.log(`[💰 POTENTIAL] Profit potential: ${Math.abs(priceDiff)}%`);

//             // Prepare opportunity object
//             const opportunity = {
//                 opportunity: true,
//                 direction: priceDiff > 0 ? 'sushi-to-uni' : 'uni-to-sushi',
//                 difference: priceDiff,
//                 uniPrice,
//                 sushiPrice,
//                 timestamp: Date.now(),
//                 blockNumber
//             };

//             // 🚀 EXECUTE REAL ARBITRAGE
//             console.log("\n[🚨 EXECUTION] STARTING REAL MONEY ARBITRAGE EXECUTION!");
//             arbitrageStats.executedTrades++;

//             try {
//                 const result = await executeArbitrageOpportunity(opportunity, token0, token1);

//                 if (result.success) {
//                     console.log(`[🎉 SUCCESS] Arbitrage executed successfully!`);
//                     console.log(`[💰 PROFIT] Actual profit: ${result.expectedProfit} ETH`);
//                     console.log(`[📝 TX] Transaction: ${result.transactionHash}`);
//                     console.log(`[⏱️ TIME] Execution time: ${result.executionTime}ms`);

//                     // Update success statistics
//                     arbitrageStats.successfulTrades++;
//                     arbitrageStats.totalProfit += result.expectedProfit || 0;
//                     arbitrageStats.totalGasSpent += ethers.formatEther(result.gasUsed || 0n);

//                 } else {
//                     console.log(`[❌ FAILED] Arbitrage execution failed: ${result.reason || result.error}`);
//                     if (result.netProfit !== undefined) {
//                         console.log(`[📊 NET] Would have resulted in: ${result.netProfit} ETH profit`);
//                     }
//                 }

//             } catch (executionError) {
//                 console.error(`[❌ CRITICAL] Arbitrage execution error:`, executionError.message);
//             }

//             return opportunity;

//         } else {
//             console.log(`[💤 NO ACTION] Price difference ${Math.abs(priceDiff)}% below threshold ${PRICE_DIFFERENCE}%`);
//             return { opportunity: false, uniPrice, sushiPrice, difference: priceDiff };
//         }

//     } catch (error) {
//         console.error(`[❌ ERROR] Price checking failed:`, error.message);
//         return { opportunity: false, error: error.message };
//     }
// };

// /**
//  * ✅ Enhanced event handler with real arbitrage execution
//  */
// const eventHandler = async (eventType, eventData) => {
//     if (isExecuting) {
//         console.log("[⏳ SKIP] Already processing event, skipping...");
//         return;
//     }

//     isExecuting = true;
//     const startTime = Date.now();

//     try {
//         console.log(`\n[🔄 EVENT] ${eventType} swap detected - Checking for arbitrage...`);

//         // Validate that we have necessary components
//         if (!pools.uPool || !pools.sPool || !tokens.token0 || !tokens.token1) {
//             throw new Error("Missing required pool or token contracts");
//         }

//         // Check prices and execute arbitrage if profitable
//         const result = await checkPricesAndExecute(pools.uPool, pools.sPool, tokens.token0, tokens.token1);

//         if (result.opportunity) {
//             console.log(`[📊 SUMMARY] Arbitrage opportunity processed`);
//         } else {
//             console.log(`[📊 SUMMARY] No profitable arbitrage found`);
//         }

//         console.log(`[⏱️ TIMING] Event processed in ${Date.now() - startTime}ms`);

//         // Print running statistics
//         console.log(`[📈 STATS] Opportunities: ${arbitrageStats.totalOpportunities}, Executed: ${arbitrageStats.executedTrades}, Success: ${arbitrageStats.successfulTrades}`);

//     } catch (error) {
//         console.error('[❌ ERROR] Event handler failed:', error.message);
//     } finally {
//         isExecuting = false;
//         console.log("[🔄 READY] Ready for next event");
//     }
// };

// /**
//  * ✅ Setup event listeners (same as before but with real execution)
//  */
// const setupEventListeners = async () => {
//     try {
//         console.log("[📡 EVENTS] Setting up event listeners for REAL TRADING...");

//         // Uniswap event listener
//         pools.uPool.on('Swap', (...args) => {
//             eventHandler('Uniswap', args).catch(error => {
//                 console.error("[❌ ERROR] Uniswap event handler failed:", error.message);
//             });
//         });

//         // SushiSwap event listener
//         pools.sPool.on('Swap', (...args) => {
//             eventHandler('SushiSwap', args).catch(error => {
//                 console.error("[❌ ERROR] SushiSwap event handler failed:", error.message);
//             });
//         });

//         // Provider error listener
//         provider.on('error', (error) => {
//             console.error("[❌ ERROR] Provider error:", error.message);
//         });

//         // WebSocket connection monitoring
//         if (provider._websocket) {
//             provider._websocket.on('error', (error) => {
//                 console.error("[❌ ERROR] WebSocket error:", error.message);
//             });

//             provider._websocket.on('close', (code, reason) => {
//                 console.warn(`[⚠️ WARNING] WebSocket closed: ${code} - ${reason}`);
//             });

//             provider._websocket.on('open', () => {
//                 console.log("[✅ SUCCESS] WebSocket connection opened");
//             });
//         }

//         console.log("[✅ SUCCESS] Event listeners configured for REAL TRADING");

//     } catch (error) {
//         console.error("[❌ ERROR] Failed to setup event listeners:", error.message);
//         throw error;
//     }
// };

// /**
//  * ✅ Health monitoring with arbitrage statistics
//  */
// const startHealthMonitoring = () => {
//     console.log("[💓 HEALTH] Starting health monitoring...");

//     setInterval(async () => {
//         try {
//             const blockNumber = await provider.getBlockNumber();
//             console.log(`[💓 HEALTH] Block: ${blockNumber} | Ops: ${arbitrageStats.totalOpportunities} | Executed: ${arbitrageStats.executedTrades} | Success: ${arbitrageStats.successfulTrades}`);
//         } catch (healthError) {
//             console.error("[❌ HEALTH] Health check failed:", healthError.message);
//         }
//     }, 60000); // Every minute
// };

// /**
//  * ✅ Test initial arbitrage opportunity (with safety confirmation)
//  */
// const testInitialArbitrage = async () => {
//     console.log("[🧪 TEST] Testing for immediate arbitrage opportunity...");

//     const result = await checkPricesAndExecute(pools.uPool, pools.sPool, tokens.token0, tokens.token1);

//     if (result.opportunity) {
//         console.log("[🚨 IMMEDIATE OPPORTUNITY] Initial arbitrage opportunity detected and processed!");
//     } else {
//         console.log("[ℹ️ INFO] No immediate arbitrage opportunity - bot will monitor for changes");
//     }
// };

// /**
//  * ✅ Main initialization function with real trading validation
//  */
// const main = async () => {
//     try {
//         console.log("\n[🔄 INIT] Starting REAL MONEY arbitrage bot initialization...");
//         console.log("[🚨 WARNING] This bot will execute real trades with real money!");

//         // Step 1: Validate arbitrage contract
//         console.log("[1️⃣ CONTRACT] Validating arbitrage smart contract...");
//         const contractValid = await validateArbitrageContract();
//         if (!contractValid) {
//             throw new Error("Arbitrage contract validation failed - deploy contract first");
//         }
//         console.log("[✅ SUCCESS] Arbitrage contract is valid and ready");

//         // Step 2: Validate system connections
//         console.log("[2️⃣ VALIDATION] Running system validation...");
//         const isValid = await runFullValidation(ARB_FOR, ARB_AGAINST, POOL_FEE);
//         if (!isValid) {
//             throw new Error("System validation failed - check connections and configuration");
//         }

//         // Step 3: Load token contracts
//         console.log("[3️⃣ TOKENS] Loading token contracts...");
//         const tokenResult = await getTokenAndContract(ARB_FOR, ARB_AGAINST, provider);
//         tokens.token0 = tokenResult.token0;
//         tokens.token1 = tokenResult.token1;
//         console.log(`[✅ SUCCESS] Tokens: ${tokens.token0.symbol}/${tokens.token1.symbol}`);

//         // Step 4: Initialize pool contracts
//         console.log("[4️⃣ POOLS] Initializing pool contracts...");
//         pools.uPool = await getPoolContract(uniswap, tokens.token0.address, tokens.token1.address, POOL_FEE, provider);
//         pools.sPool = await getPoolContract(sushiswap, tokens.token0.address, tokens.token1.address, POOL_FEE, provider);

//         console.log(`[✅ SUCCESS] Uniswap pool: ${await pools.uPool.getAddress()}`);
//         console.log(`[✅ SUCCESS] SushiSwap pool: ${await pools.sPool.getAddress()}`);

//         // Step 5: Test initial arbitrage opportunity
//         console.log("[5️⃣ INITIAL] Testing for initial arbitrage opportunity...");
//         await testInitialArbitrage();

//         // Step 6: Setup cleanup handlers
//         console.log("[6️⃣ CLEANUP] Setting up cleanup handlers...");
//         setupCleanup();

//         // Step 7: Setup event listeners
//         console.log("[7️⃣ EVENTS] Setting up event listeners...");
//         await setupEventListeners();

//         // Step 8: Start health monitoring
//         console.log("[8️⃣ HEALTH] Starting health monitoring...");
//         startHealthMonitoring();

//         // Success message
//         console.log("\n[🎉 SUCCESS] REAL MONEY Arbitrage Bot initialized!");
//         console.log(`[📊 TRADING] Monitoring ${tokens.token1.symbol}/${tokens.token0.symbol}`);
//         console.log(`[🏦 UNISWAP] Pool: ${await pools.uPool.getAddress()}`);
//         console.log(`[🍣 SUSHISWAP] Pool: ${await pools.sPool.getAddress()}`);
//         console.log(`[⚡ THRESHOLD] Arbitrage threshold: ${PRICE_DIFFERENCE}%`);
//         console.log(`[💰 CONTRACT] Arbitrage contract: ${config.PROJECT_SETTINGS.ARBITRAGE_ADDRESS}`);
//         console.log(`[🚨 WARNING] BOT IS NOW MONITORING FOR REAL MONEY TRADES!`);
//         console.log(`[👀 STATUS] Listening for swap events...\n`);

//     } catch (error) {
//         console.error('[❌ FATAL] Bot initialization failed:', error.message);
//         console.error('Stack trace:', error.stack);
//         process.exit(1);
//     }
// };

// // ✅ Start the REAL MONEY bot
// main()
//     .then(() => {
//         console.log("[✅ READY] REAL MONEY Arbitrage bot is running and monitoring...");
//         console.log("[🚨 CAUTION] All detected opportunities will be executed with real funds!");
//     })
//     .catch((error) => {
//         console.error("[❌ FATAL] Bot startup failed:", error);
//         process.exit(1);
//     });