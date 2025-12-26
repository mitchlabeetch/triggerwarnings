# 🛡️ Trigger Warnings

> **Watch with confidence.** Community-powered, AI-enhanced trigger warnings for your favorite streaming platforms.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/mitchlabeetch/Trigger_Warnings/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🌟 What is Trigger Warnings?

**Trigger Warnings** is a free, open-source browser extension that provides **real-time, community-sourced trigger warnings** for streaming platforms like Netflix, Hulu, Disney+, Prime Video, YouTube, and more. Whether you're sensitive to violence, medical imagery, spiders, or other potentially distressing content, this extension gives you advance notice—so you can watch with peace of mind.

### 🎯 Our Mission

Make streaming accessible and comfortable for everyone by:
- 🤝 **Community-driven**: Warnings created and validated by real people who care
- 🤖 **AI-powered**: Local computer vision models detect triggers automatically (experimental)
- 🎨 **Fully customizable**: Choose which warnings matter to you
- 🆓 **Free forever**: No paywalls, no subscriptions, no tracking
- 🔓 **Open source**: Built by the community, for the community

---

## ✨ Features

### 🎬 Multi-Platform Support
Works seamlessly across major streaming services:
- **Netflix** – Full support with real-time warnings
- **Prime Video** – Amazon's streaming library
- **Hulu** – All your favorite shows
- **Disney+** – Family-friendly with custom warnings
- **Max (HBO Max)** – Premium content
- **Peacock** – NBC's streaming platform
- **YouTube** – Community-sourced video warnings

### ⚡ Real-Time Warning System
- **Pre-watch summaries**: See all warnings before you start
- **Live indicators**: Discrete on-screen alerts during playback
- **Customizable timing**: Warnings appear exactly when you need them
- **Skip ahead option**: Jump past triggering scenes instantly

### 🗳️ Community Consensus
- **Democratic voting**: Upvote/downvote warnings for accuracy
- **Quality control**: Bad warnings get filtered out automatically
- **Contribution system**: Add warnings for content you've watched
- **Transparent moderation**: Community-driven guidelines

### 🧠 Local AI Detection (Experimental)
- **Computer vision models**: TensorFlow.js-powered detection
- **Privacy-first**: All processing happens on your device
- **Audio analysis**: Detects auditory triggers (e.g., retching sounds)
- **Visual recognition**: Identifies spiders, medical imagery, and more
- **No data leaves your browser**: Your viewing history stays private

### 🎨 Fully Customizable
- **Trigger profiles**: Multiple sensitivity profiles (work-safe, full warnings, etc.)
- **Category selection**: Enable only the warnings you need
- **Visual customization**: Adjust indicator size, position, and style
- **Notification preferences**: Choose how you want to be alerted

---

## 🚀 Quick Start

### Installation

