# Product Context

## Purpose

*   **Why does this project exist?**
    To demonstrate a practical application of Reclaim Protocol attestations within a decentralized application (dApp), specifically for controlling entry into a smart contract-based lottery.
*   **What is the core value proposition?**
    To provide a lottery system that is not only transparent and decentralized but also Sybil-resistant and capable of enforcing specific off-chain criteria (like following a Twitter account) for participation, verified through Reclaim proofs.

## Problem Solved

*   **What specific problems does this project address for its users or stakeholders?**
    *   **Sybil Attacks:** Prevents single users from entering the lottery multiple times with different addresses by requiring a unique, verifiable off-chain attestation (e.g., proving ownership/interaction with a specific social media account).
    *   **Targeted Participation:** Allows lottery organizers (the contract owner) to restrict entry to users who meet specific, verifiable criteria (e.g., must be following `@oasisprotocol` on Twitter).
    *   **Trust & Transparency:** Leverages blockchain for the core lottery mechanics (randomness on Sapphire, prize handling) while using Reclaim for trustworthy verification of external conditions.

## How It Should Work

*   **Describe the intended functionality and user flow from a high level.**
    1.  **Owner:** Deploys the Lottery contract, specifying the maximum participants, the Reclaim Verifier address, and the required criteria (e.g., required Twitter screen name to follow). Deposits the prize money and starts the lottery.
    2.  **Participant:** Connects their wallet to the frontend dApp. Interacts with the Reclaim component to generate a proof attesting they meet the required criteria (e.g., following the specified Twitter account). Submits this proof via the `enter()` function of the Lottery contract.
    3.  **Contract:** Verifies the submitted Reclaim proof using the configured `IReclaimVerifier`. If valid and criteria match (screen name, following status), the participant is added.
    4.  **Owner:** Ends the lottery once the participation period is over or the limit is reached. Calls `pickWinner()` to select a winner randomly (using Sapphire randomness) and transfer the prize. Can then `resetLottery()` for a new round.
*   **What are the key features and interactions?**
    *   Wallet connection (e.g., MetaMask).
    *   Reclaim proof generation flow integrated into the frontend.
    *   Smart contract interaction for entering, depositing prize, starting/ending/resetting, and picking winner.
    *   Display of lottery status, participants, prize amount, and winner.
    *   Owner dashboard for administrative actions.
    *   Participant dashboard showing entry status and lottery details.

## User Experience Goals

*   **What are the desired qualities of the user experience (e.g., intuitive, fast, secure, engaging)?**
    *   **Secure:** Users should feel confident their interactions and potential winnings are handled securely by the smart contract and that entry criteria are fairly enforced.
    *   **Clear:** The process for generating a Reclaim proof and entering the lottery should be clearly explained and guided. Lottery status and results should be transparently displayed.
    *   **Reliable:** Contract functions should execute predictably. Proof verification should be robust.
    *   **Accessible:** Standard wallet interactions should be used.
*   **Who is the target user?**
    *   Web3 users interested in participating in verifiable, criteria-based lotteries or giveaways.
    *   Developers looking for examples of integrating Reclaim Protocol attestations into dApps.
    *   Community managers or organizations wanting to run promotional events with specific participation requirements.
