import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('deploy-lottery', 'Deploy Lottery contract')
  .addOptionalParam('maxParticipants', 'Maximum number of participants', '10')
  .addOptionalParam('verifierAddress', 'Address of the Reclaim verifier contract')
  .addOptionalParam('requiredScreenName', 'Required Twitter screen name', 'oasisprotocol')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    const maxParticipants = parseInt(taskArgs.maxParticipants, 10)
    let reclaimVerifierAddress = taskArgs.verifierAddress
    const requiredScreenName = taskArgs.requiredScreenName

    if (isNaN(maxParticipants) || maxParticipants <= 0) {
      throw new Error('Invalid maxParticipants value. Please provide a positive integer.')
    }

    const [deployer] = await hre.ethers.getSigners()
    console.log('Deploying Lottery with account:', deployer.address)

    // Deploy Mock Verifier if on local network and no address provided
    const localNetworks = ['hardhat', 'localhost', 'sapphire-localnet', 'sapphire-testnet', 'arbitrum-sepolia']
    if (!reclaimVerifierAddress && localNetworks.includes(hre.network.name)) {
      console.log('Local network detected and no verifierAddress provided. Deploying MockReclaimVerifier...')
      reclaimVerifierAddress = await hre.run('deploy-mock-verifier')
    } else if (!reclaimVerifierAddress) {
      throw new Error('verifierAddress is required for non-local networks.')
    } else {
      console.log(`Using provided Reclaim Verifier address: ${reclaimVerifierAddress}`)
    }

    console.log(`\nDeploying Lottery contract with:`)
    console.log(`  maxParticipants: ${maxParticipants}`)
    console.log(`  ReclaimVerifier: ${reclaimVerifierAddress}`)
    console.log(`  requiredScreenName: ${requiredScreenName}`)
    console.log(`  Network: ${hre.network.name}`)

    const LotteryFactory = await hre.ethers.getContractFactory('Lottery')
    const gasEstimate = await deployer.estimateGas(
      await LotteryFactory.getDeployTransaction(maxParticipants, reclaimVerifierAddress, requiredScreenName)
    )
    console.log(`Gas estimate: ${gasEstimate.toString()}`)
    
    const gasLimit = gasEstimate * 120n / 100n // 20% buffer
    console.log(`Gas limit (with 20% buffer): ${gasLimit.toString()}`)

    const lottery = await LotteryFactory.deploy(
      maxParticipants,
      reclaimVerifierAddress,
      requiredScreenName,
      { gasLimit }
    )

    await lottery.waitForDeployment()
    const lotteryAddress = await lottery.getAddress()

    console.log(`\n✅ Lottery contract deployed to: ${lotteryAddress}`)
    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer.address}`)
    console.log(`Max Participants: ${maxParticipants}`)
    console.log(`Verifier Address: ${reclaimVerifierAddress}`)
    console.log(`Required Screen Name: ${requiredScreenName}`)

    return lotteryAddress
  })
