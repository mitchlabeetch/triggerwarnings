/**
 * Popup entry point
 */

import '../styles/global.css';

console.log('[TW] Popup entry point');

const appTarget = document.getElementById('app');
const bootLoader = document.getElementById('boot-loader');

if (bootLoader) bootLoader.innerHTML = '<h3>Initializing UI...</h3>';

async function mount() {
  if (!appTarget) return;

  try {
    const { default: Popup } = await import('./Popup.svelte');
    
    // Clear boot loader
    appTarget.innerHTML = '';
    
    new Popup({ target: appTarget });
    console.log('[TW] Popup mounted');
  } catch (e) {
    console.error('[TW] Failed to mount:', e);
    if (appTarget) {
      appTarget.innerHTML = `
        <div style="padding: 20px; color: red;">
          <h3>Error</h3>
          <pre>${e}</pre>
        </div>
      `;
    }
  }
}

mount();

export default {};