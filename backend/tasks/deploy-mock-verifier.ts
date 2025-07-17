import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('deploy-mock-verifier', 'Deploy MockReclaimVerifier contract')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    const [deployer] = await hre.ethers.getSigners()
    console.log('Deploying MockReclaimVerifier with account:', deployer.address)

    const MockVerifierFactory = await hre.ethers.getContractFactory('MockReclaimVerifier')
    
    console.log('Deploying MockReclaimVerifier...')
    const mockVerifier = await MockVerifierFactory.deploy()
    
    await mockVerifier.waitForDeployment()
    const mockVerifierAddress = await mockVerifier.getAddress()

    console.log(`✅ MockReclaimVerifier deployed to: ${mockVerifierAddress}`)
    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer.address}`)
    
    return mockVerifierAddress
  })
