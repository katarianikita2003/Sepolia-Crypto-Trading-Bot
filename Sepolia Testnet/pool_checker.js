// Pool Existence Checker for Sepolia Testnet
require("dotenv").config();
const ethers = require("ethers");
const config = require('./config.json');

// Initialize provider
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_KEY_URL);

// Uniswap V3 Factory ABI (minimal)
const FACTORY_ABI = [
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
];

async function checkAllPools() {
    try {
        console.log("🔍 Checking pool existence on Sepolia testnet...");
        
        const factoryAddress = config.UNISWAP.FACTORY_ADDRESS;
        const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
        
        const token0 = config.TOKENS.ARB_FOR;
        const token1 = config.TOKENS.ARB_AGAINST;
        const fees = [500, 3000, 10000]; // All possible fee tiers
        
        console.log(`Token0 (WETH): ${token0}`);
        console.log(`Token1 (DAI): ${token1}`);
        console.log(`Factory: ${factoryAddress}\n`);
        
        for (const fee of fees) {
            try {
                const poolAddress = await factory.getPool(token0, token1, fee);
                
                if (poolAddress === ethers.ZeroAddress) {
                    console.log(`❌ Pool with fee ${fee} does NOT exist`);
                } else {
                    console.log(`✅ Pool with fee ${fee} EXISTS at: ${poolAddress}`);
                    
                    // Check if pool has liquidity
                    const poolContract = new ethers.Contract(poolAddress, [
                        "function liquidity() external view returns (uint128)"
                    ], provider);
                    
                    try {
                        const liquidity = await poolContract.liquidity();
                        console.log(`   💧 Liquidity: ${liquidity.toString()}`);
                    } catch (liquidityError) {
                        console.log(`   ⚠️ Could not check liquidity: ${liquidityError.message}`);
                    }
                }
            } catch (error) {
                console.log(`❌ Error checking fee ${fee}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error("❌ Pool check failed:", error.message);
    }
}

checkAllPools();