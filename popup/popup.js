/**
 * Framy - Screenshot Background Extension
 * Popup Main Script
 * Handles UI interactions, preview updates, and exports
 */

// State
let state = {
  screenshot: null,
  cropBounds: null,
  settings: {
    bgType: 'gradient',
    gradient: 'dark',
    solidColor: '#1a1a2e',
    bgImage: null,
    padding: 60,
    borderRadius: 16,
    shadow: true,
    alignment: 'center',
    exportFormat: 'png'
  },
  theme: 'dark'
};

// Gradient definitions - Black & White focused
const GRADIENTS = {
  'dark': ['#0a0a0a', '#1a1a1a'],
  'midnight': ['#0f0f0f', '#2a2a2a'],
  'carbon': ['#1a1a1a', '#0a0a0a'],
  'snow': ['#f5f5f5', '#ffffff'],
  'silver': ['#e8e8e8', '#f8f8f8'],
  'slate': ['#1e1e1e', '#2d2d2d'],
  'noir': ['#000000', '#1a1a1a'],
  'charcoal': ['#2a2a2a', '#1a1a1a']
};

// DOM Elements
let elements = {};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  cacheElements();
  await loadSettings();
  setupEventListeners();
  await checkPendingScreenshot();
  applyTheme();
  
  // Notify background script that popup is opened (clears badge)
  chrome.runtime.sendMessage({ action: 'popupOpened' });
});

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
  elements = {
    app: document.getElementById('app'),
    themeToggle: document.getElementById('theme-toggle'),
    captureVisible: document.getElementById('capture-visible'),
    captureArea: document.getElementById('capture-area'),
    previewCanvas: document.getElementById('preview-canvas'),
    previewPlaceholder: document.getElementById('preview-placeholder'),
    paddingSlider: document.getElementById('padding-slider'),
    paddingValue: document.getElementById('padding-value'),
    radiusSlider: document.getElementById('radius-slider'),
    radiusValue: document.getElementById('radius-value'),
    shadowToggle: document.getElementById('shadow-toggle'),
    solidColor: document.getElementById('solid-color'),
    solidColorHex: document.getElementById('solid-color-hex'),
    bgImageInput: document.getElementById('bg-image-input'),
    uploadArea: document.getElementById('upload-area'),
    copyClipboard: document.getElementById('copy-clipboard'),
    downloadBtn: document.getElementById('download-btn'),
    gradientPresets: document.getElementById('gradient-presets'),
    solidColorGroup: document.getElementById('solid-color-group'),
    imageUploadGroup: document.getElementById('image-upload-group')
  };
}

/**
 * Load saved settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['framySettings', 'framyTheme']);
    if (result.framySettings) {
      state.settings = { ...state.settings, ...result.framySettings };
    }
    if (result.framyTheme) {
      state.theme = result.framyTheme;
    }
    applySettingsToUI();
  } catch (error) {
    console.error('Framy: Error loading settings:', error);
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  try {
    await chrome.storage.local.set({ 
      framySettings: state.settings,
      framyTheme: state.theme
    });
  } catch (error) {
    console.error('Framy: Error saving settings:', error);
  }
}

/**
 * Apply settings to UI elements
 */
function applySettingsToUI() {
  // Padding
  elements.paddingSlider.value = state.settings.padding;
  elements.paddingValue.textContent = state.settings.padding + 'px';

  // Border radius
  elements.radiusSlider.value = state.settings.borderRadius;
  elements.radiusValue.textContent = state.settings.borderRadius + 'px';

  // Shadow
  elements.shadowToggle.checked = state.settings.shadow;

  // Solid color
  elements.solidColor.value = state.settings.solidColor;
  elements.solidColorHex.value = state.settings.solidColor;

  // Update active buttons
  updateActiveButtons();
}

/**
 * Update active state of buttons based on current settings
 */
function updateActiveButtons() {
  // Background type buttons
  document.querySelectorAll('.bg-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === state.settings.bgType);
  });

  // Gradient presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.gradient === state.settings.gradient);
  });

  // Alignment buttons
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.align === state.settings.alignment);
  });

  // Format buttons
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.format === state.settings.exportFormat);
  });

  // Show/hide relevant controls
  elements.gradientPresets.classList.toggle('hidden', state.settings.bgType !== 'gradient');
  elements.solidColorGroup.classList.toggle('hidden', state.settings.bgType !== 'solid');
  elements.imageUploadGroup.classList.toggle('hidden', state.settings.bgType !== 'image');
}

/**
 * Check if there's a pending screenshot from context menu or keyboard shortcut
 */
