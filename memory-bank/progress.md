# Progress

## What Works
* Contract with configurable maxParticipants.
* Complete lottery lifecycle (start/enter/end/pickWinner/reset).
* Prize deposit and distribution system.
* Conditional randomness (`Sapphire.randomBytes` on Sapphire, pseudo-random fallback).
* Comprehensive view functions (`getParticipants`, `getParticipantCount`, `getLotteryDetails`).
* Full test coverage for all functionality (with conditional checks for Sapphire compatibility and custom error checks on Hardhat).
* Contract layout follows Solidity Style Guide.
* Uses OpenZeppelin Contracts v5.2.0.
* Uses named imports for Solidity.
* Uses custom errors defined within contract scope.
* Backend documentation (`backend/README.md`) created.
* Contribution guidelines (`CONTRIBUTING.md`) created.
* Basic frontend structure implemented (`HomePage`, `OwnerDashboard`, `ParticipantDashboard`).
* Frontend configured to use Lottery ABI and address.
* Frontend fetches basic lottery details (`getLotteryDetails`) and displays status correctly.
* Frontend conditionally renders owner/participant views.
* Frontend implements all owner actions (`depositPrize`, `startLottery`, `endLottery`, `pickWinner`, `resetLottery`) with transaction status handling and data refetching.
* Frontend implements participant action (`enter`) with transaction status handling and data refetching.
* Frontend displays the lottery winner address on both dashboards.
* Frontend displays win/loss messages for participants.
* Frontend UI updates promptly after successful transactions.
* `Lottery.sol` contract modified to store `lotteryWinner`.
* Backend tests updated for `lotteryWinner`.
* Frontend UI styling refined for consistency and compactness:
    * Shared component styles updated (Button, Card, Input).
    * Shared CSS module created (`DashboardCommon.module.css`).
    * Dashboards refactored to use shared/specific styles.
* Replaced inline transaction status messages with `react-toastify` notifications.
* Fixed issue where all action buttons showed loading state; now only the clicked button shows loading.
* Fixed issue where success toast appeared before transaction confirmation; implemented transaction monitoring using `useWaitForTransactionReceipt` to update toast and refetch data only after confirmation.
    * Redundant welcome/address info removed.
    * Input border color fixed.
    * Conditional rendering added for Start/End buttons.
    * Status display refactored to compact row layout.
    * Deposit action moved to status section.
    * Frontend transaction toasts now display the full transaction hash using JSX for better formatting.
    * Frontend action buttons are disabled while a transaction is pending confirmation (`!!currentTxHash`).
    * New `StatusBanner` component created for compact status display.
    * Participant Dashboard UI refined:
        * "Actions" section hidden when user has already entered.
        * Replaced large `Alert` with compact `StatusBanner` for entry/win status display below main details.

## What's Left to Build
1.  Integrate Reclaim Protocol in the frontend. So that only participants which made right attestation can join the lottery
2.  Integrate Reclaim Protocol in contracts to check attestation before participant can join lottery.
3.  (Optional) Review code structure, that it uses clean code and reusable components
4.  (Optional) Clean up unnesesary comments in code.


## Current Status
* Core contract logic complete (including winner storage) and tested on Hardhat & Sapphire localnet with custom errors.
* Test suite adapted for Sapphire network limitations and custom error checks.
* OpenZeppelin dependency updated to v5.2.0.
* Imports refactored to named imports.
* Documentation (`backend/README.md`, `CONTRIBUTING.md`) created and refined.
* Core frontend functionality implemented, including all contract interactions, winner display, and enhanced toast notifications (using JSX to display full tx hash and disabling buttons during pending state).
* UI styling refined for consistency and compactness, including specific adjustments to the Participant Dashboard layout (conditional actions, replaced status Alert with StatusBanner).

## Known Issues
* (Minor) Participant dashboard still uses `.winnerCard` style which could be merged into common styles or simplified.

## Evolution of Project Decisions
* Changed from Ownable constructor with initial owner to default Ownable pattern
* Added ReentrancyGuard early for future security
