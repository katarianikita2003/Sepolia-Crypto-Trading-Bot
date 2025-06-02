// Enhanced debug script to identify and fix contract address issues
const { ethers } = require("ethers");
require("dotenv").config();

async function enhancedDebug() {
    try {
        console.log("🔍 ENHANCED DEBUGGING - CONTRACT ADDRESS ISSUE");
        console.log("=================================================");

        // Step 1: Validate environment variables
        console.log("\n[1] 🔑 ENVIRONMENT VARIABLES");
        console.log("───────────────────────────────");

        const requiredEnvVars = ['PRIVATE_KEY', 'ALCHEMY_SEPOLIA_WS_URL'];
        let envIssues = [];

        requiredEnvVars.forEach(envVar => {
            if (!process.env[envVar]) {
                envIssues.push(envVar);
                console.log(`❌ ${envVar}: MISSING`);
            } else {
                const value = envVar === 'PRIVATE_KEY' ? '[HIDDEN]' : process.env[envVar];
                console.log(`✅ ${envVar}: ${value}`);
            }
        });

        // Step 2: Load and validate config.json
        console.log("\n[2] 📋 CONFIG.JSON VALIDATION");
        console.log("───────────────────────────────");

        let config;
        try {
            config = require('./config.json');
            console.log("✅ Config file loaded successfully");
        } catch (configError) {
            console.error("❌ Failed to load config.json:", configError.message);
            return;
        }

        // Validate all required addresses
        const requiredAddresses = [
            { path: 'PROJECT_SETTINGS.ARBITRAGE_ADDRESS', name: 'Arbitrage Contract' },
            { path: 'UNISWAP.ROUTER_ADDRESS', name: 'Uniswap Router' },
            { path: 'UNISWAP.FACTORY_ADDRESS', name: 'Uniswap Factory' },
            { path: 'UNISWAP.QUOTER_ADDRESS', name: 'Uniswap Quoter' },
            { path: 'SUSHISWAP.ROUTER_ADDRESS', name: 'SushiSwap Router' },
            { path: 'SUSHISWAP.FACTORY_ADDRESS', name: 'SushiSwap Factory' },
            { path: 'SUSHISWAP.QUOTER_ADDRESS', name: 'SushiSwap Quoter' },
            { path: 'AAVE.POOL', name: 'AAVE Pool' },
            { path: 'TOKENS.ARB_FOR', name: 'Token ARB_FOR (WETH)' },
            { path: 'TOKENS.ARB_AGAINST', name: 'Token ARB_AGAINST (DAI)' }
        ];

        let addressIssues = [];

        requiredAddresses.forEach(({ path, name }) => {
            const address = getNestedValue(config, path);

            if (!address || address === null || address === undefined || address === "") {
                addressIssues.push({ name, path, issue: 'MISSING/NULL' });
                console.log(`❌ ${name}: MISSING/NULL (${path})`);
            } else if (!ethers.isAddress(address)) {
                addressIssues.push({ name, path, issue: 'INVALID_FORMAT' });
                console.log(`❌ ${name}: INVALID FORMAT (${address})`);
            } else {
                console.log(`✅ ${name}: ${address}`);
            }
        });

        // Step 3: Test provider connection
        console.log("\n[3] 📡 PROVIDER CONNECTION TEST");
        console.log("───────────────────────────────");

        if (process.env.ALCHEMY_SEPOLIA_WS_URL) {
            try {
                const provider = new ethers.WebSocketProvider(process.env.ALCHEMY_SEPOLIA_WS_URL);
                const network = await provider.getNetwork();
                console.log(`✅ Provider connected to ${network.name} (Chain ID: ${network.chainId})`);

                // Test balance check
                if (process.env.PRIVATE_KEY) {
                    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
                    const balance = await provider.getBalance(wallet.address);
                    console.log(`✅ Wallet balance: ${ethers.formatEther(balance)} ETH`);
                }

                await provider.destroy();
            } catch (providerError) {
                console.error("❌ Provider connection failed:", providerError.message);
            }
        } else {
            console.log("❌ Cannot test provider - ALCHEMY_SEPOLIA_WS_URL missing");
        }

        // Step 4: Check artifact files
        console.log("\n[4] 📜 ARTIFACT FILES CHECK");
        console.log("───────────────────────────");

        const requiredArtifacts = [
            './artifacts/contracts/Arbitrage.sol/Arbitrage.json',
            './artifacts/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json',
            './artifacts/@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json',
            './artifacts/@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol/IQuoter.json'
        ];

        let artifactIssues = [];

        requiredArtifacts.forEach(artifactPath => {
            try {
                const artifact = require(artifactPath);
                if (artifact.abi && Array.isArray(artifact.abi)) {
                    console.log(`✅ ${artifactPath.split('/').pop()}: ${artifact.abi.length} functions`);
                } else {
                    artifactIssues.push({ path: artifactPath, issue: 'Invalid ABI' });
                    console.log(`❌ ${artifactPath}: Invalid ABI structure`);
                }
            } catch (error) {
                artifactIssues.push({ path: artifactPath, issue: error.message });
                console.log(`❌ ${artifactPath}: ${error.message}`);
            }
        });

        // Step 5: Test contract instantiation (the actual error location)
        console.log("\n[5] 🔧 CONTRACT INSTANTIATION TEST");
        console.log("────────────────────────────────────");

        if (addressIssues.length === 0 && envIssues.length === 0) {
            try {
                const provider = new ethers.WebSocketProvider(process.env.ALCHEMY_SEPOLIA_WS_URL);

                // Test each contract individually
                const testContracts = [
                    {
                        name: 'Arbitrage',
                        address: config.PROJECT_SETTINGS.ARBITRAGE_ADDRESS,
                        abi: require('./artifacts/contracts/Arbitrage.sol/Arbitrage.json').abi
                    },
                    {
                        name: 'Uniswap Router',
                        address: config.UNISWAP.ROUTER_ADDRESS,
                        abi: require('./artifacts/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json').abi
                    }
                ];

                for (const testContract of testContracts) {
                    try {
                        console.log(`🔍 Testing ${testContract.name}...`);
                        console.log(`   Address: ${testContract.address}`);
                        console.log(`   ABI functions: ${testContract.abi.length}`);

                        const contract = new ethers.Contract(testContract.address, testContract.abi, provider);
                        console.log(`✅ ${testContract.name}: Contract instance created successfully`);

                        // Check if contract is deployed
                        const code = await provider.getCode(testContract.address);
                        if (code === '0x') {
                            console.log(`⚠️  ${testContract.name}: No contract deployed at address`);
                        } else {
                            console.log(`✅ ${testContract.name}: Contract deployed and accessible`);
                        }

                    } catch (contractError) {
                        console.error(`❌ ${testContract.name}: ${contractError.message}`);

                        // Specific error analysis
                        if (contractError.message.includes('invalid value for Contract target')) {
                            console.error(`   → The address "${testContract.address}" is null or invalid`);
                        }
                    }
                }

                await provider.destroy();

            } catch (error) {
                console.error("❌ Contract instantiation test failed:", error.message);
            }
        } else {
            console.log("❌ Skipping contract test due to configuration issues");
        }

        // Step 6: Summary and recommendations
        console.log("\n[6] 📋 SUMMARY & RECOMMENDATIONS");
        console.log("═══════════════════════════════════");

        let totalIssues = envIssues.length + addressIssues.length + artifactIssues.length;

        if (totalIssues === 0) {
            console.log("🎉 ALL CHECKS PASSED! Your configuration appears correct.");
            console.log("🔍 The issue might be in your initialization.js file logic.");
            console.log("\n💡 NEXT STEPS:");
            console.log("1. Replace your helpers/initialization.js with the fixed version");
            console.log("2. Run your application again");
            console.log("3. If issues persist, check for typos in variable names");
        } else {
            console.log(`❌ FOUND ${totalIssues} ISSUE(S) THAT NEED FIXING:\n`);

            if (envIssues.length > 0) {
                console.log("🔑 ENVIRONMENT VARIABLES:");
                envIssues.forEach(env => console.log(`   - Add ${env} to your .env file`));
                console.log("");
            }

            if (addressIssues.length > 0) {
                console.log("📋 CONFIG.JSON ADDRESSES:");
                addressIssues.forEach(({ name, path, issue }) => {
                    console.log(`   - ${name} (${path}): ${issue}`);
                });
                console.log("");
            }

            if (artifactIssues.length > 0) {
                console.log("📜 MISSING ARTIFACTS:");
                artifactIssues.forEach(({ path, issue }) => {
                    console.log(`   - ${path}: ${issue}`);
                });
                console.log("   → Run 'npx hardhat compile' to generate missing artifacts");
                console.log("");
            }
        }

        console.log("🔧 IMMEDIATE FIXES:");
        console.log("1. Use the provided fixed initialization.js");
        console.log("2. Ensure all addresses in config.json are valid");
        console.log("3. Compile contracts: npx hardhat compile");
        console.log("4. Check .env file has all required variables");

    } catch (error) {
        console.error("❌ ENHANCED DEBUG FAILED:", error.message);
        console.error(error.stack);
    }
}

