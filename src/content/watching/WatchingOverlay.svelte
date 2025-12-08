<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade, fly, slide, scale } from 'svelte/transition';
  import { quintOut, backOut, elasticOut } from 'svelte/easing';
  import type { Warning, TriggerCategory } from '@shared/types/Warning.types';
  import type { WatchingStatus } from '@shared/types/MediaContent.types';
  import type { ProtectionType } from '@shared/types/Profile.types';
  import { TRIGGER_CATEGORIES } from '@shared/constants/categories';

  // Props
  export let status: WatchingStatus = 'unprotected';
  export let activeWarning: Warning | null = null;
  export let countdownSeconds: number = 0;
  export let isExpanded: boolean = false;
  export let position: { x: number; y: number } = { x: 20, y: 20 };
  export let protectionType: ProtectionType = 'warn';
  export let helperMode: boolean = false;

  // Callbacks
  export let onAddTrigger: () => void = () => {};
  export let onIgnoreThisTime: (warningId: string) => void = () => {};
  export let onIgnoreAllVideo: (category: TriggerCategory) => void = () => {};
  export let onSkipToEnd: (warning: Warning) => void = () => {};
  export let onPositionChange: (pos: { x: number; y: number }) => void = () => {};

  const dispatch = createEventDispatcher();

  // State
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let overlayRef: HTMLDivElement | null = null;
  let isHovering = false;
  let showWarningBanner = false;
  let isProtectionActive = false;

  // Computed
  $: statusText = getStatusText(status);
  $: statusIcon = getStatusIcon(status);
  $: shouldShowExpanded = isExpanded || isHovering;
  $: expandDirection = getExpandDirection();
  $: categoryInfo = activeWarning ? TRIGGER_CATEGORIES[activeWarning.categoryKey] : null;

  // Watch for active warning changes
  $: if (activeWarning && countdownSeconds > 0) {
    showWarningBanner = true;
  } else if (!activeWarning) {
    showWarningBanner = false;
    isProtectionActive = false;
  }

  function getStatusText(s: WatchingStatus): string {
    switch (s) {
      case 'protected':
        return 'Protected';
      case 'overall-only':
        return 'Limited Protection';
      case 'unprotected':
        return 'Not Covered';
      case 'reviewing':
        return 'Helper Mode';
      default:
        return '';
    }
  }

  function getStatusIcon(s: WatchingStatus): string {
    switch (s) {
      case 'protected':
        return '🛡️';
      case 'overall-only':
        return '◐';
      case 'unprotected':
        return '○';
      case 'reviewing':
        return '👁️';
      default:
        return '';
    }
  }

  function getExpandDirection(): 'horizontal' | 'vertical' {
    // Expand horizontally if on left/right edge, vertically if top/bottom
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const nearLeft = position.x < screenWidth / 3;
    const nearRight = position.x > (screenWidth * 2) / 3;

    if (nearLeft || nearRight) {
      return 'horizontal';
    }
    return 'vertical';
  }

  // Drag handlers
  function handleDragStart(e: MouseEvent | TouchEvent) {
    if (!overlayRef) return;

    isDragging = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStart = {
      x: clientX - position.x,
      y: clientY - position.y,
    };

    e.preventDefault();
  }

  function handleDragMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;

    // Constrain to viewport
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;

    position = {
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(10, Math.min(newY, maxY)),
    };
  }

  function handleDragEnd() {
    if (isDragging) {
      isDragging = false;
      onPositionChange(position);
      dispatch('positionChange', position);
    }
  }

  // Action handlers
  function handleAddTrigger() {
    dispatch('addTrigger');
    onAddTrigger();
  }

  function handleIgnoreThisTime() {
    if (activeWarning) {
      dispatch('ignoreThisTime', activeWarning.id);
      onIgnoreThisTime(activeWarning.id);
    }
  }

  function handleIgnoreAllVideo() {
    if (activeWarning) {
      dispatch('ignoreAllVideo', activeWarning.categoryKey);
      onIgnoreAllVideo(activeWarning.categoryKey);
    }
  }

  function handleSkipToEnd() {
    if (activeWarning) {
      dispatch('skipToEnd', activeWarning);
      onSkipToEnd(activeWarning);
    }
  }

  function handleProtectionStart() {
    isProtectionActive = true;
    showWarningBanner = false;
    dispatch('protectionStart');
  }

  // Lifecycle
  onMount(() => {
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);
  });

  onDestroy(() => {
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);
  });
