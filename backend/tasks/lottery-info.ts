import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('lottery-info', 'Get lottery contract configuration details')
  .addParam('address', 'Address of the lottery contract')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    const lottery = await hre.ethers.getContractAt('Lottery', taskArgs.address)
    
    try {
      // Get configuration info
      const owner = await lottery.owner()
      const maxParticipants = await lottery.maxParticipants()
      const reclaimVerifierAddress = await lottery.reclaimVerifier()
      const requiredScreenName = await lottery.requiredScreenName()
      
      console.log('\n📋 Lottery Configuration:')
      console.log('='.repeat(50))
      console.log(`Contract Address: ${taskArgs.address}`)
      console.log(`Network: ${hre.network.name}`)
      console.log(`Owner: ${owner}`)
      console.log(`Max Participants: ${maxParticipants}`)
      console.log(`Reclaim Verifier: ${reclaimVerifierAddress}`)
      console.log(`Required Screen Name: ${requiredScreenName}`)
      console.log('='.repeat(50))
      
    } catch (error) {
      console.error('Error reading lottery info:', error)
      throw error
    }
  })
