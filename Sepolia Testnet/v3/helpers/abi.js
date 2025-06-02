// Helpers for exporting ABIs

// -----------------------
// Uniswap V3
// -----------------------
const IUniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json")

// -----------------------
// Pancakeswap V3
// (Custom ABI for V3 Pools)
// -----------------------
// const IPancakeswapV3Pool = [
//   {
//     "anonymous": false,
//     "inputs": [
//       { "indexed": true,  "internalType": "address", "name": "sender",    "type": "address" },
//       { "indexed": true,  "internalType": "address", "name": "recipient", "type": "address" },
//       { "indexed": false, "internalType": "int256",  "name": "amount0",   "type": "int256" },
//       { "indexed": false, "internalType": "int256",  "name": "amount1",   "type": "int256" },
//       { "indexed": false, "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
//       { "indexed": false, "internalType": "uint128", "name": "liquidity",    "type": "uint128" },
//       { "indexed": false, "internalType": "int24",   "name": "tick",         "type": "int24" },
//       { "indexed": false, "internalType": "uint128", "name": "protocolFeesToken0", "type": "uint128" },
//       { "indexed": false, "internalType": "uint128", "name": "protocolFeesToken1", "type": "uint128" }
//     ],
//     "name": "Swap",
//     "type": "event"
//   },
//   {
//     "inputs": [],
//     "name": "slot0",
//     "outputs": [
//       { "internalType": "uint160", "name": "sqrtPriceX96",              "type": "uint160" },
//       { "internalType": "int24",   "name": "tick",                      "type": "int24" },
//       { "internalType": "uint16",  "name": "observationIndex",          "type": "uint16" },
//       { "internalType": "uint16",  "name": "observationCardinality",    "type": "uint16" },
//       { "internalType": "uint16",  "name": "observationCardinalityNext","type": "uint16" },
//       { "internalType": "uint32",  "name": "feeProtocol",               "type": "uint32" },
//       { "internalType": "bool",    "name": "unlocked",                  "type": "bool" }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   }
// ]

// -----------------------
// SushiSwap (Uniswap V2) – Minimal ABIs
// -----------------------

// Minimal Uniswap V2 Factory ABI: includes `getPair` and `createPair`
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
  },
  {
    "constant": true,
    "inputs": [],
    "name": "allPairsLength",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
]

// Minimal Uniswap V2 Router ABI: includes `swapExactTokensForTokens`
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
]

// -------------------------------------------------
// Export them all
// -------------------------------------------------
module.exports = {
  IUniswapV3Pool: IUniswapV3Pool.abi,
  SUSHI_FACTORY_ABI,
  SUSHI_ROUTER_ABI
}
