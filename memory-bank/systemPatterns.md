# System Patterns

## System Architecture
* Single smart contract design (Lottery.sol)
* Uses OpenZeppelin's v5 base contracts for security and functionality (Ownable, ReentrancyGuard, EnumerableSet).
* Event-driven architecture for tracking lottery state changes.
* Uses Solidity Custom Errors for reverts.

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
    - Owner picks winner (pickWinner), which calls internal `_getRandomIndex` for network-appropriate randomness.
    - `pickWinner` uses ReentrancyGuard.
    - Contract transfers prize to winner via `call()`.
    - Owner can reset lottery for new round (`resetLottery`).
