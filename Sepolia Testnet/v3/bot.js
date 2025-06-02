require("dotenv").config();
require('./helpers/server');
const Big = require('big.js');
const ethers = require("ethers");
const config = require('./config.json');
const { getTokenAndContract, getPoolContract, getPoolLiquidity, calculatePrice } = require('./helpers/helpers');
const { provider, uniswap, sushiswap, arbitrage } = require('./helpers/initialization');

const ARB_FOR = config.TOKENS.ARB_FOR;
const ARB_AGAINST = config.TOKENS.ARB_AGAINST;
const POOL_FEE = config.TOKENS.POOL_FEE;
const PRICE_DIFFERENCE = config.PROJECT_SETTINGS.PRICE_DIFFERENCE;

let isExecuting = false;

function logWithTime(msg, ...args) {
    console.log(`[${new Date().toISOString()}] ${msg}`, ...args);
}

const main = async () => {
    try {
        const { token0, token1 } = await getTokenAndContract(ARB_FOR, ARB_AGAINST, provider);

        const uPool = await getPoolContract(uniswap, token0.address, token1.address, POOL_FEE, provider);
        const sPool = await getPoolContract(sushiswap, token0.address, token1.address, POOL_FEE, provider);

        logWithTime(`Using ${token1.symbol}/${token0.symbol}`);
        logWithTime(`Uniswap Pool Address: ${await uPool.getAddress()}`);
        logWithTime(`SushiSwap Pool Address: ${await sPool.getAddress()}`);

        uPool.on('Swap', () => eventHandler(uPool, sPool, token0, token1));
        logWithTime(`[✅ LISTENER] Listening to Uniswap V3 pool Swap events.`);
        sPool.on('Swap', () => eventHandler(uPool, sPool, token0, token1));
        logWithTime(`[✅ LISTENER] Listening to SushiSwap V2 pool Swap events.`);
    } catch (err) {
        logWithTime(`[❌ ERROR] Initialization failed:`, err);
        process.exit(1);
    }
};

const eventHandler = async (_uPool, _sPool, _token0, _token1) => {
    logWithTime(`[DEBUG] eventHandler called with pools:`, {
        uniswapPool: await _uPool.getAddress(),
        sushiPool: await _sPool.getAddress()
    });
    if (isExecuting) return;
    isExecuting = true;
    try {
        const priceDifference = await checkPrice([_uPool, _sPool], _token0, _token1);
        if (priceDifference === null) {
            logWithTime(`[INFO] No valid price difference, skipping.`);
            return;
        }
        const exchangePath = await determineDirection(priceDifference);
        if (!exchangePath) {
            logWithTime(`[INFO] No arbitrage opportunity.`);
            return;
        }
        const { isProfitable, amount } = await determineProfitability(exchangePath, _token0, _token1);
        if (!isProfitable) {
            logWithTime(`[INFO] Trade not profitable.`);
            return;
        }
        await executeTrade(exchangePath, _token0, _token1, amount);
    } catch (err) {
        logWithTime(`[ERROR] eventHandler failed:`, err);
    } finally {
        isExecuting = false;
        logWithTime(`[INFO] Handler finished, waiting for next event.`);
    }
};

const checkPrice = async (_pools, _token0, _token1) => {
    try {
        logWithTime(`Swap Detected, Checking Prices...`);
        const currentBlock = await provider.getBlockNumber();
        logWithTime(`Current Block: ${currentBlock}`);

        let uPrice = 0, sPrice = 0;
        try {
            uPrice = await calculatePrice(_pools[0], _token0, _token1, uniswap.name, uniswap);
            if (uPrice === 0 || isNaN(uPrice)) {
                logWithTime(`[WARNING] Uniswap returned invalid price: ${uPrice}`);
            } else {
                logWithTime(`[SUCCESS] Uniswap Price (${_token1.symbol}/${_token0.symbol}): ${uPrice}`);
            }
        } catch (uniErr) {
            logWithTime(`[ERROR] Uniswap price calculation failed:`, uniErr);
        }

        try {
            sPrice = await calculatePrice(_pools[1], _token0, _token1, sushiswap.name, sushiswap);
            if (sPrice === 0 || isNaN(sPrice)) {
                logWithTime(`[WARNING] SushiSwap returned invalid price: ${sPrice}`);
            } else {
                logWithTime(`[SUCCESS] SushiSwap Price (${_token1.symbol}/${_token0.symbol}): ${sPrice}`);
            }
        } catch (sushiErr) {
            logWithTime(`[ERROR] SushiSwap price calculation failed:`, sushiErr);
        }

        if (uPrice > 0 && sPrice > 0) {
            const priceDifference = (((uPrice - sPrice) / sPrice) * 100).toFixed(2);
            logWithTime(`Percentage Difference: ${priceDifference}%`);
            return priceDifference;
        } else {
            logWithTime(`[ERROR] Invalid prices detected (Uniswap: ${uPrice}, SushiSwap: ${sPrice}). Skipping arbitrage calculation.`);
            return null;
        }
    } catch (err) {
        logWithTime(`[UNEXPECTED ERROR] checkPrice failed:`, err);
        return null;
    }
};

