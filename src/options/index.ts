/**
 * Options page entry point
 */

import '../styles/global.css';

console.log('[TW] Options entry point');

const appTarget = document.getElementById('app');
const bootLoader = document.getElementById('boot-loader');

if (bootLoader) bootLoader.innerHTML = '<h3>Initializing UI...</h3>';

async function mount() {
  if (!appTarget) return;

  try {
    // Dynamic import to isolate component failures
    const { default: Options } = await import('./Options.svelte');
    
    // Clear boot loader
    appTarget.innerHTML = '';
    
    new Options({ target: appTarget });
    console.log('[TW] Options mounted');
  } catch (e) {
    console.error('[TW] Failed to mount Options:', e);
    if (appTarget) {
      appTarget.innerHTML = `
        <div style="padding: 20px; color: #dc2626; text-align: center; font-family: sans-serif;">
          <h3>Extension Error</h3>
          <p>Failed to load options page.</p>
          <pre style="background: #fee2e2; padding: 10px; text-align: left; border-radius: 4px; overflow: auto; max-width: 800px; margin: 20px auto;">${e}</pre>
        </div>
      `;
    }
  }
}

mount();

export default {};
