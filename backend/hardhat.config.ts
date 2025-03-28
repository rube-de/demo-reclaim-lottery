import '@nomicfoundation/hardhat-ethers'
import '@oasisprotocol/sapphire-hardhat'
import '@typechain/hardhat'
import { Wallet } from 'ethers'
import 'hardhat-watcher'
import { HardhatUserConfig } from 'hardhat/config'
import 'solidity-coverage'
import { HDAccountsUserConfig } from 'hardhat/types'

import "./tasks"

// Hardhat Node and sapphire-localnet test mnemonic.
const TEST_HDWALLET: HDAccountsUserConfig = {
  mnemonic: 'test test test test test test test test test test test junk',
  path: "m/44'/60'/0'/0",
  initialIndex: 0,
  count: 20,
  passphrase: '',
}
const firstPrivateKey = Wallet.fromPhrase(TEST_HDWALLET.mnemonic).privateKey

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [firstPrivateKey]

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      // https://hardhat.org/metamask-issue.html
      chainId: 1337,
    },
    sapphire: {
      url: 'https://sapphire.oasis.io',
      chainId: 0x5afe, // 23294
      accounts,
    },
    'sapphire-testnet': {
      url: 'https://testnet.sapphire.oasis.io',
      chainId: 0x5aff, // 23295
      accounts,
    },
    'sapphire-localnet': {
      // docker run -it -p8544-8548:8544-8548 ghcr.io/oasisprotocol/sapphire-localnet
      url: 'http://localhost:8545',
      chainId: 0x5afd, // 23293
      accounts,
    },
  },
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  watcher: {
    compile: {
      tasks: ['compile'],
      files: ['./contracts/'],
    },
    test: {
      tasks: ['test'],
      files: ['./contracts/', './test'],
    },
    coverage: {
      tasks: ['coverage'],
      files: ['./contracts/', './test'],
    },
  },
  mocha: {
    require: ['ts-node/register/files'],
    timeout: 50_000,
  },
}

export default config
