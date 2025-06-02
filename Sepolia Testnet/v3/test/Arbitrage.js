const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Arbitrage Contract", function () {
  let owner, other, arbitrage;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    const Arbitrage = await ethers.getContractFactory("Arbitrage", owner);
    arbitrage = await Arbitrage.deploy();
    await arbitrage.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await arbitrage.owner()).to.equal(owner.address);
    });
  });

  describe("Access Control", function () {
    it("Should not allow non-owner to call owner-only functions", async function () {
      // Example: If you have a withdraw function
      if (arbitrage.withdraw) {
        await expect(arbitrage.connect(other).withdraw()).to.be.reverted;
      }
    });
  });

  describe("Trading", function () {
    it("Should revert if called with invalid parameters", async function () {
      // Example: Call with zero addresses or amounts
      await expect(
        arbitrage.executeTrade(
          [ethers.constants.AddressZero, ethers.constants.AddressZero],
          [ethers.constants.AddressZero, ethers.constants.AddressZero],
          0,
          0
        )
      ).to.be.reverted;
    });

    // Add more tests here for successful trade execution using mocks or mainnet fork
    it("Should execute a trade when called with valid parameters (mocked)", async function () {
      // This is a placeholder; you need to set up mocks or use a forked mainnet for real execution
      // Example:
      // await expect(arbitrage.executeTrade([...], [...], fee, amount)).to.emit(arbitrage, "TradeExecuted");
    });
  });

  describe("Fallbacks & Security", function () {
    it("Should not accept ETH directly", async function () {
      await expect(
        owner.sendTransaction({ to: arbitrage.address, value: ethers.utils.parseEther("1") })
      ).to.be.reverted;
    });
  });
});


// const { expect } = require("chai")

// describe("Arbitrage", () => {
//   let owner
//   let arbitrage

//   beforeEach(async () => {
//     [owner] = await ethers.getSigners()

//     arbitrage = await hre.ethers.deployContract("Arbitrage")
//     await arbitrage.waitForDeployment()
//   })

//   describe("Deployment", () => {
//     it("Sets the owner", async () => {
//       expect(await arbitrage.owner()).to.equal(await owner.getAddress())
//     })
//   })

//   describe("Trading", () => {
//   })
// })
