import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('lottery-pick-winner', 'Pick lottery winner (owner only)')
  .addParam('address', 'Address of the lottery contract')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    const lottery = await hre.ethers.getContractAt('Lottery', taskArgs.address)
    const [signer] = await hre.ethers.getSigners()
    
    try {
      const owner = await lottery.owner()
      if (signer.address !== owner) {
        throw new Error(`Only the owner (${owner}) can pick the winner. Current signer: ${signer.address}`)
      }
      
      const lotteryStatus = await lottery.lotteryStatus()
      if (lotteryStatus === 1n) { // LotteryStatus.Active
        throw new Error('Lottery must be ended before picking a winner')
      }
      
      const winnerPicked = await lottery.winnerPicked()
      if (winnerPicked) {
        const currentWinner = await lottery.lotteryWinner()
        throw new Error(`Winner already selected: ${currentWinner}`)
      }
      
      const currentParticipants = await lottery.getParticipantCount()
      if (currentParticipants === 0n) {
        throw new Error('No participants in the lottery')
      }
      
      const prizeAmount = await lottery.prizeAmount()
      
      console.log('\n🎯 Picking Winner:')
      console.log('='.repeat(50))
      console.log(`Contract Address: ${taskArgs.address}`)
      console.log(`Network: ${hre.network.name}`)
      console.log(`Owner: ${owner}`)
      console.log(`Total Participants: ${currentParticipants}`)
      console.log(`Prize Amount: ${hre.ethers.formatEther(prizeAmount)} ETH`)
      console.log('')
      
      console.log('Sending transaction...')
      const tx = await lottery.pickWinner()
      console.log(`Transaction hash: ${tx.hash}`)
      
      console.log('Waiting for confirmation...')
      const receipt = await tx.wait()
      
      const winner = await lottery.lotteryWinner()
      const newPrizeAmount = await lottery.prizeAmount()
      
      console.log(`🎉 Winner selected successfully!`)
      console.log(`Winner: ${winner}`)
      console.log(`Prize transferred: ${hre.ethers.formatEther(prizeAmount)} ETH`)
      console.log(`Remaining prize in contract: ${hre.ethers.formatEther(newPrizeAmount)} ETH`)
      console.log(`Gas used: ${receipt!.gasUsed}`)
      console.log('='.repeat(50))
      
    } catch (error) {
      console.error('Error picking winner:', error)
      throw error
    }
  })
