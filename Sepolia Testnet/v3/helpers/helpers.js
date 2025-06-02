// helpers.js
const ethers = require("ethers");
const IERC20 = require('@openzeppelin/contracts/build/contracts/ERC20.json');

// Utility: log with timestamp
function logWithTime(message, ...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...args);
}

// Load ERC20 token metadata and contracts
async function getTokenAndContract(_token0Address, _token1Address, _provider) {
  const token0Contract = new ethers.Contract(_token0Address, IERC20.abi, _provider);
  const token1Contract = new ethers.Contract(_token1Address, IERC20.abi, _provider);

  let [symbol0, decimals0] = ['TOKEN0', 18];
  let [symbol1, decimals1] = ['TOKEN1', 18];

  try { symbol0 = await token0Contract.symbol(); } catch (err) {
    logWithTime(`[⚠️ WARNING] Could not fetch symbol for token0 (${_token0Address}). Defaulting to "TOKEN0".`);
  }
  try { decimals0 = await token0Contract.decimals(); } catch (err) {
    logWithTime(`[⚠️ WARNING] Could not fetch decimals for token0. Defaulting to 18.`);
  }
  try { symbol1 = await token1Contract.symbol(); } catch (err) {
    logWithTime(`[⚠️ WARNING] Could not fetch symbol for token1 (${_token1Address}). Defaulting to "TOKEN1".`);
  }
  try { decimals1 = await token1Contract.decimals(); } catch (err) {
    logWithTime(`[⚠️ WARNING] Could not fetch decimals for token1. Defaulting to 18.`);
  }

  return {
    token0: { contract: token0Contract, address: _token0Address, symbol: symbol0, decimals: decimals0 },
    token1: { contract: token1Contract, address: _token1Address, symbol: symbol1, decimals: decimals1 }
  };
}

// Ensure valid exchange object
function validateExchange(exchange) {
  if (!exchange || !exchange.factory) {
    throw new Error(`[❌ ERROR] Invalid exchange object provided: ${JSON.stringify(exchange)}`);
  }
}

// Get pool or pair address from exchange
async function getPoolOrPairAddress(_exchange, _tokenA, _tokenB, _fee) {
  if (!_exchange || !_exchange.name) {
    logWithTime(`[❌ ERROR] Exchange object missing required properties.`);
    return null;
  }

  logWithTime(`[📌 DEBUG] Finding pool for ${_tokenA} and ${_tokenB} on ${_exchange.name}`);
  try {
    if (_exchange.name === "Uniswap V3") {
      return await _exchange.factory.getPool(_tokenA, _tokenB, _fee);
    } else if (_exchange.name === "SushiSwap V2") {
      return await _exchange.factory.getPair(_tokenA, _tokenB);
    } else {
      throw new Error(`[❌ ERROR] Unknown exchange type: ${_exchange.name}`);
    }
  } catch (error) {
    logWithTime(`[❌ ERROR] Failed to fetch pool:`, error);
    return null;
  }
}

// Get pool contract instance
async function getPoolContract(_exchange, _tokenA, _tokenB, _fee, _provider) {
  validateExchange(_exchange);
  const poolAddress = await getPoolOrPairAddress(_exchange, _tokenA, _tokenB, _fee);

  if (!poolAddress || poolAddress === ethers.ZeroAddress) {
    throw new Error(`No ${_exchange.name} pool/pair found for: ${_tokenA} & ${_tokenB}, fee=${_fee}`);
  }

  if (_exchange.name === "Uniswap V3") {
    const IUniswapV3Pool = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json').abi;
    return new ethers.Contract(poolAddress, IUniswapV3Pool, _provider);
  }

  if (_exchange.name === "SushiSwap V2") {
    const UNISWAP_V2_PAIR_ABI = [
      "function token0() view returns (address)",
      "function token1() view returns (address)",
      "function getReserves() view returns (uint112,uint112,uint32)",
      "event Swap(address indexed sender,uint256 amount0In,uint256 amount1In,uint256 amount0Out,uint256 amount1Out,address indexed to)"
    ];
    return new ethers.Contract(poolAddress, UNISWAP_V2_PAIR_ABI, _provider);
  }

  throw new Error(`Unknown exchange type: ${_exchange.name}`);
}

