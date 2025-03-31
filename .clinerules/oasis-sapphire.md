# Oasis Sapphire Smart Contract Rules (Revised) (.cursorrules / .clinerules)

## Purpose
These rules guide the AI agent in writing Solidity smart contracts specifically for deployment on the Oasis Sapphire ParaTime. They focus exclusively on leveraging Sapphire's unique confidentiality features and its official library/precompiles, assuming general Solidity best practices are applied separately.
*(Context Time: Friday, March 28, 2025 at 9:54 AM, Location: Frankfurt, Germany)*

---

## 1. Core Confidentiality Principles

   - **State Confidentiality by Default:** Recognize that all contract state variables are confidential by default in Sapphire. Use `private` or `internal` visibility for state intended only for internal contract logic.
   - **Avoid Unnecessary Public State:** Do **not** declare state variables as `public` unless there is a clear, justified reason for exposing that specific state variable's value directly and publicly, bypassing confidentiality. This should be rare in applications leveraging Sapphire's privacy.
   - **Function Input/Output Awareness:** Understand that data passed into (`calldata`/`memory`) and returned from (`memory`) `external` function calls may not be automatically encrypted end-to-end unless specific application-layer encryption or future Sapphire features are used. Design accordingly, especially when dealing with sensitive inputs/outputs. `view` function results *are* encrypted for the specific caller by the runtime.
   - **Event Data is Public:** Data included in emitted events is **publicly visible** on the blockchain. **Do not emit sensitive private state directly in events.** Use events primarily to signal that an action occurred or state changed, possibly including non-sensitive identifiers or references.
   - **Sensitive Logic Placement:** Encapsulate logic operating on sensitive private state within `private` or `internal` functions whenever feasible, exposing controlled interactions via `public` or `external` functions with proper access control.

## 2. Sapphire Library Usage and Precompiles

   - **Sapphire Library Import:** **Always** import the official `Sapphire.sol` contract/library provided by Oasis (e.g., `import {Sapphire} from "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";` - adjust path based on project setup like Hardhat/Foundry includes). **Do not** attempt to reimplement its functionality.
   - **Use Library Functions:** Interact with Sapphire-specific features (randomness, signing, etc.) by calling the functions exposed by the imported `Sapphire` library (e.g., `Sapphire.randomBytes(uint256 numBytes, bytes memory pers)`, `Sapphire.sign(SigningAlg alg,bytes memory secretKey, bytes memory contextOrHash, bytes memory message)`). **Refer to the official Oasis Sapphire documentation (api.docs.oasis.io/sol/sapphire-contracts/) for the exact function signatures, usage, and required arguments.**
   - **Secure Randomness:** **Must** use the Sapphire library's function for generating unpredictable numbers (e.g., `Sapphire.randomBytes(...)`). **Do not** use insecure sources like `block.timestamp`, `blockhash`, or weak PRNGs. Ensure correct usage as per the library's documentation.
   - **On-Chain Signing/Verification:** Use the Sapphire library's functions for on-chain signing (e.g., `Sapphire.sign(...)`) or signature verification if required. Rely on the library's implementation, which typically interacts securely with the underlying precompiles. Verify function signatures and usage against the official documentation.
   - **Underlying Precompiles:** Understand that the `Sapphire.sol` library functions generally provide a safe and stable interface to Sapphire's underlying precompiled contracts. Direct interaction with precompile addresses should only be done if explicitly required for advanced use cases and recommended by official documentation, as library interfaces are less likely to change and abstract away complexities.

## 3. Authentication and Access Control

   - **Standard Access Control:** Implement standard Solidity access control patterns (e.g., Ownable, Role-Based Access Control) to restrict *who* can execute state-changing functions, even if the state itself is confidential.
   - **SIWE for Authenticated Reads (View Functions):** To allow specific off-chain users (identified by their Ethereum wallet) to read potentially sensitive information derived from private state via `view` functions, implement Sign-In with Ethereum (SIWE) verification.
     - The `view` function should accept the SIWE message components and the user's signature as arguments.
     - Reconstruct the EIP-4361 message hash within the function.
     - Use `ecrecover` to verify the signature against the expected user address (`msg.sender` is irrelevant for `view` calls without gas payment or specific runtime support).
     - Grant access to data only if the signature is valid and corresponds to an authorized address.
     *AI should use a standard, audited library for SIWE message construction and verification logic where possible.*

## 4. Testing Considerations

   - **Use Sapphire Tooling:** Employ Oasis Sapphire-specific development and testing tools ( Sapphire Localnet) to ensure tests run within a simulated confidential environment.
   Run tests with:
   ```
   pnpm hardhat test --network sapphire-localnet
   ```
   - **Test Confidentiality:** Write tests that explicitly verify expected confidentiality behavior (e.g., asserting that direct reads of private state fail or that only authorized users can retrieve data via authenticated view functions). Test interactions with Sapphire library functions using the Sapphire-enabled testing environment.

   - **Hardhat chai test matchers:** Running tests with --network sapphire-localnet or --network sapphire-testnet can't use chai matchers like .to.emit for events or .to.be.revertedWith() for errors. If you test events or reverts always check if the network is hardhat, also write else branches for sapphire networks that don't use this matchers. Remember when testing with sapphire networks error won't occur when just calling the contract, you always have to also call .wait() on the transaction to get the receipt. E.g.
   ```
   const tx = await lottery.enter();
   const receipt = await tx.wait();
   ```

---

**Instruction to AI:** When generating or refactoring Solidity code for Oasis Sapphire, strictly adhere to these Sapphire-specific rules. Prioritize leveraging confidentiality features correctly. Mandate the import and use of the official `Sapphire.sol` library as per the official documentation (linked above) for accessing features like randomness and signing. Implement SIWE for authenticated reads where required. Be explicit about the public nature of event data and external function I/O visibility. Exclude general Solidity advice unless it directly interacts with a Sapphire-specific feature. Explain the Sapphire-specific concepts being applied, referencing the official library functions where appropriate.