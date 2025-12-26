# Development Guide

Complete guide to setting up your local development environment and contributing code to Trigger Warnings.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Workflow](#development-workflow)
4. [Project Structure](#project-structure)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Build & Deployment](#build--deployment)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
  ```bash
  node --version  # Should be v18+
  ```

- **npm**: v9.0.0 or higher (comes with Node.js)
  ```bash
  npm --version   # Should be v9+
  ```

- **Git**: Latest version ([Download](https://git-scm.com/))
  ```bash
  git --version
  ```

- **Modern Browser**: Chrome 88+, Firefox 91+, or Edge 88+

### Recommended Tools

- **VS Code**: With recommended extensions (see `.vscode/extensions.json`)
  - Svelte for VS Code
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

- **Chrome DevTools**: For debugging extension

---

## Initial Setup

### 1. Fork & Clone

```bash
# Fork on GitHub (click "Fork" button)

# Clone your fork
git clone https://github.com/YOUR_USERNAME/Trigger_Warnings.git
cd Trigger_Warnings

# Add upstream remote
git remote add upstream https://github.com/mitchlabeetch/Trigger_Warnings.git
```

### 2. Install Dependencies

```bash
npm install
```

This will:
- Install all npm packages (~500MB)
- Run post-install scripts
- Set up Git hooks (if configured)

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env (optional for local dev)
nano .env  # or your preferred editor
```

**Environment Variables:**
```bash
# Supabase (optional for local dev - uses demo instance if not set)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Debug mode (enables verbose logging)
VITE_DEBUG_LOGS=true
```

**Note**: You can develop without Supabase credentials. A demo read-only database will be used.

### 4. Build the Extension

```bash
# For Chrome (default)
npm run build:chrome

# For Firefox
npm run build:firefox

# For all browsers
npm run build:all
```

Output: `dist/chrome/`, `dist/firefox/`

### 5. Load Extension in Browser

#### Chrome / Edge / Brave

1. Open `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select `dist/chrome` folder
5. Extension appears in toolbar!

#### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on..."**
3. Navigate to `dist/firefox`
4. Select `manifest.json`
5. Extension is loaded! (temporary - removed on restart)

### 6. Verify Installation

1. Click extension icon
2. Should see popup UI
3. Navigate to Netflix (or any supported platform)
4. Extension should detect the platform

---

## Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/my-awesome-feature

# 3. Start dev server (with hot reload)
npm run dev:chrome
# or
npm run dev:firefox

# 4. Make changes to src/
# Vite will automatically rebuild

# 5. Reload extension in browser
# Chrome: Click reload icon on chrome://extensions
# Firefox: Click "Reload" in about:debugging

# 6. Test your changes
npm test              # Run unit tests
npm run lint          # Check code style
npm run type-check    # TypeScript validation

# 7. Commit your changes
git add .
git commit -m "feat: add awesome feature"

# 8. Push to your fork
git push origin feature/my-awesome-feature

# 9. Open Pull Request on GitHub
```

### Hot Reload (Development Mode)

```bash
# Start Vite dev server
npm run dev:chrome
```

**What happens:**
- Vite watches `src/` for changes
- Automatically rebuilds on save
- Output goes to `dist/chrome/`
- **You must manually reload** the extension in `chrome://extensions/`

**Pro tip**: Use Chrome's "Service worker" link to see background script logs in real-time.

### Testing Changes

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file change)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run specific test file
npx vitest src/core/profiles/ProfileManager.test.ts

# Run tests with coverage
npm run test:coverage
```

---

## Project Structure

```
Trigger_Warnings/
├── src/
│   ├── background/          # Service worker (extension lifecycle)
│   │   ├── index.ts
│   │   └── messageHandler.ts
│   ├── content/             # Injected into streaming sites
│   │   ├── index.ts         # Entry point
│   │   ├── providers/       # Platform adapters (Netflix, YouTube, etc.)
│   │   ├── banner/          # Warning banner component
│   │   ├── indicator/       # Warning indicator component
│   │   ├── overlay/         # Fullscreen overlay
│   │   └── consensus/       # Voting logic
│   ├── core/                # Shared business logic
│   │   ├── api/             # Supabase integration
│   │   ├── profiles/        # Profile management
│   │   ├── storage/         # Local storage abstraction
│   │   └── warning-system/  # WarningManager
│   ├── popup/               # Extension popup UI
│   │   ├── Popup.svelte
│   │   ├── components/
│   │   └── index.ts
│   ├── options/             # Settings page
│   │   ├── Options.svelte
│   │   ├── components/
│   │   └── index.ts
│   ├── shared/              # Types, constants, utilities
│   │   ├── types/
│   │   ├── constants/
│   │   └── utils/
│   ├── styles/              # Global CSS
│   ├── manifest/            # Extension manifest
│   └── _Detection_System/  # Experimental AI (not in build)
├── dist/                    # Build output (gitignored)
│   ├── chrome/
│   └── firefox/
├── docs/                    # Documentation
├── landing/                 # Marketing website
├── public/                  # Static assets
├── tests/                   # Test utilities
├── vite.config.ts           # Build configuration
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind CSS config
└── package.json             # Dependencies & scripts
```

### Key Directories

- **`src/content/`**: Runs on streaming platform pages. Has access to page DOM.
- **`src/background/`**: Runs in background. Manages extension lifecycle.
- **`src/popup/`**: Extension icon popup. Separate HTML page.
- **`src/options/`**: Full-page settings. Opens in new tab.
- **`src/core/`**: Shared logic between content/background/popup.
- **`src/shared/`**: TypeScript types, constants, utilities.

---

## Coding Standards

### TypeScript

**Always use strict mode:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Prefer interfaces over types:**
```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
}

// ❌ Avoid (unless union/intersection needed)
type User = {
  id: string;
  name: string;
};
```

**Use explicit return types for public APIs:**
```typescript
// ✅ Good
export async function fetchWarnings(contentId: string): Promise<Warning[]> {
  // ...
}

// ❌ Avoid
export async function fetchWarnings(contentId: string) {
  // Return type is inferred, but not explicit
}
```

### Svelte

**Always type component props:**
```svelte
<script lang="ts">
  export let warning: Warning;
  export let onDismiss: (id: string) => void;
</script>
```

**Keep logic out of templates:**
```svelte
<!-- ❌ BAD: TypeScript in template -->
<button on:click={() => handle(data as Warning)}>

<!-- ✅ GOOD: Logic in script block -->
<script lang="ts">
  function handleClick() {
    handle(data as Warning);
  }
</script>
<button on:click={handleClick}>
```

**Use Svelte stores for state:**
```typescript
// store.ts
import { writable } from 'svelte/store';

export const activeWarnings = writable<Warning[]>([]);

// Component.svelte
import { activeWarnings } from './store';

$: console.log($activeWarnings); // Auto-subscribes
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utils
  - `WarningBanner.svelte` ✅
  - `warningBanner.svelte` ❌
  - `formatTimestamp.ts` ✅

- **Variables/Functions**: camelCase
  - `getCurrentTime()` ✅
  - `GetCurrentTime()` ❌

- **Classes/Interfaces**: PascalCase
  - `WarningManager` ✅
  - `warningManager` ❌

- **Constants**: UPPER_SNAKE_CASE
  - `MAX_RETRY_DELAY` ✅
  - `maxRetryDelay` ❌

- **Private members**: Prefix with `_` or use `#`
  ```typescript
  class Manager {
    private _cache: Map<string, Warning>; // ✅
    #userId: string; // ✅ (ES2022 private fields)
  }
  ```

### Code Style

**Run Prettier before committing:**
```bash
npm run format
```

**ESLint rules:**
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

**Key rules:**
- No `any` types (use `unknown` if truly unknown)
- No unused variables/imports
- Prefer `const` over `let`
- Use template literals over string concatenation
- Always handle promise rejections

---

## Testing

### Writing Tests

**File naming:** `*.test.ts` next to the file being tested
```
src/core/profiles/ProfileManager.ts
src/core/profiles/ProfileManager.test.ts
```

**Test structure (AAA pattern):**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileManager } from './ProfileManager';

describe('ProfileManager', () => {
  let manager: ProfileManager;

  beforeEach(() => {
    // Arrange: Set up test state
    manager = new ProfileManager();
  });

  it('should create a new profile', async () => {
    // Arrange
    const profileData = { name: 'Test', enabled_categories: ['violence'] };

    // Act
    const profile = await manager.createProfile(profileData);

    // Assert
    expect(profile.id).toBeDefined();
    expect(profile.name).toBe('Test');
  });
});
```

**Mocking:**
```typescript
import { vi } from 'vitest';

// Mock a function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock a module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [] })),
    })),
  })),
}));
```

### Running Tests

```bash
# All tests
npm test

