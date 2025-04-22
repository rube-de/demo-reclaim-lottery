import { ethers } from "hardhat";
import { MockReclaimVerifier__factory } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockReclaimVerifier contract with the account:", deployer.address);

  const MockVerifierFactory: MockReclaimVerifier__factory = await ethers.getContractFactory("MockReclaimVerifier");

  console.log("Deploying MockReclaimVerifier...");
  const mockVerifier = await MockVerifierFactory.deploy();

  await mockVerifier.waitForDeployment();
  const mockVerifierAddress = await mockVerifier.getAddress();

  console.log(`MockReclaimVerifier deployed to: ${mockVerifierAddress}`);
}

main().catch((error) => {
  console.error("Error deploying MockReclaimVerifier:", error);
  process.exitCode = 1;
});
