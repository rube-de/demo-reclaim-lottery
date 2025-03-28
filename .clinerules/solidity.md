# Solidity Smart Contract Development Rules (.cursorrules / .clinerules)

## 0. General & Setup

   - **Solidity Version:** Use a recent, stable Solidity version (>=0.8.20 recommended). Specify the version using a caret (`^`) for patch updates but locking major/minor: `pragma solidity ^0.8.20;`
   - **SPDX License:** Always include an SPDX license identifier: `// SPDX-License-Identifier: MIT` (or other appropriate license).
   - **Contract Structure:** Organize contracts logically, potentially using inheritance or libraries for modularity and code reuse.

---

## 1. Security (Highest Priority)

   - **Checks-Effects-Interactions Pattern:** Strictly adhere to this pattern, especially when interacting with external contracts or transferring value:
     1.  **Checks:** Perform all necessary validation (`require` statements, balance checks, access control).
     2.  **Effects:** Update the contract's internal state variables.
     3.  **Interactions:** Call external contracts or transfer funds.
   - **Reentrancy Protection:**
     - Apply reentrancy guards (like OpenZeppelin's `ReentrancyGuard` or a custom `nonReentrant` modifier) to all `external` or `public` functions that perform external calls or ETH transfers (`.call{value: ...}`, `.transfer`, `.send`).
     - Be cautious even with internal functions if they can be indirectly triggered by an external call sequence.
   - **Access Control:**
     - Implement robust access control for sensitive functions (e.g., changing settings, withdrawing funds, pausing contract). Use established patterns like `Ownable` or Role-Based Access Control (RBAC) (e.g., OpenZeppelin's `AccessControl`).
     - Default to the strictest necessary visibility: `private` > `internal` > `external` > `public`. Avoid `public` for state variables unless intentionally creating a getter.
   - **Integer Arithmetic (Solidity >= 0.8.0):**
     - Rely on default checked arithmetic. Understand that overflows/underflows will `revert`.
     - Use `unchecked { ... }` blocks *only* when mathematically certain overflow/underflow cannot occur AND gas savings are significant (document reasoning clearly). See Gas Efficiency section.
   - **External Calls & Interactions:**
     - **Check Return Values:** Always check the boolean return value of low-level calls (`.call`, `.delegatecall`, `.staticcall`). Use `require()` on the success boolean.
     - **Pull over Push:** Prefer pull-payment strategies (where users withdraw funds) over push-payment strategies (where the contract sends funds) to avoid unexpected reverts or gas issues caused by recipient contracts.
     - **Untrusted Contracts:** Treat all external contracts as potentially malicious. Minimize reliance on them and clearly document interactions. Avoid `delegatecall` to untrusted contracts due to storage layout risks.
     - **Gas Limits:** Be aware that external calls can fail due to out-of-gas errors. Design contracts to be robust against this where possible (e.g., pull payments).
   - **Input Validation:**
     - Use `require(condition, "Error message");` extensively at the beginning of functions to validate inputs (arguments, `msg.sender`, `msg.value`) and required state conditions.
     - Use clear and specific error messages.
   - **`assert()` vs `require()`:** Use `require()` for input/state validation. Use `assert()` *only* for checking internal invariants (conditions that should never be false if the code is correct). `assert()` failures typically consume all remaining gas.
   - **Denial of Service (DoS):** Avoid patterns vulnerable to DoS:
     - Unbounded loops that iterate over data structures potentially controlled by users.
     - Mechanisms where one user's action (or inaction) can block progress for all others.
     - Relying on external calls that might always fail or revert.
   - **Timestamp and Block Number Dependence:** Do not rely on `block.timestamp` or `block.number` for critical logic requiring precise timing or randomness, as miners can manipulate these values to some extent.
   - **Front-Running/MEV Awareness:** Be mindful that transaction order is not guaranteed. For actions sensitive to ordering (e.g., DEX interactions, certain reveals), consider mitigation strategies if necessary (though complex).
   - **Event Emission:** Emit events for all significant state changes, access control changes, fund movements, and critical actions. This allows off-chain services to monitor contract activity reliably. Follow naming conventions (`EventName`).

---

## 2. Gas Efficiency

   - **Storage Optimization (SSTORE/SLOAD are expensive):**
     - **Minimize State Writes:** Cache state variables in `memory` if read multiple times within a function. Only write back to storage when necessary, ideally once at the end.
     - **Variable Packing:** Group variables smaller than 32 bytes (e.g., `uint128`, `bool`, `address`) together in the contract's state variable declarations where possible to fit them into single 256-bit storage slots. Order matters.
     - **Use `immutable`:** Declare state variables as `immutable` if they are set only once in the `constructor`. Their values are embedded directly into the contract bytecode, saving SLOADs.
     - **Use `constant`:** Declare state variables as `constant` if their value is known at compile time.
     - **Data Structures:** Use `mapping` for key-value lookups instead of iterating arrays. If iteration is needed, consider patterns that process data incrementally or store relevant indices. Be aware that clearing storage slots (`delete` or setting to zero) provides minimal gas refunds post-EIP-3529.
   - **`calldata` vs `memory`:**
     - For `external` function parameters (structs, arrays, strings, bytes), use `calldata` instead of `memory` if the data is only read within the function. This avoids an expensive memory allocation and copy.
   - **Loops:**
     - Avoid loops that iterate over unbounded storage arrays or mappings if possible.
     - If looping, cache array lengths or other bounds in `memory`.
     - Consider `unchecked { ++i; }` for loop counters *only* if you can prove `i` will not overflow (requires Solidity >= 0.8.0). Document this assumption.
   - **Function Visibility & Calls:** Use `internal` or `private` visibility when functions don't need to be called externally. Internal calls are generally cheaper than external ones.
   - **Short-Circuiting:** Structure `require` conditions and boolean expressions (`&&`, `||`) so that the cheaper/more likely conditions are checked first.
   - **Arithmetic:** Use `unchecked { ... }` blocks for arithmetic (Solidity >= 0.8.0) *only* when:
     1.  You are mathematically certain overflow/underflow is impossible in that context.
     2.  The gas savings are significant and necessary.
     3.  The reasoning is clearly documented with comments. **Err on the side of safety (checked arithmetic).**
   - **Optimizations:** Check `value != 0` instead of `value > 0` for `uint`. Precompute constant expressions.

---

## 3. Solidity Style Guide & Readability

   - **NatSpec Comments:** Document all contracts, interfaces, libraries, functions, events, and state variables using Ethereum Natural Language Specification (NatSpec):
     - `@title`, `@author`, `@notice` (user-facing explanation), `@dev` (developer explanation)
     - `@param` for all function parameters.
     - `@return` for all function return values.
     - `@inheritdoc` for overridden functions where appropriate.
   - **Naming Conventions:**
     - Contracts, Libraries, Interfaces, Structs, Enums: `PascalCase`
     - Functions, Modifiers, Parameters, Local/State Variables: `camelCase`
     - Constants: `UPPER_CASE_WITH_UNDERSCORES`
     - Events: `PascalCase` (should indicate the action, e.g., `Transfer`, `Approval`)
     - Internal/Private variables & functions: Prefix with an underscore (`_internalVar`, `_doSomethingInternal`).
   - **Order of Layout:** Structure contract elements consistently (follow the official Solidity Style Guide recommendations):
     1.  Pragma directives
     2.  Import directives
     3.  Interfaces, Libraries, Contracts
     4.  Type declarations (structs, enums)
     5.  State variables (Constants, Immutables, other variables grouped by purpose/visibility)
     6.  Events
     7.  Modifiers
     8.  Constructor
     9.  Receive / Fallback functions
     10. External functions
     11. Public functions
     12. Internal functions
     13. Private functions
   - **Visibility:** Explicitly declare visibility for all state variables and functions.
   - **Error Messages:** Use concise, specific error strings in `require` and `revert` statements (e.g., `require(balance >= _amount, "ERC20: insufficient balance");`). Consider custom errors (`error InsufficientBalance(uint256 requested, uint256 available);`) for gas savings and better off-chain decoding (Solidity >= 0.8.4).
   - **Formatting:** Use consistent indentation (4 spaces), line length (e.g., 120 characters max), and spacing around operators. Use tools like Prettier with a Solidity plugin.
   - **Imports:** Use specific imports (`import {Symbol} from "Contract.sol";`) rather than importing whole files (`import "Contract.sol";`).

---

**Instruction to AI:** Apply these rules rigorously when writing or refactoring Solidity code. Prioritize security above all else. Use NatSpec for documentation. Implement gas optimizations thoughtfully, ensuring they do not compromise security or readability. Explain choices related to security patterns or significant gas optimizations.