// Debug initialization.js - Find the Contract Loading Issue
const { ethers } = require("ethers");
require("dotenv").config();

console.log("[🔍 DEBUG] Starting initialization debug...");

// Check environment variables
console.log("[🔍 ENV] Environment variables:");
console.log(`   ALCHEMY_API_KEY: ${process.env.ALCHEMY_API_KEY ? '✅ Present' : '❌ Missing'}`);
console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY ? '✅ Present' : '❌ Missing'}`);
console.log(`   NETWORK: ${process.env.NETWORK || 'mainnet'}`);

// Load and check config
let config;
try {
    config = require('./config.json');
    console.log("[🔍 CONFIG] Configuration loaded:");
    console.log(`   ARBITRAGE_ADDRESS: ${config.PROJECT_SETTINGS?.ARBITRAGE_ADDRESS || '❌ Missing'}`);
    console.log(`   ARB_FOR: ${config.TOKENS?.ARB_FOR || '❌ Missing'}`);
    console.log(`   ARB_AGAINST: ${config.TOKENS?.ARB_AGAINST || '❌ Missing'}`);
} catch (configError) {
    console.error("[❌ ERROR] Failed to load config.json:", configError.message);
    process.exit(1);
}

// Setup provider
let provider;
try {
    const network = process.env.NETWORK || 'mainnet';
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    
    let providerUrl;
    if (network === 'sepolia') {
        providerUrl = `wss://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
    } else {
        providerUrl = `wss://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    }
    
    console.log(`[🔍 PROVIDER] Creating provider for ${network}:`);
    console.log(`   URL: ${providerUrl.substring(0, 50)}...`);
    
    provider = new ethers.WebSocketProvider(providerUrl);
    console.log("[✅ SUCCESS] Provider created");
    
} catch (providerError) {
    console.error("[❌ ERROR] Provider creation failed:", providerError.message);
    process.exit(1);
}

// Test provider connection
async function testProvider() {
    try {
        console.log("[🔍 PROVIDER] Testing provider connection...");
        const network = await provider.getNetwork();
        console.log(`[✅ SUCCESS] Connected to chain ID: ${network.chainId}`);
        
        const blockNumber = await provider.getBlockNumber();
        console.log(`[✅ SUCCESS] Current block: ${blockNumber}`);
        
    } catch (providerTestError) {
        console.error("[❌ ERROR] Provider test failed:", providerTestError.message);
    }
}

// Load and test contracts
async function testContracts() {
    console.log("\n[🔍 CONTRACTS] Testing contract loading...");
    
    // Test Uniswap V3 Factory
    try {
        const factoryAddress = config.UNISWAP.V3_FACTORY_ADDRESS;
        console.log(`[🔍 UNISWAP] Factory address: ${factoryAddress}`);
        
        if (!factoryAddress) {
            throw new Error("Uniswap factory address missing from config");
        }
        
        // Try to load factory ABI
        const IUniswapV3Factory = require('../artifacts/@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json');
        console.log("[✅ SUCCESS] Uniswap factory ABI loaded");
        
        const factory = new ethers.Contract(factoryAddress, IUniswapV3Factory.abi, provider);
        console.log("[✅ SUCCESS] Uniswap factory contract created");
        
        // Test factory call
        const owner = await factory.owner();
        console.log(`[✅ SUCCESS] Uniswap factory owner: ${owner}`);
        
    } catch (uniError) {
        console.error("[❌ ERROR] Uniswap contract test failed:", uniError.message);
    }
    
    // Test Arbitrage Contract
    try {
        const arbitrageAddress = config.PROJECT_SETTINGS.ARBITRAGE_ADDRESS;
        console.log(`[🔍 ARBITRAGE] Contract address: ${arbitrageAddress}`);
        
        if (!arbitrageAddress) {
            throw new Error("Arbitrage contract address missing from config");
        }
        
        // Check if contract exists
        const code = await provider.getCode(arbitrageAddress);
        if (code === '0x') {
            throw new Error("No contract found at arbitrage address");
        }
        console.log(`[✅ SUCCESS] Contract found at address (${code.length} bytes)`);
        
        // Try to load arbitrage ABI
        let arbitrageABI;
        try {
            const IArbitrage = require('../artifacts/contracts/ArbitrageBot.sol/ArbitrageBot.json');
            arbitrageABI = IArbitrage.abi;
            console.log("[✅ SUCCESS] ArbitrageBot ABI loaded from artifacts");
        } catch (abiError) {
            console.error("[❌ ERROR] Failed to load ArbitrageBot ABI:", abiError.message);
            console.log("[🔍 DEBUG] Checking artifacts directory...");
            
            const fs = require('fs');
            const path = require('path');
            
            const artifactsPath = path.join(__dirname, '..', 'artifacts');
            if (fs.existsSync(artifactsPath)) {
                console.log("[✅ SUCCESS] Artifacts directory exists");
                
                const contractsPath = path.join(artifactsPath, 'contracts');
                if (fs.existsSync(contractsPath)) {
                    console.log("[✅ SUCCESS] Contracts artifacts exist");
                    
                    const files = fs.readdirSync(contractsPath);
                    console.log(`[🔍 DEBUG] Available contract artifacts:`, files);
                } else {
                    console.log("[❌ ERROR] No contracts in artifacts");
                }
            } else {
                console.log("[❌ ERROR] Artifacts directory doesn't exist");
                console.log("[🔍 DEBUG] Run 'npx hardhat compile' first");
            }
            return;
        }
        
        const arbitrageContract = new ethers.Contract(arbitrageAddress, arbitrageABI, provider);
        console.log("[✅ SUCCESS] Arbitrage contract created");
        
        // Test contract call
        const owner = await arbitrageContract.owner();
        console.log(`[✅ SUCCESS] Arbitrage contract owner: ${owner}`);
        
    } catch (arbitrageError) {
        console.error("[❌ ERROR] Arbitrage contract test failed:", arbitrageError.message);
    }
}

// Run all tests
async function runTests() {
    await testProvider();
    await testContracts();
    
    console.log("\n[📋 SUMMARY] Debug Results:");
    console.log("1. Check that config.json has the correct contract address");
    console.log("2. Ensure 'npx hardhat compile' was run to generate artifacts");
    console.log("3. Verify the contract is deployed on the correct network");
    console.log("4. Check that all ABI files exist in artifacts/");
    
    provider.destroy();
}

runTests().catch(console.error);