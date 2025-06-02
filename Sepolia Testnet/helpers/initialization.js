// helpers/initialization.js - Fixed version
const { ethers } = require("ethers");
require("dotenv").config();

// Proper Uniswap V3 Factory ABI
const FACTORY_ABI = [
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
    "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
    "function owner() external view returns (address)",
    "function feeAmountTickSpacing(uint24 fee) external view returns (int24)",
    "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)"
];

// Router ABI (minimal)
const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
    "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)"
];

// Quoter ABI (minimal)
const QUOTER_ABI = [
    "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
    "function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)"
];

console.log("[🔍 INIT] Starting initialization...");

// Load configuration
let config;
try {
    config = require('../config.json');
    console.log("[✅ CONFIG] Configuration loaded successfully");
} catch (error) {
    console.error("[❌ CONFIG] Failed to load config.json:", error.message);
    throw error;
}

// Validate required addresses before using them
function validateAddress(address, name) {
    if (!address || address === null || address === undefined || address === "") {
        throw new Error(`❌ ${name} address is missing or invalid: ${address}`);
    }
    if (!ethers.isAddress(address)) {
        throw new Error(`❌ ${name} address is not a valid Ethereum address: ${address}`);
    }
    console.log(`[✅ ADDRESS] ${name}: ${address}`);
    return address;
}

// Validate all required addresses
console.log("[🔍 VALIDATION] Validating contract addresses...");

const ARBITRAGE_ADDRESS = validateAddress(config?.PROJECT_SETTINGS?.ARBITRAGE_ADDRESS, "ARBITRAGE_ADDRESS");
const UNISWAP_ROUTER = validateAddress(config?.UNISWAP?.ROUTER_ADDRESS, "UNISWAP_ROUTER");
const UNISWAP_FACTORY = validateAddress(config?.UNISWAP?.FACTORY_ADDRESS, "UNISWAP_FACTORY");
const UNISWAP_QUOTER = validateAddress(config?.UNISWAP?.QUOTER_ADDRESS, "UNISWAP_QUOTER");
const SUSHISWAP_ROUTER = validateAddress(config?.SUSHISWAP?.ROUTER_ADDRESS, "SUSHISWAP_ROUTER");
const SUSHISWAP_FACTORY = validateAddress(config?.SUSHISWAP?.FACTORY_ADDRESS, "SUSHISWAP_FACTORY");
const SUSHISWAP_QUOTER = validateAddress(config?.SUSHISWAP?.QUOTER_ADDRESS, "SUSHISWAP_QUOTER");
const AAVE_POOL = validateAddress(config?.AAVE?.POOL, "AAVE_POOL");

// Load ABIs
let IUniswapV3Router, IUniswapV3Factory, IQuoter, IArbitrage, IPool;

try {
    // Load Uniswap ABIs
    IUniswapV3Router = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json');
    IUniswapV3Factory = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json');
    IQuoter = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/IQuoter.sol/IQuoter.json');
    console.log("[✅ SUCCESS] Uniswap artifacts loaded");
} catch (error) {
    console.error("[❌ ERROR] Failed to load Uniswap artifacts:", error.message);
    throw error;
}

try {
    // Load custom contract ABIs
    IArbitrage = require('../artifacts/contracts/Arbitrage.sol/Arbitrage.json');
    console.log("[✅ SUCCESS] Arbitrage artifacts loaded");
} catch (error) {
    console.error("[❌ ERROR] Failed to load Arbitrage artifacts:", error.message);
    console.error("[💡 HINT] Make sure you've compiled your contracts with 'npx hardhat compile'");
    throw error;
}

try {
    // Load AAVE ABI
    IPool = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
    console.log("[✅ SUCCESS] AAVE artifacts loaded");
} catch (error) {
    console.error("[❌ ERROR] Failed to load AAVE artifacts:", error.message);
    console.error("[💡 HINT] Make sure AAVE dependencies are installed and compiled");
    throw error;
}

