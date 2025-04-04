import LotteryABI from '../../../backend/abis/Lottery.json' // Assuming ABI file is named Lottery.json
import { UseReadContractReturnType } from 'wagmi'
const { VITE_LOTTERY_ADDR } = import.meta.env // Using new env variable

export const GITHUB_REPOSITORY_URL = 'https://github.com/oasisprotocol/demo-starter'
export const OASIS_DOCS_PAGE_URL = 'https://docs.oasis.io/'
export const OASIS_HOME_PAGE_URL = 'https://oasisprotocol.org/'

export const WAGMI_CONTRACT_CONFIG = {
  address: VITE_LOTTERY_ADDR as `0x${string}`, // Using new env variable
  abi: LotteryABI, // Using Lottery ABI
}

// Update the type helper to use the Lottery ABI
export type WagmiUseReadContractReturnType<
  F extends string,
  R = unknown,
  A extends readonly unknown[] = unknown[]
> = UseReadContractReturnType<typeof LotteryABI, F, A, R | undefined>
