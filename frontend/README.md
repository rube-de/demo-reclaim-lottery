# Frontend - Reclaim Lottery dApp

React/TypeScript frontend for the decentralized lottery application built on Oasis Sapphire blockchain with Reclaim Protocol integration.

## 🏗️ Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **Web3**: Wagmi + RainbowKit
- **State Management**: TanStack Query + React Context
- **Testing**: Playwright E2E
- **Blockchain**: Oasis Sapphire network

### Project Structure
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Route components
│   ├── providers/          # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── constants/          # Configuration constants
├── public/                 # Static assets
├── test/                   # E2E tests
└── types/                  # Global type definitions
```

## 🚀 Quick Start

### Prerequisites
- Node.js ≥20
- pnpm v10.6.1
- Running Sapphire Localnet (for development)

### Installation & Setup
```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.development
# Edit .env.development with your contract address

# Start development server
pnpm dev
```

### Development Server
```bash
pnpm dev              # Start dev server (http://localhost:5173)
pnpm build            # Production build
pnpm preview          # Preview production build
```

## 🧪 Testing

### E2E Testing with Playwright
```bash
# First-time setup
pnpm test:setup

# Run E2E tests
pnpm test

# Run tests in headed mode
pnpm test:headed

# Run tests with UI
pnpm test:ui
```

## 📱 User Interface

### Main Components

#### Owner Dashboard
- **Prize Management**: Deposit and withdraw prize funds
- **Lottery Control**: Start/end lottery rounds
- **Winner Selection**: Pick winners using secure randomness
- **Participant View**: Monitor current participants

#### Participant Dashboard
- **Entry Process**: Connect wallet and enter lottery
- **Reclaim Verification**: Verify Twitter followers via QR code
- **Status Tracking**: Monitor lottery state and participation
- **Prize Information**: View current prize pool

### Key Features
- **Responsive Design**: Mobile-first approach with CSS modules
- **Real-time Updates**: TanStack Query for live blockchain data
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Accessibility**: WCAG 2.1 compliant components

## 🔐 Web3 Integration

### Wallet Connection
- **RainbowKit**: Wallet connection UI
- **Wagmi**: React hooks for Web3 interactions
- **Supported Wallets**: MetaMask, WalletConnect, Coinbase Wallet

### Blockchain Interaction
```typescript
// Example: Enter lottery with Reclaim proof
const { writeContract } = useWriteContract();

const enterLottery = async (proof: ReclaimProof) => {
  const formattedProof = formatProofForSolidity(proof);
  await writeContract({
    address: LOTTERY_CONTRACT_ADDRESS,
    abi: LotteryABI,
    functionName: 'enter',
    args: [formattedProof]
  });
};
```

### Network Configuration
```typescript
// Supported networks
const chains = [
  sapphireTestnet,
  sapphireLocalnet,
  sapphire
];
```

## 🛠️ Development

### Environment Variables
```bash
# .env.development
VITE_LOTTERY_CONTRACT_ADDR=0x...  # Contract address
VITE_NETWORK=sapphire-localnet    # Network identifier
```

### Code Quality
- **ESLint**: Linting with React and TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Strict mode enabled
- **Pre-commit**: Automated linting and formatting

### State Management Pattern
```typescript
// App state context
const AppStateContext = createContext<AppState>({
  message: null,
  isLoading: false,
  // ...
});

// Web3 auth context
const Web3AuthContext = createContext<Web3AuthState>({
  isConnected: false,
  isOwner: false,
  // ...
});
```

## 🔄 Reclaim Integration

### Proof Generation Flow
1. **QR Code Display**: Show Reclaim verification QR code
2. **Mobile Verification**: User scans and verifies Twitter followers
3. **Proof Submission**: Submit proof to smart contract
4. **Verification**: Contract validates proof via Reclaim verifier

### Implementation Example
```typescript
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

const generateProof = async () => {
  const reclaimProofRequest = await ReclaimProofRequest.init(
    APP_ID,
    APP_SECRET,
    PROVIDER_ID
  );
  
  const proof = await reclaimProofRequest.generateProof();
  return formatProofForSolidity(proof);
};
```

## 🎨 Styling

### CSS Modules
- **Component-scoped**: Styles scoped to individual components
- **Shared Modules**: Common styles in `DashboardCommon.module.css`
- **Responsive**: Mobile-first responsive design
- **Theme**: Consistent color scheme and typography

### Example Component Style
```css
/* Button.module.css */
.button {
  background: var(--primary-color);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## 📊 Performance

### Optimization Strategies
- **Code Splitting**: Route-based lazy loading
- **Bundle Analysis**: Vite bundle analyzer
- **Asset Optimization**: Optimized images and fonts
- **Caching**: Efficient Web3 data caching with TanStack Query

### Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['wagmi', '@rainbow-me/rainbowkit']
        }
      }
    }
  }
});
```

## 🚨 Error Handling

### Error Boundaries
- **Global**: App-level error boundary
- **Route**: Per-route error boundaries
- **Component**: Component-specific error handling

### User Feedback
- **Toast Messages**: Success/error notifications
- **Loading States**: Progress indicators
- **Validation**: Form and input validation

## 📝 Common Development Tasks

### Adding New Components
```bash
# Create component directory
mkdir src/components/NewComponent

# Create component files
touch src/components/NewComponent/index.tsx
touch src/components/NewComponent/index.module.css
```

### Updating Contract ABI
```bash
# Copy ABI from backend build
cp ../backend/artifacts/contracts/Lottery.sol/Lottery.json src/contracts/
```

### Adding New Routes
```typescript
// Update App.tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '/new-route', element: <NewPage /> }
    ]
  }
]);
```

## 🔍 Debugging

### Browser DevTools
- **React DevTools**: Component state inspection
- **Network Tab**: Web3 RPC call monitoring
- **Console**: Error logging and debugging

### Common Issues
- **Wallet Connection**: Check network configuration
- **Contract Interaction**: Verify contract address and ABI
- **State Updates**: Check TanStack Query cache invalidation

## 🚀 Deployment

### Production Build
```bash
pnpm build
pnpm preview  # Test production build locally
```

### Environment Configuration
```bash
# .env.production
VITE_LOTTERY_CONTRACT_ADDR=0x...  # Production contract
VITE_NETWORK=sapphire            # Production network
```

## 📚 Additional Resources

- [Oasis Sapphire Documentation](https://docs.oasis.io/sapphire/)
- [Reclaim Protocol SDK](https://docs.reclaimprotocol.org/)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [TanStack Query](https://tanstack.com/query/)

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure all checks pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