// Initialize provider
let provider;
try {
    if (!process.env.ALCHEMY_SEPOLIA_WS_URL) {
        throw new Error("ALCHEMY_SEPOLIA_WS_URL not found in environment variables");
    }

    provider = new ethers.WebSocketProvider(process.env.ALCHEMY_SEPOLIA_WS_URL);
    console.log("[📡 PROVIDER] Alchemy WebSocket provider initialized");

    // Test provider connection
    provider.getNetwork()
        .then(network => {
            console.log(`[✅ NETWORK] Connected to ${network.name} (Chain ID: ${network.chainId})`);
        })
        .catch(error => {
            console.error("[❌ NETWORK] Provider connection test failed:", error.message);
        });

} catch (error) {
    console.error("[❌ PROVIDER] Failed to initialize provider:", error.message);
    throw error;
}

// Initialize contracts with proper error handling
let uniswapRouter, uniswapFactory, uniswapQuoter;
let sushiswapRouter, sushiswapFactory, sushiswapQuoter;
let arbitrageContract, aavePool;

try {
    console.log("[🔧 CONTRACTS] Initializing contract instances...");

    // Uniswap contracts
    uniswapRouter = new ethers.Contract(UNISWAP_ROUTER, IUniswapV3Router.abi, provider);
    uniswapFactory = new ethers.Contract(UNISWAP_FACTORY, IUniswapV3Factory.abi, provider);
    uniswapQuoter = new ethers.Contract(UNISWAP_QUOTER, IQuoter.abi, provider);
    console.log("[✅ UNISWAP] Uniswap contracts initialized");

    // SushiSwap contracts (using same addresses as Uniswap V3 on Sepolia)
    sushiswapRouter = new ethers.Contract(SUSHISWAP_ROUTER, IUniswapV3Router.abi, provider);
    sushiswapFactory = new ethers.Contract(SUSHISWAP_FACTORY, IUniswapV3Factory.abi, provider);
    sushiswapQuoter = new ethers.Contract(SUSHISWAP_QUOTER, IQuoter.abi, provider);
    console.log("[✅ SUSHISWAP] SushiSwap contracts initialized");

    // Arbitrage contract
    arbitrageContract = new ethers.Contract(ARBITRAGE_ADDRESS, IArbitrage.abi, provider);
    console.log("[✅ ARBITRAGE] Arbitrage contract initialized");

    // AAVE Pool
    aavePool = new ethers.Contract(AAVE_POOL, IPool.abi, provider);
    console.log("[✅ AAVE] AAVE Pool contract initialized");

} catch (error) {
    console.error("[❌ CONTRACTS] Failed to initialize contracts:", error.message);
    console.error("[🔍 DEBUG] Error details:", error);
    throw error;
}

// Validate contracts are deployed
async function validateDeployments() {
    try {
        console.log("[🔍 VALIDATION] Validating contract deployments...");

        const contracts = [
            { name: "Arbitrage", address: ARBITRAGE_ADDRESS },
            { name: "Uniswap Router", address: UNISWAP_ROUTER },
            { name: "Uniswap Factory", address: UNISWAP_FACTORY },
            { name: "AAVE Pool", address: AAVE_POOL }
        ];

        for (const contract of contracts) {
            const code = await provider.getCode(contract.address);
            if (code === '0x') {
                console.warn(`[⚠️ WARNING] No contract deployed at ${contract.name} address: ${contract.address}`);
            } else {
                console.log(`[✅ DEPLOYED] ${contract.name} is deployed at: ${contract.address}`);
            }
        }

    } catch (error) {
        console.error("[❌ VALIDATION] Contract validation failed:", error.message);
    }
}

// Run validation
validateDeployments();

console.log("[🎉 SUCCESS] Initialization completed successfully!");

// Export all initialized components
module.exports = {
    provider,
    config,

    // Uniswap
    uniswap: {
        router: uniswapRouter,
        factory: uniswapFactory,
        quoter: uniswapQuoter
    },

    // SushiSwap
    sushiswap: {
        router: sushiswapRouter,
        factory: sushiswapFactory,
        quoter: sushiswapQuoter
    },

    // Custom contracts
    arbitrage: arbitrageContract,
    aave: {
        pool: aavePool
    },

    // Addresses (for reference)
    addresses: {
        ARBITRAGE_ADDRESS,
        UNISWAP_ROUTER,
        UNISWAP_FACTORY,
        UNISWAP_QUOTER,
        SUSHISWAP_ROUTER,
        SUSHISWAP_FACTORY,
        SUSHISWAP_QUOTER,
        AAVE_POOL
    }
};