<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ProtectionType } from '@shared/types/Profile.types';

  export let protectionType: ProtectionType = 'none';
  export let categoryName: string = '';
  export let warningDescription: string = '';
  export let isSafe: boolean = false; // New prop to control the curtain transition

  let isPeeking = false;

  $: showBlackout = protectionType === 'blackout' || protectionType === 'both';

  function handlePeekStart() {
    isPeeking = true;
  }

  function handlePeekEnd() {
    isPeeking = false;
  }

  function handleClick(event: MouseEvent) {
    // Prevent clicks from passing through to video player
    event.stopPropagation();
  }
</script>

{#if showBlackout}
  <div
    class="tw-protection-overlay"
    class:peeking={isPeeking}
    class:safe={isSafe}
    on:click={handleClick}
    role="presentation"
  >
    <div class="tw-protection-content">
      <!-- Content remains the same -->
      <div class="tw-protection-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
        </svg>
      </div>
      <div class="tw-protection-message">
        <h3>Protected Content</h3>
        {#if categoryName}
          <p class="tw-protection-category">{categoryName}</p>
        {/if}
        {#if warningDescription}
          <p class="tw-protection-description">{warningDescription}</p>
        {/if}
      </div>
    </div>

    <button
      class="tw-peek-button"
      on:mousedown={handlePeekStart}
      on:mouseup={handlePeekEnd}
      on:mouseleave={handlePeekEnd}
      on:touchstart={handlePeekStart}
      on:touchend={handlePeekEnd}
    >
      Hold to Peek
    </button>
  </div>
{/if}

<style>
  .tw-protection-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483646; /* High z-index */
    pointer-events: all;

    /* Curtain Effect */
    mask-image: radial-gradient(circle, black 0%, black 100%);
    mask-size: 1% 1%; /* Start small and transparent */
    mask-repeat: no-repeat;
    mask-position: center;
    transition: mask-size 0.8s cubic-bezier(0.7, 0, 0.3, 1), opacity 0.4s ease-in-out;
    opacity: 1;
  }

  .tw-protection-overlay.safe {
    mask-size: 300% 300%; /* Grow to reveal content */
    opacity: 0;
    pointer-events: none; /* Allow interaction when safe */
  }

  .tw-protection-overlay.peeking {
    opacity: 0.1 !important; /* Force opacity for peeking */
    transition: opacity 0.2s ease-in-out;
  }

  .tw-peek-button {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    border-radius: 20px;
    cursor: pointer;
    backdrop-filter: blur(5px);
    transition: background-color 0.2s;
  }

  .tw-peek-button:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  /* Keep existing styles for content */
  .tw-protection-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 32px;
    text-align: center;
    max-width: 500px;
  }

  .tw-protection-icon {
    color: rgba(255, 255, 255, 0.9);
    animation: tw-pulse 2s ease-in-out infinite;
  }

  @keyframes tw-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(0.95);
    }
  }

  .tw-protection-message {
    color: rgba(255, 255, 255, 0.95);
  }

  .tw-protection-message h3 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  .tw-protection-category {
    font-size: 16px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
  }

  .tw-protection-description {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
    max-width: 400px;
  }
</style>
