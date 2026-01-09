/**
 * Framy - Capture Popup Script
 * Simple capture interface - opens editor in new tab
 */

document.getElementById('capture-visible').addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'captureVisible' });
    if (response && response.dataUrl) {
      await chrome.storage.local.set({ pendingScreenshot: response.dataUrl });
      chrome.tabs.create({ url: chrome.runtime.getURL('editor/editor.html') });
      window.close();
    } else if (response && response.error) {
      alert(response.error);
    }
  } catch (error) {
    console.error('Capture error:', error);
  }
});


document.getElementById('capture-area').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.runtime.sendMessage({ action: 'captureArea', tab });
    window.close(); // Close popup to allow area selection
  } catch (error) {
    console.error('Capture error:', error);
  }
});
