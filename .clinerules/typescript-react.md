# Frontend Development Rules: TypeScript & React

**Assume TypeScript `strict: true` mode is enabled.**

## 1. Component Design & Structure

   - **Functional Components & Hooks:** Strongly prefer functional components with Hooks over class components for all new code.
   - **Single Responsibility Principle (SRP):** Keep components small and focused. Each component should ideally do one thing well (e.g., display data, handle user input for a specific form section). Extract complex logic or sub-sections into separate components.
   - **Naming Conventions:**
     - Component files and function names: `PascalCase` (e.g., `UserProfile.tsx`, `function UserProfile(...)`).
     - Non-component files/functions/variables: `camelCase` (e.g., `useAuth.ts`, `WorkspaceUserData`, `isLoading`).
   - **File Organization:**
     - Place components in a dedicated `components/` directory, possibly nested by feature or type (e.g., `components/ui/`, `components/feature/`).
     - Colocate closely related files (e.g., component, its specific hooks, styles, tests) in a single folder if preferred (`components/UserProfile/index.tsx`, `components/UserProfile/UserProfile.module.css`).
     - Use `index.ts` files primarily for exporting the public interface of a directory/module, not for component definitions themselves.
   - **Composition over Inheritance:** Use component composition to share UI and behavior rather than inheritance patterns.

## 2. TypeScript Usage

   - **Strong Typing:** TYPE EVERYTHING. Avoid using `any` unless absolutely necessary and provide a comment explaining why.
     - **Props:** Define explicit `interface` or `type` aliases for component props. Use `PascalCase` for prop type names (e.g., `interface UserProfileProps { ... }`). Be precise with types (use `| undefined`, union types, enums).
     - **State:** Use generics with `useState` for non-primitive types: `useState<User | null>(null)`. Define types for `useReducer` state and actions.
     - **Functions:** Type all function parameters and return values.
     - **API Data:** Define interfaces/types for API request payloads and response data structures.
     - **Event Handlers:** Use React's specific event types (e.g., `React.ChangeEvent<HTMLInputElement>`, `React.MouseEvent<HTMLButtonElement>`, `React.FormEvent<HTMLFormElement>`).
   - **Utility Types:** Leverage TypeScript utility types (`Partial`, `Omit`, `Pick`, `Readonly`, `ReturnType`, etc.) where appropriate to create related types without duplication.
   - **Enums/String Literal Unions:** Prefer string literal unions (e.g., `type Status = 'loading' | 'success' | 'error'`) or `const` assertions over numeric enums for clarity, especially for props or state values. Use `enum` for related numeric constants if appropriate.

## 3. Props Handling

   - **Destructuring:** Destructure props in the function signature for clarity and easy access: `const MyComponent = ({ userId, isActive }: MyComponentProps) => { ... }`.
   - **Immutability:** Treat props as immutable within the component. Do not reassign them.
   - **Avoid Prop Drilling:** For state shared across multiple levels, avoid passing props down manually through many intermediate components. Use `useContext` or a dedicated state management solution instead.

## 4. State Management

   - **Local State:** Use `useState` for simple, component-local state (e.g., form input values, toggle states).
   - **Complex Local State:** Use `useReducer` for more complex state logic within a component or closely related components, especially when the next state depends on the previous one or involves multiple sub-values.
   - **Cross-Component State (Context API):** Use `useContext` for sharing state that doesn't change frequently or involves simple updates (e.g., theme, user authentication status) across different parts of the component tree. Define clear context provider structures and types.
   - **Global/App State:** For complex, frequently updated, or widely shared application state (e.g., data cache, complex session info), consider using a dedicated state management library (like Zustand, Redux Toolkit, Jotai). Follow the chosen library's best practices consistently. *AI should ask if a specific library is preferred or make a sensible suggestion if none is specified.*

## 5. Hooks

   - **Rules of Hooks:** Adhere strictly to the Rules of Hooks (call at the top level, only from React functions or custom hooks).
   - **Custom Hooks:** Extract reusable stateful logic (including side effects like data fetching) into custom hooks (named `useSomething`). Custom hooks improve reusability, testability, and component clarity.
   - **`useEffect`:**
     - Use for side effects (API calls, subscriptions, direct DOM manipulation).
     - Provide a specific dependency array. Omitting it causes the effect to run on every render; an empty array (`[]`) runs it only on mount.
     - Include all values from the component scope (props, state, functions) that are used inside the effect and could change over time in the dependency array. Use `eslint-plugin-react-hooks` to help enforce this.
     - Return a cleanup function from `useEffect` if the effect sets up subscriptions or listeners to prevent memory leaks.
     - Avoid using `useEffect` for calculations based purely on props or state; compute derived state directly during rendering.
   - **Optimization Hooks (`useCallback`, `useMemo`, `React.memo`):**
     - Use these *sparingly* and only when necessary to optimize performance, typically based on profiling results. Premature optimization can add complexity.
     - Use `useCallback` to memoize functions passed down to optimized child components (`React.memo`).
     - Use `useMemo` to memoize expensive calculations.
     - Wrap components in `React.memo` to prevent re-renders if their props haven't changed (useful for components rendering complex lists or visualizations). *AI should state the reason if applying these optimizations.*

## 6. JSX and Rendering

   - **Readability:** Keep JSX clean. Extract complex conditional logic or mapping operations into variables or helper functions above the return statement.
   - **Keys:** Always provide stable, unique `key` props (e.g., `item.id`) when rendering lists of elements. Avoid using array indices as keys if the list can be reordered, added to, or filtered.
   - **Conditional Rendering:** Use clear and concise patterns like `&&`, ternary operators (`condition ? <A /> : <B />`), or map lookups. Avoid overly nested ternaries.
   - **Fragments:** Use Fragments (`<></>`) when you need to return multiple elements without adding an extra node to the DOM.

## 7. Styling

   - **Consistency:** Follow the project's established styling approach consistently (e.g., CSS Modules, Styled Components, Emotion, Tailwind CSS, plain CSS/Sass). *AI should ask for the preferred method if not obvious.*
   - **Colocation:** If using CSS Modules or Styled Components defined in separate files, keep the style file close to the component file (e.g., `Button.tsx` and `Button.module.css` or `Button.styles.ts`).
   - **Scoped Styles:** Prefer styling solutions that scope styles locally to the component (like CSS Modules, Styled Components) to avoid global namespace collisions.

## 8. API Interaction

   - **Abstraction:** Abstract data fetching logic into custom hooks (e.g., `useFetchData`) or dedicated service/API modules. Components should ideally call these hooks/functions rather than containing raw `Workspace` or `axios` calls.
   - **Typing:** Use the defined TypeScript types for API request/response handling.
   - **State Handling:** Clearly manage and display loading, error, and success states related to API calls in the UI.

## 9. Accessibility (a11y)

   - **Semantic HTML:** Use appropriate HTML5 elements (`<nav>`, `<main>`, `<aside>`, `<article>`, `<button>`, etc.).
   - **Attributes:** Provide `alt` text for images (`<img>`). Use `htmlFor` on `<label>` elements.
   - **Keyboard Navigation:** Ensure all interactive elements are focusable and operable via keyboard.
   - **ARIA:** Use ARIA attributes (`role`, `aria-*`) when semantic HTML is insufficient to convey meaning or state, but prefer native elements first.

---

**Instruction to AI:** Apply these rules when generating or refactoring React/TypeScript code. Prioritize type safety, component composition, and clear state management. Use descriptive names and adhere to conventions. Explain choices related to state management, hooks, or optimizations.