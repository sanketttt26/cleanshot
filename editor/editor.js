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
    gradient: 'purple-blue', // or 'custom'
    solidColor: '#1a1a2e',
    bgImage: null,
    padding: 60,
    borderRadius: 16,
    shadow: true,
    alignment: 'center',
    exportFormat: 'png',
    customGradient: {
      type: 'linear',
      angle: 135,
      stops: [
        { offset: 0, color: '#667eea' },
        { offset: 1, color: '#764ba2' }
      ]
    }
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
let customGradientManager = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  cacheElements();
  await loadSettings();
  setupEventListeners();
  
  // Initialize custom gradient manager
  customGradientManager = new CustomGradientManager();
  
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
    imageUploadGroup: document.getElementById('image-upload-group'),
    
    // Custom Gradient Elements
    customGradientBtn: document.getElementById('custom-gradient-btn'),
    customGradientEditor: document.getElementById('custom-gradient-editor'),
    gradientTrack: document.getElementById('gradient-track'),
    stopColor: document.getElementById('stop-color'),
    stopColorHex: document.getElementById('stop-color-hex'),
    stopPosition: document.getElementById('stop-position'),
    gradientAngle: document.getElementById('gradient-angle'),
    gradientType: document.getElementById('gradient-type')
  };
}

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['framySettings']);
    if (result.framySettings) {
      // Merge saved settings with default state, preserving nested customGradient
      const saved = result.framySettings;
      state.settings = { 
        ...state.settings, 
        ...saved,
        customGradient: {
          ...state.settings.customGradient,
          ...(saved.customGradient || {})
        }
      };
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
  
  // Update custom gradient UI
  if (customGradientManager) {
    customGradientManager.updateUI();
  }
  
  updateActiveButtons();
}

