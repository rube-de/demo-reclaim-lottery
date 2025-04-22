import '@nomicfoundation/hardhat-ethers' // Needed for ethers.getSigners() etc.
// import '@oasisprotocol/sapphire-hardhat'
import '@typechain/hardhat'
import 'hardhat-watcher'
import 'hardhat-gas-reporter'; // Added gas reporter import
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

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : TEST_HDWALLET;

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
      gas: 80000000, // Explicitly set gas limit for sapphire-testnet
    },
    'sapphire-localnet': {
      // docker run -it -p8544-8548:8544-8548 ghcr.io/oasisprotocol/sapphire-localnet
      url: 'http://localhost:8545',
      chainId: 0x5afd, // 23293
      accounts,
      // gas: 30000000, // Explicitly set gas limit for sapphire-localnet
    },
    'arbitrum-sepolia': {
      url: 'https://arbitrum-sepolia.drpc.org',
      chainId: 421614,
      accounts,
    },
  },
  solidity: {

    compilers: [
      {
        version: "0.8.28",
      },
      {
        version: "0.8.4",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "paris",
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
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false, // Enable with REPORT_GAS=true environment variable
    currency: 'USD', // Optional: Show gas costs in USD
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY, // Optional: Get ETH price from CoinMarketCap
    // outputFile: 'gas-report.txt', // Optional: Output report to a file
    // noColors: true, // Optional: Disable colors in output
  },
}

export default config
