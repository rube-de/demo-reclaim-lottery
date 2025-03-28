# General Clean Structure and Architecture Rules

## Core Principles

### 1. Modularity and Separation of Concerns (SoC)
   - **Goal:** Break down the system into distinct, manageable units with single, well-defined responsibilities.
   - **Action:**
     - Organize code into logical modules, components, classes, or functions based on functionality or domain concepts.
     - Ensure **High Cohesion:** Elements within a module should be closely related and work together to fulfill the module's specific responsibility.
     - Ensure **Low Coupling:** Minimize dependencies between modules. Modules should interact through well-defined, stable interfaces or contracts.
     - **Example Concerns to Separate:** User Interface (UI), Business Logic (Domain), Data Access (Persistence), Application Logic (Orchestration), Configuration, Cross-Cutting Concerns (Logging, Authentication).

### 2. Readability and Clarity
   - **Goal:** Code should be easy for humans to read and understand.
   - **Action:**
     - **Descriptive Naming:** Use clear, intention-revealing names for variables, functions, classes, modules, etc. Avoid ambiguity and abbreviations unless widely understood in the context.
     - **Consistent Formatting:** Adhere to standard formatting conventions for the language/project. Use automated formatters (like Prettier, Black, gofmt) where possible.
     - **Minimal Complexity:** Write simple, straightforward code. Avoid overly nested structures or complex conditional logic where simpler alternatives exist.
     - **Meaningful Comments:** Explain the *why* behind non-obvious code, complex algorithms, or important design decisions. Do not comment on the *what* if the code itself is clear.

### 3. Simplicity (KISS - Keep It Simple, Stupid)
   - **Goal:** Avoid unnecessary complexity in design and implementation.
   - **Action:**
     - Prefer the simplest solution that effectively solves the problem.
     - Avoid over-engineering or adding features/abstractions "just in case."
     - Refactor complex code blocks into smaller, more understandable units.

### 4. Reusability (DRY - Don't Repeat Yourself)
   - **Goal:** Avoid duplication of code, knowledge, or logic.
   - **Action:**
     - Identify repeated code blocks or logic and abstract them into reusable functions, methods, classes, or components.
     - Use configuration and parameters to handle variations instead of duplicating similar code structures.
     - Leverage existing, well-tested libraries and frameworks where appropriate.

### 5. Maintainability and Testability
   - **Goal:** Code should be easy to modify, debug, and test.
   - **Action:**
     - **Design for Change:** Structure code anticipating future changes (related to Low Coupling and SoC).
     - **Clear Interfaces:** Define clear boundaries and contracts between components.
     - **Testable Units:** Write code in units (functions, classes) that can be easily tested in isolation. Minimize side effects and dependencies on global state. Consider patterns like Dependency Injection to facilitate testing.
     - **Robust Error Handling:** Implement clear and consistent error handling strategies. Errors should be logged appropriately and handled gracefully.

### 6. Consistency
   - **Goal:** The codebase should follow uniform patterns and styles.
   - **Action:**
     - Apply chosen architectural patterns (e.g., Layered, MVC), design patterns, and coding conventions consistently across the project.
     - Maintain consistency in naming, formatting, error handling, logging, and commenting.

---

## Common Architectural Patterns Awareness

- **Layered Architecture:** Structure the application in horizontal layers (e.g., Presentation, Application, Domain, Infrastructure/Persistence). Dependencies should typically flow downwards.
- **MVC/MVP/MVVM:** Patterns primarily for structuring applications with UIs, separating concerns related to data (Model), display (View), and user input/logic (Controller/Presenter/ViewModel).
- **Microservices/Service-Oriented Architecture (SOA):** Break down the application into smaller, independent services that communicate over a network. (Consider complexity trade-offs).
- **Event-Driven Architecture:** Components communicate asynchronously via events, promoting loose coupling.

**Instruction to AI:** When generating or refactoring code, prioritize adherence to these principles. Explain design choices that relate to these rules, especially when creating new modules or defining interfaces. If existing code violates these principles significantly, suggest refactoring options.