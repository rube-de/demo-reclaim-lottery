import { ethers, run } from "hardhat";
import { Lottery__factory } from "../typechain-types";

async function main() {
  // Get command-line arguments for maxParticipants
  const args = require('minimist')(process.argv.slice(2));
  const maxParticipantsArg = args['max-participants'] || 1000; // Default to 1000
  const maxParticipants = parseInt(maxParticipantsArg, 10);

  if (isNaN(maxParticipants) || maxParticipants <= 0) {
    console.error("Invalid --max-participants value. Please provide a positive integer.");
    process.exit(1);
  }

  console.log(`Deploying Lottery contract with maxParticipants = ${maxParticipants}...`);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const LotteryFactory: Lottery__factory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy(maxParticipants);

  await lottery.waitForDeployment();
  const lotteryAddress = await lottery.getAddress();

  console.log(`Lottery contract deployed to: ${lotteryAddress}`);

  // Optional: Verify contract on Etherscan/Blockscout if applicable
  // await run("verify:verify", {
  //   address: lotteryAddress,
  //   constructorArguments: [maxParticipants],
  // });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
