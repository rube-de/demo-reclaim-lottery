# RainbowKit & Wagmi Integration with Oasis Sapphire

## 1. Introduction

RainbowKit is a React library that makes it easy to add wallet connection to your decentralized application (dApp). Wagmi is a collection of React Hooks containing everything you need to start working with Ethereum. Together, they provide a powerful and developer-friendly experience for building Web3 frontends.

This document outlines how RainbowKit and Wagmi are configured and utilized in this project, with a particular focus on their integration with the Oasis Sapphire confidential EVM.

## 2. Core Setup (`frontend/src/App.tsx`)

The primary configuration for both Wagmi and RainbowKit resides in `frontend/src/App.tsx`.

### Wagmi Configuration (`wagmiConfig`)

The `wagmiConfig` object is created using `createConfig` from Wagmi and tailored for Oasis Sapphire:

```typescript
// frontend/src/App.tsx (simplified)
import { Chain, sapphire, sapphireTestnet } from 'viem/chains'
import { createConfig, createConnector, Transport, WagmiProvider } from 'wagmi'
import {
  injectedWithSapphire,
  sapphireHttpTransport,
  sapphireLocalnet,
} from '@oasisprotocol/sapphire-wagmi-v2'
import { connectorsForWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets'

const { DEV, VITE_NETWORK } = import.meta.env
const VITE_NETWORK_NUMBER = Number(VITE_NETWORK)

export const wagmiConfig = createConfig({
  multiInjectedProviderDiscovery: false, // Discovers multiple injected wallets if true
  connectors: [
    ...connectorsForWallets(
      [
        {
          groupName: 'Recommended',
          wallets: [
            // Custom "Injected (Sapphire)" wallet
            (wallet => () => ({
              ...wallet,
              id: 'injected-sapphire',
              name: 'Injected (Sapphire)',
              createConnector: walletDetails =>
                createConnector(config => ({
                  ...injectedWithSapphire()(config), // Wraps standard injected connector for Sapphire
                  ...walletDetails,
                })),
            }))(injectedWallet()), // Uses RainbowKit's standard injectedWallet as a base
          ],
        },
      ],
      { appName: 'Demo starter', projectId: 'PROJECT_ID' } // projectId is a placeholder
    ),
  ],
  // Dynamically configures chains based on the VITE_NETWORK environment variable
  chains: [
    ...(VITE_NETWORK_NUMBER === 0x5afe ? [sapphire] : []), // Oasis Sapphire Mainnet
    ...(VITE_NETWORK_NUMBER === 0x5aff ? [sapphireTestnet] : []), // Oasis Sapphire Testnet
    ...(DEV && VITE_NETWORK_NUMBER === 0x5afd ? [sapphireLocalnet] : []), // Oasis Sapphire Localnet (dev only)
  ] as unknown as [Chain], // Type assertion
  // Configures transports for each Sapphire chain
  transports: {
    ...((VITE_NETWORK_NUMBER === 0x5afe ? { [sapphire.id]: sapphireHttpTransport() } : {}) as Transport),
    ...((VITE_NETWORK_NUMBER === 0x5aff
      ? { [sapphireTestnet.id]: sapphireHttpTransport() }
      : {}) as Transport),
    ...(DEV && VITE_NETWORK_NUMBER === 0x5afd ? { [sapphireLocalnet.id]: sapphireHttpTransport() } : {}),
  },
  batch: {
    multicall: false, // Multicall batching is disabled
  },
})
```

**Key Points:**

*   **`connectors`**:
    *   Uses `connectorsForWallets` from RainbowKit to define available wallet options.
    *   A custom **"Injected (Sapphire)"** wallet is created. This wraps RainbowKit's `injectedWallet()` with `injectedWithSapphire()` from `@oasisprotocol/sapphire-wagmi-v2`. This is crucial for ensuring that standard injected wallets (like MetaMask) can correctly sign transactions for the Sapphire network.
*   **`chains`**:
    *   The application dynamically configures the supported chains (`sapphire`, `sapphireTestnet`, `sapphireLocalnet`) based on the `VITE_NETWORK` environment variable. This allows easy switching between Sapphire environments.
*   **`transports`**:
    *   Utilizes `sapphireHttpTransport()` from `@oasisprotocol/sapphire-wagmi-v2` for each configured Sapphire chain. This transport handles the specifics of communicating with Sapphire nodes.
*   **`multiInjectedProviderDiscovery: false`**: This setting controls how Wagmi discovers injected browser wallet providers.
*   **`batch: { multicall: false }`**: Disables multicall batching, which might be a specific requirement or optimization for Sapphire interactions.

### RainbowKit Configuration (`RainbowKitProvider`)

The `RainbowKitProvider` wraps the application and provides the wallet connection UI and context:

