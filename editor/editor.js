/**
 * Framy Editor Script
 * Full-page editor for screenshot customization
 */

// State
let state = {
  screenshot: null,
  cropBounds: null,
  settings: {
    bgType: 'gradient',
    gradient: 'purple-blue',
    solidColor: '#1a1a2e',
    bgImage: null,
    padding: 60,
    borderRadius: 16,
    shadow: true,
    alignment: 'center',
    exportFormat: 'png'
  }
};

// Gradient definitions - Colorful
const GRADIENTS = {
  'purple-blue': ['#667eea', '#764ba2'],
  'teal-green': ['#11998e', '#38ef7d'],
  'orange-pink': ['#f093fb', '#f5576c'],
  'blue-cyan': ['#4facfe', '#00f2fe'],
  'sunset': ['#fa709a', '#fee140'],
  'dark': ['#0f0f0f', '#434343'],
  'ocean': ['#2193b0', '#6dd5ed'],
  'royal': ['#141e30', '#243b55']
};

// DOM Elements
let elements = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  cacheElements();
  await loadSettings();
  setupEventListeners();
  await loadPendingScreenshot();
});

function cacheElements() {
  elements = {
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

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['framySettings']);
    if (result.framySettings) {
      state.settings = { ...state.settings, ...result.framySettings };
    }
    applySettingsToUI();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveSettings() {
  try {
    await chrome.storage.local.set({ framySettings: state.settings });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

async function loadPendingScreenshot() {
  try {
    const result = await chrome.storage.local.get(['pendingScreenshot', 'pendingCropBounds']);
    if (result.pendingScreenshot) {
      state.screenshot = result.pendingScreenshot;
      state.cropBounds = result.pendingCropBounds || null;
      await chrome.storage.local.remove(['pendingScreenshot', 'pendingCropBounds']);
      await renderPreview();
    }
  } catch (error) {
    console.error('Error loading screenshot:', error);
  }
}

function applySettingsToUI() {
  elements.paddingSlider.value = state.settings.padding;
  elements.paddingValue.textContent = state.settings.padding + 'px';
  elements.radiusSlider.value = state.settings.borderRadius;
  elements.radiusValue.textContent = state.settings.borderRadius + 'px';
  elements.shadowToggle.checked = state.settings.shadow;
  elements.solidColor.value = state.settings.solidColor;
  elements.solidColorHex.value = state.settings.solidColor;
  updateActiveButtons();
}

function updateActiveButtons() {
  document.querySelectorAll('.bg-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === state.settings.bgType);
  });
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.gradient === state.settings.gradient);
  });
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.format === state.settings.exportFormat);
  });
  
  elements.gradientPresets.classList.toggle('hidden', state.settings.bgType !== 'gradient');
  elements.solidColorGroup.classList.toggle('hidden', state.settings.bgType !== 'solid');
  elements.imageUploadGroup.classList.toggle('hidden', state.settings.bgType !== 'image');
}

function setupEventListeners() {
  // Background type
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

  // Shadow
  elements.shadowToggle.addEventListener('change', (e) => {
    state.settings.shadow = e.target.checked;
    saveSettings();
    renderPreview();
  });

  // Solid color
  elements.solidColor.addEventListener('input', (e) => {
    state.settings.solidColor = e.target.value;
    elements.solidColorHex.value = e.target.value;
    renderPreview();
  });
  elements.solidColor.addEventListener('change', saveSettings);

  elements.solidColorHex.addEventListener('change', (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      state.settings.solidColor = e.target.value;
      elements.solidColor.value = e.target.value;
      saveSettings();
      renderPreview();
    }
  });

  // Image upload
  elements.uploadArea.addEventListener('click', () => elements.bgImageInput.click());
  elements.bgImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        state.settings.bgImage = ev.target.result;
        saveSettings();
        renderPreview();
      };
      reader.readAsDataURL(file);
    }
  });

  // Social presets
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

  // Export
  elements.copyClipboard.addEventListener('click', copyToClipboard);
  elements.downloadBtn.addEventListener('click', downloadImage);
}

async function renderPreview() {
  if (!state.screenshot) return;

  try {
    const canvas = elements.previewCanvas;
    const result = await CanvasRenderer.render(canvas, state.screenshot, {
      ...state.settings,
      gradientColors: GRADIENTS[state.settings.gradient] || GRADIENTS['purple-blue'],
      cropBounds: state.cropBounds
    });

    if (result) {
      canvas.classList.add('visible');
      elements.previewPlaceholder.classList.add('hidden');
    }
  } catch (error) {
    console.error('Render error:', error);
  }
}

function applySocialPreset(preset) {
  const presets = {
    twitter: { padding: 60, borderRadius: 12, shadow: true },
    linkedin: { padding: 80, borderRadius: 8, shadow: true },
    instagram: { padding: 100, borderRadius: 20, shadow: true },
    blog: { padding: 80, borderRadius: 16, shadow: true }
  };
  
  if (presets[preset]) {
    state.settings = { ...state.settings, ...presets[preset] };
    applySettingsToUI();
    saveSettings();
    renderPreview();
    showToast(`${preset} preset applied`, 'success');
  }
}

async function copyToClipboard() {
  if (!state.screenshot) {
    showToast('No screenshot to copy', 'error');
    return;
  }

  try {
    const canvas = elements.previewCanvas;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showToast('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Copy error:', error);
    showToast('Failed to copy', 'error');
  }
}

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

    chrome.downloads.download({ url: dataUrl, filename: filename, saveAs: true });
    showToast('Download started!', 'success');
  } catch (error) {
    console.error('Download error:', error);
    showToast('Failed to download', 'error');
  }
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}