# Watch mode (re-run on change)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific file
npx vitest ProfileManager.test.ts

# UI mode (interactive)
npm run test:ui
```

---

## Debugging

### Console Logging

**Use the logger utility:**
```typescript
import { logger } from '@shared/utils/logger';

logger.info('Video detected', { title, timestamp });
logger.warn('Warning fetch failed', error);
logger.error('Critical error', error);
logger.debug('Detailed debug info', data); // Only if VITE_DEBUG_LOGS=true
```

### Browser DevTools

#### Content Script Debugging
1. Open streaming platform (e.g., Netflix)
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for `[TW Content]` logs

#### Background Script Debugging
1. Go to `chrome://extensions/`
2. Find "Trigger Warnings"
3. Click **"service worker"** link
4. DevTools opens showing background script logs

#### Popup Debugging
1. Right-click extension icon
2. Click **"Inspect popup"**
3. DevTools opens for popup page

### Breakpoints

**In VS Code:**
1. Click left of line number to set breakpoint
2. Press `F5` to start debugging
3. Attach to Chrome (requires launch.json config)

**In Browser DevTools:**
1. Open Sources tab
2. Find your script (Cmd+P / Ctrl+P to search)
3. Click line number to set breakpoint

### Network Requests

**Monitor API calls:**
1. DevTools → **Network** tab
2. Filter by `supabase.co` to see backend calls
3. Click request to see headers, payload, response

