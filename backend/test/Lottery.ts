import { expect } from "chai";
import { ethers, network} from "hardhat"; // Import network
import { Lottery, Lottery__factory } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Lottery", function () {
  const TEST_MAX_PARTICIPANTS = 5;
  let Lottery: Lottery__factory;
  let lottery: Lottery;
  let owner: HardhatEthersSigner; // Use Signer type
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  // other signers to fill up participants
  let addr3: HardhatEthersSigner;
  let addr4: HardhatEthersSigner;
  let addr5: HardhatEthersSigner;


    beforeEach(async function () {
        // Explicitly get signers
        [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
        // console.log("Test Signers Initialized:");
        // console.log("  Owner:", await owner.getAddress());
        // console.log("  Addr1:", await addr1.getAddress());
        // console.log("  Addr2:", await addr2.getAddress());

        // fund all signers up ta max particpants from owner with 1 ETH
        const fundAmount = ethers.parseEther("1.0");
        for (const signer of [owner, addr1, addr2, addr3, addr4, addr5]) {
            const balance = await ethers.provider.getBalance(await signer.getAddress());
            if (balance < fundAmount) {
                await owner.sendTransaction({
                    to: await signer.getAddress(),
                    value: fundAmount,
                });
            }
        }

        // Get factory using the owner signer
        Lottery = await ethers.getContractFactory("Lottery", owner);
        // Deploy using the factory (which is linked to owner)
        lottery = await Lottery.deploy(TEST_MAX_PARTICIPANTS);
        await lottery.waitForDeployment();
        // console.log("Lottery deployed to:", await lottery.getAddress());
    });

    it("Should set different maxParticipants values correctly", async function () {
        const testMax = 3;
        // Deploy test contract using the owner signer explicitly
        const testLottery = await Lottery.connect(owner).deploy(testMax);
        await testLottery.waitForDeployment();
        expect(await testLottery.maxParticipants()).to.equal(testMax);
    });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lottery.owner()).to.equal(await owner.getAddress());
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
      // Common setup: Start the lottery
      await lottery.connect(owner).startLottery();

      if (network.name === 'hardhat') {
        // Hardhat specific: Check event emission
        await expect(lottery.connect(addr1).enter())
          .to.emit(lottery, "ParticipantEntered")
          .withArgs(await addr1.getAddress());
      } else {
        // console.warn(`Skipping event check on network: ${network.name}`);
        // Other networks: Perform action and check state
        await lottery.connect(addr1).enter();
        expect(await lottery.getParticipantCount()).to.equal(1);
      }
    });

    it("Should revert when lottery is inactive", async function () {
      expect(await lottery.lotteryStatus()).to.equal(0); // Make sure it's inactive

      // Action is common
      const action = lottery.connect(addr1).enter();

      if (network.name === 'hardhat') {
        // Hardhat specific: Check revert message
        await expect(action).to.be.revertedWith("Lottery inactive");
      } else {
        // console.warn(`Skipping specific revert check on network: ${network.name}`);
        // Other networks: Check for any revert
        try {
          const tx = await action;
          await tx.wait(); // Wait for transaction to be mined
          // If we get here, the transaction did not revert as expected
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          // console.log("Caught expected error (cannot check message):", error.message);
          // Check if the error is from expect.fail() or from contract revert
          if (error.message === "Transaction did not revert as expected") {
            throw new Error("Contract call succeeded when it should have reverted");
          }
          // If we get here, it's a contract revert, which is what we want
          expect(error.message).to.include("transaction execution reverted");
        }
      }
      expect(await lottery.getParticipantCount()).to.equal(0);
    });

    it("Should revert when address has already entered", async function () {
      // Common setup: Start lottery and enter once
      await lottery.connect(owner).startLottery();
      await lottery.connect(addr1).enter();

      // Action is common: Try to enter again
      const action = lottery.connect(addr1).enter();

      if (network.name === 'hardhat') {
        // Hardhat specific: Check revert message
        await expect(action).to.be.revertedWith("Already entered");
      } else {
        // console.warn(`Skipping specific revert check on network: ${network.name}`);
        // Other networks: Check for any revert
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          // console.log("Caught expected error (cannot check message):", error.message);
          expect(error.message).to.include("transaction execution reverted"); // Check for Sapphire revert string
        }
      }
    });

    it("Should revert when participant limit is reached", async function () {
      // Use owner signer for startLottery
      await lottery.connect(owner).startLottery();

      // Fill up participants using available signers (owner, addr1, addr2, addrs[0], addrs[1])
      const participantsToEnter = [owner, addr1, addr2, addr3, addr4];
      expect(participantsToEnter.length).to.be.at.least(TEST_MAX_PARTICIPANTS, "Not enough signers for test");

      for (let i = 0; i < TEST_MAX_PARTICIPANTS; i++) {
        await lottery.connect(participantsToEnter[i]).enter();
      }

      // Use another signer for the exceeding entry attempt
      const exceedingSigner = addr5; 

      // get balance of exceedingSigner
      const balance = await ethers.provider.getBalance(await exceedingSigner.getAddress());
      console.log(`Exceeding Signer(${await exceedingSigner.getAddress()}) Balance: ${ethers.formatEther(balance)} ETH`);

      // Action is common: Try to enter with the exceeding signer
      const action = lottery.connect(exceedingSigner).enter();

      if (network.name === 'hardhat') {
        // Hardhat specific: Check revert message
        await expect(action).to.be.revertedWith("Lottery full");
      } else {
        // console.warn(`Skipping specific revert check on network: ${network.name}`);
         // Other networks: Check for any revert
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          //  console.log("Caught expected error (cannot check message):", error.message);
           expect(error.message).to.include("transaction execution reverted"); // Check for Sapphire revert string
        }
      }
    });
  });

  describe("depositPrize()", function () {
    it("Should allow owner to deposit prize", async function () {
      const depositAmount = ethers.parseEther("1.0");
      // Action is common
      const action = lottery.connect(owner).depositPrize({ value: depositAmount });

      if (network.name === 'hardhat') {
        // Hardhat specific: Check event emission
        await expect(action).to.emit(lottery, "PrizeDeposited").withArgs(depositAmount);
      } else {
        // console.warn(`Skipping event check on network: ${network.name}`);
        const tx = await action;
        await tx.wait();
      }
      // Check state change regardless of network
      expect(await lottery.prizeAmount()).to.equal(depositAmount);
    });

    it("Should revert when non-owner tries to deposit", async function () {
      const depositAmount = ethers.parseEther("1.0");
      // Action is common
      const action = lottery.connect(addr1).depositPrize({ value: depositAmount });

      if (network.name === 'hardhat') {
         // Hardhat specific: Check revert message
        await expect(action).to.be.revertedWith("Ownable: caller is not the owner");
      } else {
        // console.warn(`Skipping specific revert check on network: ${network.name}`);
        // Other networks: Check for any revert
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          //  console.log("Caught expected error (cannot check message):", error.message);
           expect(error.message).to.include("transaction execution reverted"); // Check for Sapphire revert string
        }
      }
    });

    it("Should update prizeAmount correctly", async function () {
      const deposit1 = ethers.parseEther("0.5");
      const deposit2 = ethers.parseEther("0.7");
      // Use owner signer for deposits
      await lottery.connect(owner).depositPrize({ value: deposit1 });
      await lottery.connect(owner).depositPrize({ value: deposit2 });
      expect(await lottery.prizeAmount()).to.equal(deposit1 + deposit2);
    });
  });

  describe("endLottery()", function () {
    it("Should allow owner to end active lottery", async function () {
      // Common setup
      await lottery.connect(owner).startLottery();
      // Action is common
      const action = lottery.connect(owner).endLottery();

      if (network.name === 'hardhat') {
        // Hardhat specific: Check event emission
        await expect(action).to.emit(lottery, "LotteryEnded");
      } else {
        // console.warn(`Skipping event check on network: ${network.name}`);
        await action; // Perform action without check
      }
      // Check state change regardless of network
      expect(await lottery.lotteryStatus()).to.equal(0); // Inactive
    });

    it("Should revert when non-owner tries to end", async function () {
      // Common setup
      await lottery.connect(owner).startLottery();
      // Action is common
      const action = lottery.connect(addr1).endLottery();

      if (network.name === 'hardhat') {
        // Hardhat specific: Check revert message
        await expect(action).to.be.revertedWith("Ownable: caller is not the owner");
      } else {
        // console.warn(`Skipping specific revert check on network: ${network.name}`);
        // Other networks: Check for any revert
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          //  console.log("Caught expected error (cannot check message):", error.message);
           expect(error.message).to.include("transaction execution reverted"); // Check for Sapphire revert string
        }
      }
    });

    it("Should revert when lottery is already inactive", async function () {
      // Action is common
      const action = lottery.connect(owner).endLottery();

      if (network.name === 'hardhat') {
        // Hardhat specific: Check revert message
        await expect(action).to.be.revertedWith("Lottery not active");
      } else {
        // console.warn(`Skipping specific revert check on network: ${network.name}`);
        // Other networks: Check for any revert
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          //  console.log("Caught expected error (cannot check message):", error.message);
           expect(error.message).to.include("transaction execution reverted"); // Check for Sapphire revert string
        }
      }
    });
  });

  describe("pickWinner()", function () {
    it("Should pick winner and transfer prize", async function () {
      // Setup lottery with participants and prize using explicit signers
      await lottery.connect(owner).startLottery();
      await lottery.connect(addr1).enter();
      await lottery.connect(addr2).enter();
      await lottery.connect(owner).depositPrize({ value: ethers.parseEther("1.0") });
      await lottery.connect(owner).endLottery();

      // Store initial balances
      const initialBalance1 = await ethers.provider.getBalance(await addr1.getAddress());
      const initialBalance2 = await ethers.provider.getBalance(await addr2.getAddress());

      // Action is common
      const action = lottery.connect(owner).pickWinner();

      // Pick winner using owner signer
      if (network.name === 'hardhat') {
        // Hardhat specific: Check event emission
        await expect(action).to.emit(lottery, "WinnerPicked"); // We can't easily predict the winner with real randomness
      } else {
        // console.warn(`Skipping event check on network: ${network.name}`);
        await action; // Perform action without check
      }

      // Verify one participant received funds (check balance increase) - Common check
      const newBalance1 = await ethers.provider.getBalance(await addr1.getAddress());
      const newBalance2 = await ethers.provider.getBalance(await addr2.getAddress());
      const prize = ethers.parseEther("1.0");

      // Check if either balance increased by approximately the prize amount
      // (Allow for small gas cost differences if winner paid gas, though owner pays here)
      const receivedPrize1 = newBalance1 > initialBalance1;
      const receivedPrize2 = newBalance2 > initialBalance2;

      expect(receivedPrize1 || receivedPrize2).to.be.true;
      // Ensure only one winner
      expect(receivedPrize1 && receivedPrize2).to.be.false;

      // Check contract balance is zero
      expect(await ethers.provider.getBalance(await lottery.getAddress())).to.equal(0);
      // Check prizeAmount state is zero
      expect(await lottery.prizeAmount()).to.equal(0);
    });

    it("Should revert when lottery is active", async function () {
      // Common setup
      await lottery.connect(owner).startLottery();
      // Action is common
      const action = lottery.connect(owner).pickWinner();

      if (network.name === 'hardhat') {
        // Hardhat specific: Check revert message
        await expect(action).to.be.revertedWith("Lottery not ended");
      } else {
        // console.warn(`Skipping specific revert check on network: ${network.name}`);
        // Other networks: Check for any revert
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          //  console.log("Caught expected error (cannot check message):", error.message);
           expect(error.message).to.include("transaction execution reverted"); // Check for Sapphire revert string
        }
      }
    });

    it("Should revert when already picked winner", async function () {
      // Common setup: Complete one round
      await lottery.connect(owner).startLottery();
      await lottery.connect(addr1).enter();
      await lottery.connect(owner).depositPrize({ value: ethers.parseEther("1.0") });
      await lottery.connect(owner).endLottery();
      await lottery.connect(owner).pickWinner(); // First pick

      // Action is common: Try to pick again
      const action = lottery.connect(owner).pickWinner();

      if (network.name === 'hardhat') {
        // Hardhat specific: Check revert message
        await expect(action).to.be.revertedWith("Winner already picked");
      } else {
        // console.warn(`Skipping specific revert check on network: ${network.name}`);
        // Other networks: Check for any revert
        try {
          const tx = await action; // Second pick attempt
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          //  console.log("Caught expected error (cannot check message):", error.message);
           expect(error.message).to.include("transaction execution reverted"); // Check for Sapphire revert string
        }
      }
    });

    it("Should revert when no participants", async function () {
      // Common setup
      await lottery.connect(owner).startLottery();
      await lottery.connect(owner).depositPrize({ value: ethers.parseEther("1.0") });
      await lottery.connect(owner).endLottery();

      // Action is common
      const action = lottery.connect(owner).pickWinner();

      if (network.name === 'hardhat') {
        // Hardhat specific: Check revert message
        await expect(action).to.be.revertedWith("No participants");
      } else {
        // console.warn(`Skipping specific revert check on network: ${network.name}`);
        // Other networks: Check for any revert
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          //  console.log("Caught expected error (cannot check message):", error.message);
           expect(error.message).to.include("transaction execution reverted"); // Check for Sapphire revert string
        }
      }
    });
  });

  describe("View Functions", function () {
    it("Should return participant list", async function () {
      // Use owner signer for startLottery
      await lottery.connect(owner).startLottery();
      // Use addr1 and addr2 signers for enter
      await lottery.connect(addr1).enter();
      await lottery.connect(addr2).enter();

      const participants = await lottery.getParticipants();
      expect(participants).to.have.lengthOf(2);
      expect(participants).to.include(await addr1.getAddress());
      expect(participants).to.include(await addr2.getAddress());
    });

    it("Should return participant count", async function () {
      // Use owner signer for startLottery
      await lottery.connect(owner).startLottery();
      expect(await lottery.getParticipantCount()).to.equal(0);
      // Use addr1 signer for enter
      await lottery.connect(addr1).enter();
      expect(await lottery.getParticipantCount()).to.equal(1);
    });

    it("Should return lottery details", async function () {
      // Deposit some prize to check that field too
      const depositAmount = ethers.parseEther("0.1");
      await lottery.connect(owner).depositPrize({ value: depositAmount });

      const details = await lottery.getLotteryDetails();
      expect(details.status).to.equal(0); // Inactive
      expect(details.participantCount).to.equal(0);
      expect(details.currentPrize).to.equal(depositAmount); // Check deposited prize
      expect(details.maxAllowedParticipants).to.equal(TEST_MAX_PARTICIPANTS);
      expect(details.isWinnerPicked).to.be.false;

      // Check details after starting
      await lottery.connect(owner).startLottery();
      await lottery.connect(addr1).enter();
      const detailsActive = await lottery.getLotteryDetails();
      expect(detailsActive.status).to.equal(1); // Active
      expect(detailsActive.participantCount).to.equal(1);
      expect(detailsActive.currentPrize).to.equal(depositAmount);
      expect(detailsActive.maxAllowedParticipants).to.equal(TEST_MAX_PARTICIPANTS);
      expect(detailsActive.isWinnerPicked).to.be.false;
    });
  });
});