const debugFactory = async (factory, exchangeName) => {
    try {
        console.log(`[🐛 DEBUG] Testing ${exchangeName} factory...`);

        // Check what functions are available
        console.log(`[🔍 CONTRACT] Factory address: ${await factory.getAddress()}`);

        // Try to get contract code to verify it's deployed
        const code = await factory.provider.getCode(await factory.getAddress());
        console.log(`[🔍 CODE] Contract code length: ${code.length} (should be > 2)`);

        if (code === '0x' || code.length <= 2) {
            console.error(`[❌ ERROR] No contract deployed at factory address`);
            return false;
        }

        // List available functions (this is a hack but useful for debugging)
        console.log(`[🔍 FUNCTIONS] Available functions:`);
        const functionNames = [
            'getPool',
            'poolFor',
            'getPoolAddress',
            'createPool',
            'owner',
            'allPools',
            'allPoolsLength'
        ];

        for (const funcName of functionNames) {
            try {
                if (typeof factory[funcName] === 'function') {
                    console.log(`  ✅ ${funcName}: available`);
                } else {
                    console.log(`  ❌ ${funcName}: not available`);
                }
            } catch (e) {
                console.log(`  ❓ ${funcName}: error checking`);
            }
        }

        // Try the specific call that's failing
        const token0 = config.TOKENS.ARB_FOR;
        const token1 = config.TOKENS.ARB_AGAINST;
        const fee = config.TOKENS.POOL_FEE;

        console.log(`[🧪 TEST] Trying getPool(${token0}, ${token1}, ${fee})`);

        try {
            const result = await factory.getPool(token0, token1, fee);
            console.log(`[✅ SUCCESS] getPool result: ${result}`);
            return true;
        } catch (callError) {
            console.error(`[❌ ERROR] getPool call failed: ${callError.message}`);

            // Try with reversed token order
            try {
                console.log(`[🧪 TEST] Trying reversed token order...`);
                const result2 = await factory.getPool(token1, token0, fee);
                console.log(`[✅ SUCCESS] getPool (reversed) result: ${result2}`);
                return true;
            } catch (reverseError) {
                console.error(`[❌ ERROR] Reversed order also failed: ${reverseError.message}`);
            }
        }

        return false;

    } catch (error) {
        console.error(`[❌ ERROR] Debug factory failed: ${error.message}`);
        return false;
    }
};

// Helper function to get nested object values
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
    }, obj);
}

// Run enhanced debug
enhancedDebug();