// Get liquidity from pool
async function getPoolLiquidity(_exchange, _token0, _token1, _fee, _provider) {
  try {
    if (!_exchange || !_exchange.name || !_exchange.factory) {
      logWithTime(`[❌ ERROR] Invalid exchange object received.`, _exchange);
      return [0n, 0n];
    }

    logWithTime(`[📌 DEBUG] Fetching liquidity for ${_exchange.name}...`);
    const pairOrPoolAddr = await getPoolOrPairAddress(_exchange, _token0.address, _token1.address, _fee);
    if (!pairOrPoolAddr || pairOrPoolAddr === ethers.ZeroAddress) {
      logWithTime(`[⚠️ WARNING] No pool found for ${_exchange.name} on tokens ${_token0.symbol}/${_token1.symbol}`);
      return [0n, 0n];
    }

    if (_exchange.name === "Uniswap V3") {
      const token0Balance = await _token0.contract.balanceOf(pairOrPoolAddr);
      const token1Balance = await _token1.contract.balanceOf(pairOrPoolAddr);
      logWithTime(`[✅ SUCCESS] Uniswap V3 Liquidity: ${token0Balance.toString()} / ${token1Balance.toString()}`);
      return [token0Balance, token1Balance];
    }

    if (_exchange.name === "SushiSwap V2") {
      const pairContract = new ethers.Contract(pairOrPoolAddr, [
        "function getReserves() view returns (uint112,uint112,uint32)"
      ], _provider);
      const [reserve0, reserve1] = await pairContract.getReserves();
      logWithTime(`[✅ SUCCESS] SushiSwap V2 Liquidity: ${reserve0.toString()} / ${reserve1.toString()}`);
      return [reserve0, reserve1];
    }

    throw new Error(`[❌ ERROR] Unknown exchange type ${_exchange.name}`);
  } catch (error) {
    logWithTime(`[❌ ERROR] getPoolLiquidity Failed:`, error);
    return [0n, 0n];
  }
}

// Calculate token price from pool
async function calculatePrice(poolContract, token0, token1, exchangeName, exchangeObj) {
  try {
    logWithTime(`[📊 DEBUG] Calculating price for ${exchangeName}: ${token1.symbol}/${token0.symbol}`);

    if (exchangeName === "Uniswap V3") {
      if (!exchangeObj || !exchangeObj.quoter) throw new Error("Uniswap V3 quoter not provided.");

      const amountIn = ethers.parseUnits("1", token0.decimals);
      const quoterIface = exchangeObj.quoter.interface;
      const isV2 = quoterIface.getFunction("quoteExactInputSingle").inputs.length === 1;

      let quotedAmount;

      if (isV2) {
        quotedAmount = await exchangeObj.quoter.callStatic.quoteExactInputSingle({
          tokenIn: token0.address,
          tokenOut: token1.address,
          amountIn,
          fee: 3000,
          sqrtPriceLimitX96: 0
        });
        const price = ethers.formatUnits(quotedAmount.amountOut, token1.decimals);
        logWithTime(`[✅ QUOTER V2] Uniswap V3 Quoted Price: 1 ${token0.symbol} = ${price} ${token1.symbol}`);
        return parseFloat(price);
      } else {
        quotedAmount = await exchangeObj.quoter.callStatic.quoteExactInputSingle(
          token0.address,
          token1.address,
          3000,
          amountIn,
          0
        );
        const price = ethers.formatUnits(quotedAmount, token1.decimals);
        logWithTime(`[✅ QUOTER V1] Uniswap V3 Quoted Price: 1 ${token0.symbol} = ${price} ${token1.symbol}`);
        return parseFloat(price);
      }
    }

    if (exchangeName === "SushiSwap V2") {
      const [pairToken0, pairToken1] = await Promise.all([
        poolContract.token0(),
        poolContract.token1()
      ]);
      let [reserve0, reserve1] = await poolContract.getReserves();

      if (!reserve0 || !reserve1 || reserve0 === 0n || reserve1 === 0n) {
        logWithTime(`[❌ ERROR] SushiSwap reserves are invalid: ${reserve0}, ${reserve1}`);
        return 0;
      }

      if (pairToken0.toLowerCase() !== token0.address.toLowerCase()) {
        [reserve0, reserve1] = [reserve1, reserve0];
      }

      const r0 = Number(reserve0);
      const r1 = Number(reserve1);
      const dec0 = 10 ** token0.decimals;
      const dec1 = 10 ** token1.decimals;
      const price = (r1 * dec0) / (r0 * dec1);

      logWithTime(`[✅ SUCCESS] SushiSwap Price: 1 ${token0.symbol} = ${price} ${token1.symbol}`);
      return price;
    }

    throw new Error(`Unknown exchange: ${exchangeName}`);
  } catch (error) {
    logWithTime(`[❌ ERROR] calculatePrice Failed:`, error);
    return 0;
  }
}

module.exports = {
  getTokenAndContract,
  getPoolContract,
  getPoolOrPairAddress,
  getPoolLiquidity,
  calculatePrice,
  validateExchange,
  logWithTime
};
