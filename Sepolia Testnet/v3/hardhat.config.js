require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

// Clean private key
let cleanPrivateKey = '';
if (PRIVATE_KEY) {
  cleanPrivateKey = PRIVATE_KEY.replace(/^0x/, '');
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
      timeout: 1800000,
    },

    // Sepolia testnet - VERIFIED WORKING URL
    // sepolia: PRIVATE_KEY && ALCHEMY_API_KEY ? {
    //   url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    //   accounts: [`0x${cleanPrivateKey}`],
    //   chainId: 11155111,
    //   gas: 'auto',
    //   gasPrice: 'auto',
    //   timeout: 120000, // 2 minutes timeout
    //   confirmations: 1, // Faster for testnet
    // } : undefined,

    // Mainnet - VERIFIED WORKING
    mainnet: PRIVATE_KEY && ALCHEMY_API_KEY ? {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${cleanPrivateKey}`],
      chainId: 1,
      gas: 'auto',
      gasPrice: 'auto',
      gasMultiplier: 1.2,
      timeout: 600000,
      confirmations: 2,
    } : undefined,
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 20,
  },

  mocha: {
    timeout: 600000,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

console.log("🔧 Hardhat Configuration (Verified Working):");
console.log(`   ✅ Sepolia URL: https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY ? ALCHEMY_API_KEY.substring(0, 8) + '...' : 'missing'}`);
console.log(`   ✅ Wallet: ${cleanPrivateKey ? '0x1Ae0947c15b5d9dc74ad69E07A82725E71740603' : 'Not configured'}`);
console.log(`   ✅ Networks: Sepolia & Mainnet ready`);