function updateActiveButtons() {
  document.querySelectorAll('.bg-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === state.settings.bgType);
  });
  
  document.querySelectorAll('.preset-btn').forEach(btn => {
    if (btn.id === 'custom-gradient-btn') {
      btn.classList.toggle('active', state.settings.gradient === 'custom');
    } else {
      btn.classList.toggle('active', btn.dataset.gradient === state.settings.gradient);
    }
  });
  
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.format === state.settings.exportFormat);
  });
  
  elements.gradientPresets.classList.toggle('hidden', state.settings.bgType !== 'gradient');
  elements.solidColorGroup.classList.toggle('hidden', state.settings.bgType !== 'solid');
  elements.imageUploadGroup.classList.toggle('hidden', state.settings.bgType !== 'image');
  
  // Show/Hide custom gradient editor
  elements.customGradientEditor.classList.toggle('hidden', 
    state.settings.bgType !== 'gradient' || state.settings.gradient !== 'custom');
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
      if (btn.id === 'custom-gradient-btn') {
        state.settings.gradient = 'custom';
      } else {
        state.settings.gradient = btn.dataset.gradient;
      }
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

  // Number spinner buttons
  document.querySelectorAll('.spinner-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.dataset.target;
      const step = parseInt(btn.dataset.step) || 1;
      const input = document.getElementById(targetId);
      
      if (input) {
        const currentValue = parseInt(input.value) || 0;
        const min = parseInt(input.min) || 0;
        const max = parseInt(input.max) || 100;
        const newValue = Math.max(min, Math.min(max, currentValue + step));
        
        input.value = newValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
}

async function renderPreview() {
  if (!state.screenshot) return;

  try {
    const canvas = elements.previewCanvas;
    
    // Determine gradient colors
    let gradientColors;
    if (state.settings.gradient === 'custom') {
      gradientColors = state.settings.customGradient.stops;
    } else {
      gradientColors = GRADIENTS[state.settings.gradient] || GRADIENTS['purple-blue'];
    }

    const result = await CanvasRenderer.render(canvas, state.screenshot, {
      ...state.settings,
      gradientColors: gradientColors,
      cropBounds: state.cropBounds,
      // Pass custom angle and type if active
      angle: state.settings.gradient === 'custom' ? state.settings.customGradient.angle : 135,
      gradientType: state.settings.gradient === 'custom' ? state.settings.customGradient.type : 'linear'
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

/**
 * Custom Gradient Manager
 * Handles the logic for the custom gradient editor
 */
class CustomGradientManager {
  constructor() {
    this.selectedStopIndex = 0;
    this.isDragging = false;
    
    this.bindEvents();
    this.renderSlider();
  }
  
  bindEvents() {
    // Slider track click (add stop or select)
    elements.gradientTrack.addEventListener('mousedown', (e) => {
      if (e.target === elements.gradientTrack) {
        // Calculate position
        const rect = elements.gradientTrack.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const offset = Math.max(0, Math.min(1, x / rect.width));
        
        // Add new stop
        this.addStop(offset);
      }
    });

    // Global mouse events for dragging
    document.addEventListener('mousemove', (e) => this.handleDrag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
    
    // Input changes
    elements.stopColor.addEventListener('input', (e) => this.updateSelectedStop({ color: e.target.value }));
    elements.stopColorHex.addEventListener('change', (e) => {
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        this.updateSelectedStop({ color: e.target.value });
      }
    });
    
    elements.stopPosition.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        this.updateSelectedStop({ offset: val / 100 });
      }
    });
    
    elements.gradientAngle.addEventListener('input', (e) => {
      const angle = parseInt(e.target.value) || 0;
      state.settings.customGradient.angle = angle;
      renderPreview();
    });
    
    elements.gradientAngle.addEventListener('change', (e) => {
      const angle = parseInt(e.target.value) || 0;
      state.settings.customGradient.angle = angle;
      saveSettings();
      renderPreview();
    });
    
    elements.gradientType.addEventListener('change', (e) => {
      state.settings.customGradient.type = e.target.value;
      saveSettings();
      renderPreview();
    });
  }
  
  renderSlider() {
    const track = elements.gradientTrack;
    const stops = state.settings.customGradient.stops;
    
    // Update track background
    const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);
    const gradientString = sortedStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ');
    track.style.background = `linear-gradient(to right, ${gradientString})`;
    
    // Clear existing handles
    track.innerHTML = '';
    
    // Create handles
    stops.forEach((stop, index) => {
      const handle = document.createElement('div');
      handle.className = `gradient-handle ${index === this.selectedStopIndex ? 'active' : ''}`;
      handle.style.left = `${stop.offset * 100}%`;
      handle.style.backgroundColor = stop.color;
      
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.selectedStopIndex = index;
        this.isDragging = true;
        this.updateUI();
      });
      
      // Double click to remove (if more than 2 stops)
      handle.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (stops.length > 2) {
          this.removeStop(index);
        }
      });
      
      track.appendChild(handle);
    });
  }
  
  updateUI() {
    this.renderSlider();
    
    const stop = state.settings.customGradient.stops[this.selectedStopIndex];
    if (stop) {
      elements.stopColor.value = stop.color;
      elements.stopColorHex.value = stop.color;
      elements.stopPosition.value = Math.round(stop.offset * 100);
    }
    
    elements.gradientAngle.value = state.settings.customGradient.angle;
    elements.gradientType.value = state.settings.customGradient.type;
  }
  
  handleDrag(e) {
    if (!this.isDragging) return;
    
    const rect = elements.gradientTrack.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let offset = Math.max(0, Math.min(1, x / rect.width));
    
    this.updateSelectedStop({ offset }, false); // Don't re-render slider completely while dragging for performance? Actually we need to to see preview
  }
  
  stopDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      saveSettings();
    }
  }
  
  addStop(offset) {
    // Interpolate color at this offset
    const color = this.getColorAtOffset(offset);
    
    state.settings.customGradient.stops.push({ offset, color });
    this.selectedStopIndex = state.settings.customGradient.stops.length - 1;
    
    this.updateUI();
    saveSettings();
    renderPreview();
  }
  
  removeStop(index) {
    state.settings.customGradient.stops.splice(index, 1);
    this.selectedStopIndex = Math.max(0, this.selectedStopIndex - 1);
    
    this.updateUI();
    saveSettings();
    renderPreview();
  }
  
  updateSelectedStop(updates, save = true) {
    const stop = state.settings.customGradient.stops[this.selectedStopIndex];
    Object.assign(stop, updates);
    
    this.updateUI();
    if (save) saveSettings();
    renderPreview();
  }
  
  getColorAtOffset(offset) {
    // Simple interpolation or just pick nearest neighbor for now
    // For better UX, we should interpolate between adjacent stops
    return '#ffffff'; 
  }
}
