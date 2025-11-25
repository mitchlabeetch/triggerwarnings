# Trigger Warnings Extension - Project Context

## Project Overview

**Trigger Warnings** is a browser extension (Manifest V3 for Chrome, V2 adaptation for Firefox) designed to provide community-sourced and potentially real-time trigger warnings for streaming platforms. It supports major services like Netflix, Prime Video, Hulu, Disney+, Max, Peacock, and YouTube.

### Key Features
*   **Multi-Platform Support:** Abstracted `Provider` system to interface with different video players.
*   **Warning System:** Real-time monitoring of video playback to display timely warnings.
*   **Community Consensus:** Voting mechanism (up/down) for warnings to ensure accuracy.
*   **Modern UI:** Built with Svelte 4 and Tailwind CSS.
*   **Backend:** Supabase integration for storing and retrieving warnings.

## Architecture

### Directory Structure

*   **`src/background/`**: Service worker handling extension lifecycle, alarms, and cross-component messaging.
*   **`src/content/`**: Injected scripts that run on streaming sites.
    *   `providers/`: Adapters for different streaming platforms (Netflix, YouTube, etc.).
    *   `banner/` & `indicator/`: UI components injected into the video player.
    *   `consensus/`: Logic for handling user votes on warnings.
    *   `modules`: (Experimental/Advanced) `audio-analyzer`, `visual-analyzer`, `subtitle-analyzer` for local detection.
*   **`src/core/`**: Business logic shared across contexts.
    *   `warning-system/`: `WarningManager` orchestrates fetching and triggering warnings.
    *   `profiles/`: User profile management.
    *   `api/`: Interface with Supabase backend.
*   **`src/popup/`**: The main extension popup UI (Svelte).
*   **`src/options/`**: Extension settings page (Svelte).
*   **`landing/`**: Source code for the product landing page.

### Tech Stack
*   **Language:** TypeScript (Strict mode)
*   **Framework:** Svelte 4
*   **Build Tool:** Vite with `vite-plugin-web-extension`
*   **Styling:** Tailwind CSS
*   **Testing:** Vitest (Unit/Integration)

## Development Workflow

### Setup & Installation
1.  **Install Dependencies:** `npm install`
2.  **Start Dev Server:** `npm run dev` (or `npm run dev:chrome` / `npm run dev:firefox`)
    *   This will build the extension into `dist/` and watch for changes.
    *   Load the `dist/<browser>` folder as an "unpacked extension" in your browser.

### Build Commands
*   `npm run build`: Production build (defaults to Chrome).
*   `npm run build:chrome`: Build for Chrome (MV3).
*   `npm run build:firefox`: Build for Firefox (MV2).
*   `npm run build:all`: Build for all supported browsers.

### Testing & Quality
*   `npm run test`: Run unit tests via Vitest.
*   `npm run lint`: Run ESLint.
*   `npm run format`: Format code with Prettier.
*   `npm run type-check`: Run TypeScript compiler check.

## Conventions

*   **Components:** Svelte components are used for all UI.
*   **Styling:** Tailwind utility classes are preferred over custom CSS.
*   **State Management:** Svelte stores and direct class-based managers (e.g., `WarningManager`).
*   **Async/Await:** Used extensively for extension APIs and backend calls.
*   **Logging:** A custom `logger` utility is used (likely wrapping console methods).

## Key Files
*   `src/manifest/manifest.json`: Source of truth for extension configuration.
*   `src/content/index.ts`: Entry point for content scripts, initializes the `WarningManager` and `Provider`.
*   `src/core/warning-system/WarningManager.ts`: Core logic for matching warnings to playback time.
*   `vite.config.ts`: Complex build configuration, handles MV3 -> MV2 transformation for Firefox.
