const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/_yxNWICbX6Bt1bu3q6wmItgm5ZNM7rz6`);
const poolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json').abi;

async function checkUniswapPool() {
  const poolAddress = "0x60594a405d53811d3BC4766596EFD80fd545A270";
  const pool = new ethers.Contract(poolAddress, poolABI, provider);
  
  const slot0 = await pool.slot0();
  console.log(slot0);
}

checkUniswapPool();
