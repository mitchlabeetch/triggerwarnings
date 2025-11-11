<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ActiveWarning } from '@shared/types/Warning.types';
  import { TRIGGER_CATEGORIES } from '@shared/constants/categories';

  export let onQuickAdd: () => void;
  export let activeWarnings: ActiveWarning[] = [];

  let visible = false;
  let isExpanded = false;
  let showAddTriggerForm = false;
  let currentTime = '--:--';
  let intervalId: number | null = null;
  let videoElement: HTMLVideoElement | null = null;
  let playerContainer: HTMLElement | null = null;

  // Customization props (will come from profile settings)
  export let buttonColor: string = '#8b5cf6'; // More violet as requested
  export let buttonOpacity: number = 0.95;
  export let appearingMode: 'always' | 'onMove' | 'onHover' = 'always';
  export let fadeOutDelay: number = 3000; // milliseconds

  let fadeOutTimer: number | null = null;
  let isVideoPaused = false;
  let isVideoStarting = true;
  let videoStartTimer: number | null = null;

  // Fade in after a short delay
  onMount(() => {
    setTimeout(() => {
      visible = true;
    }, 500);

    // Find video element and container
    videoElement = document.querySelector('video');
    playerContainer = videoElement?.closest('.html5-video-container, .video-stream, [data-player]') as HTMLElement;

    // Update timestamp every second
    updateTimestamp();
    intervalId = window.setInterval(updateTimestamp, 1000);

    // Track video paused state
    if (videoElement) {
      videoElement.addEventListener('pause', handleVideoPause);
      videoElement.addEventListener('play', handleVideoPlay);
      videoElement.addEventListener('playing', handleVideoPlay);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
    }

    // Handle cursor movement for appearing mode
    if (appearingMode === 'onMove') {
      document.addEventListener('mousemove', handleMouseMove);
    }
  });

  onDestroy(() => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
    if (fadeOutTimer !== null) {
      clearTimeout(fadeOutTimer);
    }
    if (videoStartTimer !== null) {
      clearTimeout(videoStartTimer);
    }
    if (videoElement) {
      videoElement.removeEventListener('pause', handleVideoPause);
      videoElement.removeEventListener('play', handleVideoPlay);
      videoElement.removeEventListener('playing', handleVideoPlay);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    }
    document.removeEventListener('mousemove', handleMouseMove);
  });

  function updateTimestamp() {
    const video = document.querySelector('video');
    if (video && !isNaN(video.currentTime)) {
      const time = Math.floor(video.currentTime);
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      currentTime = `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
  }

  function handleVideoPause() {
    isVideoPaused = true;
    isExpanded = true;
  }

  function handleVideoPlay() {
    isVideoPaused = false;
    if (!isVideoStarting) {
      isExpanded = false;
    }
  }

  function handleTimeUpdate(e: Event) {
    const video = e.target as HTMLVideoElement;
    // Consider video "starting" if within first 7 seconds
    if (video.currentTime <= 7 && isVideoStarting) {
      isExpanded = true;
    } else if (video.currentTime > 7 && isVideoStarting) {
      isVideoStarting = false;
      if (!isVideoPaused) {
        isExpanded = false;
      }
    }
  }

  function handleMouseMove() {
    if (appearingMode === 'onMove') {
      visible = true;
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
      fadeOutTimer = window.setTimeout(() => {
        if (!isExpanded && appearingMode === 'onMove') {
          visible = false;
        }
      }, fadeOutDelay);
    }
  }

  function handleQuickAdd() {
    showAddTriggerForm = !showAddTriggerForm;
    if (showAddTriggerForm) {
      isExpanded = true;
    }
  }

  function handleMouseEnter() {
    isExpanded = true;
    if (fadeOutTimer) clearTimeout(fadeOutTimer);
  }

  function handleMouseLeave() {
    if (!showAddTriggerForm && !isVideoPaused && !isVideoStarting) {
      isExpanded = false;
      if (appearingMode === 'onMove') {
        fadeOutTimer = window.setTimeout(() => {
          visible = false;
        }, fadeOutDelay);
      }
    }
  }

  $: hasActiveWarnings = activeWarnings.length > 0;
  $: triggerCount = activeWarnings.length;
  $: shouldShowAlways = appearingMode === 'always' || isExpanded || isVideoPaused || isVideoStarting;
</script>

{#if visible && shouldShowAlways}
  <div
    class="tw-overlay"
    class:expanded={isExpanded}
    class:has-warnings={hasActiveWarnings}
    class:showing-form={showAddTriggerForm}
    role="complementary"
    aria-label="Trigger Warnings Extension Overlay"
    style="--button-color: {buttonColor}; --button-opacity: {buttonOpacity};"
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:focusin={handleMouseEnter}
    on:focusout={handleMouseLeave}
  >
    <div class="tw-overlay-content">
      <!-- Compact view (always visible) -->
      <div class="tw-overlay-compact">
        <!-- Status badge -->
        <div class="tw-overlay-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            {#if hasActiveWarnings}
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            {:else}
              <path d="M12 8v4M12 16h.01"/>
            {/if}
          </svg>
        </div>

        <!-- Label -->
        <div class="tw-overlay-label">TW</div>

        <!-- Timestamp -->
        <div class="tw-overlay-time">{currentTime}</div>

        <!-- Quick add icon (always visible) -->
        <button
          class="tw-overlay-add-icon"
          on:click={handleQuickAdd}
          title="Add trigger warning"
          aria-label="Add trigger warning"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <!-- Expanded content (horizontal expansion on both sides) -->
      {#if isExpanded}
        <div class="tw-overlay-expanded">
          <!-- Welcome message (on pause or start) -->
          {#if (isVideoPaused || isVideoStarting) && !showAddTriggerForm}
            <div class="tw-overlay-welcome">
              <div class="tw-welcome-platform">
                <span class="tw-welcome-icon">📺</span>
                <span>You are watching on <strong>{getplatformName()}</strong></span>
              </div>
              {#if triggerCount > 0}
                <div class="tw-welcome-triggers">
                  Users have flagged <strong>{triggerCount}</strong> {triggerCount === 1 ? 'trigger' : 'triggers'} on this content.
                </div>
              {:else}
                <div class="tw-welcome-triggers">
                  No triggers reported yet. Help the community by adding one!
                </div>
              {/if}
            </div>
          {/if}

          <!-- Active warnings list -->
          {#if hasActiveWarnings && !showAddTriggerForm}
            <div class="tw-overlay-warnings">
              <div class="tw-warnings-header">
                <span>Active Triggers</span>
                <span class="tw-warnings-count">{activeWarnings.length}</span>
              </div>
              {#each activeWarnings as warning}
                <div class="tw-warning-item">
                  <span class="tw-warning-icon">{TRIGGER_CATEGORIES[warning.categoryKey]?.icon || '⚠️'}</span>
                  <span class="tw-warning-name">{TRIGGER_CATEGORIES[warning.categoryKey]?.name || warning.categoryKey}</span>
                  <span class="tw-warning-time">{formatTime(warning.startTime)} - {formatTime(warning.endTime)}</span>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Add trigger button (expands to show text) -->
          {#if !showAddTriggerForm}
            <button
              class="tw-overlay-add-btn"
              on:click={handleQuickAdd}
              title="Add trigger warning at current timestamp"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Add Trigger</span>
            </button>
          {/if}

          <!-- Add trigger form (inline, horizontal layout) -->
          {#if showAddTriggerForm}
            <div class="tw-overlay-form">
              <div class="tw-form-header">
                <span>Add Trigger Warning</span>
                <button class="tw-form-close" on:click={() => showAddTriggerForm = false}>✕</button>
              </div>
              <div class="tw-form-content">
                <p class="tw-form-hint">🎯 Quick workflow - no fullscreen exit needed</p>
                <!-- Form implementation will connect to existing add trigger functionality -->
                <div class="tw-form-message">
                  Click extension icon to complete adding trigger
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<script context="module" lang="ts">
  function getplatformName(): string {
    const hostname = window.location.hostname;
    if (hostname.includes('youtube')) return 'YouTube';
    if (hostname.includes('netflix')) return 'Netflix';
    if (hostname.includes('prime')) return 'Prime Video';
    if (hostname.includes('hulu')) return 'Hulu';
    if (hostname.includes('disney')) return 'Disney+';
    if (hostname.includes('max.')) return 'Max';
    if (hostname.includes('peacock')) return 'Peacock';
    return 'this platform';
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
</script>

<style>
  .tw-overlay {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    animation: tw-overlay-fade-in 0.5s ease-out;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 90vw;
  }

  @keyframes tw-overlay-fade-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .tw-overlay-content {
    display: flex;
    align-items: center;
    gap: 0;
    background: linear-gradient(135deg,
      rgba(var(--button-color-rgb, 139, 92, 246), var(--button-opacity, 0.95)) 0%,
      rgba(var(--button-color-rgb, 168, 85, 247), var(--button-opacity, 0.95)) 100%
    );
    background: rgba(139, 92, 246, 0.95); /* More violet as requested */
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: white;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .tw-overlay:hover .tw-overlay-content {
    background: rgba(168, 85, 247, 0.98);
    box-shadow: 0 12px 40px rgba(168, 85, 247, 0.5);
  }

  .tw-overlay.has-warnings .tw-overlay-content {
    background: rgba(239, 68, 68, 0.95);
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4);
  }

  .tw-overlay.has-warnings:hover .tw-overlay-content {
    background: rgba(220, 38, 38, 0.98);
    box-shadow: 0 12px 40px rgba(220, 38, 38, 0.5);
  }

  /* Compact view */
  .tw-overlay-compact {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    transition: all 0.3s ease;
  }

  .tw-overlay.expanded .tw-overlay-compact {
    padding-right: 12px;
    border-right: 1px solid rgba(255, 255, 255, 0.2);
  }

  .tw-overlay-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .tw-overlay-badge svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .tw-overlay-label {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
    white-space: nowrap;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .tw-overlay-time {
    font-size: 13px;
    font-weight: 600;
    font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
    background: rgba(0, 0, 0, 0.25);
    padding: 3px 10px;
    border-radius: 10px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    letter-spacing: 0.5px;
  }

  .tw-overlay-add-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .tw-overlay-add-icon:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.1) rotate(90deg);
  }

  .tw-overlay-add-icon:active {
    transform: scale(0.95) rotate(90deg);
  }

  /* Expanded content - horizontal layout */
  .tw-overlay-expanded {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    max-height: 400px;
    overflow-x: auto;
    overflow-y: hidden;
    animation: tw-expand-horizontal 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    flex-wrap: nowrap;
  }

  @keyframes tw-expand-horizontal {
    from {
      opacity: 0;
      max-width: 0;
      padding-left: 0;
      padding-right: 0;
    }
    to {
      opacity: 1;
      max-width: 800px;
      padding-left: 16px;
      padding-right: 16px;
    }
  }

  /* Welcome message */
  .tw-overlay-welcome {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;
    animation: tw-welcome-in 0.4s ease-out;
  }

  @keyframes tw-welcome-in {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .tw-welcome-platform {
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tw-welcome-icon {
    font-size: 16px;
  }

  .tw-welcome-triggers {
    font-size: 12px;
    opacity: 0.9;
  }

  /* Active warnings list */
  .tw-overlay-warnings {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 300px;
  }

  .tw-warnings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    opacity: 0.95;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .tw-warnings-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 8px;
    font-weight: 700;
  }

  .tw-warning-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 500;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    animation: tw-warning-slide-in 0.3s ease-out;
  }

  @keyframes tw-warning-slide-in {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .tw-warning-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .tw-warning-name {
    flex: 1;
    font-weight: 600;
  }

  .tw-warning-time {
    font-size: 10px;
    opacity: 0.8;
    font-family: monospace;
  }

  /* Add trigger button */
  .tw-overlay-add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 14px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    animation: tw-btn-slide-in 0.4s ease-out;
  }

  @keyframes tw-btn-slide-in {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .tw-overlay-add-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .tw-overlay-add-btn:active {
    transform: translateY(0);
  }

  /* Add trigger form */
  .tw-overlay-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    min-width: 300px;
    animation: tw-form-expand 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes tw-form-expand {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .tw-form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 700;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .tw-form-close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .tw-form-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .tw-form-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tw-form-hint {
    font-size: 11px;
    opacity: 0.85;
    margin: 0;
  }

  .tw-form-message {
    font-size: 12px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    text-align: center;
  }

  /* Fullscreen adjustments */
  :global(body:fullscreen) .tw-overlay,
  :global(body:-webkit-full-screen) .tw-overlay,
  :global(body:-moz-full-screen) .tw-overlay {
    position: fixed;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .tw-overlay {
      max-width: 95vw;
    }

    .tw-overlay-compact {
      padding: 8px 12px;
      gap: 6px;
    }

    .tw-overlay-expanded {
      padding: 8px 12px;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tw-overlay-label {
      font-size: 12px;
    }

    .tw-overlay-time {
      font-size: 11px;
      padding: 2px 8px;
    }

    .tw-overlay-warnings {
      max-width: 250px;
    }
  }

  /* Glassmorphism enhancements */
  .tw-overlay-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 24px;
    pointer-events: none;
  }
</style>