const determineDirection = async (_priceDifference) => {
    logWithTime(`Determining Direction...`);
    if (_priceDifference >= PRICE_DIFFERENCE) {
        logWithTime(`Buy --> ${uniswap.name}, Sell --> ${sushiswap.name}`);
        return [uniswap, sushiswap];
    } else if (_priceDifference <= -(PRICE_DIFFERENCE)) {
        logWithTime(`Buy --> ${sushiswap.name}, Sell --> ${uniswap.name}`);
        return [sushiswap, uniswap];
    } else {
        return null;
    }
};

const determineProfitability = async (_exchangePath, _token0, _token1, _fee = POOL_FEE) => {
    logWithTime(`[DEBUG] Exchange Path: `, _exchangePath);
    if (!_exchangePath[0] || !_exchangePath[0].factory) {
        logWithTime(`[ERROR] determineProfitability: Exchange object is undefined or missing a factory.`);
        return { isProfitable: false, amount: 0 };
    }
    const liquidity = await getPoolLiquidity(_exchangePath[0].factory, _token0, _token1, _fee, provider);
    const percentage = Big(0.5);
    const minAmount = Big(liquidity[1]).mul(percentage);

    if (_exchangePath[0].name === "Uniswap V3" && _exchangePath[0].quoter) {
        try {
            logWithTime(`[DEBUG] Calling Uniswap V3 quoter with fee: ${_fee}`);
            const token0Needed = await _exchangePath[0].quoter.quoteExactInputSingle.staticCall({
                tokenIn: _token0.address,
                tokenOut: _token1.address,
                fee: _fee,
                amountIn: BigInt(minAmount.round().toFixed(0)),
                sqrtPriceLimitX96: 0
            });
            logWithTime(`[SUCCESS] Uniswap Quoter returned: ${token0Needed}`);
        } catch (error) {
            logWithTime(`[ERROR] Uniswap V3 quoter failed:`, error);
            return { isProfitable: false, amount: 0 };
        }
    } else {
        logWithTime(`[ERROR] Invalid Exchange Type for Quoter: ${_exchangePath[0].name}`);
        return { isProfitable: false, amount: 0 };
    }
    return { isProfitable: true, amount: ethers.parseUnits(minAmount.round().toFixed(0), _token0.decimals) };
};

const executeTrade = async (_exchangePath, _token0, _token1, _amount) => {
    logWithTime(`Attempting Arbitrage...`);
    const routerPath = [
        await _exchangePath[0].router.getAddress(),
        await _exchangePath[1].router.getAddress()
    ];
    const tokenPath = [
        _token0.address,
        _token1.address
    ];
    const account = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const tokenBalanceBefore = await _token0.contract.balanceOf(account.address);
    const ethBalanceBefore = await provider.getBalance(account.address);

    try {
        const transaction = await arbitrage.connect(account).executeTrade(
            routerPath,
            tokenPath,
            POOL_FEE,
            _amount
        );
        const receipt = await transaction.wait(1);
        logWithTime(`[SUCCESS] Trade Executed! Tx Hash: ${receipt.transactionHash}`);
    } catch (error) {
        logWithTime(`[ERROR] Trade Execution Failed:`, error);
    }

    const tokenBalanceAfter = await _token0.contract.balanceOf(account.address);
    const ethBalanceAfter = await provider.getBalance(account.address);
    const tokenBalanceDifference = tokenBalanceAfter - tokenBalanceBefore;
    const ethBalanceDifference = ethBalanceBefore - ethBalanceAfter;

    console.table({
        'ETH Balance Before': ethers.formatUnits(ethBalanceBefore, 18),
        'ETH Balance After': ethers.formatUnits(ethBalanceAfter, 18),
        'ETH Spent (gas)': ethers.formatUnits(ethBalanceDifference.toString(), 18),
        'WETH Balance BEFORE': ethers.formatUnits(tokenBalanceBefore, _token0.decimals),
        'WETH Balance AFTER': ethers.formatUnits(tokenBalanceAfter, _token0.decimals),
        'WETH Gained/Lost': ethers.formatUnits(tokenBalanceDifference.toString(), _token0.decimals),
    });
};

main();