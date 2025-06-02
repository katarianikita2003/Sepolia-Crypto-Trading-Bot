require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox")

const privateKey = process.env.PRIVATE_KEY || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    //  hardhat: {
    //       forking: {
    //         url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    //         blockNumber: 223528000
    //       },
    //     },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [privateKey],
      chainId: 11155111
    },
  }
};

// mainnet: {
//   url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
//   accounts: [privateKey],
//   chainId: 1
// },
//   }
// };

// https://eth-mainnet.g.alchemy.com/v2/p8bd8Z28KlQgUdTzqD2il-W6tJy2hKMp