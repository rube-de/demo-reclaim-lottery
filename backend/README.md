# Decentralized Lottery Smart Contract (Backend)

This directory contains the Solidity smart contract code for a decentralized lottery application, built using Hardhat and OpenZeppelin. The contract is designed for deployment on EVM-compatible chains and includes specific features for enhanced privacy and randomness when deployed on the Oasis Sapphire ParaTime.

## Description

This smart contract implements a transparent and secure lottery system. Key features include:

*   Owner-controlled lottery lifecycle (start, end, reset).
*   Participant entry with unique address enforcement.
*   Configurable maximum number of participants per round.
*   Prize handling (deposit and secure transfer to the winner).
*   **Conditional Randomness:** Utilizes Oasis Sapphire's secure `Sapphire.randomBytes` for winner selection when deployed on Sapphire networks (Mainnet, Testnet, Localnet), falling back to a less secure pseudo-random method (based on `block.prevrandao` and `block.timestamp`) on standard EVM chains for development and testing purposes.
*   Comprehensive view functions for retrieving lottery details.
*   Use of Solidity Custom Errors for clear revert reasons.
*   Protection against reentrancy attacks using OpenZeppelin's `ReentrancyGuard`.

## Installation

### Prerequisites

*   Node.js (v18+ recommended)
*   pnpm (or npm/yarn)

### Steps

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    # or npm install / yarn install
    ```

## Usage / Getting Started

### Compilation

Compile the smart contracts:

```bash
npx hardhat compile
```

### Deployment

Use the provided deployment script (`scripts/deployLottery.ts`). You can specify the network and the maximum number of participants.

**Deploy to local Hardhat network (for testing):**

```bash
# Deploy with default maxParticipants (1000)
npx hardhat run scripts/deployLottery.ts --network hardhat

# Deploy with custom maxParticipants
npx hardhat run scripts/deployLottery.ts --network hardhat --max-participants 50
```

**Deploy to Oasis Sapphire Localnet:**

```bash
# Ensure sapphire-localnet is running
# Deploy with default maxParticipants (1000)
npx hardhat run scripts/deployLottery.ts --network sapphire-localnet

# Deploy with custom maxParticipants
npx hardhat run scripts/deployLottery.ts --network sapphire-localnet --max-participants 5
```

The script will output the deployed contract address.

## Features

*   **Configurable Capacity:** Set the maximum number of participants during deployment.
*   **Lifecycle Management:** Owner can `startLottery`, `endLottery`, and `resetLottery`.
*   **Secure Entry:** `enter()` function ensures unique participants and respects capacity limits and lottery status.
*   **Prize Management:** Owner can `depositPrize`, and `pickWinner` securely transfers the prize using `call()`.
*   **Random Winner Selection:** Secure randomness on Oasis Sapphire, pseudo-random fallback elsewhere.
*   **Transparency:** View functions (`getParticipants`, `getParticipantCount`, `getLotteryDetails`, etc.) provide on-chain visibility.
*   **Security:** Uses OpenZeppelin `Ownable`, `ReentrancyGuard`, `EnumerableSet`, and custom errors.

## API Overview

The primary contract is `Lottery.sol`. Key functions include:

*   `enter()`: Allows users to participate.
*   `depositPrize()`: Allows the owner to fund the lottery.
*   `startLottery()`: Starts a new lottery round (owner only).
*   `endLottery()`: Ends the current round (owner only).
*   `pickWinner()`: Selects and pays the winner (owner only).
*   `resetLottery()`: Resets the contract for a new round (owner only).
*   Various `view` functions for retrieving state.

Detailed function documentation is available via NatSpec comments within the `contracts/Lottery.sol` file.

## Running Tests

Tests are written using Hardhat, Ethers.js, and Chai.

**Standard Tests (Hardhat Network):**

```bash
# Run tests with default maxParticipants (set low in test file)
npx hardhat test

# Run tests with a specific maxParticipants override (if needed)
MAX_PARTICIPANTS=5 npx hardhat test
```

**Sapphire Network Tests:**

```bash
# Ensure sapphire-localnet is running
npx hardhat test --network sapphire-localnet
```

**Important Testing Differences:**

*   **Event Emission:** Chai matchers like `.to.emit()` **do not work** on `sapphire-localnet` or `sapphire-testnet`. Tests verifying events are conditionally skipped when running on these networks.
*   **Revert Checks:**
    *   On the **Hardhat** network, use `expect(...).to.be.revertedWithCustomError(contract, "ErrorName")` for both contract-defined and inherited (e.g., `OwnableUnauthorizedAccount`) custom errors.
    *   On **Sapphire** networks, reverts must be checked differently:
        1.  Wrap the potentially reverting transaction call in a `try...catch` block.
        2.  **Crucially, call `await tx.wait()` *inside* the `try` block** after the transaction call (`const tx = await contract.someFunction(); await tx.wait();`).
        3.  In the `catch` block, assert that the `error.message` includes the specific string `"transaction execution reverted"`.

## Contributing

Contributions are welcome. Please follow standard development practices. This project aims to adhere to Test-Driven Development (TDD). Please consult the [CONTRIBUTING.md](../../CONTRIBUTING.md) file in the root directory for detailed guidelines.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](../../LICENSE) file in the root directory for details.

## Technology Stack

*   **Solidity:** ^0.8.20
*   **Hardhat:** ^2.12.0
*   **OpenZeppelin Contracts:** ^5.2.0
*   **Ethers.js:** ^5.7.2
*   **Chai:** ^4.3.7
*   **TypeScript:** ^4.9.5
