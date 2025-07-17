import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('lottery-participants', 'List current lottery participants')
  .addParam('address', 'Address of the lottery contract')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    const lottery = await hre.ethers.getContractAt('Lottery', taskArgs.address)
    
    try {
      const currentParticipants = await lottery.getParticipantCount()
      const maxParticipants = await lottery.maxParticipants()
      
      console.log('\\n👥 Lottery Participants:')
      console.log('='.repeat(50))
      console.log(`Contract Address: ${taskArgs.address}`)
      console.log(`Network: ${hre.network.name}`)
      console.log(`Participants: ${currentParticipants}/${maxParticipants}`)
      console.log('')
      
      if (currentParticipants > 0) {
        console.log('Participant Addresses:')
        const participants = await lottery.getParticipants()
        for (let i = 0; i < participants.length; i++) {
          console.log(`  ${i + 1}. ${participants[i]}`)
        }
      } else {
        console.log('No participants yet.')
      }
      
      console.log('='.repeat(50))
      
    } catch (error) {
      console.error('Error reading participants:', error)
      throw error
    }
  })
