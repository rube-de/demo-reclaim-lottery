import { ethers, run, network } from "hardhat"; // Import network
import { Lottery__factory, MockReclaimVerifier__factory } from "../typechain-types"; // Import mock factory

async function main() {
  // Get command-line arguments
  const args = require('minimist')(process.argv.slice(2));
  const maxParticipantsArg = args['max-participants'] || 10; // Default to 10
  const maxParticipants = parseInt(maxParticipantsArg, 10);
  let reclaimVerifierAddress = args['reclaim-verifier-address']; // Get verifier address arg
  const requiredScreenName = args['required-screen-name'] || "oasisprotocol"; // Default Twitter handle

  if (isNaN(maxParticipants) || maxParticipants <= 0) {
    console.error("Invalid --max-participants value. Please provide a positive integer.");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Mock Verifier if on local network and no address provided
  if (!reclaimVerifierAddress && (network.name === "hardhat" || network.name === "localhost"|| network.name === "sapphire-localnet"|| network.name === "sapphire-testnet" || network.name === "arbitrum-sepolia")) {
    console.log("Local network detected and no reclaimVerifierAddress provided. Deploying MockReclaimVerifier...");
    const MockVerifierFactory: MockReclaimVerifier__factory = await ethers.getContractFactory("MockReclaimVerifier");
    const mockVerifier = await MockVerifierFactory.deploy();
    await mockVerifier.waitForDeployment();
    reclaimVerifierAddress = await mockVerifier.getAddress();
    console.log(`MockReclaimVerifier deployed to: ${reclaimVerifierAddress}`);
  } else if (!reclaimVerifierAddress) {
    console.error("Error: --reclaim-verifier-address is required for non-local networks.");
    process.exit(1);
  } else {
     console.log(`Using provided Reclaim Verifier address: ${reclaimVerifierAddress}`);
  }


  console.log(`Deploying Lottery contract with:
    maxParticipants = ${maxParticipants}
    ReclaimVerifier = ${reclaimVerifierAddress}
    requiredScreenName = ${requiredScreenName}
  ...`);

  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const gasEstimate = await deployer.estimateGas(await LotteryFactory.getDeployTransaction(maxParticipants, reclaimVerifierAddress, requiredScreenName));
  console.log("Sapphire estimate:", gasEstimate.toString());
  const gasLimit = gasEstimate * 120n / 100n;

  const lottery = await LotteryFactory.deploy(
    maxParticipants,
    reclaimVerifierAddress,
    requiredScreenName,
    {
      gasLimit
    }
  );

  await lottery.waitForDeployment();
  const lotteryAddress = await lottery.getAddress();

  console.log(`Lottery contract deployed to: ${lotteryAddress}`);

  // Optional: Verify contract on Etherscan/Blockscout if applicable
  // Note: Update constructorArguments if verification is needed
  // await run("verify:verify", {
  //   address: lotteryAddress,
  //   constructorArguments: [maxParticipants, reclaimVerifierAddress, requiredScreenName],
  // });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
