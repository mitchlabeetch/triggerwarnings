# Contributing to Trigger Warnings

Thank you for your interest in contributing! 🎉 This project is built by the community, for the community. Whether you're a developer, designer, content moderator, or just someone who cares about accessibility, there's a place for you here.

## 🌟 Ways to Contribute

### 1. 🗳️ Add & Vote on Warnings (No Coding Required!)
The easiest way to contribute is through the extension itself:

- **Add warnings**: After watching content, use the extension to submit trigger warnings
- **Vote on existing warnings**: Help validate community submissions with upvotes/downvotes
- **Improve descriptions**: Suggest better timing or clearer descriptions for warnings

### 2. 🐛 Report Bugs
Found something broken? [Open an issue](https://github.com/mitchlabeetch/Trigger_Warnings/issues/new) with:
- **Clear description**: What happened vs. what you expected
- **Steps to reproduce**: How can we see the bug ourselves?
- **Environment**: Browser, OS, extension version
- **Screenshots/videos**: If applicable

### 3. 💡 Request Features
Have an idea? [Start a discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions) or open an issue with the `enhancement` label.

### 4. 💻 Code Contributions
- **Fix bugs**: Check out [good first issues](https://github.com/mitchlabeetch/Trigger_Warnings/labels/good%20first%20issue)
- **Add features**: See our [roadmap](docs/ROADMAP.md) for planned work
- **Improve performance**: Profile and optimize hot paths
- **Add tests**: Increase code coverage

### 5. 🎨 Design & UX
- **UI improvements**: Better layouts, colors, animations
- **Accessibility**: Screen reader support, keyboard navigation
- **Mockups**: Propose redesigns or new features

### 6. 📝 Documentation
- **Tutorials**: Write guides for specific use cases
- **Translations**: Help localize the extension (coming soon)
- **API docs**: Document internal APIs for developers
- **Fix typos**: Even small improvements matter!

### 7. 🧪 Testing
- **Cross-browser testing**: Test on different browsers and versions
- **Edge cases**: Try to break things (responsibly!)
- **Performance testing**: Measure impact on playback

---

## 🚀 Getting Started (Development)

### Prerequisites
- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ (comes with Node.js)
- **Git**: For version control
- **Modern browser**: Chrome, Firefox, or Edge (latest version)

### Setup Steps

1. **Fork the repository**
   - Click "Fork" button on GitHub
   - Clone your fork: `git clone https://github.com/YOUR_USERNAME/Trigger_Warnings.git`

2. **Install dependencies**
   ```bash
   cd Trigger_Warnings
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials (optional for local dev)
   ```

4. **Start development server**
   ```bash
   # Chrome
   npm run dev:chrome
   
   # Firefox
   npm run dev:firefox
   ```

5. **Load extension in browser**
   - **Chrome**: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", select `dist/chrome`
   - **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", select any file in `dist/firefox`

6. **Make changes**
   - Edit files in `src/`
   - Vite will auto-rebuild
   - Reload extension in browser to see changes

**📖 Detailed guide**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## 📋 Contribution Workflow

### 1. Pick an Issue
- Browse [open issues](https://github.com/mitchlabeetch/Trigger_Warnings/issues)
- Look for `good first issue` or `help wanted` labels
- Comment on the issue to claim it (avoids duplicate work)

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming conventions:**
- `feature/` – New features
- `fix/` – Bug fixes
- `docs/` – Documentation changes
- `refactor/` – Code improvements without changing behavior
- `test/` – Adding or fixing tests

### 3. Write Code
- **Follow existing patterns**: Match the style of surrounding code
- **Keep it small**: Aim for focused, reviewable PRs (< 500 lines when possible)
- **Add tests**: Cover new features or bug fixes
- **Update docs**: If you change behavior, update relevant docs

### 4. Test Your Changes
```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Build for production
npm run build:chrome
npm run build:firefox
```

### 5. Commit Your Changes
We use **conventional commits** for clear history:

```bash
git commit -m "feat: add support for AppleTV+"
git commit -m "fix: prevent banner from blocking video controls"
git commit -m "docs: update installation guide for Safari"
git commit -m "refactor: extract provider detection logic"
```

**Commit format**: `<type>: <description>`

**Types:**
- `feat` – New feature
- `fix` – Bug fix
- `docs` – Documentation only
- `style` – Formatting, no code change
- `refactor` – Code restructuring
- `test` – Adding tests
- `chore` – Maintenance tasks

### 6. Push and Create PR
```bash
git push origin your-branch-name
```

Then:
1. Go to GitHub and click "Create Pull Request"
2. Fill out the PR template
3. Link related issues (e.g., "Closes #123")
4. Request review from maintainers

---

## 📏 Code Style Guidelines

### TypeScript
- **Strict mode**: All code must pass `tsc --noEmit`
- **Explicit types**: Avoid `any`, prefer interfaces/types
- **Named exports**: Prefer `export function foo()` over `export default`
- **Async/await**: Use async/await over raw Promises

### Svelte
- **Logic in `<script>`**: Keep templates simple, move complex logic to script block
- **Props with types**: Always type component props
- **Stores for state**: Use Svelte stores for cross-component state
- **No TypeScript in templates**: Avoid type assertions in HTML (see [BEST_PRACTICES.md](BEST_PRACTICES.md))

### CSS/Tailwind
- **Tailwind first**: Use utility classes over custom CSS
- **Consistent spacing**: Follow Tailwind's spacing scale (4, 8, 16, 24, 32...)
- **Dark mode ready**: Consider dark mode when adding new UI

### File Structure
- **One component per file**: Each `.svelte` file should contain one component
- **Colocate related files**: Keep components, types, and tests close together
- **Barrel exports**: Use `index.ts` for public APIs

---

## 🧪 Testing Guidelines

### Unit Tests
- **Test pure logic**: Focus on business logic, not UI
- **Mock external APIs**: Use vitest mocks for browser APIs
- **Arrange-Act-Assert**: Follow AAA pattern for clarity

```typescript
// Example test
describe('WarningManager', () => {
  it('should filter warnings by time range', () => {
    // Arrange
    const warnings = [/* ... */];
    const manager = new WarningManager(warnings);
    
    // Act
    const filtered = manager.getWarningsInRange(0, 10);
    
    // Assert
    expect(filtered).toHaveLength(2);
  });
});
```

### Integration Tests
- **Test component interactions**: Verify components work together
- **Use testing library**: Prefer `@testing-library/svelte` for Svelte components
- **Real-ish environment**: Mock minimally, test close to production

### Manual Testing
Before submitting a PR:
- [ ] Test on target streaming platform(s)
- [ ] Verify warnings display correctly
- [ ] Check for console errors
- [ ] Test on different screen sizes (if UI change)
- [ ] Verify no performance regressions

---

## 🔍 Code Review Process

### What Reviewers Look For
- **Correctness**: Does it work as intended?
- **Style**: Follows project conventions?
- **Tests**: Are new features/fixes covered?
- **Performance**: No unnecessary re-renders or blocking calls?
- **Security**: No XSS, injection, or privacy issues?
- **Accessibility**: Keyboard navigable, screen reader friendly?

### Review Timeline
- **Initial review**: Within 2-3 days
- **Follow-up reviews**: Within 1-2 days after updates
- **Merging**: Once approved by a maintainer

### Addressing Feedback
- Be open to suggestions—we're all learning!
- Ask questions if something is unclear
- Push new commits to your PR branch (don't force push)
- Resolve conversations after addressing feedback

---

## 🏷️ Adding New Streaming Providers

Want to add support for a new platform? See [docs/PROVIDERS.md](docs/PROVIDERS.md) for a detailed guide.

**Quick checklist:**
1. Create a new provider class extending `BaseProvider`
2. Implement video detection and time-tracking methods
3. Add content script match patterns to `manifest.json`
4. Register provider in `ProviderFactory`
5. Test on the actual platform
6. Update documentation

---

## 🌍 Internationalization (Coming Soon)

We plan to support multiple languages! If you're interested in translating:
- Watch this space for i18n setup instructions
- Languages we need: Spanish, French, German, Japanese, Korean, Portuguese, etc.
- Join the discussion: [#i18n](https://github.com/mitchlabeetch/Trigger_Warnings/discussions)

---

## 📄 Documentation Standards

When writing docs:
- **Use clear headings**: H2 for sections, H3 for subsections
- **Code examples**: Show, don't just tell
- **Screenshots**: Include for UI changes or complex setups
- **Keep it updated**: Update docs when code behavior changes
- **Friendly tone**: Write for humans, not robots

---

## ❓ Questions?

- **General questions**: [Open a discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions)
- **Bug reports**: [Open an issue](https://github.com/mitchlabeetch/Trigger_Warnings/issues)
- **Security issues**: Email security@triggerwarnings.app (coming soon) or see [SECURITY.md](SECURITY.md)
- **Development help**: Ask in your PR or issue, maintainers are happy to help!

---

## 🎉 Recognition

Contributors will be:
- Listed in the GitHub contributors page
- Mentioned in release notes (for significant contributions)
- Added to a CONTRIBUTORS.md file (coming soon)

We appreciate every contribution, big or small! 🙏

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Thank you for making the web more accessible!** ❤️

</div>