---

## Build & Deployment

### Production Build

```bash
# Build for Chrome
npm run build:chrome

# Build for Firefox
npm run build:firefox

# Build for all browsers
npm run build:all
```

**Output:**
- `dist/chrome/` – Chrome extension (MV3)
- `dist/firefox/` – Firefox extension (MV2)

### Build Optimizations

Production builds include:
- **Minification**: Code is minified for size
- **Tree-shaking**: Unused code is removed
- **Source maps**: Generated for debugging (`.map` files)

**To disable source maps** (for distribution):
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: false, // Disable for production
  },
});
```

### Creating Distribution Package

**Chrome Web Store:**
```bash
npm run build:chrome
cd dist/chrome
zip -r ../../trigger-warnings-chrome.zip .
```

**Firefox Add-ons:**
```bash
npm run build:firefox
cd dist/firefox
zip -r ../../trigger-warnings-firefox.zip .
```

---

## Common Tasks

### Adding a New Trigger Category

1. **Update types** (`src/shared/types/Warning.types.ts`):
   ```typescript
   export type TriggerType =
     | 'violence'
     | 'gore'
     | 'spiders'
     | 'my_new_trigger'; // Add here
   ```

2. **Update UI** (`src/options/Options.svelte`):
   ```svelte
   const CATEGORIES = [
     { id: 'violence', label: 'Violence' },
     { id: 'my_new_trigger', label: 'My New Trigger' }, // Add here
   ];
   ```

3. **Update database schema** (if using custom Supabase):
   ```sql
   ALTER TABLE warnings 
   ADD CONSTRAINT check_trigger_type 
   CHECK (type IN ('violence', 'gore', 'spiders', 'my_new_trigger'));
   ```

### Adding a New Streaming Provider

See [PROVIDERS.md](PROVIDERS.md) for full guide. Quick overview:

1. Create `src/content/providers/MyPlatformProvider.ts`
2. Extend `BaseProvider`
3. Implement required methods
4. Add to `ProviderFactory`
5. Update `manifest.json` with new domains

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update @supabase/supabase-js

# Update all (caution!)
npm update

# Update major versions (interactive)
npx npm-check-updates -u
npm install
```

**After updating:**
```bash
npm run type-check  # Ensure TypeScript still works
npm test            # Ensure tests still pass
npm run build       # Ensure build still works
```

---

## Troubleshooting

### Build Errors

**Error: "Module not found"**
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
```

**Error: "TypeScript errors"**
```bash
# Solution: Check types
npm run type-check
```

**Error: "Vite build failed"**
```bash
# Solution: Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

### Extension Not Loading

**Chrome: "Manifest file is invalid"**
- Check `dist/chrome/manifest.json` syntax
- Ensure all required fields are present

**Firefox: "Extension is corrupt"**
- Rebuild: `npm run build:firefox`
- Check console for errors

### Hot Reload Not Working

**Vite not rebuilding:**
```bash
# Kill all node processes
pkill -f node

# Restart dev server
npm run dev:chrome
```

**Browser not reflecting changes:**
- Hard reload: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Disable cache in DevTools (Network tab → "Disable cache")

---

## Additional Resources

- [Architecture Overview](ARCHITECTURE.md)
- [Adding Providers](PROVIDERS.md)
- [API Documentation](API.md)
- [Best Practices](../BEST_PRACTICES.md)
- [Contributing Guide](../CONTRIBUTING.md)

---

<div align="center">

**Questions?** [Open a discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions) 💬

[Back to README](../README.md)

</div>
