require("dotenv").config();
const ethers = require('ethers');
const config = require('../config.json');

const {
  SUSHI_FACTORY_ABI,
  SUSHI_ROUTER_ABI
} = require('./abi');

const UniswapV3FactoryABI = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json').abi;
const SwapRouterABI = require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json').abi;
const QuoterV2ABI = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/IQuoterV2.sol/IQuoterV2.json').abi;

const provider = new ethers.JsonRpcProvider(config.NETWORK.RPC_URL);

const uniswap = {
  name: "Uniswap V3",
  factory: new ethers.Contract(config.UNISWAP.FACTORY_V3, UniswapV3FactoryABI, provider),
  router: new ethers.Contract(config.UNISWAP.ROUTER_V3, SwapRouterABI, provider),
  quoter: new ethers.Contract(config.UNISWAP.QUOTER_V2, QuoterV2ABI, provider)
};

const sushiswap = {
  name: "SushiSwap V2",
  factory: new ethers.Contract(config.SUSHISWAP.FACTORY_V2, SUSHI_FACTORY_ABI, provider),
  quoter: null,
  router: new ethers.Contract(config.SUSHISWAP.ROUTER_V2, SUSHI_ROUTER_ABI, provider)
};

const IArbitrage = require('../artifacts/contracts/Arbitrage.sol/Arbitrage.json');
const arbitrage = new ethers.Contract(
  config.PROJECT_SETTINGS.ARBITRAGE_ADDRESS,
  IArbitrage.abi,
  provider
);

module.exports = {
  provider,
  uniswap,
  sushiswap,
  arbitrage
};
