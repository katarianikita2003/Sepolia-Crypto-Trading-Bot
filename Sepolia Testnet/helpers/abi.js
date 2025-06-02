// Helpers for exporting ABIs

// -----------------------
// Uniswap V3
// -----------------------

const IUniswapV3PoolArtifact = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");

// ✅ Properly extract ABI from artifact
const IUniswapV3PoolABI = IUniswapV3PoolArtifact.abi;

if (!IUniswapV3PoolABI) {
    console.error("[❌ ERROR] IUniswapV3Pool ABI is missing or undefined!");
    process.exit(1);
}

// -----------------------
// SushiSwap (Uniswap V2) – Complete ABIs
// -----------------------

const SUSHI_FACTORY_ABI = [
    {
        "constant": true,
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" },
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "name": "getPair",
        "outputs": [
            { "internalType": "address", "name": "pair", "type": "address" }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

const SUSHI_ROUTER_ABI = [
    {
        "constant": false,
        "inputs": [
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
            { "internalType": "address[]", "name": "path", "type": "address[]" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactTokensForTokens",
        "outputs": [
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// ✅ Complete Uniswap V2 Pair ABI with Swap event
const UNISWAP_V2_PAIR_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "token0",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "token1",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getReserves",
        "outputs": [
            { "internalType": "uint112", "name": "_reserve0", "type": "uint112" },
            { "internalType": "uint112", "name": "_reserve1", "type": "uint112" },
            { "internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32" }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount0In", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "amount1In", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "amount0Out", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "amount1Out", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "to", "type": "address" }
        ],
        "name": "Swap",
        "type": "event"
    }
];

const UNISWAP_FACTORY_ABI = [
    {
        "inputs": [],
        "name": "WETH9",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "tokenA", "type": "address" },
            { "internalType": "address", "name": "tokenB", "type": "address" },
            { "internalType": "uint24", "name": "fee", "type": "uint24" }
        ],
        "name": "getPool",
        "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    }
];

const UNISWAP_ROUTER_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "tokenIn", "type": "address" },
            { "internalType": "address", "name": "tokenOut", "type": "address" },
            { "internalType": "uint24", "name": "fee", "type": "uint24" },
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
            { "internalType": "address", "name": "recipient", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "exactInputSingle",
        "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
        "stateMutability": "payable",
        "type": "function"
    }
];

// -------------------------------------------------
// ✅ Corrected Export
// -------------------------------------------------
module.exports = {
    IUniswapV3Pool: IUniswapV3PoolABI,
    SUSHI_FACTORY_ABI,
    SUSHI_ROUTER_ABI,
    UNISWAP_FACTORY_ABI,
    UNISWAP_ROUTER_ABI,
    UNISWAP_V2_PAIR_ABI  // ✅ Export the complete V2 pair ABI
};
