/**
 * CleanShot - Screenshot Background Extension
 * Background Service Worker
 * Handles screenshot capture, context menus, and keyboard shortcuts
 */

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'cleanshot-capture',
    title: 'CleanShot Screenshot',
    contexts: ['page', 'selection', 'image']
  });

  chrome.contextMenus.create({
    id: 'capture-visible',
    parentId: 'cleanshot-capture',
    title: 'Capture Visible Tab',
    contexts: ['page', 'selection', 'image']
  });



  chrome.contextMenus.create({
    id: 'capture-area',
    parentId: 'cleanshot-capture',
    title: 'Select Area',
    contexts: ['page', 'selection', 'image']
  });

  console.log('CleanShot: Context menus created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleCaptureRequest(info.menuItemId, tab);
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-visible') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        handleCaptureRequest('capture-visible', tabs[0]);
      }
    });
  }
});

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureVisible') {
    captureVisibleTab().then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }



  if (message.action === 'captureArea') {
    initiateAreaSelection(sender.tab || message.tab).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === 'areaSelected') {
    captureSelectedArea(message.bounds, sender.tab).then(async (result) => {
      if (result && result.dataUrl) {
        await chrome.storage.local.set({ 
          pendingScreenshot: result.dataUrl,
          pendingCropBounds: result.bounds
        });
        openEditorTab();
      }
      sendResponse(result);
    }).catch(err => sendResponse({ error: err.message }));
    return true;
  }
});

/**
 * Open editor in new tab
 */
function openEditorTab() {
  chrome.tabs.create({ url: chrome.runtime.getURL('editor/editor.html') });
}

/**
 * Handle capture from context menu or keyboard
 */
async function handleCaptureRequest(type, tab) {
  try {
    let result;
    
    switch (type) {
      case 'capture-visible':
        result = await captureVisibleTab();
        break;

      case 'capture-area':
        await initiateAreaSelection(tab);
        return;
      default:
        return;
    }

    if (result && result.dataUrl) {
      await chrome.storage.local.set({ pendingScreenshot: result.dataUrl });
      openEditorTab();
    }
  } catch (error) {
    console.error('CleanShot: Capture error:', error);
  }
}

/**
 * Capture visible tab
 */
async function captureVisibleTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) throw new Error('No active tab found');
  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
    throw new Error('Cannot capture browser internal pages');
  }

  const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 });
  return { dataUrl, width: tab.width, height: tab.height };
}



/**
 * Start area selection
 */
async function initiateAreaSelection(tab) {
  if (!tab || !tab.id) {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  } catch (e) { /* already injected */ }

  await new Promise(resolve => setTimeout(resolve, 50));
  await chrome.tabs.sendMessage(tab.id, { action: 'startAreaSelection' });
  return { success: true };
}

/**
 * Capture selected area
 */
async function captureSelectedArea(bounds, tab) {
  const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 });
  return { dataUrl, bounds, requiresCrop: true };
}

console.log('CleanShot: Background service worker loaded');
