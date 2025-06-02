const { ethers } = require("ethers")

async function checkSushiSwapPair() {
  const pairAddress = "0xC3D03e4F041Fd4cD388c549Ee2A29a9E5075882f";
  const pairABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function getReserves() external view returns (uint112,uint112,uint32)"
  ];

  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
  const pair = new ethers.Contract(pairAddress, pairABI, provider);

  const token0 = await pair.token0();
  const token1 = await pair.token1();
  const reserves = await pair.getReserves();

  console.log({ token0, token1, reserves });
}

checkSushiSwapPair();
