# Adding New Streaming Providers

Complete guide to adding support for new streaming platforms to Trigger Warnings.

---

## 📋 Overview

The Trigger Warnings extension uses a **Provider Pattern** to support different streaming platforms. Each provider is a class that knows how to:
- Detect the video player on the page
- Extract video metadata (title, episode, timestamps)
- Monitor playback events (play, pause, seek)
- Find injection points for warning UI

---

## 🎯 Quick Start Checklist

- [ ] Create provider class extending `BaseProvider`
- [ ] Implement required abstract methods
- [ ] Test on the actual platform
- [ ] Add to `ProviderFactory`
- [ ] Update `manifest.json` permissions
- [ ] Add tests
- [ ] Update documentation

**Time estimate**: 2-4 hours for a simple provider

---

## 📚 Table of Contents

1. [Understanding Providers](#understanding-providers)
2. [Step-by-Step Guide](#step-by-step-guide)
3. [Provider Interface](#provider-interface)
4. [Common Patterns](#common-patterns)
5. [Testing Your Provider](#testing-your-provider)
6. [Troubleshooting](#troubleshooting)
7. [Examples](#examples)

---

## Understanding Providers

### What is a Provider?

A **Provider** is a platform-specific adapter that bridges the extension with a streaming platform's video player. It abstracts away platform differences so the core warning system doesn't need to know about Netflix vs. Hulu vs. YouTube.

### Provider Hierarchy

```
BaseProvider (abstract)
├── NetflixProvider
├── PrimeVideoProvider
├── HuluProvider
├── DisneyPlusProvider
├── MaxProvider
├── PeacockProvider
├── YouTubeProvider
└── [Your New Provider]
```

### Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Video Detection** | Find the `<video>` element on the page |
| **Metadata Extraction** | Get title, episode, season, IMDb ID |
| **Time Tracking** | Monitor current playback position |
| **Event Handling** | Respond to play, pause, seek events |
| **UI Injection** | Provide DOM elements for warning overlays |

---

## Step-by-Step Guide

### Step 1: Research the Platform

Before writing code, understand the platform's structure:

1. **Open the platform** in your browser
2. **Inspect the video player** (Right-click → Inspect)
3. **Find key elements**:
   - Video element: `<video>` tag
   - Title element: Where the show/movie title is displayed
   - Progress bar: For time tracking
   - Player container: For injecting UI

4. **Test video playback**:
   - Play, pause, seek
   - Watch how the DOM changes
   - Look for API calls (Network tab in DevTools)

**Pro tip**: Use `console.dir(videoElement)` to see all properties of the video element.

### Step 2: Create Provider File

```bash
# Create new provider file
touch src/content/providers/MyPlatformProvider.ts
```

**Template:**
```typescript
import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';

export class MyPlatformProvider extends BaseProvider {
  readonly name = 'MyPlatform';
  readonly domains = ['myplatform.com'];

  protected readonly videoElementSelector = 'video'; // CSS selector for video

  async initialize(): Promise<void> {
    await super.initialize(); // Required: sets up video observer
    this.setupVideoListeners();
  }

  async getCurrentMedia(): Promise<MediaInfo | null> {
    // Extract video metadata from page
    const title = this.extractTitle();
    const episode = this.extractEpisode();
    
    if (!title) return null;

    return {
      id: this.generateContentId(title, episode),
      title,
      episode,
      platform: 'myplatform',
      imdbId: await this.fetchImdbId(title), // Optional
    };
  }

  getInjectionPoint(): HTMLElement | null {
    // Return element where warnings should be injected
    return document.querySelector('.player-container');
  }

  protected setupVideoListeners(): void {
    const video = this.videoElement;
    if (!video) return;

    // Listen for playback events
    this.addEventListener(video, 'play', () => {
      this.triggerPlayCallbacks();
    });

    this.addEventListener(video, 'pause', () => {
      this.triggerPauseCallbacks();
    });

    this.addEventListener(video, 'seeked', () => {
      this.triggerSeekCallbacks(video.currentTime);
    });
  }

  private extractTitle(): string | null {
    const titleElement = document.querySelector('.video-title');
    return titleElement?.textContent?.trim() || null;
  }

  private extractEpisode(): { season: number; episode: number } | null {
    // Platform-specific logic to extract S01E01 format
    const episodeText = document.querySelector('.episode-info')?.textContent;
    const match = episodeText?.match(/S(\d+)E(\d+)/i);
    
    if (match) {
      return {
        season: parseInt(match[1]),
        episode: parseInt(match[2]),
      };
    }
    
    return null;
  }

  private generateContentId(title: string, episode?: { season: number; episode: number } | null): string {
    const baseId = title.toLowerCase().replace(/\s+/g, '-');
    
    if (episode) {
      return `${baseId}-s${episode.season.toString().padStart(2, '0')}e${episode.episode.toString().padStart(2, '0')}`;
    }
    
    return baseId;
  }

  private async fetchImdbId(title: string): Promise<string | undefined> {
    // Optional: Query IMDb API or parse from page
    // For now, return undefined
    return undefined;
  }

  // Helper to add event listeners that are auto-cleaned up
  private addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener
  ): void {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }
}
```

### Step 3: Register Provider

**Add to `ProviderFactory` (`src/content/providers/ProviderFactory.ts`):**

```typescript
import { MyPlatformProvider } from './MyPlatformProvider';

export class ProviderFactory {
  static createProvider(hostname: string): BaseProvider | null {
    // ... existing providers ...

    if (hostname.includes('myplatform.com')) {
      return new MyPlatformProvider();
    }

    return null;
  }
}
```

### Step 4: Update Manifest

**Add permissions (`src/manifest/manifest.json`):**

```json
{
  "host_permissions": [
    "*://*.myplatform.com/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "*://*.myplatform.com/watch/*"
      ],
      "js": ["content/index.ts"],
      "run_at": "document_idle"
    }
  ]
}
```

**Note**: Adjust `matches` pattern to the actual URL structure.

### Step 5: Test

1. **Build the extension:**
   ```bash
   npm run build:chrome
   ```

2. **Reload extension** in `chrome://extensions/`

3. **Navigate to the platform**: `https://myplatform.com/watch/...`

4. **Open DevTools Console**: Look for logs like:
   ```
   [TW Content] Provider detected: MyPlatform
   [TW Content] Video found: <video>
   [TW Content] Media info: { title: "...", ... }
   ```

5. **Test playback events**:
   - Play video → Should see `[TW Content] Play event`
   - Pause → Should see `[TW Content] Pause event`
   - Seek → Should see `[TW Content] Seek event: 123.45`

### Step 6: Add Tests

**Create test file** (`src/content/providers/MyPlatformProvider.test.ts`):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyPlatformProvider } from './MyPlatformProvider';

describe('MyPlatformProvider', () => {
  let provider: MyPlatformProvider;

  beforeEach(() => {
    // Set up mock DOM
    document.body.innerHTML = `
      <div class="player-container">
        <video></video>
        <div class="video-title">Test Show</div>
        <div class="episode-info">S01E01</div>
      </div>
    `;
    
    provider = new MyPlatformProvider();
  });

  it('should detect platform name', () => {
    expect(provider.name).toBe('MyPlatform');
  });

  it('should extract video title', async () => {
    const media = await provider.getCurrentMedia();
    expect(media?.title).toBe('Test Show');
  });

  it('should extract episode info', async () => {
    const media = await provider.getCurrentMedia();
    expect(media?.episode).toEqual({ season: 1, episode: 1 });
  });

  it('should generate content ID', async () => {
    const media = await provider.getCurrentMedia();
    expect(media?.id).toBe('test-show-s01e01');
  });

  it('should find injection point', () => {
    const injectionPoint = provider.getInjectionPoint();
    expect(injectionPoint?.className).toBe('player-container');
  });
});
```

**Run tests:**
```bash
npm test MyPlatformProvider
```

---

## Provider Interface

### Required Methods

#### `name: string`
Platform identifier (used for logging and debugging).

```typescript
readonly name = 'Netflix'; // ✅ Good
readonly name = 'netflix'; // ❌ Bad (use PascalCase)
```

#### `domains: string[]`
List of domains this provider handles.

```typescript
readonly domains = ['netflix.com', 'netflix.co.uk']; // ✅ Multiple domains
readonly domains = ['myplatform.com'];
```

#### `async getCurrentMedia(): Promise<MediaInfo | null>`
Extract video metadata from the page.

**Return:**
```typescript
interface MediaInfo {
  id: string;               // Unique content ID (e.g., "tt1234567-s01e01")
  title: string;            // "Stranger Things"
  platform: string;         // "netflix"
  episode?: {
    season: number;
    episode: number;
  };
  imdbId?: string;          // "tt4574334" (optional)
  year?: number;            // 2016 (optional)
}
```

**Example:**
```typescript
async getCurrentMedia(): Promise<MediaInfo | null> {
  const titleEl = document.querySelector('.video-title');
  const title = titleEl?.textContent?.trim();
  
  if (!title) {
    console.warn('[TW Provider] No title found');
    return null;
  }

  return {
    id: this.generateContentId(title),
    title,
    platform: 'myplatform',
  };
}
```

#### `getInjectionPoint(): HTMLElement | null`
Return the DOM element where warning UI should be injected.

**Best practices:**
- Choose a container that encompasses the video player
- Avoid elements that are recreated on navigation
- Prefer stable, high-level containers

**Example:**
```typescript
getInjectionPoint(): HTMLElement | null {
  // Option 1: Specific container
  const container = document.querySelector('.player-video-wrapper');
  
  // Option 2: Fallback to video's parent
  if (!container) {
    return this.videoElement?.parentElement || null;
  }
  
  return container;
}
```

#### `protected setupVideoListeners(): void`
Set up event listeners on the video element.

**Required events:**
- `play` → Call `this.triggerPlayCallbacks()`
- `pause` → Call `this.triggerPauseCallbacks()`
- `seeked` → Call `this.triggerSeekCallbacks(currentTime)`

**Example:**
```typescript
protected setupVideoListeners(): void {
  const video = this.videoElement;
  if (!video) return;

  const playHandler = () => this.triggerPlayCallbacks();
  const pauseHandler = () => this.triggerPauseCallbacks();
  const seekHandler = () => this.triggerSeekCallbacks(video.currentTime);

  video.addEventListener('play', playHandler);
  video.addEventListener('pause', pauseHandler);
  video.addEventListener('seeked', seekHandler);

  // Store for cleanup
  this.eventListeners.push(
    { element: video, event: 'play', handler: playHandler },
    { element: video, event: 'pause', handler: pauseHandler },
    { element: video, event: 'seeked', handler: seekHandler }
  );
}
```

### Optional Overrides

#### `videoElementSelector: string`
CSS selector for finding the video element (default: `'video'`).

```typescript
protected readonly videoElementSelector = 'video.player-video'; // More specific
```

#### `async initialize(): Promise<void>`
Custom initialization logic (e.g., wait for lazy-loaded elements).

```typescript
async initialize(): Promise<void> {
  await super.initialize(); // Required!
  
  // Wait for player to fully load
  await this.waitForElement('.player-loaded');
  
  this.setupVideoListeners();
}

private waitForElement(selector: string, timeout = 5000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) return resolve(element);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}
```

---

## Common Patterns

### Pattern 1: Waiting for DOM Elements

Many platforms lazy-load their UI. Use `DOMObserver` or `MutationObserver`:

```typescript
import { DOMObserver } from './DOMObserver';

async initialize(): Promise<void> {
  await super.initialize();
  
  // Wait for player to appear
  await DOMObserver.waitForElement('.video-player', { timeout: 10000 });
  
  this.setupVideoListeners();
}
```

### Pattern 2: Extracting IMDb ID

Some platforms include IMDb IDs in the page:

```typescript
private extractImdbId(): string | undefined {
  // Check meta tags
  const metaTag = document.querySelector('meta[property="imdb:id"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || undefined;
  }

  // Check URL
  const match = window.location.href.match(/imdb\.com\/title\/(tt\d+)/);
  if (match) {
    return match[1];
  }

  // Check page content
  const links = document.querySelectorAll('a[href*="imdb.com/title"]');
  for (const link of links) {
    const href = link.getAttribute('href');
    const idMatch = href?.match(/tt\d+/);
    if (idMatch) {
      return idMatch[0];
    }
  }

  return undefined;
}
```

### Pattern 3: Handling URL Changes (SPAs)

Single-page apps (like Netflix) don't reload on navigation. Watch URL changes:

```typescript
async initialize(): Promise<void> {
  await super.initialize();
  this.setupVideoListeners();
  
  // Watch for URL changes
  this.watchUrlChanges();
}

private watchUrlChanges(): void {
  let lastUrl = location.href;
  
  const checkUrl = () => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      this.handleUrlChange();
    }
  };

  // Poll every 500ms (better than nothing)
  setInterval(checkUrl, 500);
  
  // Also listen for history API calls
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    checkUrl();
  };
}

private async handleUrlChange(): Promise<void> {
  console.log('[TW Provider] URL changed, reloading media info');
  const media = await this.getCurrentMedia();
  if (media) {
    this.triggerMediaChangeCallbacks(media);
  }
}
```

### Pattern 4: Handling Ads (Hulu, Peacock)

Ad-supported platforms inject ads into the video stream. Detect and ignore them:

```typescript
protected setupVideoListeners(): void {
  const video = this.videoElement;
  if (!video) return;

  video.addEventListener('play', () => {
    if (this.isAd()) {
      console.log('[TW Provider] Ad detected, ignoring play event');
      return;
    }
    this.triggerPlayCallbacks();
  });
}

private isAd(): boolean {
  // Check for ad indicator
  const adOverlay = document.querySelector('.ad-playing');
  if (adOverlay) return true;

  // Check video duration (ads are usually short)
  const video = this.videoElement;
  if (video && video.duration < 60) {
    return true; // Likely an ad
  }

  return false;
}
```

---

## Testing Your Provider

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Provider is detected on the platform
- [ ] Video element is found
- [ ] Title is extracted correctly
- [ ] Episode info is extracted (if applicable)
- [ ] Content ID is generated
- [ ] Play event triggers callbacks
- [ ] Pause event triggers callbacks
- [ ] Seek event triggers callbacks
- [ ] Injection point is found
- [ ] Navigation to new content updates media info

### Automated Testing

```bash
# Run provider tests
npm test MyPlatformProvider

# Run all provider tests
npm test providers/

# Test with coverage
npm run test:coverage
```

### Debugging Tips

**Add verbose logging:**
```typescript
async getCurrentMedia(): Promise<MediaInfo | null> {
  console.log('[TW Provider] Extracting media info...');
  
  const title = this.extractTitle();
  console.log('[TW Provider] Title:', title);
  
  const episode = this.extractEpisode();
  console.log('[TW Provider] Episode:', episode);
  
  if (!title) {
    console.warn('[TW Provider] No title found, media info unavailable');
    return null;
  }

  const media = { id: '...', title, platform: 'myplatform' };
  console.log('[TW Provider] Final media info:', media);
  
  return media;
}
```

**Inspect DOM:**
```javascript
// In browser console
console.dir(document.querySelector('video'));
console.log(document.querySelector('.video-title')?.textContent);
```

---

## Troubleshooting

### Video Not Detected

**Problem**: `videoElement` is `null`

**Solutions:**
1. Check `videoElementSelector` is correct
2. Wait for video to load:
   ```typescript
   await DOMObserver.waitForElement('video', { timeout: 10000 });
   ```
3. Check if video is in shadow DOM (use `element.shadowRoot.querySelector()`)

### Title Not Extracted

**Problem**: `getCurrentMedia()` returns `null`

**Solutions:**
1. Inspect the page to find the correct selector
2. Try multiple selectors:
   ```typescript
   private extractTitle(): string | null {
     const selectors = [
       '.video-title',
       '.show-title',
       '[data-uia="video-title"]', // Netflix uses data attributes
       'h1.title',
     ];
     
     for (const selector of selectors) {
       const el = document.querySelector(selector);
       if (el?.textContent) {
         return el.textContent.trim();
       }
     }
     
     return null;
   }
   ```

### Events Not Firing

**Problem**: Play/pause callbacks never trigger

**Solutions:**
1. Check video element is found: `console.log(this.videoElement)`
2. Manually test events:
   ```typescript
   video.addEventListener('play', () => console.log('PLAY'));
   ```
3. Some platforms use custom player APIs (not native `<video>` events)
   - Look for player instance: `window.netflixPlayer`, `window.player`, etc.

### Injection Point Not Found

**Problem**: Warnings don't appear on screen

**Solutions:**
1. Return video's parent as fallback:
   ```typescript
   getInjectionPoint(): HTMLElement | null {
     return document.querySelector('.player-container')
       || this.videoElement?.parentElement
       || document.body;
   }
   ```
2. Check if container is created dynamically (wait for it)

---

## Examples

### Simple Provider (YouTube-style)

```typescript
export class SimplePlatformProvider extends BaseProvider {
  readonly name = 'SimplePlatform';
  readonly domains = ['simple.com'];

  async getCurrentMedia(): Promise<MediaInfo | null> {
    const title = document.querySelector('h1.title')?.textContent?.trim();
    return title ? { id: title, title, platform: 'simple' } : null;
  }

  getInjectionPoint(): HTMLElement | null {
    return document.querySelector('.player-container');
  }

  protected setupVideoListeners(): void {
    const video = this.videoElement;
    if (!video) return;

    video.addEventListener('play', () => this.triggerPlayCallbacks());
    video.addEventListener('pause', () => this.triggerPauseCallbacks());
    video.addEventListener('seeked', () => this.triggerSeekCallbacks(video.currentTime));
  }
}
```

### Advanced Provider (Netflix-style)

See `src/content/providers/NetflixProvider.ts` for a production example with:
- Custom player API integration
- IMDb ID extraction
- Episode detection
- URL change handling
- Lazy-loaded UI handling

---

## Submitting Your Provider

Once your provider is working:

1. **Write tests** (see Step 6)
2. **Update documentation** (add to README's "Supported Platforms" list)
3. **Create Pull Request** with:
   - Provider code
   - Tests
   - Manifest updates
   - Documentation updates

**PR title**: `feat: add support for [Platform Name]`

---

<div align="center">

**Need help?** [Open a discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions) 💬

[Back to README](../README.md)

</div>
