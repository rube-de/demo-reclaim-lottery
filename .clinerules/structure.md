# Code Structure & Granularity Rules 

## 1. Directory and File Organization

   - **Logical Grouping:** Organize files into directories based on a clear and consistent strategy (e.g., by feature, domain concept, or technical type like `components/`, `services/`, `hooks/`, `utils/`, `types/`). Avoid overly flat structures for complex projects, but also avoid excessively deep nesting.
   - **Clear Naming:** Use descriptive, unambiguous names for both files and directories that clearly indicate their content or purpose. Follow language/framework naming conventions.
   - **Colocation (Recommended):** Where appropriate, keep closely related files together. For example, a component file, its specific styles, its dedicated tests, and perhaps component-specific hooks might reside in the same directory (`./components/UserProfile/`).
   - **Single Primary Focus per File:** Each file should ideally concentrate on a single responsibility, such as defining one component, one class, a cohesive set of related utility functions, or type definitions for a specific module. Avoid mixing unrelated logic within the same file.

## 2. File Length Guideline

   - **Conciseness:** Aim for files to be reasonably short and focused.
   - **Guideline:** Treat file length as an indicator. If a file significantly exceeds **~200-300 lines** (excluding comments, imports, and whitespace), it should trigger a review. This often indicates the file might have too many responsibilities and could potentially be split into smaller, more focused files. *This is a guideline, not a hard limit, but exceeding it requires justification or refactoring.*
   - **Internal Structure:** Within a file, use whitespace, comments, and consistent ordering (e.g., imports, constants, types, main logic, helpers) to clearly separate distinct parts.

## 3. Function / Method Granularity and Responsibility

   - **Single Responsibility Principle (SRP):** This is crucial. Every function or method must have **one primary, well-defined responsibility**. It should do one thing and do it well.
     - **Test:** You should be able to describe the function's purpose accurately in a single, concise sentence.
     - **Action:** If a function performs multiple distinct steps or has multiple reasons to change, refactor it by extracting logic into smaller, dedicated helper functions.
   - **Descriptive Naming:** Function and method names must clearly and accurately reflect their single purpose (e.g., use verb-noun pairs like `calculateTax`, `WorkspaceUserDetails`, `validateEmailFormat`).
   - **Length Guideline:** Aim for functions/methods to be very short, ideally fitting comfortably on a single screen (e.g., **under ~20-30 lines**).
     - **Rationale:** Shorter functions are easier to understand, test, and debug. Exceeding this guideline is a strong signal that the function might be violating SRP and should be refactored. *Again, this is a guideline prompting review.*

## 4. Function / Method Arguments

   - **Limit Number of Parameters:** Aim for functions/methods to have few parameters (ideally **0-3 arguments**). Functions with many parameters are harder to call, test, and understand.
   - **Use Parameter Objects:** If a function inherently requires more than 3-4 arguments, group related parameters into a dedicated object, interface, or type (e.g., `options`, `config`, `userData`). This improves call-site readability and makes function signatures more stable.
     - *Example (JS/TS):* Instead of `function plot(x, y, color, thickness, style)`, use `function plot(point, { color, thickness, style })`.
   - **Avoid Boolean Flag Arguments:** Do not use boolean flags to alter a function's core logic path significantly. This violates SRP. Instead, create separate functions with distinct names that represent each behavior.
     - *Example:* Instead of `saveFile(data, overwrite = false)`, prefer `saveFile(data)` and `saveFileAndOverwrite(data)`.

## 5. Rationale (Why these rules matter, especially for AI)

   - **Improved Testability:** Small, single-purpose functions with limited arguments and dependencies are significantly easier to unit test thoroughly.
   - **Enhanced Readability & Maintainability:** Concise files and functions are easier for humans (and AI) to read, understand, debug, and modify safely.
   - **Better AI Agent Performance:**
     - **Reduced Context:** Smaller code units fit more easily within the limited context windows of AI models, leading to more accurate analysis and generation.
     - **Clearer Intent:** Single-purpose functions make the code's intent explicit, reducing ambiguity for AI understanding.
     - **Focused Refactoring:** AI can refactor smaller units more reliably and with less risk of introducing unintended side effects.
     - **Accurate Generation:** When asked to generate code, targeting small, well-defined functions leads to more precise and correct results.

---

**Instruction to AI:** Strictly adhere to these structural and granularity guidelines when generating or refactoring code. Prioritize creating small, single-purpose functions and methods. Keep files focused and reasonably concise. Use parameter objects for functions requiring multiple inputs. Explicitly refactor code that violates these principles, explaining the reasoning based on SRP, testability, and readability. Flag code segments that significantly exceed length guidelines for review or automatic refactoring.
