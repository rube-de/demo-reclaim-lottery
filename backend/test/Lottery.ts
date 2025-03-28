import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery, Lottery__factory } from "../typechain-types";

describe("Lottery", function () {
  let Lottery: Lottery__factory;
  let lottery: Lottery;
  let owner: any;
  let addr1: any;
  let addr2: any;

    const TEST_MAX_PARTICIPANTS = 5;
    
    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        Lottery = await ethers.getContractFactory("Lottery");
        lottery = await Lottery.deploy(TEST_MAX_PARTICIPANTS);
    });

    it("Should set different maxParticipants values correctly", async function () {
        const testMax = 3;
        const testLottery = await Lottery.deploy(testMax);
        expect(await testLottery.maxParticipants()).to.equal(testMax);
    });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lottery.owner()).to.equal(owner.address);
    });

    it("Should initialize with inactive status", async function () {
      expect(await lottery.lotteryStatus()).to.equal(0); // 0 = Inactive
    });

    it("Should have maxParticipants set correctly", async function () {
      expect(await lottery.maxParticipants()).to.equal(TEST_MAX_PARTICIPANTS);
    });

    it("Should have prizeAmount initialized to 0", async function () {
      expect(await lottery.prizeAmount()).to.equal(0);
    });
  });

  describe("enter()", function () {
    it("Should allow entry when lottery is active", async function () {
      await lottery.startLottery();
      await expect(lottery.connect(addr1).enter())
        .to.emit(lottery, "ParticipantEntered")
        .withArgs(addr1.address);
    });

    it("Should revert when lottery is inactive", async function () {
      await expect(lottery.connect(addr1).enter())
        .to.be.revertedWith("Lottery inactive");
    });

    it("Should revert when address has already entered", async function () {
      await lottery.startLottery();
      await lottery.connect(addr1).enter();
      await expect(lottery.connect(addr1).enter())
        .to.be.revertedWith("Already entered");
    });

    it("Should revert when participant limit is reached", async function () {
      await lottery.startLottery();
      
      // Fill up participants using test accounts
      const signers = await ethers.getSigners();
      for (let i = 0; i < TEST_MAX_PARTICIPANTS; i++) {
        await lottery.connect(signers[i]).enter();
      }

      await expect(lottery.connect(addr2).enter())
        .to.be.revertedWith("Lottery full");
    });
  });

  describe("depositPrize()", function () {
    it("Should allow owner to deposit prize", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await expect(lottery.depositPrize({ value: depositAmount }))
        .to.emit(lottery, "PrizeDeposited")
        .withArgs(depositAmount);
      expect(await lottery.prizeAmount()).to.equal(depositAmount);
    });

    it("Should revert when non-owner tries to deposit", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await expect(lottery.connect(addr1).depositPrize({ value: depositAmount }))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should update prizeAmount correctly", async function () {
      const deposit1 = ethers.parseEther("0.5");
      const deposit2 = ethers.parseEther("0.7");
      await lottery.depositPrize({ value: deposit1 });
      await lottery.depositPrize({ value: deposit2 });
      expect(await lottery.prizeAmount()).to.equal(deposit1 + deposit2);
    });
  });

  describe("endLottery()", function () {
    it("Should allow owner to end active lottery", async function () {
      await lottery.startLottery();
      await expect(lottery.endLottery())
        .to.emit(lottery, "LotteryEnded");
      expect(await lottery.lotteryStatus()).to.equal(0); // Inactive
    });

    it("Should revert when non-owner tries to end", async function () {
      await expect(lottery.connect(addr1).endLottery())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert when lottery is already inactive", async function () {
      await expect(lottery.endLottery())
        .to.be.revertedWith("Lottery not active");
    });
  });
});
