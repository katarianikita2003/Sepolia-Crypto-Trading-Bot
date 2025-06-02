// Real Arbitrage Helpers - Flash Loan & Trade Execution
const { ethers } = require("ethers");
require("dotenv").config();

// Import dependencies
const initialization = require('./initialization');
const config = require('../config.json');
const { provider } = initialization;
console.log("🔍 Provider Type:", typeof provider);
console.log("🔍 Provider Network Test...");
provider.getNetwork()
  .then(network => console.log("✅ Provider network:", network))
  .catch(err => console.error("❌ Provider test failed:", err.message));

console.log("🔍 Arbitrage Address:", config?.PROJECT_SETTINGS?.ARBITRAGE_ADDRESS);

try {
  const IArbitrage = require('../artifacts/contracts/Arbitrage.sol/Arbitrage.json');
  console.log("✅ ABI Loaded:", !!IArbitrage.abi);
  const contract = new ethers.Contract(config?.PROJECT_SETTINGS?.ARBITRAGE_ADDRESS, IArbitrage.abi, provider);
  console.log("✅ Contract created");
} catch (err) {
  console.error("❌ Contract creation failed:", err.message);
}

const AAVE_POOL = config.AAVE.POOL;
const ARBITRAGE_CONTRACT = config?.PROJECT_SETTINGS?.ARBITRAGE_ADDRESS;

if (!ARBITRAGE_CONTRACT) {
    throw new Error("ARBITRAGE_CONTRACT address is missing or invalid in config.json");
}
console.log("📦 Loaded config:", JSON.stringify(config, null, 2));

// Gas configuration
const GAS_LIMIT = config.PROJECT_SETTINGS.GAS_LIMIT || 800000;
const GAS_MULTIPLIER = 1.2; // 20% buffer
const SLIPPAGE_TOLERANCE = 0.02; // 2%
const MIN_PROFIT_THRESHOLD = 0.5; // 0.5% minimum profit after all costs

/**
 * ✅ Calculate exact arbitrage amounts and profits
 */
async function calculateArbitrageAmounts(token0, token1, uniPrice, sushiPrice, maxAmount = null) {
    try {
        console.log("[📊 CALC] Calculating optimal arbitrage amounts...");

        // Determine direction
        const buyUni = uniPrice < sushiPrice;
        const buyPrice = buyUni ? uniPrice : sushiPrice;
        const sellPrice = buyUni ? sushiPrice : uniPrice;
        const priceSpread = ((sellPrice - buyPrice) / buyPrice) * 100;

        console.log(`[📊 SPREAD] Price spread: ${priceSpread.toFixed(4)}%`);
        console.log(`[📊 DIRECTION] ${buyUni ? 'Buy Uniswap → Sell SushiSwap' : 'Buy SushiSwap → Sell Uniswap'}`);

        // Calculate optimal trade amount (simplified - you may want more sophisticated calculation)
        const optimalAmount = maxAmount || ethers.parseEther("10"); // Default 10 ETH worth

        // Calculate expected amounts
        const buyAmount = optimalAmount;
        const sellAmount = (buyAmount * BigInt(Math.floor(sellPrice * 1e6))) / BigInt(Math.floor(buyPrice * 1e6));

        // Apply slippage
        const minSellAmount = sellAmount * BigInt(Math.floor((1 - SLIPPAGE_TOLERANCE) * 1000)) / 1000n;

        // Calculate profit
        const grossProfit = sellAmount - buyAmount;

        return {
            profitable: priceSpread >= MIN_PROFIT_THRESHOLD,
            direction: buyUni ? 'uni-to-sushi' : 'sushi-to-uni',
            buyExchange: buyUni ? 'uniswap' : 'sushiswap',
            sellExchange: buyUni ? 'sushiswap' : 'uniswap',
            buyAmount,
            sellAmount,
            minSellAmount,
            grossProfit,
            priceSpread,
            buyPrice,
            sellPrice
        };

    } catch (error) {
        console.error("[❌ ERROR] calculateArbitrageAmounts failed:", error.message);
        return { profitable: false, error: error.message };
    }
}

