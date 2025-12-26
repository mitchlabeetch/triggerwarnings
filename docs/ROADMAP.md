# Roadmap

Future plans and feature development timeline for Trigger Warnings.

---

## 🎯 Vision

**Mission**: Make streaming accessible and comfortable for everyone by providing accurate, timely, and customizable trigger warnings.

**Long-term goals (3-5 years):**
- Support for 50+ streaming platforms worldwide
- 10M+ users globally
- 100M+ community-submitted warnings
- Advanced AI detection with 95%+ accuracy
- Industry partnerships with streaming providers
- Mobile apps (iOS, Android)
- International localization (20+ languages)

---

## 📅 Release Timeline

### Version 2.0 (Current) - "Community Foundation"
**Status**: ✅ Released (January 2025)

**Features:**
- ✅ Multi-platform support (Netflix, Hulu, Disney+, Prime, Max, Peacock, YouTube)
- ✅ Community warning submission & voting
- ✅ Svelte-based modern UI
- ✅ Profile system (multiple sensitivity levels)
- ✅ Real-time warning display (banners, indicators, overlays)
- ✅ Supabase backend integration
- ✅ Chrome (MV3) & Firefox (MV2) support

---

### Version 2.1 - "Trust & Reliability"
**Status**: 🚧 In Progress (Q1 2025)
**Target**: March 2025

**Goals:**
- Improve warning accuracy through better moderation
- Reduce spam and false positives
- Enhance user experience

**Features:**
- 🚧 **Trusted user system**: Users with good track record get voting weight boost
- 🚧 **Warning quality indicators**: Color-coded confidence levels
- 🚧 **Spam detection**: Auto-flag suspicious submissions
- 🚧 **Edit warnings**: Users can correct their own submissions (within 10 min)
- 🚧 **Report system**: Flag inappropriate warnings
- 🚧 **Batch warning submission**: Add multiple warnings for a show/episode at once
- 🚧 **Warning previews**: See warning before it triggers (5-second heads-up)

**Technical:**
- Performance optimizations (reduce CPU usage by 30%)
- Better caching (reduce API calls by 50%)
- Improved provider stability (handle platform UI changes)

---

### Version 2.2 - "Enhanced Detection"
**Status**: 📋 Planned (Q2 2025)
**Target**: May 2025

**Goals:**
- Improve AI detection accuracy
- Add more trigger categories
- Better customization

**Features:**
- 🔜 **Audio analysis (beta)**: Detect auditory triggers (retching, screams, loud noises)
- 🔜 **Subtitle analysis (beta)**: Parse captions for trigger keywords
- 🔜 **Custom trigger categories**: Users create their own categories
- 🔜 **Trigger intensity slider**: Adjust sensitivity (more/fewer warnings)
- 🔜 **Time-based profiles**: Auto-switch profiles by time of day ("Work-Safe" 9-5)
- 🔜 **Export warning data**: Download warnings for offline viewing

**New Platforms:**
- Apple TV+
- Paramount+
- Tubi
- Crunchyroll

---

### Version 3.0 - "Social & Personalization"
**Status**: 📋 Planned (Q3-Q4 2025)
**Target**: September 2025

**Major changes:**
- User accounts (optional)
- Social features
- Advanced personalization

**Features:**
- 🔮 **User accounts**: Email/password or OAuth (Google, GitHub)
- 🔮 **Contribution history**: See your warnings, votes, reputation
- 🔮 **Follow creators**: Get notified when they add warnings
- 🔮 **Warning comments**: Discuss disputed warnings
- 🔮 **Moderator system**: Elected community moderators
- 🔮 **Reputation score**: Earn badges for quality contributions
- 🔮 **AI-powered recommendations**: Suggest trigger categories based on viewing
- 🔮 **Advanced filtering**: By episode, season, specific actors, directors
- 🔮 **Watch party sync**: Share warnings with friends watching together

**New Platforms:**
- Plex
- Jellyfin
- Emby
- Twitch (live stream warnings)

---

### Version 3.1 - "Mobile & Internationalization"
**Status**: 💭 Concept (Q4 2025 - Q1 2026)
**Target**: December 2025

**Goals:**
- Expand to mobile browsers
- Support international audiences

**Features:**
- 🌐 **Mobile apps**: iOS (Safari extension) and Android (custom browser)
- 🌐 **Localization**: 20+ languages (Spanish, French, German, Japanese, Korean, etc.)
- 🌐 **Regional content**: Support for non-US streaming platforms (BBC iPlayer, etc.)
- 🌐 **Accessibility**: Screen reader optimization, high-contrast mode
- 🌐 **Offline mode**: Pre-download warnings for flights, commutes
- 🌐 **SMS alerts**: Text message warnings for parents monitoring kids' viewing

