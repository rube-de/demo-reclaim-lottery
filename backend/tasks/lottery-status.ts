import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('lottery-status', 'Get lottery contract status and state')
  .addParam('address', 'Address of the lottery contract')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    const lottery = await hre.ethers.getContractAt('Lottery', taskArgs.address)
    
    try {
      // Get basic info
      const owner = await lottery.owner()
      const maxParticipants = await lottery.maxParticipants()
      const currentParticipants = await lottery.getParticipantCount()
      const prizeAmount = await lottery.prizeAmount()
      const lotteryStatus = await lottery.lotteryStatus()
      const winnerPicked = await lottery.winnerPicked()
      const winner = await lottery.lotteryWinner()
      const requiredScreenName = await lottery.requiredScreenName()
      
      // Convert status enum to boolean
      const hasStarted = lotteryStatus === 1n // LotteryStatus.Active
      const hasEnded = lotteryStatus === 0n && winnerPicked // Inactive but winner picked means ended
      
      console.log('\n🎰 Lottery Status:')
      console.log('='.repeat(50))
      console.log(`Contract Address: ${taskArgs.address}`)
      console.log(`Network: ${hre.network.name}`)
      console.log(`Owner: ${owner}`)
      console.log(`Required Screen Name: ${requiredScreenName}`)
      console.log('')
      console.log('📊 Current State:')
      console.log(`  Max Participants: ${maxParticipants}`)
      console.log(`  Current Participants: ${currentParticipants}`)
      console.log(`  Prize Amount: ${hre.ethers.formatEther(prizeAmount)} ETH`)
      console.log(`  Has Started: ${hasStarted ? '✅' : '❌'}`)
      console.log(`  Has Ended: ${hasEnded ? '✅' : '❌'}`)
      console.log(`  Winner: ${winner === hre.ethers.ZeroAddress ? 'None' : winner}`)
      
      // Determine current phase
      let phase = 'Setup'
      if (winner !== hre.ethers.ZeroAddress) {
        phase = 'Winner Selected'
      } else if (hasEnded) {
        phase = 'Ended (awaiting winner selection)'
      } else if (hasStarted) {
        phase = 'Active (accepting participants)'
      } else if (prizeAmount > 0) {
        phase = 'Ready to Start (prize deposited)'
      }
      
      console.log(`  Phase: ${phase}`)
      console.log('='.repeat(50))
      
    } catch (error) {
      console.error('Error reading lottery status:', error)
      throw error
    }
  })
