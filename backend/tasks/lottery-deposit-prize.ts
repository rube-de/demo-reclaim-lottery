import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import '@nomicfoundation/hardhat-ethers'

task('lottery-deposit-prize', 'Deposit prize into lottery contract (owner only)')
  .addParam('address', 'Address of the lottery contract')
  .addParam('amount', 'Amount of ETH to deposit as prize')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run('compile')

    const lottery = await hre.ethers.getContractAt('Lottery', taskArgs.address)
    const [signer] = await hre.ethers.getSigners()
    
    try {
      const owner = await lottery.owner()
      if (signer.address !== owner) {
        throw new Error(`Only the owner (${owner}) can deposit prize. Current signer: ${signer.address}`)
      }
      
      const amountWei = hre.ethers.parseEther(taskArgs.amount)
      
      console.log('\n💰 Depositing Prize:')
      console.log('='.repeat(50))
      console.log(`Contract Address: ${taskArgs.address}`)
      console.log(`Network: ${hre.network.name}`)
      console.log(`Owner: ${owner}`)
      console.log(`Amount: ${taskArgs.amount} ETH`)
      console.log('')
      
      console.log('Sending transaction...')
      const tx = await lottery.depositPrize({ value: amountWei })
      console.log(`Transaction hash: ${tx.hash}`)
      
      console.log('Waiting for confirmation...')
      const receipt = await tx.wait()
      
      const newPrizeAmount = await lottery.prizeAmount()
      console.log(`✅ Prize deposited successfully!`)
      console.log(`New prize amount: ${hre.ethers.formatEther(newPrizeAmount)} ETH`)
      console.log(`Gas used: ${receipt!.gasUsed}`)
      console.log('='.repeat(50))
      
    } catch (error) {
      console.error('Error depositing prize:', error)
      throw error
    }
  })
