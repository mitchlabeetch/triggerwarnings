# Best Practices & Post-Mortem: Trigger Warnings Extension

## 🚨 The "Empty Popup" Incident: Root Cause Analysis

**The Issue:**
The extension's Popup and Options pages were rendering as empty white screens or getting stuck indefinitely on a "Loading..." state, despite no obvious errors in the console during development builds.

**The Root Cause:**
The failure was caused by a combination of **TypeScript syntax incompatibility in Svelte templates** and **initialization race conditions**.

1.  **TypeScript inside HTML:**
    *   **The Bug:** We used TypeScript type assertions inside Svelte template markup, e.g., `on:click={() => handle(data as Profile)}`.
    *   **The Result:** The Svelte compiler/preprocessor failed to parse this syntax correctly during the production build. Unlike `.ts` files, Svelte templates are not always fully TS-compatible in all configurations. This resulted in broken JavaScript bundles that crashed silently or failed to execute the component mounting logic.

2.  **Blocking Initialization:**
    *   **The Bug:** The component state initialized with `let loading = true` and waited for an asynchronous `loadData()` call to complete before rendering *anything*.
    *   **The Result:** If the background script was asleep, busy, or the `webextension-polyfill` message bridge failed (common in MV3), the `await` would hang forever. The user saw nothing but a spinner (or blank screen), and because the UI was blocked, no error messages could be displayed.

---

## 🛠️ Best Practices for Extension Development

### 1. Svelte + TypeScript Hygiene
**Rule:** **Keep logic out of the template.**
The Svelte template syntax (HTML) should be as simple as possible. Move complex logic, and *especially* TypeScript assertions, into the `<script>` block.

*   **❌ BAD:**
    ```svelte
    <button on:click={() => update(data as MyType)}>Click</button>
    ```
*   **✅ GOOD:**
    ```svelte
    <script lang="ts">
      function handleClick() {
        update(data as MyType);
      }
    </script>
    <button on:click={handleClick}>Click</button>
    ```

### 2. "Render First, Fetch Later"
**Rule:** **Never block the initial UI render on async data.**
Extensions must feel instant. A user clicking the popup icon expects immediate feedback.

*   **❌ BAD:**
    ```typescript
    let loading = true;
    onMount(async () => {
      data = await fetchData(); // If this hangs, UI is dead
      loading = false;
    });
    ```
*   **✅ GOOD:**
    ```typescript
    let loading = false; // Render UI immediately (skeleton or default state)
    onMount(() => {
      // Fire-and-forget fetch
      loadData(); 
    });
    ```

### 3. Robust Messaging & Polyfills
**Rule:** **Trust, but verify (and have a backup).**
The `webextension-polyfill` (`browser.*`) is great, but it can add overhead or fail in specific contexts (like before the background worker is fully woke).

*   **Pattern:** Prefer the standard `chrome.*` API for critical initialization calls, or wrap polyfill calls in a timeout race.
    ```typescript
    const timeout = new Promise((_, reject) => setTimeout(() => reject('Timeout'), 2000));
    
    // Race the fetch against a timeout to prevent infinite hanging
    await Promise.race([fetchData(), timeout]).catch(handleError);
    ```

### 4. Visual Error Boundaries
**Rule:** **Always fail loudly and visibly.**
In an extension popup, `console.log` is often hidden unless the user explicitly inspects the popup. UI-based error reporting is essential.

*   **Implementation:**
    *   Add a `window.onerror` handler in your entry point (`index.ts`) that writes errors to the DOM.
    *   If initialization fails, replace the app root with a red error box containing the stack trace. This turns a "mystery blank screen" into an actionable bug report.

### 5. Build Configuration Safety
**Rule:** **Validate imports and regex.**
*   **Dynamic Imports:** Use `await import('./App.svelte')` in your entry point. This isolates component crashes from the bootstrapping logic, ensuring your error handlers still run.
*   **Regex:** Avoid regex literals with complex escaping (e.g., `/\/watch\//`) in Svelte files if you encounter build errors. Use `new RegExp('watch/')` for safety.

## 🚀 Summary checklist for Future Features

- [ ] Is logic separated from the template?
- [ ] Does the UI render immediately (no `await` before render)?
- [ ] Is there a timeout/failsafe for all message passing?
- [ ] Is there a visible error state if data loading fails?
- [ ] Are TypeScript assertions (`as Type`) restricted to the `<script>` block?
