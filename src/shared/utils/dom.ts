/**
 * DOM manipulation utilities
 */

/**
 * Wait for an element to appear in the DOM
 */
export function waitForElement<T extends Element>(
  selector: string,
  timeout = 10000
): Promise<T | null> {
  return new Promise((resolve) => {
    const element = document.querySelector<T>(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector<T>(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Check if element is in fullscreen mode
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

/**
 * Get the fullscreen element
 */
export function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  );
}

/**
 * Create a container for injecting Svelte components
 */
export function createContainer(id: string, className?: string): HTMLDivElement {
  const container = document.createElement('div');
  container.id = id;
  if (className) {
    container.className = className;
  }

  // AGGRESSIVE: Make container immune to player interference
  container.style.cssText = `
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    pointer-events: none !important;
    z-index: 2147483647 !important;
  `;

  // Prevent player from modifying our container
  Object.defineProperty(container.style, 'display', {
    set: () => {}, // Ignore attempts to hide
    get: () => 'block'
  });

  Object.defineProperty(container.style, 'visibility', {
    set: () => {}, // Ignore attempts to hide
    get: () => 'visible'
  });

  return container;
}

/**
 * Inject a container into the DOM at the appropriate location
 */
export function injectContainer(container: HTMLElement, parent?: HTMLElement): void {
  const targetParent = parent || document.body;

  // Ensure parent has position: relative for absolute positioned children
  const computedStyle = window.getComputedStyle(targetParent);
  if (computedStyle.position === 'static') {
    targetParent.style.position = 'relative';
  }

  targetParent.appendChild(container);

  // AGGRESSIVE: Monitor if container gets removed and re-inject it
  const containerObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.removedNodes.forEach((node) => {
          if (node === container) {
            // Player removed our container - put it back!
            console.warn('[TW] Container removed by player - re-injecting');
            targetParent.appendChild(container);
          }
        });
      }
    });
  });

  containerObserver.observe(targetParent, {
    childList: true,
    subtree: false
  });

  // Also set up periodic check to ensure container is still in DOM
  const checkInterval = setInterval(() => {
    if (!document.contains(container)) {
      console.warn('[TW] Container not in DOM - re-injecting');
      targetParent.appendChild(container);
    }
  }, 1000);

  // Store cleanup function on container for later use
  (container as any).__twCleanup = () => {
    containerObserver.disconnect();
    clearInterval(checkInterval);
  };
}
