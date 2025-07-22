// scripts/deploy.js - Fixed version with network-specific addresses
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting Arbitrage Contract Deployment...\n");

  // Network configuration
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Deployer setup
  const [deployer] = await ethers.getSigners();
  console.log(`👛 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

  // Network-specific addresses
  let constructorArgs;
  
  if (network.chainId === 1n) { // Mainnet
    constructorArgs = [
      "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e", // Aave V3 PoolAddressesProvider (Mainnet)
      "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 Router
      "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"  // Sushiswap Router
    ];
    console.log("🌍 Using MAINNET addresses");
  } else if (network.chainId === 11155111n) { // Sepolia
    constructorArgs = [
      "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A", // Aave PoolAddressesProvider (Sepolia)
      "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 Router
      "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"  // Sushiswap Router
    ];
    console.log("🧪 Using SEPOLIA addresses");
  } else {
    throw new Error(`Unsupported network: ${network.chainId}`);
  }

  // Balance check
  const minBalance = network.chainId === 1n ? 0.08 : 0.01;
  const currentBalance = parseFloat(ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
  
  if (currentBalance < minBalance) {
    throw new Error(`❌ Insufficient balance. Need at least ${minBalance} ETH, have ${currentBalance} ETH`);
  }

  // Deploy warning for mainnet
  if (network.chainId === 1n) {
    console.log("\n⚠️  MAINNET DEPLOYMENT WARNING ⚠️");
    console.log("You are about to deploy on Ethereum Mainnet!");
    console.log("This will cost real ETH. Are you sure you want to continue?");
    console.log("Press Ctrl+C to cancel...\n");
    
    // Give user 5 seconds to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Deployment execution
  // const Arbitrage = await ethers.getContractFactory("Arbitrage");
  const Arbitrage = await ethers.getContractFactory("EnhancedArbitrageBot");
  console.log("\n🏗️ Deploying contract with arguments:", constructorArgs);
  
  const arbitrage = await Arbitrage.deploy(...constructorArgs);
  console.log(`📝 Transaction Hash: ${arbitrage.deploymentTransaction().hash}`);
  
  await arbitrage.waitForDeployment();
  const contractAddress = await arbitrage.getAddress();
  console.log("\n✅ Contract deployed to:", contractAddress);

  // Post-deployment verification
  console.log("\n🔍 Verifying contract settings...");
  console.log("👑 Owner:", await arbitrage.owner());
  console.log("🏦 Aave Provider:", await arbitrage.ADDRESSES_PROVIDER());
  console.log("🦄 Uniswap Router:", await arbitrage.UNISWAP_V3_ROUTER());
  console.log("🍣 Sushiswap Router:", await arbitrage.SUSHISWAP_ROUTER());

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    constructorArgs,
    transactionHash: arbitrage.deploymentTransaction().hash
  };

  const deploymentsDir = './deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${network.chainId}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n📁 Deployment info saved to: deployments/${filename}`);

  // Final instructions
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📋 NEXT STEPS:");
  console.log(`1. Update your bot.js with contract address: ${contractAddress}`);
  console.log("2. Fund your wallet with more ETH for bot operations");
  console.log("3. Update token addresses in bot.js for mainnet:");
  console.log("   - WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
  console.log("   - DAI: 0x6B175474E89094C44Da98b954EedeAC495271d0F");
  
  if (network.chainId === 1n) {
    console.log("\n⚠️  IMPORTANT MAINNET REMINDERS:");
    console.log("- You're now on MAINNET - real money is at stake!");
    console.log("- Test thoroughly with small amounts first");
    console.log("- Monitor gas prices before executing trades");
    console.log("- Be aware of MEV bots that may front-run you");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

// // scripts/deploy.js (fixed version)
// const { ethers } = require("hardhat");
// const fs = require('fs');
// const path = require('path');

// async function main() {
//   console.log("🚀 Starting Arbitrage Contract Deployment...\n");

//   // Network configuration
//   const network = await ethers.provider.getNetwork();
//   console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

//   // Deployer setup
//   const [deployer] = await ethers.getSigners();
//   console.log(`👛 Deployer: ${deployer.address}`);
//   console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

//   // Contract parameters (verified Sepolia addresses)
//   const constructorArgs = [
//     "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A", // Aave PoolAddressesProvider
//     "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 Router
//     "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"  // Sushiswap Router
//   ];

//   // Deployment execution
//   const Arbitrage = await ethers.getContractFactory("EnhancedArbitrageBot");
//   console.log("\n🏗️ Deploying contract with arguments:", constructorArgs);
  
//   const arbitrage = await Arbitrage.deploy(...constructorArgs);
//   console.log(`📝 Transaction Hash: ${arbitrage.deploymentTransaction().hash}`);
  
//   await arbitrage.waitForDeployment();
//   console.log("\n✅ Contract deployed to:", await arbitrage.getAddress());

//   // Post-deployment verification
//   console.log("\n🔍 Verifying contract settings...");
//   console.log("👑 Owner:", await arbitrage.owner());
//   console.log("🏦 Aave Provider:", await arbitrage.ADDRESSES_PROVIDER());
//   console.log("🦄 Uniswap Router:", await arbitrage.UNISWAP_V3_ROUTER());
//   console.log("🍣 Sushiswap Router:", await arbitrage.SUSHISWAP_ROUTER());
// }

// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error("❌ Deployment failed:", error);
//     process.exit(1);
//   });




// // // scripts/deploy.js - Smart Contract Deployment Script
// // const { ethers } = require("hardhat");
// // const fs = require('fs');
// // const path = require('path');
// // async function main() {
// //     console.log("🚀 Starting Arbitrage Contract Deployment...\n");

// //     // Get network information
// //     const network = await ethers.provider.getNetwork();
// //     console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

// //     // Get deployer account
// //     const [deployer] = await ethers.getSigners();
// //     const deployerAddress = await deployer.getAddress();
// //     console.log(`👛 Deployer: ${deployerAddress}`);

// //     // Check deployer balance
// //     const balance = await ethers.provider.getBalance(deployerAddress);
// //     const balanceInEth = ethers.formatEther(balance);
// //     console.log(`💰 Balance: ${balanceInEth} ETH`);

// //     // Minimum balance check
// //     const minBalance = network.chainId === 1 ? "0.5" : "0.1"; // Mainnet vs testnet
// //     if (parseFloat(balanceInEth) < parseFloat(minBalance)) {
// //         throw new Error(`❌ Insufficient balance. Need at least ${minBalance} ETH for deployment`);
// //     }

// //     console.log("\n📋 Pre-deployment Checks:");

// //     // Get current gas price
// //     const feeData = await ethers.provider.getFeeData();
// //     console.log(`⛽ Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
// //     console.log(`⛽ Max Fee: ${ethers.formatUnits(feeData.maxFeePerGas, 'gwei')} gwei`);

// //     // Estimate deployment cost
// //     // ✅ Add constructor arguments (example values)
// //     const Arbitrage = await ethers.getContractFactory("EnhancedArbitrageBot");
// //     const deployTx = await Arbitrage.deploy(
// //         "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A", // Aave Sepolia provider[8]
// //         "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap
// //         "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F" // SushiSwap
// //     );
// //     const main = async () => {
// //         // Aave Sepolia Pool Addresses Provider
// //         const aaveProvider = "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A"; // Verified Sepolia address[8]

// //         // DEX Routers (checksum verified)
// //         const uniswapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
// //         const sushiswapRouter = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";

// //         const Arbitrage = await ethers.getContractFactory("EnhancedArbitrageBot");
// //         const arbitrage = await Arbitrage.deploy(
// //             aaveProvider,
// //             uniswapRouter,
// //             sushiswapRouter
// //         );

// //         console.log(`Contract deployed to: ${arbitrage.address}`);
// //     };

// //     const deploymentData = Arbitrage.interface.encodeDeploy([]);
// //     const estimatedGas = await ethers.provider.estimateGas({
// //         data: Arbitrage.bytecode + deploymentData.slice(2)
// //     });

// //     const estimatedCost = estimatedGas * feeData.gasPrice;
// //     const estimatedCostEth = ethers.formatEther(estimatedCost);

// //     console.log(`📊 Estimated Gas: ${estimatedGas.toString()}`);
// //     console.log(`💸 Estimated Cost: ${estimatedCostEth} ETH`);

// //     // Confirmation for mainnet
// //     if (network.chainId === 1) {
// //         console.log("\n🚨 MAINNET DEPLOYMENT WARNING!");
// //         console.log(`🚨 This will cost approximately ${estimatedCostEth} ETH`);
// //         console.log("🚨 This deployment cannot be undone!");

// //         // Wait for manual confirmation
// //         console.log("\n⏳ Deployment will start in 10 seconds...");
// //         console.log("⏳ Press Ctrl+C to abort");
// //         await new Promise(resolve => setTimeout(resolve, 10000));
// //     }

// //     console.log("\n🏗️ Deploying Arbitrage contract...");

// //     // Deploy with specific gas settings
// //     // const deployTx = await Arbitrage.deploy({
// //     //     gasLimit: estimatedGas * 12n / 10n, // 20% buffer
// //     //     maxFeePerGas: feeData.maxFeePerGas,
// //     //     maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
// //     // });

// //     console.log(`📝 Transaction Hash: ${deployTx.deploymentTransaction().hash}`);
// //     console.log("⏳ Waiting for deployment confirmation...");

// //     // Wait for deployment
// //     await deployTx.waitForDeployment();
// //     const contractAddress = await deployTx.getAddress();

// //     console.log("\n✅ Deployment Successful!");
// //     console.log(`📜 Contract Address: ${contractAddress}`);
// //     console.log(`👑 Owner: ${deployerAddress}`);

// //     // Verify deployment
// //     console.log("\n🔍 Verifying deployment...");
// //     const deployedCode = await ethers.provider.getCode(contractAddress);

// //     if (deployedCode === '0x') {
// //         throw new Error("❌ Contract deployment failed - no code at address");
// //     }

// //     console.log(`✅ Contract deployed successfully (${deployedCode.length} bytes)`);

// //     // Test basic functionality
// //     console.log("\n🧪 Testing basic contract functionality...");

// //     try {
// //         const arbitrage = await ethers.getContractAt("Arbitrage", contractAddress);

// //         // Test owner function
// //         const owner = await arbitrage.owner();
// //         console.log(`👑 Contract Owner: ${owner}`);

// //         if (owner.toLowerCase() !== deployerAddress.toLowerCase()) {
// //             console.warn("⚠️ WARNING: Contract owner doesn't match deployer");
// //         } else {
// //             console.log("✅ Owner verification successful");
// //         }

// //         // Test pool address provider
// //         const poolProvider = await arbitrage.ADDRESSES_PROVIDER();
// //         console.log(`🏦 Aave Pool Provider: ${poolProvider}`);

// //         // Test router addresses
// //         const uniRouter = await arbitrage.UNISWAP_V3_ROUTER();
// //         const sushiRouter = await arbitrage.SUSHISWAP_ROUTER();
// //         console.log(`🦄 Uniswap Router: ${uniRouter}`);
// //         console.log(`🍣 SushiSwap Router: ${sushiRouter}`);

// //         console.log("✅ All basic tests passed");

// //     } catch (testError) {
// //         console.error("⚠️ WARNING: Basic tests failed:", testError.message);
// //         console.log("Contract deployed but functionality not verified");
// //     }

// //     // Update configuration files
// //     console.log("\n📝 Updating configuration files...");

// //     try {
// //         // Update config.json
// //         const configPath = path.join(__dirname, '..', 'config.json');
// //         if (fs.existsSync(configPath)) {
// //             const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
// //             config.PROJECT_SETTINGS.ARBITRAGE_ADDRESS = contractAddress;
// //             fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
// //             console.log("✅ Updated config.json with contract address");
// //         }

// //         // Create deployment record
// //         const deploymentRecord = {
// //             contractAddress,
// //             deployerAddress,
// //             network: network.name,
// //             chainId: network.chainId,
// //             deploymentHash: deployTx.deploymentTransaction().hash,
// //             blockNumber: (await deployTx.deploymentTransaction().wait()).blockNumber,
// //             timestamp: new Date().toISOString(),
// //             gasUsed: estimatedGas.toString(),
// //             gasCost: estimatedCostEth
// //         };

// //         const deploymentsDir = path.join(__dirname, '..', 'deployments');
// //         if (!fs.existsSync(deploymentsDir)) {
// //             fs.mkdirSync(deploymentsDir);
// //         }

// //         const deploymentFile = path.join(deploymentsDir, `${network.name}-${Date.now()}.json`);
// //         fs.writeFileSync(deploymentFile, JSON.stringify(deploymentRecord, null, 2));
// //         console.log(`✅ Deployment record saved: ${deploymentFile}`);

// //     } catch (fileError) {
// //         console.warn("⚠️ WARNING: Could not update config files:", fileError.message);
// //     }

// //     // Generate verification command
// //     if (network.chainId === 1 && process.env.ETHERSCAN_API_KEY) {
// //         console.log("\n🔍 Etherscan Verification:");
// //         console.log("Run this command to verify on Etherscan:");
// //         console.log(`npx hardhat verify --network mainnet ${contractAddress}`);
// //     }

// //     // Final summary
// //     console.log("\n📋 DEPLOYMENT SUMMARY");
// //     console.log("=".repeat(50));
// //     console.log(`Contract Address: ${contractAddress}`);
// //     console.log(`Network: ${network.name} (${network.chainId})`);
// //     console.log(`Owner: ${deployerAddress}`);
// //     console.log(`Gas Used: ~${estimatedGas.toString()}`);
// //     console.log(`Cost: ~${estimatedCostEth} ETH`);
// //     console.log("=".repeat(50));

// //     if (network.chainId === 1) {
// //         console.log("\n🚨 MAINNET DEPLOYMENT COMPLETE!");
// //         console.log("🚨 SAVE THE CONTRACT ADDRESS SAFELY!");
// //         console.log("🚨 You can now use this address in your trading bot");
// //     } else {
// //         console.log("\n✅ Testnet deployment complete!");
// //         console.log("✅ Test the contract before mainnet deployment");
// //     }

// //     // Next steps
// //     console.log("\n📋 Next Steps:");
// //     console.log("1. Save the contract address in a secure location");
// //     console.log("2. Update your bot configuration with the contract address");
// //     console.log("3. Test the arbitrage functionality on testnet first");
// //     console.log("4. Fund the contract owner wallet with ETH for gas");
// //     console.log("5. Start your arbitrage bot");

// //     return contractAddress;
// // }

// // // Execute deployment
// // main()
// //     .then((contractAddress) => {
// //         console.log(`\n🎉 Deployment completed successfully!`);
// //         console.log(`Contract: ${contractAddress}`);
// //         process.exit(0);
// //     })
// //     .catch((error) => {
// //         console.error("❌ Deployment failed:", error);
// //         process.exit(1);
// //     });