# System Patterns

## System Architecture
* Single smart contract design (Lottery.sol)
* Uses OpenZeppelin's v5 base contracts for security and functionality (Ownable, ReentrancyGuard, EnumerableSet).
* Event-driven architecture for tracking lottery state changes.
* Uses Solidity Custom Errors for reverts.
* Stores winner address in public state variable (`lotteryWinner`) for frontend access.

## Key Technical Decisions
1. **Participant Management**:
   - Using OpenZeppelin's EnumerableSet for efficient participant tracking
   - Configurable maxParticipants via constructor parameter
   - Alternative: Simple array would be less gas efficient for lookups

2. **Prize Distribution**:
   - Using call() instead of transfer() for wider compatibility
   - Protected by ReentrancyGuard to prevent attacks

 3. **Randomness**:
    - Implemented conditional randomness via internal `_getRandomIndex` function.
    - Uses `Sapphire.randomBytes` precompile on Sapphire networks (Mainnet, Testnet, Localnet - checked via `block.chainid`).
    - Falls back to insecure `keccak256(abi.encodePacked(block.prevrandao, block.timestamp, participantCount))` on other networks (e.g., Hardhat local).
    - Trade-off: Provides secure randomness on target networks while allowing testing/development on standard EVM chains.

## Design Patterns in Use
* **Ownership Pattern**: Using OpenZeppelin's Ownable for admin functions
* **Guard Check Pattern**: ReentrancyGuard for secure prize distribution
* **Event-Condition-Action**: Emitting events for all state changes

## Component Relationships
```mermaid
flowchart TD
    Owner[Contract Owner] -->|calls| Lottery[Lottery.sol]
    Users[Participants] -->|calls enter()| Lottery
    Lottery -->|emits events| Frontend
    Lottery -->|stores| Participants[EnumerableSet]
```

## Critical Implementation Paths
1. **Lottery Lifecycle**:
   - Deploy with maxParticipants parameter
   - Owner deposits prize (depositPrize)
   - Owner starts lottery (startLottery)
   - Users enter lottery (enter) with:
     * Active status check
     * Participant limit enforcement
     * Unique address requirement
    - Owner ends lottery (endLottery)
    - Owner picks winner (pickWinner), which calls internal `_getRandomIndex` for network-appropriate randomness and sets `lotteryWinner`.
    - `pickWinner` uses ReentrancyGuard.
    - Contract transfers prize to winner via `call()`.
    - Owner can reset lottery for new round (`resetLottery`), which clears `lotteryWinner`.

---

## Frontend Architecture

*   **Entry Point:** `main.tsx` initializes providers (Wagmi, RainbowKit, React Query, Contexts) and renders the root `App` component.
*   **Root Component:** `App.tsx` sets up routing (`react-router-dom`) and the main application layout.
*   **Structure:** Follows a standard React/Vite structure:
    *   `components/`: Reusable UI elements (e.g., `Button`, `Card`, `Layout`), often using CSS Modules for scoped styling.
    *   `pages/`: Feature-specific view components mapped to routes. Dashboard pages (`OwnerDashboard`, `ParticipantDashboard`) utilize a shared CSS module (`DashboardCommon.module.css`) for common layout and specific modules for unique styles.
    *   `hooks/`: Custom hooks for reusable logic (e.g., `useAppState`, `useWeb3Auth`).
    *   `providers/`: React Context API providers for shared state (e.g., `AppStateProvider`, `Web3AuthProvider`).
    *   `constants/`: Application-wide constants.
    *   `types/`: Shared TypeScript definitions.
    *   `utils/`: Common utility functions.
*   **State Management:**
    *   **Server State:** TanStack Query (React Query) for fetching, caching, and managing data from the blockchain/backend.
    *   **Shared UI State:** React Context API (`providers/`) for global state like authentication status or theme.
    *   **Local Component State:** `useState`/`useReducer` for state confined to individual components.
    *   **Web3 Interaction:** Abstracted via Wagmi hooks, RainbowKit for wallet connection, and custom hooks (`useWeb3Auth`). Sapphire compatibility handled by specific wrappers.
    *   **Data Refetching:** Uses React Query's `invalidateQueries` followed by Wagmi's explicit `refetch()` function in transaction success handlers to ensure immediate UI updates.

```mermaid
graph TD
    subgraph Frontend Application
        direction LR
        main[main.tsx Entry Point] --> App[App.tsx Root]

        subgraph Providers
            direction TB
            Wagmi[WagmiProvider]
            RainbowKit[RainbowKitProvider]
            ReactQuery[QueryClientProvider]
            CustomContexts[Custom Contexts e.g., AppStateProvider]
        end

        subgraph Core Structure
            direction TB
            Routing[React Router]
            Layout[Layout Components]
            Pages[Pages (Views)]
            Components[Reusable UI Components]
        end

        subgraph State & Logic
             direction TB
             ReactQueryHooks[React Query Hooks] -->|interacts with| Blockchain/Backend
             WagmiHooks[Wagmi Hooks] -->|interacts with| Blockchain/Backend
             ContextHooks[useContext Hooks]
             CustomHooks[Custom Hooks e.g., useAppState]
             LocalState[useState / useReducer]
        end

        subgraph Utils & Types
            direction TB
            Utilities[utils/]
            Types[types/]
            Constants[constants/]
        end

        main --> Providers
        Providers --> App
        App --> Routing
        Routing --> Pages & Layout
        Pages --> Components & StateLogic
        Layout --> Components
        Components --> LocalState & ContextHooks
        StateLogic --> Utilities & Types & Constants

    end

    FrontendApplication -->|reads/writes| Lottery[Lottery.sol via Wagmi/Viem]
```