async function checkPendingScreenshot() {
  try {
    const result = await chrome.storage.local.get(['pendingScreenshot', 'pendingCropBounds']);
    if (result.pendingScreenshot) {
      state.screenshot = result.pendingScreenshot;
      state.cropBounds = result.pendingCropBounds || null;
      
      // Clear pending data
      await chrome.storage.local.remove(['pendingScreenshot', 'pendingCropBounds']);
      
      // Render preview
      await renderPreview();
    }
  } catch (error) {
    console.error('Framy: Error checking pending screenshot:', error);
  }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Capture buttons
  elements.captureVisible.addEventListener('click', () => captureScreenshot('visible'));
  elements.captureArea.addEventListener('click', () => captureScreenshot('area'));

  // Background type buttons
  document.querySelectorAll('.bg-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.settings.bgType = btn.dataset.type;
      updateActiveButtons();
      saveSettings();
      renderPreview();
    });
  });

  // Gradient presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.settings.gradient = btn.dataset.gradient;
      updateActiveButtons();
      saveSettings();
      renderPreview();
    });
  });

  // Sliders
  elements.paddingSlider.addEventListener('input', (e) => {
    state.settings.padding = parseInt(e.target.value);
    elements.paddingValue.textContent = state.settings.padding + 'px';
    renderPreview();
  });

  elements.paddingSlider.addEventListener('change', saveSettings);

  elements.radiusSlider.addEventListener('input', (e) => {
    state.settings.borderRadius = parseInt(e.target.value);
    elements.radiusValue.textContent = state.settings.borderRadius + 'px';
    renderPreview();
  });

  elements.radiusSlider.addEventListener('change', saveSettings);

  // Shadow toggle
  elements.shadowToggle.addEventListener('change', (e) => {
    state.settings.shadow = e.target.checked;
    saveSettings();
    renderPreview();
  });

  // Alignment buttons
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.settings.alignment = btn.dataset.align;
      updateActiveButtons();
      saveSettings();
      renderPreview();
    });
  });

  // Solid color picker
  elements.solidColor.addEventListener('input', (e) => {
    state.settings.solidColor = e.target.value;
    elements.solidColorHex.value = e.target.value;
    renderPreview();
  });

  elements.solidColor.addEventListener('change', saveSettings);

  elements.solidColorHex.addEventListener('change', (e) => {
    const color = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      state.settings.solidColor = color;
      elements.solidColor.value = color;
      saveSettings();
      renderPreview();
    }
  });

  // Image upload
  elements.uploadArea.addEventListener('click', () => elements.bgImageInput.click());
  elements.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
  });
  elements.uploadArea.addEventListener('dragleave', () => {
    elements.uploadArea.classList.remove('dragover');
  });
  elements.uploadArea.addEventListener('drop', handleImageDrop);
  elements.bgImageInput.addEventListener('change', handleImageSelect);

  // Social media presets
  document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => applySocialPreset(btn.dataset.preset));
  });

  // Format buttons
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.settings.exportFormat = btn.dataset.format;
      updateActiveButtons();
      saveSettings();
    });
  });

  // Export buttons
  elements.copyClipboard.addEventListener('click', copyToClipboard);
  elements.downloadBtn.addEventListener('click', downloadImage);
}

/**
 * Toggle theme
 */
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  saveSettings();
}

/**
 * Apply current theme
 */
function applyTheme() {
  elements.app.classList.remove('theme-dark', 'theme-light');
  elements.app.classList.add(`theme-${state.theme}`);
}

/**
 * Capture screenshot
 */
async function captureScreenshot(type) {
  try {
    let response;

    switch (type) {
      case 'visible':
        response = await chrome.runtime.sendMessage({ action: 'captureVisible' });
        break;
      case 'area':
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.runtime.sendMessage({ action: 'captureArea', tab: activeTab });
        showToast('Select an area on the page', 'info');
        window.close(); // Close popup to allow selection
        return;
    }

    if (response && response.error) {
      showToast(response.error, 'error');
      return;
    }

    if (response && response.dataUrl) {
      state.screenshot = response.dataUrl;
      state.cropBounds = response.bounds || null;
      await renderPreview();
    }
  } catch (error) {
    console.error('Framy: Capture error:', error);
    showToast('Failed to capture screenshot', 'error');
  }
}

/**
 * Render preview with current settings
 */
async function renderPreview() {
  if (!state.screenshot) return;

  try {
    const canvas = elements.previewCanvas;
    const result = await CanvasRenderer.render(canvas, state.screenshot, {
      ...state.settings,
      gradientColors: GRADIENTS[state.settings.gradient] || GRADIENTS['dark'],
      cropBounds: state.cropBounds
    });

    if (result) {
      canvas.classList.add('visible');
      elements.previewPlaceholder.classList.add('hidden');
    }
  } catch (error) {
    console.error('Framy: Render error:', error);
  }
}

/**
 * Handle image drop for background
 */
function handleImageDrop(e) {
  e.preventDefault();
  elements.uploadArea.classList.remove('dragover');

  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadBackgroundImage(file);
  }
}

/**
 * Handle image selection for background
 */
function handleImageSelect(e) {
  const file = e.target.files[0];
  if (file) {
    loadBackgroundImage(file);
  }
}

/**
 * Load background image
 */
function loadBackgroundImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    state.settings.bgImage = e.target.result;
    elements.uploadArea.classList.add('has-image');
    elements.uploadArea.querySelector('.upload-text').textContent = file.name;
    saveSettings();
    renderPreview();
  };
  reader.readAsDataURL(file);
}

/**
 * Apply social media preset
 */
function applySocialPreset(preset) {
  const presetConfig = SOCIAL_PRESETS[preset];
  if (presetConfig) {
    state.settings = { ...state.settings, ...presetConfig };
    applySettingsToUI();
    updateActiveButtons();
    saveSettings();
    renderPreview();
    showToast(`Applied ${preset} preset`, 'success');
  }
}

/**
 * Copy image to clipboard
 */
async function copyToClipboard() {
  if (!state.screenshot) {
    showToast('No screenshot to copy', 'error');
    return;
  }

  try {
    const canvas = elements.previewCanvas;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);

    showToast('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Framy: Copy error:', error);
    showToast('Failed to copy', 'error');
  }
}

/**
 * Download image
 */
function downloadImage() {
  if (!state.screenshot) {
    showToast('No screenshot to download', 'error');
    return;
  }

  try {
    const canvas = elements.previewCanvas;
    const format = state.settings.exportFormat;
    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    const quality = format === 'png' ? undefined : 0.92;
    
    const dataUrl = canvas.toDataURL(mimeType, quality);
    const filename = `framy-screenshot-${Date.now()}.${format}`;

    // Use Chrome downloads API
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true
    });

    showToast('Download started!', 'success');
  } catch (error) {
    console.error('Framy: Download error:', error);
    showToast('Failed to download', 'error');
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