/**
 * ✅ Estimate gas costs for arbitrage transaction
 */
async function estimateGasCosts(arbitrageContract, calldata) {
    try {
        console.log("[⛽ GAS] Estimating transaction gas costs...");

        // Get current gas price
        const gasPrice = await provider.getFeeData();
        const maxFeePerGas = gasPrice.maxFeePerGas;
        const maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas;

        console.log(`[⛽ GAS] Max Fee: ${ethers.formatUnits(maxFeePerGas, 'gwei')} gwei`);
        console.log(`[⛽ GAS] Priority Fee: ${ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei`);

        // Estimate gas limit (with buffer)
        const estimatedGas = BigInt(GAS_LIMIT);
        const gasWithBuffer = estimatedGas * BigInt(Math.floor(GAS_MULTIPLIER * 100)) / 100n;

        // Calculate total gas cost
        const totalGasCost = gasWithBuffer * maxFeePerGas;

        console.log(`[⛽ GAS] Estimated gas: ${estimatedGas.toString()}`);
        console.log(`[⛽ GAS] Gas with buffer: ${gasWithBuffer.toString()}`);
        console.log(`[⛽ GAS] Total gas cost: ${ethers.formatEther(totalGasCost)} ETH`);

        return {
            gasLimit: gasWithBuffer,
            maxFeePerGas,
            maxPriorityFeePerGas,
            totalGasCost,
            gasCostInWei: totalGasCost
        };

    } catch (error) {
        console.error("[❌ ERROR] estimateGasCosts failed:", error.message);
        return null;
    }
}

/**
 * ✅ Calculate net profit after all costs
 */
async function calculateNetProfit(grossProfit, gasCost, flashLoanFee = 0n) {
    try {
        const netProfit = grossProfit - gasCost - flashLoanFee;
        const profitInEth = ethers.formatEther(netProfit);

        console.log(`[💰 PROFIT] Gross profit: ${ethers.formatEther(grossProfit)} ETH`);
        console.log(`[💰 COSTS] Gas cost: ${ethers.formatEther(gasCost)} ETH`);
        console.log(`[💰 COSTS] Flash loan fee: ${ethers.formatEther(flashLoanFee)} ETH`);
        console.log(`[💰 NET] Net profit: ${profitInEth} ETH`);

        return {
            netProfit,
            profitInEth: parseFloat(profitInEth),
            profitable: netProfit > 0n,
            grossProfit,
            totalCosts: gasCost + flashLoanFee
        };

    } catch (error) {
        console.error("[❌ ERROR] calculateNetProfit failed:", error.message);
        return { profitable: false, error: error.message };
    }
}

/**
 * ✅ Execute flash loan arbitrage
 */
