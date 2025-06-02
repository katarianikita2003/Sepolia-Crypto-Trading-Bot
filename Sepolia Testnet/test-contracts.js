// test-contracts.js - Contract Connection Testing
// Run with: node test-contracts.js

console.log("🔗 Testing Contract Connections...\n");

async function testContracts() {
    try {
        // Load dependencies
        require("dotenv").config();
        const { ethers } = require("ethers");
        const config = require('./config.json');
        const { provider, uniswap, sushiswap } = require('./helpers/initialization');
        const { getTokenAndContract, getPoolContract } = require('./helpers/helpers');

        // Test 1: Provider Connection
        console.log("1️⃣ Testing Provider Connection...");
        const blockNumber = await provider.getBlockNumber();
        console.log(`✅ Connected to Ethereum - Block: ${blockNumber}`);
        
        const network = await provider.getNetwork();
        console.log(`✅ Network: ${network.name} (Chain ID: ${network.chainId})`);

        // Test 2: Token Contract Loading
        console.log("\n2️⃣ Testing Token Contract Loading...");
        const ARB_FOR = config.TOKENS.ARB_FOR;   // DAI
        const ARB_AGAINST = config.TOKENS.ARB_AGAINST; // WETH
        
        console.log(`Loading tokens: ${ARB_FOR} & ${ARB_AGAINST}`);
        const { token0, token1 } = await getTokenAndContract(ARB_FOR, ARB_AGAINST, provider);
        
        console.log(`✅ Token0: ${token0.symbol} (${token0.decimals} decimals)`);
        console.log(`✅ Token1: ${token1.symbol} (${token1.decimals} decimals)`);

        // Test 3: Uniswap Factory Connection
        console.log("\n3️⃣ Testing Uniswap V3 Factory...");
        const factoryAddress = await uniswap.factory.getAddress();
        console.log(`✅ Uniswap Factory connected: ${factoryAddress}`);
        
        // Test pool existence
        const poolAddress = await uniswap.factory.getPool(
            token0.address, 
            token1.address, 
            config.TOKENS.POOL_FEE
        );
        
        if (poolAddress === ethers.ZeroAddress) {
            console.warn("⚠️ No Uniswap V3 pool found for this token pair");
        } else {
            console.log(`✅ Uniswap V3 Pool found: ${poolAddress}`);
        }

        // Test 4: SushiSwap Factory Connection
        console.log("\n4️⃣ Testing SushiSwap V2 Factory...");
        const sushiFactoryAddress = await sushiswap.factory.getAddress();
        console.log(`✅ SushiSwap Factory connected: ${sushiFactoryAddress}`);
        
        // Test pair existence
        const pairAddress = await sushiswap.factory.getPair(token0.address, token1.address);
        
        if (pairAddress === ethers.ZeroAddress) {
            console.warn("⚠️ No SushiSwap V2 pair found for this token pair");
        } else {
            console.log(`✅ SushiSwap V2 Pair found: ${pairAddress}`);
        }

        // Test 5: Pool Contract Instantiation (if pools exist)
        if (poolAddress !== ethers.ZeroAddress) {
            console.log("\n5️⃣ Testing Uniswap Pool Contract...");
            const uPool = await getPoolContract(
                uniswap, 
                token0.address, 
                token1.address, 
                config.TOKENS.POOL_FEE, 
                provider
            );
            console.log(`✅ Uniswap Pool Contract instantiated: ${await uPool.getAddress()}`);
            
            // Test slot0 call
            try {
                const slot0 = await uPool.slot0();
                console.log(`✅ Slot0 data retrieved - sqrtPriceX96: ${slot0.sqrtPriceX96}`);
            } catch (slot0Error) {
                console.warn("⚠️ Could not retrieve slot0 data:", slot0Error.message);
            }
        }

        if (pairAddress !== ethers.ZeroAddress) {
            console.log("\n6️⃣ Testing SushiSwap Pair Contract...");
            const sPool = await getPoolContract(
                sushiswap, 
                token0.address, 
                token1.address, 
                config.TOKENS.POOL_FEE, 
                provider
            );
            console.log(`✅ SushiSwap Pair Contract instantiated: ${await sPool.getAddress()}`);
            
            // Test reserves call
            try {
                const reserves = await sPool.getReserves();
                console.log(`✅ Reserves retrieved - Reserve0: ${reserves[0]}, Reserve1: ${reserves[1]}`);
            } catch (reservesError) {
                console.warn("⚠️ Could not retrieve reserves:", reservesError.message);
            }
        }

        // Test 7: Gas Price and Network Status
        console.log("\n7️⃣ Testing Network Status...");
        const gasPrice = await provider.getGasPrice();
        console.log(`✅ Current Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

        console.log("\n🎉 ALL CONTRACT CONNECTIONS SUCCESSFUL!");
        console.log("✅ Ready to proceed with event testing and price calculations");

    } catch (error) {
        console.error("\n❌ CONTRACT CONNECTION TEST FAILED:");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
        console.log("\n🔧 Fix the above errors before proceeding");
        process.exit(1);
    }
}

// Run the test
testContracts()
    .then(() => {
        console.log("\n🏁 Contract tests completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Unexpected error:", error);
        process.exit(1);
    });