**Technical:**
- React Native mobile apps
- i18n framework (react-intl or similar)
- IndexedDB for offline storage
- WebRTC for watch party features

---

### Version 4.0 - "Industry Integration"
**Status**: 💭 Vision (2026+)
**Target**: TBD

**Goals:**
- Partner with streaming platforms
- Enterprise features for studios

**Potential features:**
- 🎬 **Studio partnerships**: Official warnings from content creators
- 🎬 **API for platforms**: Streaming services integrate our warnings
- 🎬 **Pre-release screening**: Get warnings before public release
- 🎬 **Creator tools**: Dashboard for filmmakers to self-report triggers
- 🎬 **Educational content**: Resources for studios on inclusive filmmaking
- 🎬 **Certification program**: "Trigger-Aware" badge for certified content

**Business model (to sustain development):**
- Donations/sponsorships from streaming platforms
- Premium API for studios ($99/month for bulk warning uploads)
- **Note**: Core extension remains free forever

---

## 🚀 Feature Requests

### Most Requested Features

Based on GitHub discussions and user feedback:

| Feature | Votes | Status | ETA |
|---------|-------|--------|-----|
| Custom trigger categories | 147 | Planned 2.2 | Q2 2025 |
| Mobile app (iOS) | 132 | Planned 3.1 | Q4 2025 |
| Audio detection | 98 | In Progress 2.2 | Q2 2025 |
| Offline mode | 87 | Planned 3.1 | Q4 2025 |
| Watch party sync | 76 | Planned 3.0 | Q3 2025 |
| Subtitle warnings | 65 | Planned 2.2 | Q2 2025 |
| User accounts | 54 | Planned 3.0 | Q3 2025 |
| More languages | 43 | Planned 3.1 | Q4 2025 |

**Want to request a feature?** [Open a discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions)

---

## 🛠️ Technical Roadmap

### Performance Improvements

**Q1 2025:**
- ✅ Reduce extension size: 5MB → 3MB (via tree-shaking, lazy loading)
- ✅ Optimize WarningManager: O(n²) → O(n log n) time complexity
- 🚧 Implement service worker caching strategies
- 🚧 Reduce background CPU usage: <1% idle

**Q2 2025:**
- 🔜 Web Workers for AI detection (off main thread)
- 🔜 WASM modules for critical paths (5-10x speedup)
- 🔜 GraphQL API (reduce over-fetching by 70%)
- 🔜 CDN caching for popular content warnings

### Security Enhancements

**Q1 2025:**
- ✅ Row-level security (RLS) on all Supabase tables
- 🚧 Rate limiting (500 req/min per user)
- 🚧 CAPTCHA for suspicious voting patterns

**Q2 2025:**
- 🔜 End-to-end encryption for user data (accounts)
- 🔜 Two-factor authentication (2FA)
- 🔜 Security audit by external firm

**Q3 2025:**
- 🔜 Bug bounty program ($100-$1000 per valid report)
- 🔜 Regular penetration testing

### Infrastructure

**Current:**
- Supabase free tier (500MB storage, 500 req/sec)
- GitHub Pages for landing page

**Q2 2025:**
- Upgrade to Supabase Pro ($25/month) – more storage, better performance
- Set up CDN (CloudFlare) for faster API responses worldwide

**Q4 2025:**
- Consider self-hosting for full control
- Evaluate cloud costs: Supabase vs. AWS vs. GCP

---

## 🌍 Platform Expansion

### Current Support (7 platforms)
- Netflix
- Prime Video
- Hulu
- Disney+
- Max (HBO Max)
- Peacock
- YouTube

### Planned Additions

**Q1 2025 (v2.1):**
- Apple TV+ 🍎
- Paramount+ 📺
- Crunchyroll 🎌
- Tubi 📺

**Q2 2025 (v2.2):**
- Plex 🎬
- Jellyfin 🎬
- Emby 🎬
- Funimation 🎌

**Q3 2025 (v3.0):**
- Twitch 🎮 (live streams)
- Vimeo 📹
- Dailymotion 📹
- Regional platforms (BBC iPlayer, ITV Hub, etc.)

**Q4 2025 (v3.1):**
- International platforms (Netflix regions, local services)
- Educational platforms (Coursera, edX)
- Porn platforms (if community demand exists)

