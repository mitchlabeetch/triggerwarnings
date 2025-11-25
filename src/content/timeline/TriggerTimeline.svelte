<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ActiveWarning } from '@shared/types/Warning.types';
  import { IStreamingProvider } from '@shared/types/Provider.types';

  export let provider: IStreamingProvider;
  export let warnings: ActiveWarning[] = [];

  let canvas: HTMLCanvasElement;
  let tooltip: HTMLDivElement;
  let tooltipText: string = '';

  let observer: MutationObserver | null = null;

  onMount(() => {
    const progressBar = provider.getProgressBar();
    if (progressBar) {
      progressBar.appendChild(canvas);
      progressBar.appendChild(tooltip);
      draw();
    }

    // Observe for changes in the progress bar to redraw
    observer = new MutationObserver(draw);
    if (progressBar) {
      observer.observe(progressBar, { attributes: true, childList: true, subtree: true });
    }
  });

  onDestroy(() => {
    if (observer) {
      observer.disconnect();
    }
    if (canvas) {
        canvas.remove();
    }
    if (tooltip) {
        tooltip.remove();
    }
  });

  function draw() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const progressBar = provider.getProgressBar();
    if (!progressBar) return;

    canvas.width = progressBar.clientWidth;
    canvas.height = progressBar.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    warnings.forEach(warning => {
      const startPercent = warning.startTime / (provider.getVideoElement()?.duration || 1);
      const endPercent = warning.endTime / (provider.getVideoElement()?.duration || 1);

      const startX = startPercent * canvas.width;
      const endX = endPercent * canvas.width;

      ctx.fillStyle = getCategoryColor(warning.categoryKey);
      ctx.fillRect(startX, 0, endX - startX, canvas.height);
    });
  }

  function handleMouseMove(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = x / canvas.width;
    const time = percent * (provider.getVideoElement()?.duration || 0);

    const hoveredWarning = warnings.find(w => time >= w.startTime && time <= w.endTime);

    if (hoveredWarning) {
      tooltipText = hoveredWarning.categoryName;
      tooltip.style.left = `${x}px`;
      tooltip.style.visibility = 'visible';
    } else {
      tooltip.style.visibility = 'hidden';
    }
  }

  function handleMouseLeave() {
    tooltip.style.visibility = 'hidden';
  }

  function getCategoryColor(category: string): string {
    // Basic color mapping - can be expanded
    const colors: { [key: string]: string } = {
        'violence': '#ff4d4d',
        'gore': '#b30000',
        'nudity': '#ffc107',
        'sexual_content': '#e91e63',
        'profanity': '#9c27b0',
        'drug_use': '#4caf50',
    };
    return colors[category] || '#ffffff';
  }
</script>

<canvas
  bind:this={canvas}
  on:mousemove={handleMouseMove}
  on:mouseleave={handleMouseLeave}
></canvas>

<div bind:this={tooltip} class="timeline-tooltip">{tooltipText}</div>

<style>
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: all;
    z-index: 10;
  }
  .timeline-tooltip {
    position: absolute;
    top: -30px;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    visibility: hidden;
    pointer-events: none;
  }
</style>
