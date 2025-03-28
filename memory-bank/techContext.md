# Tech Context

## Technologies Used
* **Solidity**: ^0.8.20 (with SafeMath not needed due to built-in overflow checks)
* **Hardhat**: ^2.12.0 (development framework)
* **OpenZeppelin Contracts**: ^4.8.0 (for Ownable, EnumerableSet, ReentrancyGuard)
* **Ethers.js**: ^5.7.2 (for testing)
* **Chai**: ^4.3.7 (assertion library)
* **TypeScript**: ^4.9.5 (for tests and scripts)

## Development Setup
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

Key deployment features:
* Configurable maxParticipants (defaults to 1000)
* Detailed deployment logs with contract address
* Optional contract verification support
* Error handling for invalid parameters

## Technical Decisions
- Using configurable maxParticipants parameter instead of constant
- EnumerableSet for efficient participant tracking
- ReentrancyGuard for prize distribution safety
- Owner-restricted critical functions

## Technical Constraints
* Max 1000 participants per lottery round
* Pseudo-randomness limitations (not suitable for production)
* Sapphire-localnet test network requirements

## Dependencies
* **OpenZeppelin Contracts**:
  - Ownable: For owner-restricted functions
  - EnumerableSet: For efficient participant management
  - ReentrancyGuard: For secure prize distribution

## Tool Usage Patterns
* **Hardhat**:
  - Using TypeScript for all tests and scripts
  - Solidity style guide from .clinerules
* **Testing**:
  - AAA pattern (Arrange-Act-Assert)
  - Full coverage for all functions
  - Edge case testing (0 participants, max participants)
