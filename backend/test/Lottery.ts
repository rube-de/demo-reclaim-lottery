import "@nomicfoundation/hardhat-chai-matchers"; // Fixes TS errors for .emit, .revertedWithCustomError, etc.
// @ts-ignore: ethers is injected by Hardhat runtime
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { Lottery, Lottery__factory, MockReclaimVerifier, MockReclaimVerifier__factory } from "../typechain-types"; // Import mock types
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
/**
 * Updated TypeScript equivalent of the Solidity Proof struct (matching SDK)
 */
type ProofStruct = {
  claimInfo: {
    provider: string;
    parameters: string;
    context: string;
  };
  signedClaim: {
    signatures: string[];
    claim: {
      identifier: string;
      owner: string;
      timestampS: number;
      epoch: number;
    };
  };
};

describe("Lottery", function () {
  const TEST_MAX_PARTICIPANTS = 5;
  let Lottery: Lottery__factory;
  let lottery: Lottery;
  let MockReclaimVerifierFactory: MockReclaimVerifier__factory; // Factory for mock
  let mockReclaimVerifier: MockReclaimVerifier; // Instance of mock
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let addr3: HardhatEthersSigner;
  let addr4: HardhatEthersSigner;
  let addr5: HardhatEthersSigner;

  let dummyProof: ProofStruct; // Declare variable, assign in beforeEach

  beforeEach(async function () {
    // Explicitly get signers
    [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

    dummyProof = {
      claimInfo: {
        provider: "twitter-followers",
        parameters: '{"following":"true","screen_name":"oasisprotocol"}',
        context: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      signedClaim: {
        signatures: [],
        claim: {
          identifier: ethers.keccak256(ethers.toUtf8Bytes('{"provider":"twitter-followers","parameters":"{\\"following\\":\\"true\\",\\"screen_name\\":\\"oasisprotocol\\"}"}')),
          owner: ethers.ZeroAddress,
          timestampS: Math.floor(Date.now() / 1000) >>> 0,
          epoch: 1,
        },
      },
    };

    // Explicitly get signers
    [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

    // Fund signers if needed
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

    // Deploy Mock Reclaim Verifier first
    MockReclaimVerifierFactory = await ethers.getContractFactory("MockReclaimVerifier", owner);
    mockReclaimVerifier = await MockReclaimVerifierFactory.deploy();
    await mockReclaimVerifier.waitForDeployment();
    const mockVerifierAddress = await mockReclaimVerifier.getAddress();

    // Configure mock defaults
    await mockReclaimVerifier.setShouldSucceed(true);
    await (mockReclaimVerifier as any).setMockScreenName("oasisprotocol");
    await (mockReclaimVerifier as any).setMockFollowingStatus("true");

    // Get Lottery factory using the owner signer
    Lottery = await ethers.getContractFactory("Lottery", owner);
    // Deploy Lottery, passing the mock verifier address and required screen name
    lottery = await (Lottery as any).deploy(TEST_MAX_PARTICIPANTS, mockVerifierAddress, "oasisprotocol");
    await lottery.waitForDeployment();
  });

  it("Should set different maxParticipants values correctly", async function () {
    const testMax = 3;
    const mockVerifierAddress = await mockReclaimVerifier.getAddress(); // Get mock address again
    // Deploy test contract using the owner signer explicitly, providing mock address
    const testLottery = await (Lottery.connect(owner) as any).deploy(testMax, mockVerifierAddress, "oasisprotocol");
    await testLottery.waitForDeployment();
    expect(await testLottery.maxParticipants()).to.equal(testMax);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lottery.owner()).to.equal(await owner.getAddress());
    });

    it("Should set the reclaimVerifier address", async function () {
      expect(await lottery.reclaimVerifier()).to.equal(await mockReclaimVerifier.getAddress());
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

  describe("enter() - Basic Logic", function () {
    // These tests focus on logic *other* than Reclaim verification

    beforeEach(async function() {
      // Ensure mock allows verification for these basic tests
      await mockReclaimVerifier.connect(owner).setShouldSucceed(true);
      // Start the lottery for most tests in this block
      await lottery.connect(owner).startLottery();
    });


    it("Should revert when lottery is inactive", async function () {
      // Need a separate deployment for this test as beforeEach starts it
      const mockVerifierAddress = await mockReclaimVerifier.getAddress();
      const inactiveLottery = await (Lottery as any).deploy(TEST_MAX_PARTICIPANTS, mockVerifierAddress, "oasisprotocol");
      await inactiveLottery.waitForDeployment();
      expect(await inactiveLottery.lotteryStatus()).to.equal(0); // Ensure inactive

      // Pass dummyProof
      const action = inactiveLottery.connect(addr1).enter(dummyProof);

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(inactiveLottery, "LotteryNotActive");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          expect(error.message).to.include("transaction execution reverted");
        }
      }
    });

    it("Should revert when address has already entered", async function () {
      await lottery.connect(addr1).enter(dummyProof); // Enter once with dummyProof
      const action = lottery.connect(addr1).enter(dummyProof); // Try again with dummyProof

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(lottery, "AlreadyEntered");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          expect(error.message).to.include("transaction execution reverted");
        }
      }
    });

    it("Should revert when participant limit is reached", async function () {
      const participantsToEnter = [owner, addr1, addr2, addr3, addr4];
      expect(participantsToEnter.length).to.be.at.least(TEST_MAX_PARTICIPANTS, "Not enough signers for test");

      for (let i = 0; i < TEST_MAX_PARTICIPANTS; i++) {
        // Enter with dummyProof
        await lottery.connect(participantsToEnter[i]).enter(dummyProof);
      }

      const exceedingSigner = addr5;
      // Enter with dummyProof
      const action = lottery.connect(exceedingSigner).enter(dummyProof);

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(lottery, "LotteryFull");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          expect(error.message).to.include("transaction execution reverted");
        }
      }
    });
  });

  describe("enter() - Reclaim Verification", function () {
    beforeEach(async function() {
      // Start the lottery for these tests
      await lottery.connect(owner).startLottery();
    });

    it("Should allow entry with valid proof (mocked success)", async function () {
      // Configure mock for success
      await mockReclaimVerifier.connect(owner).setShouldSucceed(true);

      if (network.name === 'hardhat') {
        await expect(lottery.connect(addr1).enter(dummyProof))
          .to.emit(lottery, "ParticipantEntered")
          .withArgs(await addr1.getAddress());
      } else {
        await lottery.connect(addr1).enter(dummyProof);
        expect(await lottery.getParticipantCount()).to.equal(1);
      }
    });

    it("Should revert if mock verification fails", async function () {
      // Configure mock for failure
      await mockReclaimVerifier.connect(owner).setShouldSucceed(false);

      const action = lottery.connect(addr1).enter(dummyProof);

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(lottery, "InvalidAttestationProofNotValid");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          expect(error.message).to.include("transaction execution reverted");
        }
      }
    });

    // Removed tests for provider/parameter checks within Lottery.sol as they are no longer performed there

    it("Should revert if screen name does not match required", async function () {
      await mockReclaimVerifier.connect(owner).setShouldSucceed(true);
      await (mockReclaimVerifier as any).setMockScreenName("wrongname");
      await (mockReclaimVerifier as any).setMockFollowingStatus("true");

      const action = lottery.connect(addr1).enter(dummyProof);

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(lottery, "InvalidAttestationScreenNameMismatch");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          expect(error.message).to.include("transaction execution reverted");
        }
      }
    });

    it("Should revert if following status is not true", async function () {
      await mockReclaimVerifier.connect(owner).setShouldSucceed(true);
      await (mockReclaimVerifier as any).setMockScreenName("oasisprotocol");
      await (mockReclaimVerifier as any).setMockFollowingStatus("false");

      const action = lottery.connect(addr1).enter(dummyProof);

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(lottery, "InvalidAttestationFollowingStatus");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
          expect(error.message).to.include("transaction execution reverted");
        }
      }
    });
  });


  // --- Keep other describe blocks (depositPrize, endLottery, pickWinner, resetLottery, View Functions) ---
  // --- They need updates to pass dummyProof to enter() calls within their beforeEach/setups ---

  describe("depositPrize()", function () {
    // No changes needed here as it doesn't call enter()
    it("Should allow owner to deposit prize", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const action = lottery.connect(owner).depositPrize({ value: depositAmount });

      if (network.name === 'hardhat') {
        await expect(action).to.emit(lottery, "PrizeDeposited").withArgs(depositAmount);
      } else {
        const tx = await action;
        await tx.wait();
      }
      expect(await lottery.prizeAmount()).to.equal(depositAmount);
    });

    it("Should revert when non-owner tries to deposit", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const action = lottery.connect(addr1).depositPrize({ value: depositAmount });

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(lottery, "OwnableUnauthorizedAccount").withArgs(await addr1.getAddress());
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
           expect(error.message).to.include("transaction execution reverted");
        }
      }
    });

    it("Should update prizeAmount correctly", async function () {
      const deposit1 = ethers.parseEther("0.5");
      const deposit2 = ethers.parseEther("0.7");
      await lottery.connect(owner).depositPrize({ value: deposit1 });
      await lottery.connect(owner).depositPrize({ value: deposit2 });
      expect(await lottery.prizeAmount()).to.equal(deposit1 + deposit2);
    });
  });

  describe("endLottery()", function () {
    // No changes needed here
    it("Should allow owner to end active lottery", async function () {
      await lottery.connect(owner).startLottery();
      const action = lottery.connect(owner).endLottery();

      if (network.name === 'hardhat') {
        await expect(action).to.emit(lottery, "LotteryEnded");
      } else {
        await action;
      }
      expect(await lottery.lotteryStatus()).to.equal(0); // Inactive
    });

    it("Should revert when non-owner tries to end", async function () {
      await lottery.connect(owner).startLottery();
      const action = lottery.connect(addr1).endLottery();

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(lottery, "OwnableUnauthorizedAccount").withArgs(await addr1.getAddress());
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
           expect(error.message).to.include("transaction execution reverted");
        }
      }
    });

    it("Should revert when lottery is already inactive", async function () {
      const action = lottery.connect(owner).endLottery();

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(lottery, "LotteryNotActive");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
           expect(error.message).to.include("transaction execution reverted");
        }
      }
    });
  });

  describe("pickWinner()", function () {
     beforeEach(async function() {
      // Setup: Start lottery, enter participants, deposit prize, end lottery
      await lottery.connect(owner).startLottery();
      // Configure mock for successful entry
      await mockReclaimVerifier.connect(owner).setShouldSucceed(true);
      // Enter participants using dummyProof
      await lottery.connect(addr1).enter(dummyProof);
      await lottery.connect(addr2).enter(dummyProof);
      await lottery.connect(owner).depositPrize({ value: ethers.parseEther("1.0") });
      await lottery.connect(owner).endLottery();
    });

    it("Should pick winner and transfer prize", async function () {
      const initialBalance1 = await ethers.provider.getBalance(await addr1.getAddress());
      const initialBalance2 = await ethers.provider.getBalance(await addr2.getAddress());
      const action = lottery.connect(owner).pickWinner();

      if (network.name === 'hardhat') {
        await expect(action).to.emit(lottery, "WinnerPicked");
      } else {
        await action;
      }

      const newBalance1 = await ethers.provider.getBalance(await addr1.getAddress());
      const newBalance2 = await ethers.provider.getBalance(await addr2.getAddress());
      const prize = ethers.parseEther("1.0");
      const receivedPrize1 = newBalance1 > initialBalance1;
      const receivedPrize2 = newBalance2 > initialBalance2;

      expect(receivedPrize1 || receivedPrize2).to.be.true;
      expect(receivedPrize1 && receivedPrize2).to.be.false;
      expect(await ethers.provider.getBalance(await lottery.getAddress())).to.equal(0);
      expect(await lottery.prizeAmount()).to.equal(0);
      const winnerAddress = receivedPrize1 ? await addr1.getAddress() : await addr2.getAddress();
      expect(await lottery.lotteryWinner()).to.equal(winnerAddress);
    });

     it("Should revert when lottery is active", async function () {
      // Need a separate deployment/setup where lottery is left active
      const mockVerifierAddress = await mockReclaimVerifier.getAddress();
      const activeLottery = await (Lottery as any).deploy(TEST_MAX_PARTICIPANTS, mockVerifierAddress, "oasisprotocol");
      await activeLottery.waitForDeployment();
      await activeLottery.connect(owner).startLottery(); // Start it

      const action = activeLottery.connect(owner).pickWinner();

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(activeLottery, "LotteryNotEnded");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
           expect(error.message).to.include("transaction execution reverted");
        }
      }
    });


    it("Should revert when already picked winner", async function () {
      await lottery.connect(owner).pickWinner(); // First pick
      const action = lottery.connect(owner).pickWinner(); // Try again

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(lottery, "WinnerAlreadyPicked");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
           expect(error.message).to.include("transaction execution reverted");
        }
      }
    });

     it("Should revert when no participants", async function () {
      // Need separate deployment/setup with no participants
      const mockVerifierAddress = await mockReclaimVerifier.getAddress();
      const noParticipantLottery = await (Lottery as any).deploy(TEST_MAX_PARTICIPANTS, mockVerifierAddress, "oasisprotocol");
      await noParticipantLottery.waitForDeployment();
      await noParticipantLottery.connect(owner).startLottery(); // Start
      await noParticipantLottery.connect(owner).depositPrize({ value: ethers.parseEther("1.0") }); // Deposit
      await noParticipantLottery.connect(owner).endLottery(); // End

      const action = noParticipantLottery.connect(owner).pickWinner();

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(noParticipantLottery, "NoParticipants");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
           expect(error.message).to.include("transaction execution reverted");
        }
      }
    });
  });

  describe("resetLottery()", function () {
     beforeEach(async function() {
      // Setup: Complete one round
      await lottery.connect(owner).startLottery();
       // Configure mock for successful entry
      await mockReclaimVerifier.connect(owner).setShouldSucceed(true);
      // Enter participant
      await lottery.connect(addr1).enter(dummyProof);
      await lottery.connect(owner).depositPrize({ value: ethers.parseEther("1.0") });
      await lottery.connect(owner).endLottery();
      await lottery.connect(owner).pickWinner();
    });

    it("Should allow owner to reset lottery after winner picked", async function () {
      const action = lottery.connect(owner).resetLottery();

      if (network.name === 'hardhat') {
        await expect(action).to.emit(lottery, "LotteryReset");
      } else {
        await action;
      }

      expect(await lottery.lotteryStatus()).to.equal(0); // Inactive
      expect(await lottery.getParticipantCount()).to.equal(0);
      expect(await lottery.prizeAmount()).to.equal(0);
      expect(await lottery.winnerPicked()).to.be.false;
      expect(await lottery.lotteryWinner()).to.equal(ethers.ZeroAddress);
    });

    it("Should revert when non-owner tries to reset", async function () {
      const action = lottery.connect(addr1).resetLottery();

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(lottery, "OwnableUnauthorizedAccount").withArgs(await addr1.getAddress());
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
           expect(error.message).to.include("transaction execution reverted");
        }
      }
    });

     it("Should revert when winner not picked yet", async function () {
      // Need separate setup where winner is not picked
      const mockVerifierAddress = await mockReclaimVerifier.getAddress();
      const notPickedLottery = await (Lottery as any).deploy(TEST_MAX_PARTICIPANTS, mockVerifierAddress, "oasisprotocol");
      await notPickedLottery.waitForDeployment();
      await notPickedLottery.connect(owner).startLottery();
       // Configure mock for successful entry
      await mockReclaimVerifier.connect(owner).setShouldSucceed(true); // Need to configure mock for this instance too
      // Enter participant
      await notPickedLottery.connect(addr1).enter(dummyProof);
      await notPickedLottery.connect(owner).depositPrize({ value: ethers.parseEther("1.0") });
      await notPickedLottery.connect(owner).endLottery(); // End but don't pick

      const action = notPickedLottery.connect(owner).resetLottery();

      if (network.name === 'hardhat') {
        await expect(action).to.be.revertedWithCustomError(notPickedLottery, "WinnerNotPickedYet");
      } else {
        try {
          const tx = await action;
          await tx.wait();
          expect.fail("Transaction did not revert as expected");
        } catch (error: any) {
           expect(error.message).to.include("transaction execution reverted");
        }
      }
    });
  });

  describe("View Functions", function () {
     beforeEach(async function() {
      // Setup: Start lottery, enter participants
      await lottery.connect(owner).startLottery();
       // Configure mock for successful entry
      await mockReclaimVerifier.connect(owner).setShouldSucceed(true);
      // Enter participants
      await lottery.connect(addr1).enter(dummyProof);
      await lottery.connect(addr2).enter(dummyProof);
    });

    it("Should return participant list", async function () {
      const participants = await lottery.getParticipants();
      expect(participants).to.have.lengthOf(2);
      expect(participants).to.include(await addr1.getAddress());
      expect(participants).to.include(await addr2.getAddress());
    });

    it("Should return participant count", async function () {
      // Already entered 2 in beforeEach
      expect(await lottery.getParticipantCount()).to.equal(2);
      // Enter another
      await lottery.connect(addr3).enter(dummyProof);
      expect(await lottery.getParticipantCount()).to.equal(3);
    });

    it("Should return lottery details", async function () {
      // Deposit prize
      const depositAmount = ethers.parseEther("0.1");
      await lottery.connect(owner).depositPrize({ value: depositAmount });

      // Check details while active
      const detailsActive = await lottery.getLotteryDetails();
      expect(detailsActive.status).to.equal(1); // Active
      expect(detailsActive.participantCount).to.equal(2); // From beforeEach
      expect(detailsActive.currentPrize).to.equal(depositAmount);
      expect(detailsActive.maxAllowedParticipants).to.equal(TEST_MAX_PARTICIPANTS);
      expect(detailsActive.isWinnerPicked).to.be.false;

      // Check details after ending
      await lottery.connect(owner).endLottery();
      const detailsEnded = await lottery.getLotteryDetails();
      expect(detailsEnded.status).to.equal(0); // Inactive
      expect(detailsEnded.participantCount).to.equal(2);
      expect(detailsEnded.currentPrize).to.equal(depositAmount);
      expect(detailsEnded.maxAllowedParticipants).to.equal(TEST_MAX_PARTICIPANTS);
      expect(detailsEnded.isWinnerPicked).to.be.false; // Winner not picked yet

       // Check details after picking winner
      await lottery.connect(owner).pickWinner();
      const detailsPicked = await lottery.getLotteryDetails();
      expect(detailsPicked.status).to.equal(0); // Inactive
      expect(detailsPicked.participantCount).to.equal(2); // Count remains after picking
      expect(detailsPicked.currentPrize).to.equal(0); // Prize transferred
      expect(detailsPicked.maxAllowedParticipants).to.equal(TEST_MAX_PARTICIPANTS);
      expect(detailsPicked.isWinnerPicked).to.be.true; // Winner picked
    });
  });
});