```typescript
// frontend/src/App.tsx (simplified)
import { lightTheme, RainbowKitProvider, Theme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AccountAvatar } from './components/AccountAvatar'

const queryClient = new QueryClient()
const rainbowKitTheme: Theme = {
  ...lightTheme({ accentColor: 'var(--brand-extra-dark)' }), // Custom theme based on lightTheme
  fonts: {
    body: 'inherit', // Uses the application's body font
  },
}

// Inside App component's return statement:
<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider
      theme={rainbowKitTheme}
      avatar={({ size, address }) => <AccountAvatar size={size} address={address} />} // Custom avatar component
      modalSize="compact" // Uses compact modal for wallet selection
    >
      {/* ... rest of the app ... */}
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

**Key Points:**

*   **`theme`**: A custom theme is applied, derived from `lightTheme` with a modified accent color and font.
*   **`avatar`**: A custom `AccountAvatar` component is used to render user avatars in the RainbowKit UI.
*   **`modalSize="compact"`**: Configures the wallet connection modal to use a compact layout.

### Provider Hierarchy

The providers are nested as follows to ensure correct context availability:

1.  `WagmiProvider` (provides Wagmi context with `wagmiConfig`)
2.  `QueryClientProvider` (provides TanStack Query context for server state management)
3.  `RainbowKitProvider` (provides RainbowKit context for wallet UI and state)
4.  Application-specific contexts (`Web3AuthContextProvider`, `AppStateContextProvider`)
5.  `RouterProvider` (from `react-router-dom`)

## 3. Wallet Connection (`frontend/src/components/Layout/index.tsx`)

The `ConnectButton` component from RainbowKit is used to provide the user interface for connecting and managing wallet connections.

```typescript
// frontend/src/components/Layout/index.tsx (simplified)
import { ConnectButton } from '@rainbow-me/rainbowkit'
import classes from './index.module.css'
import { LogoIcon } from '../icons/LogoIcon'

export const Layout: FC = () => {
  // ...
  return (
    <LayoutBase
      header={
        <header className={classes.header}>
          <LogoIcon />
          <ConnectButton /> {/* RainbowKit's ConnectButton */}
        </header>
      }
    >
      {/* ... main content ... */}
    </LayoutBase>
  )
}
```

The `ConnectButton` automatically uses the global Wagmi and RainbowKit configurations established in `App.tsx`. It handles displaying connection status, opening the wallet selection modal, and showing account/network information.

## 4. Smart Contract Interaction with Wagmi (`frontend/src/pages/HomePage/ParticipantDashboard.tsx`)

Wagmi hooks are used extensively for interacting with the Lottery smart contract. The `ParticipantDashboard.tsx` component serves as a good example.

### Reading Contract Data

The `useReadContract` hook is used to fetch data from contract view functions or public state variables.

```typescript
// frontend/src/pages/HomePage/ParticipantDashboard.tsx (simplified)
import { useReadContract } from 'wagmi'
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config';

// Fetching a public string state variable
const { data: requiredTwitterHandle } = useReadContract({
  ...WAGMI_CONTRACT_CONFIG, // Contains ABI and contract address
  functionName: 'requiredScreenName',
}) satisfies WagmiUseReadContractReturnType<'requiredScreenName', string>;

// Fetching data from a view function returning a tuple
const { data: lotteryDetails, refetch: refetchLotteryDetails } = useReadContract({
  ...WAGMI_CONTRACT_CONFIG,
  functionName: 'getLotteryDetails',
}) satisfies WagmiUseReadContractReturnType<
  'getLotteryDetails',
  readonly [number, bigint, bigint, bigint, boolean]
>;

// Conditional fetching
const { data: participantsList } = useReadContract({
  ...WAGMI_CONTRACT_CONFIG,
  functionName: 'getParticipants',
  query: {
    enabled: !!address, // Only fetches if 'address' is available
  },
});
```

*   `WAGMI_CONTRACT_CONFIG` (from `frontend/src/constants/config.ts`) provides the contract's `abi` and `address`.
*   `functionName` specifies which contract function or public variable to read.
*   The `query: { enabled: ... }` option allows for conditional fetching.
*   `WagmiUseReadContractReturnType` is a custom type helper for stronger typing of hook results.

### Writing to Contract

The `useWriteContract` hook prepares for sending transactions that modify contract state.

```typescript
// frontend/src/pages/HomePage/ParticipantDashboard.tsx (simplified)
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

const { writeContract, isPending: isWritePending, reset: resetWriteContract } = useWriteContract();

const handleEnterLottery = () => {
  // ... (proof formatting logic) ...
  const formattedProofArg = { /* ... */ }; // Argument for the 'enter' function

  writeContract(
    {
      ...WAGMI_CONTRACT_CONFIG,
      functionName: 'enter',
      args: [formattedProofArg],
    },
    {
      onSuccess: (hash: `0x${string}`) => {
        // Handle successful transaction submission (e.g., update UI, store hash)
        setCurrentTxHash(hash);
      },
      onError: (error: Error) => {
        // Handle submission error
      },
    }
  );
};
```

*   `writeContract` (returned by `useWriteContract`) is called to initiate the transaction.
*   It takes the contract config, function name, and arguments (`args`).
*   `onSuccess` and `onError` callbacks handle the outcome of the transaction *submission* (not confirmation).

### Transaction Monitoring

The `useWaitForTransactionReceipt` hook tracks the status of a submitted transaction until it's confirmed on the blockchain.

```typescript
// frontend/src/pages/HomePage/ParticipantDashboard.tsx (simplified)
const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>(undefined);

