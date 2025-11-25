console.log('[TW Offscreen] Offscreen document loaded');

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OFFSCREEN_PING') {
    sendResponse({ success: true, timestamp: Date.now() });
  }
});
