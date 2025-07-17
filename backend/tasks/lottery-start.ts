import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('lottery-start', 'Start the lottery (owner only)')
  .addParam('address', 'Address of the lottery contract')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    const lottery = await hre.ethers.getContractAt('Lottery', taskArgs.address)
    const [signer] = await hre.ethers.getSigners()
    
    try {
      const owner = await lottery.owner()
      if (signer.address !== owner) {
        throw new Error(`Only the owner (${owner}) can start the lottery. Current signer: ${signer.address}`)
      }
      
      const lotteryStatus = await lottery.lotteryStatus()
      if (lotteryStatus === 1n) { // LotteryStatus.Active
        throw new Error('Lottery has already started')
      }
      
      const prizeAmount = await lottery.prizeAmount()
      if (prizeAmount === 0n) {
        throw new Error('Prize must be deposited before starting the lottery')
      }
      
      console.log('\n🚀 Starting Lottery:')
      console.log('='.repeat(50))
      console.log(`Contract Address: ${taskArgs.address}`)
      console.log(`Network: ${hre.network.name}`)
      console.log(`Owner: ${owner}`)
      console.log(`Prize Amount: ${hre.ethers.formatEther(prizeAmount)} ETH`)
      console.log('')
      
      console.log('Sending transaction...')
      const tx = await lottery.startLottery()
      console.log(`Transaction hash: ${tx.hash}`)
      
      console.log('Waiting for confirmation...')
      const receipt = await tx.wait()
      
      console.log(`✅ Lottery started successfully!`)
      console.log(`Participants can now enter the lottery.`)
      console.log(`Gas used: ${receipt!.gasUsed}`)
      console.log('='.repeat(50))
      
    } catch (error) {
      console.error('Error starting lottery:', error)
      throw error
    }
  })