async function executeFlashLoanArbitrage(arbitrageParams, gasParams) {
    try {
        console.log("[🚀 EXECUTION] Starting flash loan arbitrage...");

        if (!process.env.PRIVATE_KEY) {
            throw new Error("PRIVATE_KEY not found in environment variables");
        }

        if (!ARBITRAGE_CONTRACT) {
            throw new Error("ARBITRAGE_CONTRACT address not configured");
        }

        // Create wallet
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        console.log(`[👛 WALLET] Using wallet: ${wallet.address}`);

        // Load arbitrage contract
        let arbitrageContract;
        try {
            const IArbitrage = require('../artifacts/contracts/Arbitrage.sol/Arbitrage.json');
            arbitrageContract = new ethers.Contract(ARBITRAGE_CONTRACT, IArbitrage.abi, wallet);
            console.log(`[📜 CONTRACT] Arbitrage contract loaded: ${ARBITRAGE_CONTRACT}`);
        } catch (contractError) {
            throw new Error(`Failed to load arbitrage contract: ${contractError.message}`);
        }

        // Prepare flash loan parameters
        const buyRouterAddress = await (arbitrageParams.buyExchange === 'uniswap'
            ? initialization.uniswap.router.getAddress()
            : initialization.sushiswap.router.getAddress());

        const sellRouterAddress = await (arbitrageParams.sellExchange === 'uniswap'
            ? initialization.uniswap.router.getAddress()
            : initialization.sushiswap.router.getAddress());

        const flashLoanParams = {
            asset: arbitrageParams.token, // Token to borrow
            amount: arbitrageParams.buyAmount, // Amount to borrow
            params: ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'address', 'uint256', 'uint256', 'bool'],
                [
                    buyRouterAddress,
                    sellRouterAddress,
                    arbitrageParams.buyAmount,
                    arbitrageParams.minSellAmount,
                    arbitrageParams.direction === 'uni-to-sushi'
                ]
            )
        };


        console.log("[📋 PARAMS] Flash loan parameters prepared");

        // Execute flash loan
        console.log("[🏦 AAVE] Initiating flash loan...");
        const transaction = await arbitrageContract.executeArbitrage(
            flashLoanParams.asset,
            flashLoanParams.amount,
            flashLoanParams.params,
            {
                gasLimit: gasParams.gasLimit,
                maxFeePerGas: gasParams.maxFeePerGas,
                maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas
            }
        );

        console.log(`[📝 TX] Transaction sent: ${transaction.hash}`);
        console.log("[⏳ WAIT] Waiting for confirmation...");

        // Wait for confirmation
        const receipt = await transaction.wait();

        if (receipt.status === 1) {
            console.log(`[✅ SUCCESS] Arbitrage executed successfully!`);
            console.log(`[📝 TX] Transaction hash: ${receipt.hash}`);
            console.log(`[⛽ GAS] Gas used: ${receipt.gasUsed.toString()}`);

            // Calculate actual costs
            const actualGasCost = receipt.gasUsed * receipt.gasPrice;
            console.log(`[💰 COST] Actual gas cost: ${ethers.formatEther(actualGasCost)} ETH`);

            return {
                success: true,
                transactionHash: receipt.hash,
                gasUsed: receipt.gasUsed,
                gasCost: actualGasCost,
                blockNumber: receipt.blockNumber
            };

        } else {
            throw new Error("Transaction failed");
        }

    } catch (error) {
        console.error("[❌ ERROR] executeFlashLoanArbitrage failed:", error.message);

        // Handle specific error types
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.error("[💸 ERROR] Insufficient funds for gas");
        } else if (error.code === 'REPLACEMENT_UNDERPRICED') {
            console.error("[⛽ ERROR] Gas price too low");
        } else if (error.message.includes('revert')) {
            console.error("[🔄 ERROR] Transaction would revert - likely unprofitable");
        }

        throw error;
    }
}

/**
 * ✅ Main arbitrage execution orchestrator
 */
