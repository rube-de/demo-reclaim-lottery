# Active Context

## Current Focus
* Refining frontend Lottery DApp dashboards (implementing actions, improving UI).

## Recent Changes
* Updated `OwnerDashboard.tsx` and `ParticipantDashboard.tsx` to correctly fetch lottery status and details using the `getLotteryDetails` contract function, resolving previous loading/error issues.
* Updated `frontend/src/constants/config.ts` to use Lottery ABI and address (`VITE_LOTTERY_ADDR`).
* Refactored `frontend/src/pages/HomePage/index.tsx`:
    * Removed MessageBox contract logic.
    * Added logic to fetch Lottery owner address.
    * Implemented conditional rendering for owner/participant views.
* Created basic structure for `frontend/src/pages/HomePage/OwnerDashboard.tsx`.
* Created basic structure for `frontend/src/pages/HomePage/ParticipantDashboard.tsx`.
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
* Updated memory bank (`activeContext.md`, `progress.md`, `techContext.md`, `systemPatterns.md`).
* Implemented owner actions (`depositPrize`, `startLottery`, `endLottery`, `pickWinner`, `resetLottery`) in `OwnerDashboard.tsx` using `useWriteContract`, including transaction state handling and explicit data refetching.
* Implemented participant action (`enter`) in `ParticipantDashboard.tsx` using `useWriteContract`, including transaction state handling and explicit data refetching.
* Modified `Lottery.sol` to add `lotteryWinner` public state variable.
* Updated `Lottery.ts` tests to check `lotteryWinner` state.
* Recompiled contract and updated frontend configuration (`.env.development`) with new address (handled by user).
* Updated `OwnerDashboard.tsx` and `ParticipantDashboard.tsx` to read and display the `lotteryWinner`.
* Added "Better luck next time" message to `ParticipantDashboard.tsx`.
* Fixed UI update delay issue by adding explicit `refetch()` calls after `invalidateQueries()` in transaction success handlers.

## Next Steps
1.  Refine UI styling for both dashboards.
2.  Consider adding toast notifications for transaction status instead of/in addition to the current inline messages.
3.  Perform thorough testing of the frontend interactions.
4.  (Optional) Document security considerations (esp. conditional randomness).
5.  (Optional) Prepare/finalize deployment scripts.
6.  (Optional) Gas optimization analysis.
7.  (Optional) Formal security audit.


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
* Explicit `refetch()` calls are needed alongside `invalidateQueries()` for immediate UI updates with Wagmi/React Query in this setup.
