import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('lottery-end', 'End the lottery (owner only)')
  .addParam('address', 'Address of the lottery contract')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    const lottery = await hre.ethers.getContractAt('Lottery', taskArgs.address)
    const [signer] = await hre.ethers.getSigners()
    
    try {
      const owner = await lottery.owner()
      if (signer.address !== owner) {
        throw new Error(`Only the owner (${owner}) can end the lottery. Current signer: ${signer.address}`)
      }
      
      const lotteryStatus = await lottery.lotteryStatus()
      if (lotteryStatus === 0n) { // LotteryStatus.Inactive
        throw new Error('Lottery has not started yet')
      }
      
      const currentParticipants = await lottery.getParticipantCount()
      
      console.log('\n🏁 Ending Lottery:')
      console.log('='.repeat(50))
      console.log(`Contract Address: ${taskArgs.address}`)
      console.log(`Network: ${hre.network.name}`)
      console.log(`Owner: ${owner}`)
      console.log(`Current Participants: ${currentParticipants}`)
      console.log('')
      
      console.log('Sending transaction...')
      const tx = await lottery.endLottery()
      console.log(`Transaction hash: ${tx.hash}`)
      
      console.log('Waiting for confirmation...')
      const receipt = await tx.wait()
      
      console.log(`✅ Lottery ended successfully!`)
      console.log(`You can now pick the winner using: lottery-pick-winner`)
      console.log(`Gas used: ${receipt!.gasUsed}`)
      console.log('='.repeat(50))
      
    } catch (error) {
      console.error('Error ending lottery:', error)
      throw error
    }
  })