#### Chrome / Edge / Brave
1. Visit the [Chrome Web Store](#) *(coming soon)*
2. Click "Add to Chrome"
3. Click the extension icon and configure your preferences

#### Firefox
1. Visit [Firefox Add-ons](#) *(coming soon)*
2. Click "Add to Firefox"
3. Configure your trigger preferences

#### Manual Installation (Development)
```bash
# Clone the repository
git clone https://github.com/mitchlabeetch/Trigger_Warnings.git
cd Trigger_Warnings

# Install dependencies
npm install

# Build for Chrome
npm run build:chrome

# Build for Firefox
npm run build:firefox
```

Then load the `dist/chrome` or `dist/firefox` folder as an unpacked extension in your browser.

**📖 Detailed instructions**: See [docs/INSTALLATION.md](docs/INSTALLATION.md)

---

## 📚 Documentation

### For Users
- **[User Guide](docs/USER_GUIDE.md)** – How to use the extension effectively
- **[Installation Guide](docs/INSTALLATION.md)** – Platform-specific setup instructions
- **[FAQ](docs/FAQ.md)** – Answers to common questions

### For Developers
- **[Contributing Guide](CONTRIBUTING.md)** – How to contribute to the project
- **[Architecture Overview](docs/ARCHITECTURE.md)** – System design and components
- **[Development Setup](docs/DEVELOPMENT.md)** – Local development workflow
- **[API Documentation](docs/API.md)** – Backend integration guide
- **[Adding Providers](docs/PROVIDERS.md)** – Support new streaming platforms

### Advanced Topics
- **[Computer Vision](docs/COMPUTER_VISION.md)** – AI/ML detection system
- **[Community Moderation](docs/COMMUNITY_MODERATION.md)** – Voting and consensus
- **[Roadmap](docs/ROADMAP.md)** – Future features and plans

---

## 🤝 Contributing

We welcome contributions from developers, designers, writers, and community moderators! Whether you want to:
- 🐛 Fix bugs or improve code
- 🎨 Design better UI/UX
- 📝 Write documentation or translations
- 🗳️ Add trigger warnings for content
- 🧪 Test on different platforms

**Please read our [Contributing Guide](CONTRIBUTING.md) to get started.**

### Ways to Contribute
1. **Add warnings**: Use the extension to tag triggers in shows you've watched
2. **Vote on accuracy**: Help validate community-submitted warnings
3. **Report issues**: Found a bug? [Open an issue](https://github.com/mitchlabeetch/Trigger_Warnings/issues)
4. **Code contributions**: Check out our [good first issues](https://github.com/mitchlabeetch/Trigger_Warnings/labels/good%20first%20issue)
5. **Translate**: Help make the extension accessible in more languages

---

## 🛠️ Technology Stack

- **Frontend**: TypeScript, Svelte 4, Tailwind CSS
- **Build**: Vite, vite-plugin-web-extension
- **Backend**: Supabase (PostgreSQL, real-time subscriptions)
- **AI/ML**: TensorFlow.js, Transformers.js, CLIP models
- **Testing**: Vitest, ESLint, Prettier
- **Browser APIs**: Manifest V3 (Chrome), Manifest V2 (Firefox)

---

## 🔒 Privacy & Security

- **No tracking**: We don't collect browsing history or personal data
- **Local processing**: AI detection runs entirely in your browser
- **Open source**: Audit our code anytime—transparency first
- **Secure backend**: Supabase with row-level security policies
- **Anonymous voting**: No personal info required to contribute warnings

**Read more**: [SECURITY.md](SECURITY.md)

---

## 📊 Roadmap

### Current Status: **Work in Progress (v2.0.0)**

#### ✅ Completed
- [x] Multi-platform provider system
- [x] Real-time warning display
- [x] Community voting mechanism
- [x] Basic UI/UX with Svelte
- [x] Supabase integration

#### 🚧 In Progress
- [ ] Computer vision detection (audio + visual)
- [ ] Enhanced trigger categories
- [ ] Mobile browser support
- [ ] Localization (i18n)

#### 🔮 Planned Features
- [ ] User reputation system
- [ ] Content creator partnerships
- [ ] API for third-party integrations
- [ ] Browser-native notifications
- [ ] Advanced filtering (by episode, season, etc.)

**Full roadmap**: [docs/ROADMAP.md](docs/ROADMAP.md)

---

## 📜 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

**TL;DR**: You can use, modify, and distribute this software freely. Just include the original license and copyright notice.

---

## 🙏 Acknowledgments

- **Contributors**: Thank you to everyone who has submitted warnings, voted, or contributed code
- **Streaming platforms**: For providing content that brings people together
- **Open-source community**: Built on the shoulders of giants (Svelte, Vite, Supabase, TensorFlow.js)
- **Accessibility advocates**: For inspiring this project and making the web more inclusive

---

## 💬 Community & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/mitchlabeetch/Trigger_Warnings/issues)
- **Discussions**: [Join conversations](https://github.com/mitchlabeetch/Trigger_Warnings/discussions)
- **Email**: support@triggerwarnings.app *(coming soon)*

---

## ⚠️ Disclaimer

This extension is a **community effort** and may not catch every triggering scene. Warnings are:
- Submitted by volunteers (not professionals)
- Based on subjective experiences
- Continuously improved through voting

**Please use responsibly** and trust your own judgment. If you're unsure about content, consider researching it independently or watching with a trusted person.

---

<div align="center">

**Made with ❤️ by the community, for the community**

[⭐ Star us on GitHub](https://github.com/mitchlabeetch/Trigger_Warnings) • [🐦 Follow on Twitter](#) • [📧 Subscribe to Updates](#)

</div>
