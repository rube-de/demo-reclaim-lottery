# Test-Driven Development (TDD) Rules

## 1. The Core TDD Cycle (Red-Green-Refactor)

   - **Mandatory Cycle:** All new functionality, feature development, or bug fixing must strictly follow the Red-Green-Refactor cycle.
   - **Step 1: RED - Write a Failing Test**
     - **Action:** Before writing *any* implementation code, write a single, small, automated test case for the smallest piece of desired functionality or requirement.
     - **Definition:** The test should clearly define *what* the code should do for a specific input or scenario.
     - **Verification:** Run the test and **verify that it fails**. It must fail for the *expected reason* (e.g., compilation error because the function/class doesn't exist, assertion failure because the wrong value is returned, specific error not thrown). If it passes, the test is not valid for driving new code (it might be testing existing functionality, or the test itself is flawed).
   - **Step 2: GREEN - Make the Test Pass**
     - **Action:** Write the **absolute minimum amount of production code** necessary to make the *currently failing test* pass.
     - **Simplicity:** Do not add any logic, features, or complexity beyond what is strictly required by the test. Focus solely on getting the bar to green. Temporary "ugly" code or hardcoding (if it passes the test) is acceptable at this stage.
     - **Verification:** Run *all* tests (or at least the relevant suite) and verify that the new test and all previously passing tests are now green.
   - **Step 3: REFACTOR - Improve the Code**
     - **Condition:** Only refactor when all tests are green.
     - **Action:** Improve the *newly added* production code (and potentially the test code) for clarity, simplicity, efficiency, and adherence to design principles and other coding standards (as defined in other `.clinerules`).
     - **Focus:** Remove duplication, improve naming, simplify logic, extract methods/functions, apply design patterns where appropriate.
     - **Safety:** Refactor in small, incremental steps. **Run all tests frequently** after each small refactoring step to ensure that no behavior (as defined by the tests) has been broken. The tests must remain green throughout and after refactoring.

---

## 2. Test Quality Standards

   - **Specificity (Single Responsibility):** Each test case should verify only one specific aspect, behavior, or requirement of the code under test. Avoid testing multiple unrelated things in a single test.
   - **Clarity and Readability:**
     - Use descriptive names for test functions/methods that clearly state what is being tested and the expected outcome (e.g., `withdraw_ShouldFail_WhenBalanceIsInsufficient`, `testCalculateTotal_WithEmptyItemsList_ReturnsZero`).
     - Structure tests clearly using patterns like Arrange-Act-Assert (AAA) or Given-When-Then (GWT).
     - Keep test code clean, simple, and easy to understand. Tests serve as living documentation.
   - **Fast Execution:** Tests must run quickly to provide rapid feedback. Unit tests, which are the primary focus of TDD, should avoid slow operations like network calls, database access, or file system I/O. Use test doubles (mocks, stubs, fakes) to isolate the code under test.
   - **Isolation and Independence:** Tests must be independent of each other. The outcome of one test must not affect any other test. Avoid shared state between tests. Ensure tests can be run in any order and produce consistent results.
   - **Repeatability:** Tests must be deterministic, producing the same result every time they are run in the same environment. Avoid dependencies on mutable external factors like current time, random numbers, or environment-specific configurations unless properly controlled within the test setup.

---

## 3. Scope and Design Considerations

   - **Focus on Unit Tests:** The primary application of the Red-Green-Refactor cycle is at the unit test level, testing individual functions, methods, or classes in isolation.
   - **Design for Testability:** Write production code that is inherently testable. This often involves:
     - Favoring pure functions (outputs depend only on inputs, no side effects).
     - Using Dependency Injection to provide dependencies instead of creating them internally.
     - Avoiding global state or singletons where possible.
     - Keeping units (functions, classes) small and focused (Single Responsibility Principle).
     *AI should proactively apply these patterns.*
   - **Test Coverage:** Aim for testing behavior and logic rather than just lines of code. TDD naturally drives high coverage of the logic being implemented. Test edge cases, boundary conditions, error handling, and invalid inputs, not just the "happy path."

---

## 4. Bug Fixing with TDD

   - **Reproduce the Bug with a Test:** When fixing a bug, the *first step* is always to write a new automated test case that specifically reproduces the bug. This test should fail in the same way the bug manifests.
   - **Follow the Cycle:** Once the failing test exists (RED), proceed to the GREEN step by writing the minimum code to fix the bug and make the test pass. Then, REFACTOR the fix and related code while ensuring all tests remain green.

---

**Instruction to AI:** Adhere strictly to the Red-Green-Refactor cycle for all code generation related to new features or bug fixes. Always start by creating a failing test. Write minimal code to pass the test, then refactor for quality while keeping tests green. Ensure generated tests meet the specified quality standards. Explain the TDD steps being taken (e.g., "Writing failing test for...", "Implementing minimal code to pass...", "Refactoring...").