async function executeArbitrageOpportunity(opportunity, token0, token1) {
    const startTime = Date.now();

    try {
        console.log("\n[🎯 ARBITRAGE] ============ EXECUTING REAL ARBITRAGE ============");
        console.log(`[📊 OPPORTUNITY] Direction: ${opportunity.direction}`);
        console.log(`[📊 OPPORTUNITY] Profit potential: ${Math.abs(opportunity.difference)}%`);

        // Step 1: Calculate precise arbitrage amounts
        console.log("\n[1️⃣ CALCULATE] Calculating arbitrage parameters...");
        const arbitrageCalc = await calculateArbitrageAmounts(
            token0,
            token1,
            opportunity.uniPrice,
            opportunity.sushiPrice
        );

        if (!arbitrageCalc.profitable) {
            console.log("[❌ ABORT] Arbitrage not profitable after detailed calculation");
            return { success: false, reason: "Not profitable" };
        }

        // Step 2: Estimate gas costs
        console.log("\n[2️⃣ GAS] Estimating gas costs...");
        const gasParams = await estimateGasCosts(null, null);

        if (!gasParams) {
            throw new Error("Failed to estimate gas costs");
        }

        // Step 3: Calculate net profit
        console.log("\n[3️⃣ PROFIT] Calculating net profit...");
        const profitCalc = await calculateNetProfit(
            arbitrageCalc.grossProfit,
            gasParams.gasCostInWei,
            ethers.parseEther("0.0009") // Aave flash loan fee (0.09%)
        );

        if (!profitCalc.profitable) {
            console.log(`[❌ ABORT] Not profitable after costs. Net: ${profitCalc.profitInEth} ETH`);
            return { success: false, reason: "Unprofitable after costs", netProfit: profitCalc.profitInEth };
        }

        console.log(`[✅ PROFITABLE] Expected net profit: ${profitCalc.profitInEth} ETH`);

        // Step 4: Final safety check
        console.log("\n[4️⃣ SAFETY] Final safety checks...");

        // Check wallet balance
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const balance = await provider.getBalance(wallet.address);
        const requiredBalance = gasParams.gasCostInWei * 2n; // 2x buffer

        if (balance < requiredBalance) {
            throw new Error(`Insufficient ETH balance. Have: ${ethers.formatEther(balance)}, Need: ${ethers.formatEther(requiredBalance)}`);
        }

        console.log(`[✅ BALANCE] Sufficient ETH balance: ${ethers.formatEther(balance)} ETH`);

        // Step 5: Execute the arbitrage
        console.log("\n[5️⃣ EXECUTE] Executing flash loan arbitrage...");
        console.log("🚨 WARNING: REAL MONEY TRANSACTION STARTING IN 3 SECONDS...");

        // 3-second delay for safety
        await new Promise(resolve => setTimeout(resolve, 3000));

        const arbitrageParams = {
            token: token0.address,
            buyAmount: arbitrageCalc.buyAmount,
            minSellAmount: arbitrageCalc.minSellAmount,
            buyExchange: arbitrageCalc.buyExchange,
            sellExchange: arbitrageCalc.sellExchange,
            direction: arbitrageCalc.direction
        };

        const result = await executeFlashLoanArbitrage(arbitrageParams, gasParams);

        // Step 6: Report results
        const executionTime = Date.now() - startTime;
        console.log(`\n[🎉 COMPLETE] Arbitrage completed in ${executionTime}ms`);
        console.log(`[💰 PROFIT] Expected profit: ${profitCalc.profitInEth} ETH`);
        console.log(`[📝 TX] Transaction: ${result.transactionHash}`);

        return {
            success: true,
            transactionHash: result.transactionHash,
            expectedProfit: profitCalc.profitInEth,
            gasUsed: result.gasUsed,
            executionTime
        };

    } catch (error) {
        console.error("[❌ FAILED] Arbitrage execution failed:", error.message);
        return {
            success: false,
            error: error.message,
            executionTime: Date.now() - startTime
        };
    }
}

/**
 * ✅ Validate arbitrage contract is deployed and functional
 */
async function validateArbitrageContract() {
    try {
        if (!ARBITRAGE_CONTRACT) {
            throw new Error("ARBITRAGE_CONTRACT address not configured");
        }

        const IArbitrage = require('../artifacts/contracts/Arbitrage.sol/Arbitrage.json');
        const contract = new ethers.Contract(ARBITRAGE_CONTRACT, IArbitrage.abi, provider);

        // Test contract is deployed
        const code = await provider.getCode(ARBITRAGE_CONTRACT);
        if (code === '0x') {
            throw new Error("No contract deployed at ARBITRAGE_CONTRACT address");
        }

        // Test contract owner
        const owner = await contract.owner();
        console.log(`[📜 CONTRACT] Arbitrage contract owner: ${owner}`);

        // Test if our wallet matches owner
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
            console.warn(`[⚠️ WARNING] Wallet ${wallet.address} is not contract owner ${owner}`);
        }

        return true;

    } catch (error) {
        console.error("[❌ ERROR] Arbitrage contract validation failed:", error.message);
        return false;
    }
}

module.exports = {
    executeArbitrageOpportunity,
    calculateArbitrageAmounts,
    estimateGasCosts,
    calculateNetProfit,
    executeFlashLoanArbitrage,
    validateArbitrageContract
};