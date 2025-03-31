# Active Context

## Current Focus
* Preparing for deployment.

## Recent Changes
* Implemented conditional randomness in `Lottery.sol` (`_getRandomIndex`) using `Sapphire.randomBytes` on Sapphire networks and pseudo-randomness otherwise.
* Refactored `Lottery.sol` layout according to style guide.
* Updated tests (`Lottery.ts`) to handle Sapphire network specifics:
    * Skipped Chai matcher checks (`emit`, `revertedWith`) on non-hardhat networks.
    * Added `await tx.wait()` before checking for reverts on Sapphire.
    * Updated revert checks on Sapphire to look for `"transaction execution reverted"` string.
* Upgraded OpenZeppelin Contracts dependency to v5.2.0.
* Refactored `Lottery.sol` imports to use named imports.
* Replaced `require` string messages with custom errors (defined within contract scope).
* Corrected `ReentrancyGuard` import path for OpenZeppelin v5.
* Updated Hardhat tests to use `revertedWithCustomError` for both contract-defined and inherited custom errors (e.g., `OwnableUnauthorizedAccount`).
* Created `backend/README.md` with project details, setup, usage, testing info (including Sapphire specifics), and Apache 2.0 license reference.
* Created root `CONTRIBUTING.md` outlining contribution guidelines, TDD process, and general coding standards.
* Updated `backend/README.md` to link to `CONTRIBUTING.md`.
* Removed specific `.clinerules` references from `CONTRIBUTING.md` in favor of general standards.
* Updated memory bank (`activeContext.md`, `progress.md`, `techContext.md`).

## Next Steps
1. Document security considerations (esp. conditional randomness).
2. Prepare/finalize deployment scripts.
3. (Optional) Frontend integration examples.

## Active Decisions & Considerations
* Gas optimization deferred.
* Using `call()` for prize transfer.
* Conditional randomness implemented (`Sapphire.randomBytes` vs. pseudo-random).
* Test strategy adapted for Sapphire network limitations (skip matchers, use `await tx.wait()`, check specific revert string).
* Using OpenZeppelin's EnumerableSet for participant tracking.
* Implementing ReentrancyGuard for prize distribution safety.
* Using conditional randomness (`Sapphire.randomBytes` or pseudo-random based on chain ID).

## Important Patterns & Preferences
* Following TDD approach (Red-Green-Refactor)
* Using NatSpec documentation throughout
* Adhering to the official Solidity style guide and general clean code principles.
* **CRITICAL:** When using `execute_command`, **DO NOT** escape `&&` as `&&`. Use the standard `&&` for command chaining.
* **Sapphire Testing:** Chai matchers (`.to.emit`) are incompatible with `sapphire-localnet`. Tests checking events must be conditional (`if (network.name === 'hardhat')`). For reverts, Hardhat tests use `revertedWithCustomError` (including for inherited errors like `OwnableUnauthorizedAccount`), while Sapphire network tests use `try...catch`, call `await tx.wait()` inside the `try` block, and check for `error.message.includes("transaction execution reverted")` in the `catch` block.

## Learnings & Insights
* Need to be explicit about pseudo-randomness limitations in documentation (especially the fallback).
* Prize distribution uses `call()` for compatibility.
* Testing reverts on Sapphire requires `await tx.wait()` and checking the specific error message string `"transaction execution reverted"`.
* Shell command chaining requires standard `&&`, not `&&`.
