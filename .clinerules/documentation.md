# General Documentation and README Rules

## 1. General Documentation Principles

   - **Audience Awareness:** Identify the intended audience (e.g., end-users, developers using a library, contributors, operations) and tailor the language, technical depth, and examples accordingly.
   - **Clarity and Conciseness:** Use clear, unambiguous language. Avoid unnecessary jargon or explain it upon first use. Be direct and get to the point. Use formatting (lists, headings) to improve readability.
   - **Accuracy:** Ensure all information, including installation steps, code examples, configuration parameters, and API descriptions, is correct and reflects the current state of the project. Incorrect documentation is worse than no documentation.
   - **Maintainability:** Documentation should be treated as code – kept up-to-date as the project evolves. Instructions or examples that become outdated must be corrected promptly. *AI should note areas likely to change and suggest adding comments or markers for future updates.*
   - **Completeness:** Provide sufficient information for the target audience to successfully install, configure, use, and (if applicable) contribute to the project. Anticipate common questions or points of confusion.
   - **Findability:** Organize documentation logically. Use clear headings, potentially a table of contents for longer documents, and cross-links where relevant (e.g., linking from README to more detailed guides).
   - **Working Code Examples:** Provide practical, minimal, and runnable code examples to illustrate usage, configuration, or API calls. Ensure examples are well-explained and correctly formatted (see Formatting section).

---

## 2. README.md: Structure and Content

   - **Purpose:** The `README.md` file is the primary entry point and "front page" of the project. It must quickly convey what the project is, its value, and how to get started.
   - **Location:** The file must be named `README.md` and located in the root directory of the project repository.
   - **Essential Sections:** Ensure the README includes the following sections, adapting as necessary for the specific project type:
     1.  **Project Title:** A clear H1 heading (`# Project Title`).
     2.  **Badges (Optional but Recommended):** Place near the top. Include relevant badges for build status (CI/CD), code coverage, package version (npm, PyPI), license, etc.
     3.  **Description/Introduction:**
         -   A brief (1-3 sentences) tagline or summary clearly stating what the project is and does.
         -   A more detailed paragraph expanding on the purpose, the problem it solves, and its key benefits.
     4.  **Table of Contents (Recommended for long READMEs):** An auto-generated or manually created TOC linking to major sections for easy navigation.
     5.  **Installation:**
         -   Clear, step-by-step instructions.
         -   List prerequisites (e.g., Node.js version, Python version, OS requirements).
         -   Provide exact commands for common package managers (`npm install project`, `pip install project`, `go get ...`, etc.). Include instructions for building from source if applicable.
     6.  **Usage / Getting Started:**
         -   A minimal working example demonstrating the core functionality.
         -   Include necessary code snippets (properly formatted).
         -   Explain the example clearly.
         -   Link to more detailed examples, tutorials, or API documentation if available.
     7.  **Configuration (If Applicable):**
         -   Explain how to configure the project (e.g., environment variables, configuration files).
         -   Provide examples of configuration settings and explain key options.
     8.  **Features (Optional but helpful):** A bulleted list highlighting the main features or capabilities.
     9.  **API Overview (Optional):** If the project exposes an API (library or service), provide a very high-level overview or link prominently to the full API documentation. Avoid duplicating extensive API docs in the README.
     10. **Running Tests (If Applicable):** Instructions on how developers can run the project's test suite. Specify commands and any required setup.
     11. **Contributing:**
         -   Encourage contributions.
         -   Briefly outline the process (e.g., fork, branch, commit, PR).
         -   **Link prominently to `CONTRIBUTING.md`** if it exists (highly recommended for non-trivial projects). Do not duplicate detailed contribution guidelines here.
     12. **License:**
         -   State the project's license clearly (e.g., "This project is licensed under the MIT License.").
         -   **Link prominently to the `LICENSE` file** in the repository root.
     13. **Support / Contact (Optional):** Information on how to get help, report issues (link to issue tracker), or contact the maintainers.
     14. **Acknowledgements (Optional):** Give credit to inspirations, key dependencies, or contributors if desired.

---

## 3. Other Key Documentation Files

   - **`LICENSE`:** Ensure a `LICENSE` file exists in the root directory containing the full text of the chosen license. The README must reference this file. *AI should prompt for license choice if missing.*
   - **`CONTRIBUTING.md`:** For projects welcoming contributions, create a `CONTRIBUTING.md` file detailing coding standards, development setup, testing procedures, pull request guidelines, and Code of Conduct. Link to this from the README.
   - **`CHANGELOG.md`:** Recommend maintaining a `CHANGELOG.md` file to document notable changes, features, bug fixes, and breaking changes for each version/release.
   - **Code Comments:** Remind the AI that good documentation also includes inline code comments explaining the *why* behind complex or non-obvious code sections, complementing external documentation.

---

## 4. Formatting and Style (Markdown)

   - **Standard Markdown:** Use GitHub Flavored Markdown (GFM) or standard Markdown syntax correctly and consistently.
   - **Headings:** Structure the document logically using headings (`#`, `##`, `###`, etc.). Use sentence case or title case consistently for headings.
   - **Code Blocks:** Use fenced code blocks (```) with appropriate language identifiers (e.g., ```javascript, ```python, ```bash) for syntax highlighting. Keep code examples concise and focused.
   - **Lists:** Use bullet points (`-`, `*`) or numbered lists (`1.`) for sequences or enumerations.
   - **Emphasis:** Use **bold** for strong emphasis (e.g., UI elements, key terms) and *italic* for mild emphasis or definitions. Use `inline code` formatting for variable names, file names, commands, or code snippets within text.
   - **Links:** Use descriptive link text: `[Contribution Guidelines](CONTRIBUTING.md)` instead of `Click [here](CONTRIBUTING.md)`. Ensure links are valid.
   - **Images/Screenshots:** Use sparingly but effectively (e.g., for UI examples, diagrams). Provide descriptive alt text. Store images within the repository (e.g., in an `assets` or `docs/images` folder).
   - **Diagrams:** Use Mermaid for all diagrams.
   - **Tone:** Maintain a professional, clear, helpful, and welcoming tone.

---

**Instruction to AI:** Generate documentation, especially README files, following these structure and content guidelines. Ensure accuracy and clarity. Use appropriate Markdown formatting. When creating a new README, prompt for necessary project-specific details (like title, description, language, installation method, license) if not provided. Link related documentation files (`LICENSE`, `CONTRIBUTING.md`) where appropriate.