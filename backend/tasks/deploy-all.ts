import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('deploy-all', 'Deploy complete lottery system (MockReclaimVerifier + Lottery)')
  .addOptionalParam('maxParticipants', 'Maximum number of participants', '10')
  .addOptionalParam('requiredScreenName', 'Required Twitter screen name', 'oasisprotocol')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    console.log('🚀 Starting complete lottery deployment...')
    console.log(`Network: ${hre.network.name}`)
    console.log(`Max Participants: ${taskArgs.maxParticipants}`)
    console.log(`Required Screen Name: ${taskArgs.requiredScreenName}`)

    // Step 1: Deploy MockReclaimVerifier
    console.log('\n📋 Step 1: Deploying MockReclaimVerifier...')
    const mockVerifierAddress = await hre.run('deploy-mock-verifier')

    // Step 2: Deploy Lottery with the mock verifier
    console.log('\n🎰 Step 2: Deploying Lottery contract...')
    const lotteryAddress = await hre.run('deploy-lottery', {
      maxParticipants: taskArgs.maxParticipants,
      verifierAddress: mockVerifierAddress,
      requiredScreenName: taskArgs.requiredScreenName
    })

    // Summary
    console.log('\n🎉 Deployment Summary:')
    console.log('='.repeat(50))
    console.log(`Network: ${hre.network.name}`)
    console.log(`MockReclaimVerifier: ${mockVerifierAddress}`)
    console.log(`Lottery Contract: ${lotteryAddress}`)
    console.log(`Max Participants: ${taskArgs.maxParticipants}`)
    console.log(`Required Screen Name: ${taskArgs.requiredScreenName}`)
    console.log('='.repeat(50))

    return {
      mockVerifierAddress,
      lotteryAddress
    }
  })