const {
  isLoading: isConfirming,
  isSuccess: isConfirmed,
  isError: isConfirmationError,
  error: confirmationError,
} = useWaitForTransactionReceipt({
  hash: currentTxHash, // The hash received from writeContract's onSuccess
  query: {
    enabled: !!currentTxHash, // Only runs when a hash is available
  },
});

useEffect(() => {
  if (isConfirmed) {
    // Handle successful confirmation (e.g., show success message, refetch data)
  } else if (isConfirmationError) {
    // Handle confirmation error
  }
}, [isConfirmed, isConfirmationError, /* ... */]);
```

### Data Refetching & Cache Invalidation

After a successful transaction that modifies state, it's often necessary to refetch data and invalidate caches.

```typescript
// frontend/src/pages/HomePage/ParticipantDashboard.tsx (simplified)
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient();
// ... (inside useEffect for transaction confirmation) ...
if (isConfirmed) {
  // Invalidate React Query cache for specific contract reads
  const detailsQueryKey: readonly unknown[] = [WAGMI_CONTRACT_CONFIG.address, 'getLotteryDetails', undefined];
  queryClient.invalidateQueries({ queryKey: detailsQueryKey });

  // Manually trigger refetch for data read by useReadContract
  refetchLotteryDetails();
}
```

### Argument Formatting

When calling contract functions that expect complex types like structs, JavaScript/TypeScript objects must be formatted to match the Solidity struct definition.

```typescript
// frontend/src/pages/HomePage/ParticipantDashboard.tsx (in handleEnterLottery)
const proofArg = reclaimProofs[0]; // Proof object from Reclaim SDK
const formattedProofArg = { // Manually structured to match Solidity struct
  claimInfo: {
    provider: proofArg.claimData.provider,
    parameters: proofArg.claimData.parameters,
    context: proofArg.claimData.context,
  },
  signedClaim: {
    signatures: proofArg.signatures,
    claim: {
      identifier: proofArg.identifier,
      owner: proofArg.claimData.owner,
      timestampS: Number(proofArg.claimData.timestampS) >>> 0,
      epoch: proofArg.claimData.epoch,
    }
  }
};
// ... then pass formattedProofArg in writeContract args ...
```

## 5. Oasis Sapphire Integration Summary

The integration with Oasis Sapphire is primarily handled at the configuration level in `App.tsx` through the `@oasisprotocol/sapphire-wagmi-v2` library:

*   **`injectedWithSapphire()`**: This wrapper ensures that standard injected wallets (like MetaMask) can correctly sign transactions compatible with Sapphire's unique transaction format.
*   **`sapphireHttpTransport()`**: This provides the necessary transport layer to communicate with Sapphire RPC nodes.
*   **Dynamic Chain Configuration**: The `chains` array in `wagmiConfig` is set up to include the appropriate Sapphire network (Mainnet, Testnet, or Localnet) based on environment variables.

This setup allows developers to use standard Wagmi hooks and RainbowKit components for most interactions. The Sapphire-specific complexities are largely abstracted away by these specialized wrappers and configurations, leading to a smoother development experience. Components making contract calls do not need to be heavily modified for Sapphire, as long as the global Wagmi/RainbowKit setup is correctly configured.

## 6. Constants and Configuration (`frontend/src/constants/config.ts`)

A centralized configuration file, `frontend/src/constants/config.ts`, plays a role in simplifying contract interactions:

```typescript
// frontend/src/constants/config.ts
import LotteryABI from '../../../backend/abis/Lottery.json'
import { UseReadContractReturnType } from 'wagmi'
const { VITE_LOTTERY_ADDR } = import.meta.env

export const WAGMI_CONTRACT_CONFIG = {
  address: VITE_LOTTERY_ADDR as `0x${string}`,
  abi: LotteryABI,
}

export type WagmiUseReadContractReturnType<
  F extends string,
  R = unknown,
  A extends readonly unknown[] = unknown[]
> = UseReadContractReturnType<typeof LotteryABI, F, A, R | undefined>
```

*   `WAGMI_CONTRACT_CONFIG`: Exports an object containing the deployed `address` of the Lottery contract (from the `VITE_LOTTERY_ADDR` environment variable) and its `abi` (imported from the backend's ABI JSON file). This object is spread into Wagmi hook calls (`useReadContract`, `useWriteContract`), keeping them concise.
*   `WagmiUseReadContractReturnType`: A generic type helper that leverages `typeof LotteryABI` to provide more precise TypeScript typings for the data returned by `useReadContract`, enhancing type safety.

This centralized approach ensures that contract address and ABI are consistently used across the frontend.
