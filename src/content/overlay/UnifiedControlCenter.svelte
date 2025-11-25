<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import browser from 'webextension-polyfill';
  import type { ActiveWarning } from '@shared/types/Warning.types';
  import type { IStreamingProvider } from '@shared/types/Provider.types';

  export let warnings: ActiveWarning[] = [];
  export let provider: IStreamingProvider;

  let isHovered = false;
  let isExpanded = false;
  let isDragging = false;
  let activeTab = 'Upcoming';
  let nextTriggerText = '';
  let currentTime = 0;
  let isVertical = false;

  let expansionDirection: 'left' | 'right' | 'center' = 'center';

  const width = tweened(60, { duration: 300, easing: cubicOut });
  const height = tweened(60, { duration: 300, easing: cubicOut });

  let position = { x: window.innerWidth / 2 - 30, y: 50 };
  let offset = { x: 0, y: 0 };

  onMount(async () => {
    const data = await browser.storage.local.get('controlCenterPosition');
    if (data.controlCenterPosition) {
      position = data.controlCenterPosition;
    }
    const videoElement = provider.getVideoElement();
    if (videoElement) {
        videoElement.addEventListener('timeupdate', () => {
            currentTime = videoElement.currentTime;
        });
    }
  });

  $: {
    const upcomingWarnings = warnings.filter(w => w.startTime > currentTime);
    if (upcomingWarnings.length > 0) {
      const nextWarning = upcomingWarnings.sort((a, b) => a.startTime - b.startTime)[0];
      const timeToWarning = nextWarning.startTime - currentTime;
      const minutes = Math.floor(timeToWarning / 60);
      const seconds = Math.floor(timeToWarning % 60).toString().padStart(2, '0');
      nextTriggerText = `Next: ${nextWarning.categoryName} in ${minutes}:${seconds}`;
    } else {
      nextTriggerText = 'No upcoming triggers';
    }
  }

  $: {
    isVertical = position.x < 100 || position.x > window.innerWidth - 100;
    if (position.x < window.innerWidth / 3) expansionDirection = 'right';
    else if (position.x > (window.innerWidth / 3) * 2) expansionDirection = 'left';
    else expansionDirection = 'center';
  }

  function handleMouseEnter() {
    if (!isExpanded) {
      isHovered = true;
      if (!isVertical) width.set(300);
    }
  }

  function handleMouseLeave() {
    if (!isExpanded) {
      isHovered = false;
      if (!isVertical) width.set(60);
    }
  }

  function toggleExpand() {
    if (isDragging) return;
    isExpanded = !isExpanded;
    if (isExpanded) {
      if (isVertical) {
        height.set(400);
        width.set(80);
      } else {
        width.set(500);
        height.set(300);
      }
    } else {
      width.set(60);
      height.set(60);
      handleMouseLeave();
    }
    isHovered = false;
  }

  function handleMouseDown(event: MouseEvent) {
    if (event.target instanceof HTMLElement && event.target.closest('.drag-handle')) {
      isDragging = true;
      offset.x = event.clientX - position.x;
      offset.y = event.clientY - position.y;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (isDragging) {
      position.x = event.clientX - offset.x;
      position.y = event.clientY - offset.y;
    }
  }

  function handleMouseUp() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    browser.storage.local.set({ controlCenterPosition: position });
    setTimeout(() => { isDragging = false; }, 10);
  }
</script>

<div
  class="glass-pill-container"
  style="--pill-width: {$width}px; --pill-height: {$height}px; left: {position.x}px; bottom: var(--tw-dock-bottom-offset, 20px);"
  class:expanded={isExpanded}
  class:vertical={isVertical}
  class:expand-left={expansionDirection === 'left'}
  class:expand-right={expansionDirection === 'right'}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="drag-handle-area" on:mousedown={handleMouseDown}>
    {#if isHovered && !isExpanded}
      <div class="drag-handle">
        <span /><span /><span />
      </div>
    {/if}
  </div>

  <div class="glass-pill" on:click={toggleExpand}>
    {#if !isExpanded}
      <span class="default-text">
        {#if isHovered && !isVertical}
          {nextTriggerText}
        {:else}
          TW
        {/if}
      </span>
    {:else}
      <div class="dashboard">
        <div class="tabs">
          <button on:click|stopPropagation={() => activeTab = 'Upcoming'} class:active={activeTab === 'Upcoming'}>Upcoming</button>
          <button on:click|stopPropagation={() => activeTab = 'Report'} class:active={activeTab === 'Report'}>Report</button>
          <button on:click|stopPropagation={() => activeTab = 'Settings'} class:active={activeTab === 'Settings'}>Settings</button>
        </div>
        <div class="tab-content">
          {#if activeTab === 'Upcoming'}
            <div>Upcoming Triggers Content</div>
          {:else if activeTab === 'Report'}
            <div>Report a Trigger Content</div>
          {:else if activeTab === 'Settings'}
            <div>Settings Content</div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Base styles */
  .glass-pill-container {
    position: fixed;
    left: 0;
    width: var(--pill-width);
    height: var(--pill-height);
    z-index: 2147483647 !important;
    display: flex;
    justify-content: center;
  }

  .glass-pill {
    width: 100%;
    height: 100%;
    border-radius: 50px;
    background: rgba(10, 10, 20, 0.7);
    backdrop-filter: blur(12px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: sans-serif;
    font-size: 1.1rem;
    overflow: hidden;
    transition: all 0.3s cubic-out;
    cursor: pointer;
  }

  /* Drag handle */
  .drag-handle-area {
    position: absolute;
    top: -15px;
    height: 20px;
    width: 100%;
    cursor: move;
    display: flex;
    justify-content: center;
  }
  .drag-handle { display: flex; gap: 3px; padding: 4px; background: rgba(0,0,0,0.4); border-radius: 5px; }
  .drag-handle span { width: 4px; height: 4px; background-color: rgba(255,255,255,0.6); border-radius: 50%; }

  .default-text { white-space: nowrap; padding: 0 20px; }

  /* Expansion direction */
  .expanded.expand-left .glass-pill { transform-origin: right; }
  .expanded.expand-right .glass-pill { transform-origin: left; }

  /* Dashboard base */
  .dashboard {
    width: 100%;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    opacity: 0;
    animation: fadeIn 0.2s 0.2s forwards;
  }
  @keyframes fadeIn { to { opacity: 1; } }

  /* Horizontal Layout */
  .dashboard { flex-direction: column; }
  .tabs { display: flex; justify-content: space-around; border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 15px; }

  /* Vertical Layout */
  .vertical .dashboard { flex-direction: row; }
  .vertical .tabs { flex-direction: column; justify-content: flex-start; border-bottom: none; border-right: 1px solid rgba(255,255,255,0.3); margin-bottom: 0; margin-right: 15px; }
  .vertical .tabs button { text-align: left; }

  .tabs button { background: none; border: none; color: white; padding: 10px 15px; cursor: pointer; font-size: 1rem; opacity: 0.7; transition: opacity 0.2s; }
  .tabs button:hover { opacity: 1; }
  .tabs button.active { opacity: 1; border-bottom: 2px solid var(--tw-accent-color, white); }
  .vertical .tabs button.active { border-bottom: none; border-right: 2px solid var(--tw-accent-color, white); }

  .tab-content { flex-grow: 1; text-align: center; }
</style>