</script>

<!-- Main Overlay Container -->
<div
  class="watching-overlay"
  class:dragging={isDragging}
  class:expanded={shouldShowExpanded}
  class:helper-mode={helperMode}
  style="left: {position.x}px; top: {position.y}px;"
  bind:this={overlayRef}
  on:mouseenter={() => (isHovering = true)}
  on:mouseleave={() => (isHovering = false)}
  role="region"
  aria-label="Trigger Warnings Overlay"
>
  <!-- Compact View (Default) -->
  <div
    class="compact-view"
    on:mousedown={handleDragStart}
    on:touchstart={handleDragStart}
    role="button"
    tabindex="0"
    aria-label="Drag to move, hover to expand"
  >
    <span class="status-icon">{statusIcon}</span>
    {#if !shouldShowExpanded}
      <span
        class="status-dot"
        class:protected={status === 'protected'}
        class:partial={status === 'overall-only'}
      ></span>
    {/if}
  </div>

  <!-- Expanded View -->
  {#if shouldShowExpanded}
    <div
      class="expanded-view"
      class:horizontal={expandDirection === 'horizontal'}
      class:vertical={expandDirection === 'vertical'}
      in:slide={{ duration: 200, easing: quintOut }}
      out:slide={{ duration: 150 }}
    >
      <!-- Status Display -->
      <div class="status-section">
        <span class="status-text">{statusText}</span>
      </div>

      <!-- Toolbox Actions -->
      <div class="toolbox">
        <!-- Add Trigger Button -->
        <button
          class="action-btn add-trigger"
          on:click={handleAddTrigger}
          title="Add a trigger timestamp"
        >
          <span class="btn-icon">+</span>
        </button>

        {#if helperMode}
          <span class="helper-badge">Helper</span>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Warning Banner (shows when trigger is approaching) -->
{#if showWarningBanner && activeWarning && categoryInfo}
  <div
    class="warning-banner"
    in:fly={{ y: -50, duration: 400, easing: backOut }}
    out:fade={{ duration: 200 }}
  >
    <div class="warning-content">
      <!-- Countdown -->
      <div class="countdown-section">
        <div class="countdown-ring">
          <svg viewBox="0 0 36 36" class="countdown-svg">
            <path
              class="countdown-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="countdown-progress"
              stroke-dasharray="{(countdownSeconds / 10) * 100}, 100"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span class="countdown-number">{countdownSeconds}</span>
        </div>
      </div>

      <!-- Warning Info -->
      <div class="warning-info">
        <div class="warning-header">
          <span class="warning-icon">{categoryInfo.icon}</span>
          <span class="warning-title">{categoryInfo.name}</span>
        </div>
        <p class="warning-subtitle">Trigger warning in {countdownSeconds}s</p>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button
          class="quick-action-btn ignore-once"
          on:click={handleIgnoreThisTime}
          title="Ignore this occurrence"
        >
          Ignore
        </button>
        <button
          class="quick-action-btn ignore-all"
          on:click={handleIgnoreAllVideo}
          title="Ignore all {categoryInfo.name} warnings in this video"
        >
          Ignore All
        </button>
        <button
          class="quick-action-btn skip-now"
          on:click={handleSkipToEnd}
          title="Skip to after this trigger"
        >
          Skip →
        </button>
      </div>
    </div>

    <!-- Protection Mode Label -->
    <div class="protection-label">
      {#if protectionType === 'hide'}
        🖤 Screen will black out
      {:else if protectionType === 'mute'}
        🔇 Audio will mute
      {:else if protectionType === 'mute-and-hide'}
        🖤🔇 Screen + audio protection
      {:else if protectionType === 'skip'}
        ⏭️ Will skip automatically
      {:else}
        ⚠️ Warning only
      {/if}
    </div>
  </div>
{/if}

<!-- Protection Overlay (when trigger is active) -->
{#if isProtectionActive && (protectionType === 'hide' || protectionType === 'mute-and-hide')}
  <div class="protection-overlay" in:fade={{ duration: 300 }} out:fade={{ duration: 500 }}>
    <div class="protection-content" in:scale={{ duration: 400, delay: 100, easing: elasticOut }}>
      <span class="protection-icon">🛡️</span>
      <p class="protection-text">Content temporarily hidden for your safety</p>
      {#if activeWarning && categoryInfo}
        <p class="protection-category">{categoryInfo.name}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Main Overlay */
  .watching-overlay {
    position: fixed;
    z-index: 2147483646;
    display: flex;
    align-items: flex-start;
    gap: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    pointer-events: auto;
    transition: transform 0.1s ease;
  }

  .watching-overlay.dragging {
    cursor: grabbing;
    transform: scale(1.05);
  }

  /* Compact View */
  .compact-view {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
    backdrop-filter: blur(12px);
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    cursor: grab;
    position: relative;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .compact-view:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }

  .status-icon {
    font-size: 1.25rem;
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
  }

  .status-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #6b7280;
    border: 2px solid rgba(15, 23, 42, 0.9);
  }

  .status-dot.protected {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  }

  .status-dot.partial {
    background: #fbbf24;
    box-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
  }

  /* Expanded View */
  .expanded-view {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
    backdrop-filter: blur(12px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    margin-left: -4px;
    color: white;
  }

  .expanded-view.vertical {
    flex-direction: column;
    margin-left: 0;
    margin-top: -4px;
  }

  .status-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-text {
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
  }

  .toolbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition:
      transform 0.2s,
      background 0.2s;
  }

  .add-trigger {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .add-trigger:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .btn-icon {
    line-height: 1;
  }

  .helper-badge {
    font-size: 0.65rem;
    background: rgba(139, 92, 246, 0.3);
    color: #c4b5fd;
    padding: 0.125rem 0.375rem;
    border-radius: 50px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .helper-mode .compact-view {
    border-color: rgba(139, 92, 246, 0.4);
  }

  /* Warning Banner */
  .warning-banner {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2147483647;
    min-width: 320px;
    max-width: 90vw;
    background: linear-gradient(145deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95));
    backdrop-filter: blur(16px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 20px 50px rgba(239, 68, 68, 0.3);
    padding: 1rem;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .warning-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  /* Countdown Ring */
  .countdown-section {
    flex-shrink: 0;
  }

  .countdown-ring {
    position: relative;
    width: 48px;
    height: 48px;
  }

  .countdown-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .countdown-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.2);
    stroke-width: 3;
  }

  .countdown-progress {
    fill: none;
    stroke: white;
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dasharray 0.3s ease;
  }

  .countdown-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.125rem;
    font-weight: 700;
  }

  /* Warning Info */
  .warning-info {
    flex: 1;
    min-width: 120px;
  }

  .warning-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .warning-icon {
    font-size: 1.25rem;
  }

  .warning-title {
    font-size: 1rem;
    font-weight: 600;
  }

  .warning-subtitle {
    font-size: 0.8rem;
    opacity: 0.9;
    margin: 0.25rem 0 0;
  }

  /* Quick Actions */
  .quick-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .quick-action-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .quick-action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .skip-now {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .skip-now:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .protection-label {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 0.75rem;
    text-align: center;
    opacity: 0.9;
  }

  /* Protection Overlay */
  .protection-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483645;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .protection-content {
    text-align: center;
    color: white;
  }

  .protection-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1rem;
    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5));
  }

  .protection-text {
    font-size: 1.25rem;
    font-weight: 500;
    margin: 0 0 0.5rem;
    opacity: 0.9;
  }

  .protection-category {
    font-size: 0.875rem;
    opacity: 0.7;
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .warning-banner {
      min-width: auto;
      width: calc(100% - 32px);
      left: 16px;
      transform: none;
    }

    .warning-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .quick-actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
</style>
