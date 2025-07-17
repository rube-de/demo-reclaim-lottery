import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('lottery-reset', 'Reset lottery for new round (owner only)')
  .addParam('address', 'Address of the lottery contract')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    const lottery = await hre.ethers.getContractAt('Lottery', taskArgs.address)
    const [signer] = await hre.ethers.getSigners()
    
    try {
      const owner = await lottery.owner()
      if (signer.address !== owner) {
        throw new Error(`Only the owner (${owner}) can reset the lottery. Current signer: ${signer.address}`)
      }
      
      const winnerPicked = await lottery.winnerPicked()
      if (!winnerPicked) {
        throw new Error('Winner must be selected before resetting')
      }
      
      const currentWinner = await lottery.lotteryWinner()
      const currentParticipants = await lottery.getParticipantCount()
      const prizeAmount = await lottery.prizeAmount()
      
      console.log('\n🔄 Resetting Lottery:')
      console.log('='.repeat(50))
      console.log(`Contract Address: ${taskArgs.address}`)
      console.log(`Network: ${hre.network.name}`)
      console.log(`Owner: ${owner}`)
      console.log(`Previous Winner: ${currentWinner}`)
      console.log(`Participants to clear: ${currentParticipants}`)
      console.log(`Current Prize Amount: ${hre.ethers.formatEther(prizeAmount)} ETH`)
      console.log('')
      
      console.log('Sending transaction...')
      const tx = await lottery.resetLottery()
      console.log(`Transaction hash: ${tx.hash}`)
      
      console.log('Waiting for confirmation...')
      const receipt = await tx.wait()
      
      const newParticipants = await lottery.getParticipantCount()
      const newPrizeAmount = await lottery.prizeAmount()
      const newWinner = await lottery.lotteryWinner()
      const newWinnerPicked = await lottery.winnerPicked()
      const newLotteryStatus = await lottery.lotteryStatus()
      const newHasStarted = newLotteryStatus === 1n // LotteryStatus.Active
      const newHasEnded = newLotteryStatus === 0n && newWinnerPicked // Inactive but winner picked means ended
      
      console.log(`✅ Lottery reset successfully!`)
      console.log(`New State:`)
      console.log(`  Participants: ${newParticipants}`)
      console.log(`  Prize Amount: ${hre.ethers.formatEther(newPrizeAmount)} ETH`)
      console.log(`  Winner: ${newWinner === hre.ethers.ZeroAddress ? 'None' : newWinner}`)
      console.log(`  Has Started: ${newHasStarted}`)
      console.log(`  Has Ended: ${newHasEnded}`)
      console.log(`Gas used: ${receipt!.gasUsed}`)
      console.log('')
      console.log('Ready for new round! You can now deposit prize and start again.')
      console.log('='.repeat(50))
      
    } catch (error) {
      console.error('Error resetting lottery:', error)
      throw error
    }
  })
