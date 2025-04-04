# Tech Context

## Technologies Used

### Backend
* **Solidity**: ^0.8.20 (with SafeMath not needed due to built-in overflow checks)
* **Hardhat**: ^2.12.0 (development framework)
* **OpenZeppelin Contracts**: ^5.2.0 (for Ownable, EnumerableSet, ReentrancyGuard)
* **Ethers.js**: ^5.7.2 (for testing)
* **Chai**: ^4.3.7 (assertion library)
* **TypeScript**: ^4.9.5 (for backend tests and scripts)

### Frontend
* **Framework**: React v18.3.1
* **Language**: TypeScript v5.5.3
* **Build Tool**: Vite v5.4.8
* **Routing**: React Router v6.27.0
* **Web3 Interaction**:
    * Wagmi v2.14.11 (React Hooks for Ethereum)
    * Viem v2.23.1 (TypeScript Interface for Ethereum)
    * RainbowKit v2.2.3 (Wallet Connection UI)
    * `@oasisprotocol/sapphire-viem-v2` / `@oasisprotocol/sapphire-wagmi-v2` (Sapphire compatibility)
    * SIWE v2.3.2 (Sign-In with Ethereum)
* **State Management**:
    * TanStack Query (React Query) v5.45.1 (Server state, caching, background updates)
    * React Context API (likely for global UI state like theme, auth status)
    * `useState`/`useReducer` (Component-local state)
* **Notifications**:
    * `react-toastify` ^11.0.5 (Toast notifications for transaction status)
* **Styling**:
    * CSS Modules (inferred from file structure)
    * Fonts: `@fontsource-variable/figtree`, `@fontsource-variable/roboto-mono`
    * Icons: `@material-design-icons/svg`, `@metamask/jazzicon`
* **Testing**: Playwright v1.47.2 (End-to-End)
* **Other**: `react-responsive` (Responsive design helpers)

## Development Setup

### Backend
1. Install dependencies:
```bash
cd backend
npm install
```

2. Compile contracts:
```bash
npx hardhat compile
```

3. Run tests (with smaller maxParticipants for testing):
```bash
npx hardhat test
```
Or to test with custom maxParticipants:
```bash
MAX_PARTICIPANTS=5 npx hardhat test
```

4. Deploy contract:
```bash
# Deploy to local Hardhat network (testing)
npx hardhat run scripts/deployLottery.ts --network hardhat

# Deploy to sapphire-localnet with custom maxParticipants
npx hardhat run scripts/deployLottery.ts --network sapphire-localnet --max-participants 1000
```

Key backend deployment features:
* Configurable maxParticipants (defaults to 1000)
* Detailed deployment logs with contract address
* Optional contract verification support
* Error handling for invalid parameters

### Frontend
1. Install dependencies:
```bash
cd frontend
npm install # or pnpm install / yarn install depending on project setup
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

5. Run E2E tests:
```bash
# First time setup
npm run test:setup

# Run tests
npm run test
```

## Technical Decisions

### Backend
- Using configurable maxParticipants parameter instead of constant
- EnumerableSet for efficient participant tracking
- ReentrancyGuard for prize distribution safety
- Owner-restricted critical functions

### Frontend
- Using Vite for fast development and build performance.
- Wagmi/Viem for modern React hooks-based Ethereum interaction.
- RainbowKit for a standard wallet connection experience.
- TanStack Query for managing server state and caching API data.
- CSS Modules for scoped styling.

## Technical Constraints

### Backend
* Max 1000 participants per lottery round
* Pseudo-randomness limitations (not suitable for production on non-Sapphire chains)
* Sapphire-localnet test network requirements

### Frontend
* Relies on modern browser features supported by Vite/React.
* Wallet compatibility determined by RainbowKit/Wagmi.

## Dependencies

### Backend
* **OpenZeppelin Contracts (^5.2.0)**:
  - Ownable: For owner-restricted functions
  - EnumerableSet: For efficient participant management
  - ReentrancyGuard: For secure prize distribution

### Frontend (Key Libraries)
* **React/ReactDOM**: Core UI library
* **Wagmi/Viem**: Web3 interaction
* **RainbowKit**: Wallet connection
* **TanStack Query**: Server state management
* **React Router**: Client-side routing
* **SIWE**: Authentication
* **react-toastify**: Toast notifications

## Tool Usage Patterns

### Backend (Hardhat)
* Using TypeScript for all tests and scripts.
* Adhering to Solidity style guide and clean code principles.
* **Testing**:
    * AAA pattern (Arrange-Act-Assert).
    * Full coverage for all functions.
    * Edge case testing (0 participants, max participants).
    * **Sapphire Specifics:** Conditional testing for events (`if (network.name === 'hardhat')`). Different revert checking logic for Hardhat (`revertedWithCustomError`) vs. Sapphire (`try/catch`, `await tx.wait()`, check error message string).

### Frontend (Vite/React/TypeScript)
* Functional components with Hooks preferred.
* Strong typing enforced (`strict: true` assumed).
* CSS Modules for styling.
* Custom hooks for reusable logic (e.g., `useAppState`, `useWeb3Auth`).
* Playwright for end-to-end testing.