**Requests?** Open a [feature request](https://github.com/mitchlabeetch/Trigger_Warnings/issues)

---

## 🤖 AI/ML Development

### Short-term (2025)

**Q1:**
- ✅ CLIP integration (zero-shot image classification)
- 🚧 YOLO fine-tuning (custom spider/weapon detection)

**Q2:**
- 🔜 CLAP integration (audio analysis)
- 🔜 BERT for subtitle parsing
- 🔜 Cascade pipeline optimization (reduce false positives by 50%)

**Q3:**
- 🔜 VLM (vision-language model) for context understanding
- 🔜 Custom training pipeline (let users label data)
- 🔜 Federated learning (privacy-preserving model updates)

### Long-term (2026+)

**Advanced models:**
- Emotion recognition (detect distress in faces)
- Scene understanding (violence vs. action movie safe)
- Multi-modal fusion (audio + visual + subtitle combined)
- Real-time on mobile (TinyML)

**Accuracy goals:**
- Recall: 95% (catch 95% of triggers)
- Precision: 90% (90% of alerts are correct)
- Speed: <50ms per frame (real-time on GPU)

---

## 🎓 Community Growth

### Current Stats (January 2025)
- Users: ~1,000 (estimated)
- Warnings submitted: ~5,000
- Platforms: 7
- Contributors: 50+

### Growth Targets

**Q2 2025:**
- 10,000 users
- 50,000 warnings
- 10 platforms
- 200+ contributors

**Q4 2025:**
- 100,000 users
- 500,000 warnings
- 20 platforms
- 1,000+ contributors

**2026:**
- 1,000,000 users
- 10,000,000 warnings
- 50+ platforms
- 10,000+ contributors

### Community Initiatives

**Q1 2025:**
- 🚧 Contributor of the Month (recognition)
- 🚧 Weekly newsletter (updates, top warnings)
- 🚧 Discord server (community chat)

**Q2 2025:**
- 🔜 Hackathons (add new platforms, improve AI)
- 🔜 Meetups (virtual, maybe in-person at conferences)
- 🔜 Ambassador program (community leaders)

**Q3 2025:**
- 🔜 Annual conference (TriggerCon 2025?)
- 🔜 Swag store (stickers, t-shirts for contributors)
- 🔜 Documentary (the story of Trigger Warnings)

---

## 💰 Sustainability

### Current Funding
- $0/month revenue (100% free, no ads)
- Maintainer volunteers time (~20 hrs/week)
- Infrastructure: Supabase free tier ($0/month)

**This is not sustainable long-term.**

### Future Funding Options

**Option 1: Donations (Preferred)**
- GitHub Sponsors
- Patreon ($3/month tier)
- One-time donations (Buy Me a Coffee)
- Target: $500/month to cover hosting, maintainer stipend

**Option 2: Partnerships**
- Streaming platforms sponsor development
- Mental health organizations sponsor
- Accessibility advocacy groups sponsor
- Target: $5,000/month

**Option 3: Enterprise API**
- Studios pay for bulk warning upload API
- $99/month for premium features
- Only for studios, not users
- Target: $10,000/month

**What will NOT happen:**
- ❌ Ads in the extension
- ❌ Paid tiers for users
- ❌ Selling user data
- ❌ Paywall for warnings

**Core extension will remain free forever.**

---

## 🎉 Milestones

### Completed
- [x] **2024-06**: Project launched (v1.0)
- [x] **2024-09**: Netflix support added
- [x] **2024-12**: Multi-platform support (v2.0)
- [x] **2025-01**: 1,000 users milestone 🎊

### Upcoming
- [ ] **2025-03**: 10,000 users (v2.1 release)
- [ ] **2025-06**: AI detection beta (v2.2 release)
- [ ] **2025-09**: User accounts (v3.0 release)
- [ ] **2025-12**: 100,000 users, mobile apps (v3.1)
- [ ] **2026-06**: 1M users milestone 🚀

---

## 🗣️ Community Feedback

**We listen to you!** Roadmap is flexible based on:
- GitHub Discussions upvotes
- User surveys (sent quarterly)
- Direct feedback (email, social media)
- Contributor input (monthly meetings)

**Want to influence the roadmap?**
- [Vote on features](https://github.com/mitchlabeetch/Trigger_Warnings/discussions)
- [Join Discord](https://discord.gg/triggerwarnings) *(coming soon)*
- [Become a contributor](../CONTRIBUTING.md)

---

## 📊 Success Metrics

How we measure progress:

| Metric | 2025 Goal | 2026 Goal | Current |
|--------|-----------|-----------|---------|
| Active users | 100K | 1M | ~1K |
| Warnings submitted | 500K | 10M | ~5K |
| Platforms supported | 20 | 50 | 7 |
| Languages | 10 | 20 | 1 (English) |
| AI accuracy (F1) | 80% | 95% | 75% |
| Avg. warning score | 7 | 8 | TBD |
| Community satisfaction | 85% | 90% | TBD |

---

<div align="center">

**Excited about the future?** [Star us on GitHub ⭐](https://github.com/mitchlabeetch/Trigger_Warnings)

**Want to contribute?** [Read the guide](../CONTRIBUTING.md) 💻

[Back to README](../README.md)

</div>
