// scripts/deployEnhanced.js - Deploy Enhanced Market Manipulation Contract
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Deploying Enhanced Market Manipulation Arbitrage Contract...\n");

    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log(`👛 Deployer: ${deployerAddress}`);

    // Check deployer balance
    const balance = await ethers.provider.getBalance(deployerAddress);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`💰 Balance: ${balanceInEth} ETH`);

    // Network-specific configurations
    let aaveAddressesProvider;
    let wethAddress, daiAddress;
    
    if (network.chainId === 1n) { // Mainnet
        aaveAddressesProvider = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";
        wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
        console.log("🌍 Mainnet configuration loaded");
    } else if (network.chainId === 11155111n) { // Sepolia
        aaveAddressesProvider = "0x0496275d34753A48320CA58103d5220d394FF77F";
        wethAddress = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
        daiAddress = "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357";
        console.log("🧪 Sepolia testnet configuration loaded");
    } else {
        throw new Error(`Unsupported network: ${network.chainId}`);
    }

    console.log("\n📋 Contract Configuration:");
    console.log(`🏦 AAVE Addresses Provider: ${aaveAddressesProvider}`);
    console.log(`💎 WETH Address: ${wethAddress}`);
    console.log(`💵 DAI Address: ${daiAddress}`);

    // Estimate deployment cost
    const EnhancedArbitrageBot = await ethers.getContractFactory("EnhancedArbitrageBot");
    const deploymentData = EnhancedArbitrageBot.interface.encodeDeploy([aaveAddressesProvider]);
    
    const estimatedGas = await ethers.provider.estimateGas({
        data: EnhancedArbitrageBot.bytecode + deploymentData.slice(2)
    });

    const feeData = await ethers.provider.getFeeData();
    const estimatedCost = estimatedGas * feeData.gasPrice;
    const estimatedCostEth = ethers.formatEther(estimatedCost);

    console.log(`\n📊 Deployment Estimates:`);
    console.log(`⛽ Gas Required: ${estimatedGas.toString()}`);
    console.log(`💸 Estimated Cost: ${estimatedCostEth} ETH`);

    // Safety checks
    if (parseFloat(balanceInEth) < parseFloat(estimatedCostEth) * 2) {
        throw new Error(`❌ Insufficient balance for deployment. Need at least ${parseFloat(estimatedCostEth) * 2} ETH`);
    }

    // Mainnet warning
    if (network.chainId === 1n) {
        console.log("\n🚨 MAINNET DEPLOYMENT WARNING!");
        console.log("🚨 This contract will execute REAL market manipulation!");
        console.log("🚨 Ensure you understand the legal and financial risks!");
        console.log("⏳ Deployment starting in 10 seconds...");
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    console.log("\n🏗️ Deploying Enhanced ArbitrageBot contract...");

    // Deploy contract
    const enhancedArbitrageBot = await EnhancedArbitrageBot.deploy(aaveAddressesProvider, {
        gasLimit: estimatedGas * 12n / 10n, // 20% buffer
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    });

    console.log(`📝 Transaction Hash: ${enhancedArbitrageBot.deploymentTransaction().hash}`);
    console.log("⏳ Waiting for deployment confirmation...");

    await enhancedArbitrageBot.waitForDeployment();
    const contractAddress = await enhancedArbitrageBot.getAddress();

    console.log("\n✅ Deployment Successful!");
    console.log(`📜 Contract Address: ${contractAddress}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const deployedCode = await ethers.provider.getCode(contractAddress);
    
    if (deployedCode === '0x') {
        throw new Error("❌ Contract deployment failed - no code at address");
    }

    console.log(`✅ Contract deployed successfully (${deployedCode.length} bytes)`);

    // Test basic functionality
    console.log("\n🧪 Testing contract functionality...");
    
    try {
        const owner = await enhancedArbitrageBot.owner();
        console.log(`👑 Contract Owner: ${owner}`);
        
        if (owner.toLowerCase() !== deployerAddress.toLowerCase()) {
            throw new Error("Owner mismatch!");
        }
        
        // Test calculation function
        const optimalAmount = await enhancedArbitrageBot.calculateOptimalFlashAmount(
            wethAddress,
            daiAddress,
            3000
        );
        console.log(`📊 Optimal flash amount for WETH/DAI: ${ethers.formatEther(optimalAmount)} tokens`);
        
        console.log("✅ All functionality tests passed");
        
    } catch (testError) {
        console.warn("⚠️ WARNING: Some functionality tests failed:", testError.message);
    }

    // Update configuration
    console.log("\n📝 Updating configuration files...");
    
    const configUpdate = {
        ENHANCED_ARBITRAGE_ADDRESS: contractAddress,
        DEPLOYMENT_NETWORK: network.name,
        DEPLOYMENT_BLOCK: await ethers.provider.getBlockNumber(),
        DEPLOYMENT_TIMESTAMP: new Date().toISOString(),
        WETH_ADDRESS: wethAddress,
        DAI_ADDRESS: daiAddress,
        AAVE_ADDRESSES_PROVIDER: aaveAddressesProvider
    };

    // Save deployment info
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    const deploymentFile = path.join(deploymentsDir, `enhanced-${network.name}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(configUpdate, null, 2));
    console.log(`✅ Deployment record saved: ${deploymentFile}`);

    // Generate bot configuration
    const botConfig = `
// Enhanced Bot Configuration
module.exports = {
    ARBITRAGE_ADDRESS: "${contractAddress}",
    TOKEN_A: "${wethAddress}", // WETH
    TOKEN_B: "${daiAddress}",  // DAI
    POOL_FEE: 3000,
    NETWORK: "${network.name}",
    
    // Flash loan parameters
    MIN_FLASH_AMOUNT: ethers.parseEther("10"),
    MAX_FLASH_AMOUNT: ethers.parseEther("1000"),
    MIN_PROFIT_TARGET: ethers.parseEther("0.1"),
    
    // Market manipulation settings
    PRICE_IMPACT_TARGET: 200, // 2%
    MANIPULATION_COOLDOWN: 300000, // 5 minutes
};`;

    fs.writeFileSync(path.join(__dirname, '..', 'enhancedConfig.js'), botConfig);
    console.log("✅ Bot configuration file created: enhancedConfig.js");

    // Final summary
    console.log("\n📋 ENHANCED DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log(`📜 Contract Address: ${contractAddress}`);
    console.log(`🌍 Network: ${network.name} (${network.chainId})`);
    console.log(`👑 Owner: ${deployerAddress}`);
    console.log(`💰 Deployment Cost: ~${estimatedCostEth} ETH`);
    console.log(`🎯 Strategy: Flash Loan Market Manipulation`);
    console.log(`💎 Target Pair: WETH/DAI`);
    console.log("=".repeat(60));

    console.log("\n📋 NEXT STEPS:");
    console.log("1. 📝 Update manipulation_bot.js with the new contract address");
    console.log("2. 💰 Fund your wallet with ETH for gas (recommended: 1+ ETH)");
    console.log("3. 🧪 Test on small amounts first");
    console.log("4. 📊 Monitor for profitable manipulation opportunities");
    console.log("5. 🚀 Run: node manipulation_bot.js");

    if (network.chainId === 1n) {
        console.log("\n🚨 MAINNET WARNINGS:");
        console.log("🚨 This strategy involves market manipulation");
        console.log("🚨 Understand legal and regulatory implications");
        console.log("🚨 Start with small amounts to test");
        console.log("🚨 Monitor gas costs and slippage carefully");
    }

    return contractAddress;
}

main()
    .then((contractAddress) => {
        console.log(`\n🎉 Enhanced arbitrage contract deployed successfully!`);
        console.log(`📜 Address: ${contractAddress}`);
        console.log(`🚀 Ready for flash loan market manipulation!`);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Enhanced deployment failed:", error);
        process.exit(1);
    });
