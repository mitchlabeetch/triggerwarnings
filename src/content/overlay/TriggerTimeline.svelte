<script lang="ts">
  import { onMount } from 'svelte';
  import type { IStreamingProvider } from '@shared/types/Provider.types';
  import type { ActiveWarning } from '@shared/types/Warning.types';

  export let provider: IStreamingProvider;
  export let warnings: ActiveWarning[] = [];

  let canvas: HTMLCanvasElement;
  let tooltip: HTMLDivElement;
  let tooltipVisible = false;
  let tooltipContent = '';
  let tooltipX = 0;

  let videoDuration = 0;

  onMount(() => {
    const videoElement = provider.getVideoElement();
    if (videoElement) {
      videoDuration = videoElement.duration;
      drawTimeline();

      videoElement.addEventListener('durationchange', handleDurationChange);
    }
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('durationchange', handleDurationChange);
      }
    };
  });

  function handleDurationChange() {
    const videoElement = provider.getVideoElement();
    if (videoElement) {
      videoDuration = videoElement.duration;
      drawTimeline();
    }
  }

  $: if (canvas && warnings.length > 0) {
    drawTimeline();
  }

  function drawTimeline() {
    const ctx = canvas.getContext('2d');
    if (!ctx || !videoDuration) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    warnings.forEach(warning => {
      const startX = (warning.startTime / videoDuration) * width;
      const endX = (warning.endTime / videoDuration) * width;

      ctx.fillStyle = getCategoryColor(warning.categoryKey);
      ctx.fillRect(startX, 0, endX - startX, height);
    });
  }

  function getCategoryColor(category: string): string {
    // Simple hashing for consistent colors
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return `#${"00000".substring(0, 6 - c.length)}${c}`;
  }

  function handleMouseMove(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = (x / rect.width) * videoDuration;

    const hoveredWarning = warnings.find(w => time >= w.startTime && time <= w.endTime);

    if (hoveredWarning) {
      tooltipVisible = true;
      tooltipContent = hoveredWarning.categoryName;
      tooltipX = event.clientX;
    } else {
      tooltipVisible = false;
    }
  }

  function handleMouseLeave() {
    tooltipVisible = false;
  }
</script>

<div class="timeline-container">
  <canvas
    bind:this={canvas}
    on:mousemove={handleMouseMove}
    on:mouseleave={handleMouseLeave}
    width="1000"
    height="10"
  ></canvas>

  {#if tooltipVisible}
    <div
      bind:this={tooltip}
      class="timeline-tooltip"
      style="left: {tooltipX}px;"
    >
      {tooltipContent}
    </div>
  {/if}
</div>

<style>
  .timeline-container {
    position: absolute;
    width: 100%;
    height: 10px; /* Adjust to match progress bar */
    bottom: var(--tw-timeline-bottom-offset, 45px);
    left: 0;
    z-index: 2147483647;
    pointer-events: all;
  }

  canvas {
    width: 100%;
    height: 100%;
  }

  .timeline-tooltip {
    position: fixed;
    transform: translateX(-50%);
    bottom: 60px; /* Position above the timeline */
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.9rem;
    white-space: nowrap;
  }
</style>
