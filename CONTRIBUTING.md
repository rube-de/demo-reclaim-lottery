# Contributing to the Decentralized Lottery Project

Thank you for your interest in contributing! We welcome improvements and bug fixes. Please follow these guidelines to ensure a smooth process.

## Getting Started

1.  **Fork the Repository:** Create your own fork of the project repository.
2.  **Clone Your Fork:** Clone your forked repository to your local machine.
3.  **Install Dependencies:** Follow the installation instructions in the relevant `README.md` files (root and `backend/`).
4.  **Create a Branch:** Create a new branch for your feature or bug fix:
    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b fix/issue-description
    ```

## Development Process

*   **Test-Driven Development (TDD):** This project aims to follow TDD principles, especially for the smart contract code (`backend/`). Please write failing tests *before* implementing new features or fixing bugs. Ensure all tests pass before submitting a pull request. Refer to the `backend/README.md` for specific instructions on running tests, including handling Sapphire network differences.
*   **Coding Standards:**
    *   **Solidity:** Adhere to the official Solidity Style Guide, general secure development practices (like Checks-Effects-Interactions), and Oasis Sapphire best practices when applicable. Use NatSpec for documentation.
    *   **TypeScript/JavaScript:** Follow standard TypeScript/JavaScript best practices and the formatting rules defined by Prettier (`.prettierrc.cjs`).
    *   **General:** Adhere to general principles of clean code, such as modularity, readability, and maintainability (e.g., Single Responsibility Principle, DRY).
*   **Commit Messages:** Write clear and concise commit messages explaining the purpose of your changes.

## Submitting Changes

1.  **Lint and Format:** Ensure your code passes any linting checks and is formatted correctly using Prettier (`pnpm run format` or similar, if configured).
2.  **Test:** Make sure all tests pass in the relevant environments (e.g., Hardhat local, potentially Sapphire localnet for backend changes).
3.  **Push:** Push your changes to your forked repository.
4.  **Create a Pull Request (PR):** Open a pull request from your branch to the main branch of the original repository.
    *   Provide a clear title and description for your PR, explaining the changes and referencing any related issues.
    *   Ensure your PR addresses only one specific feature or bug fix.

## Reporting Bugs

If you find a bug, please open an issue on the project's issue tracker (if available). Provide detailed steps to reproduce the bug, including:

*   Your environment (OS, Node version, etc.)
*   The steps you took.
*   What you expected to happen.
*   What actually happened (including error messages or logs).

## Code of Conduct

Please note that this project may be subject to a Code of Conduct. Participants are expected to follow it in all interactions. (Link to Code of Conduct if one exists).

Thank you for contributing!
