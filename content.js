/**
 * Framy - Screenshot Background Extension
 * Content Script
 * Handles area selection overlay for capturing specific regions
 */

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.framyInjected) return;
  window.framyInjected = true;

  let isSelecting = false;
  let selectionOverlay = null;
  let selectionBox = null;
  let startX = 0;
  let startY = 0;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startAreaSelection') {
      startAreaSelection();
      sendResponse({ success: true });
    }
    return true;
  });

  /**
   * Initialize area selection mode
   */
  function startAreaSelection() {
    // Remove existing overlay if any
    removeSelectionOverlay();

    // Create overlay
    selectionOverlay = document.createElement('div');
    selectionOverlay.id = 'framy-selection-overlay';
    selectionOverlay.innerHTML = `
      <style>
        #framy-selection-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.4);
          cursor: crosshair;
          z-index: 2147483647;
          user-select: none;
        }
        #framy-selection-box {
          position: absolute;
          border: 2px dashed #fff;
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
          pointer-events: none;
        }
        #framy-selection-hint {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #000;
          color: #fff;
          padding: 14px 28px;
          border-radius: 8px;
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.3px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          z-index: 2147483647;
          animation: framy-fade-in 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        @keyframes framy-fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      </style>
      <div id="framy-selection-hint">
        Click and drag to select an area &bull; Press ESC to cancel
      </div>
    `;

    document.body.appendChild(selectionOverlay);

    // Add event listeners
    selectionOverlay.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);

    isSelecting = false;
  }

  /**
   * Handle mouse down - start selection
   */
  function onMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();

    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    // Create selection box
    selectionBox = document.createElement('div');
    selectionBox.id = 'framy-selection-box';
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionOverlay.appendChild(selectionBox);

    // Add move and up listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Handle mouse move - update selection box
   */
  function onMouseMove(e) {
    if (!isSelecting || !selectionBox) return;

    e.preventDefault();
    e.stopPropagation();

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  }

  /**
   * Handle mouse up - finish selection
   */
  function onMouseUp(e) {
    if (!isSelecting) return;

    e.preventDefault();
    e.stopPropagation();

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    const endX = e.clientX;
    const endY = e.clientY;

    // Calculate bounds (use devicePixelRatio for high DPI screens)
    const dpr = window.devicePixelRatio || 1;
    const bounds = {
      x: Math.min(startX, endX) * dpr,
      y: Math.min(startY, endY) * dpr,
      width: Math.abs(endX - startX) * dpr,
      height: Math.abs(endY - startY) * dpr
    };

    // Remove overlay first
    removeSelectionOverlay();
    isSelecting = false;

    // Only proceed if selection has some size
    if (bounds.width > 10 && bounds.height > 10) {
      // Delay to ensure overlay is removed before capture
      setTimeout(() => {
        // Send bounds to background script for capture
        chrome.runtime.sendMessage({
          action: 'areaSelected',
          bounds: bounds
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Framy: Error sending message:', chrome.runtime.lastError);
            return;
          }
          if (response && response.dataUrl) {
            // Store screenshot and trigger popup
            chrome.storage.local.set({ 
              pendingScreenshot: response.dataUrl,
              pendingCropBounds: bounds
            }, () => {
              // Open the editor popup
              chrome.runtime.sendMessage({
                action: 'openPopupWithScreenshot',
                dataUrl: response.dataUrl
              });
            });
          }
        });
      }, 150);
    }
  }

  /**
   * Handle keyboard events
   */
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      removeSelectionOverlay();
    }
  }

  /**
   * Remove selection overlay and cleanup
   */
  function removeSelectionOverlay() {
    if (selectionOverlay) {
      selectionOverlay.remove();
      selectionOverlay = null;
    }
    selectionBox = null;
    isSelecting = false;
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  console.log('Framy: Content script loaded');
})();
