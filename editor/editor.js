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
  },
  annotations: {
    items: [],           // Array of annotation objects
    activeTool: null,    // 'arrow', 'line', 'circle', 'rect'
    color: '#ff0000',    // Red default
    isDrawing: false,
    startPoint: null,
    currentShape: null   // Shape being drawn
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
let annotationManager = null;

// Undo/Redo history
let undoStack = [];
let redoStack = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  cacheElements();
  await loadSettings();
  setupEventListeners();
  
  // Initialize custom gradient manager
  customGradientManager = new CustomGradientManager();
  
  // Initialize annotation manager
  annotationManager = new AnnotationManager();
  
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
    gradientType: document.getElementById('gradient-type'),
    
    // Annotation Elements  
    annotationColorSlider: document.getElementById('annotation-color-slider'),
    annotationColorPreview: document.getElementById('annotation-color-preview'),
    previewContainer: document.getElementById('preview-container')
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
      
      // Draw annotations on top
      const ctx = canvas.getContext('2d');
      drawAnnotations(ctx);
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

/**
 * Annotation Manager
 * Handles drawing tools, color selection, and annotation rendering
 */
class AnnotationManager {
  constructor() {
    this.bindEvents();
    this.updateColorPreview();
  }
  
  bindEvents() {
    // Tool button clicks (only for drawing tools, not undo/redo)
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
    });
    
    // Undo/Redo button clicks
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undo());
    }
    if (redoBtn) {
      redoBtn.addEventListener('click', () => this.redo());
    }
    
    // Keyboard shortcuts for undo/redo
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.redo();
      }
    });
    
    // Color slider
    if (elements.annotationColorSlider) {
      elements.annotationColorSlider.addEventListener('input', (e) => {
        const hue = e.target.value;
        state.annotations.color = `hsl(${hue}, 100%, 50%)`;
        this.updateColorPreview();
      });
    }
    
    // Canvas mouse events for drawing
    const canvas = elements.previewCanvas;
    if (canvas) {
      canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
      canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    }
    
    // Don't initialize history yet - wait until first action is performed
    // This ensures undo button is disabled until there's something to undo
    this.updateUndoRedoButtons();
  }
  
  selectTool(tool) {
    if (!tool) return; // Safety check
    
    // Toggle off if same tool clicked
    if (state.annotations.activeTool === tool) {
      state.annotations.activeTool = null;
    } else {
      state.annotations.activeTool = tool;
    }
    
    // Update button states (only for drawing tools, not undo/redo)
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === state.annotations.activeTool);
    });
    
    // Change cursor when tool is active
    if (elements.previewCanvas) {
      elements.previewCanvas.style.cursor = state.annotations.activeTool ? 'crosshair' : 'default';
    }
  }
  
  updateColorPreview() {
    if (elements.annotationColorPreview) {
      elements.annotationColorPreview.style.background = state.annotations.color;
    }
  }
  
  getCanvasCoordinates(e) {
    const canvas = elements.previewCanvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }
  
  handleMouseDown(e) {
    if (!state.annotations.activeTool) return;
    
    const coords = this.getCanvasCoordinates(e);
    state.annotations.isDrawing = true;
    state.annotations.startPoint = coords;
  }
  
  handleMouseMove(e) {
    if (!state.annotations.isDrawing || !state.annotations.activeTool) return;
    
    const coords = this.getCanvasCoordinates(e);
    
    // Create temporary shape for preview
    state.annotations.currentShape = {
      type: state.annotations.activeTool,
      startX: state.annotations.startPoint.x,
      startY: state.annotations.startPoint.y,
      endX: coords.x,
      endY: coords.y,
      color: state.annotations.color
    };
    
    // Re-render with temp shape
    renderPreview();
  }
  
  handleMouseUp(e) {
    if (!state.annotations.isDrawing) return;
    
    const coords = this.getCanvasCoordinates(e);
    
    // Only add if there was actual movement
    const start = state.annotations.startPoint;
    const dx = Math.abs(coords.x - start.x);
    const dy = Math.abs(coords.y - start.y);
    
    if (dx > 5 || dy > 5) {
      // Add final annotation
      const annotation = {
        type: state.annotations.activeTool,
        startX: start.x,
        startY: start.y,
        endX: coords.x,
        endY: coords.y,
        color: state.annotations.color
      };
      
      // Save history BEFORE adding annotation (to enable undo)
      this.saveHistory();
      
      // Add annotation to items
      state.annotations.items.push(annotation);
      
      // Clear redo stack when a new action is performed
      redoStack = [];
      this.updateUndoRedoButtons();
    }
    
    // Reset drawing state
    state.annotations.isDrawing = false;
    state.annotations.startPoint = null;
    state.annotations.currentShape = null;
    
    renderPreview();
  }
  
  saveHistory() {
    // Deep clone the annotations items array
    const snapshot = JSON.parse(JSON.stringify(state.annotations.items));
    undoStack.push(snapshot);
    
    // Limit undo stack size to prevent memory issues (keep last 50 states)
    if (undoStack.length > 50) {
      undoStack.shift();
    }
    
    this.updateUndoRedoButtons();
  }
  
  undo() {
    if (undoStack.length === 0) return; // Can't undo if stack is empty
    
    // Save current state to redo stack
    const current = JSON.parse(JSON.stringify(state.annotations.items));
    redoStack.push(current);
    
    // Restore previous state from undo stack
    const previous = undoStack.pop();
    state.annotations.items = JSON.parse(JSON.stringify(previous));
    
    this.updateUndoRedoButtons();
    renderPreview();
  }
  
  redo() {
    if (redoStack.length === 0) return;
    
    // Save current state to undo stack
    const current = JSON.parse(JSON.stringify(state.annotations.items));
    undoStack.push(current);
    
    // Restore next state
    const next = redoStack.pop();
    state.annotations.items = JSON.parse(JSON.stringify(next));
    
    this.updateUndoRedoButtons();
    renderPreview();
  }
  
  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn) {
      // Disable undo button when undo stack is empty (no more states to undo to)
      // Initially, undo stack is empty until first action is performed
      undoBtn.disabled = undoStack.length === 0;
    }
    
    if (redoBtn) {
      // Disable redo button when redo stack is empty (no more states to redo)
      redoBtn.disabled = redoStack.length === 0;
    }
  }
}

/**
 * Draw annotations on canvas
 */
function drawAnnotations(ctx) {
  const padding = state.settings.padding;
  
  // Draw all saved annotations
  state.annotations.items.forEach(annotation => {
    drawAnnotation(ctx, annotation, padding);
  });
  
  // Draw current shape being drawn (preview)
  if (state.annotations.currentShape) {
    drawAnnotation(ctx, state.annotations.currentShape, padding);
  }
}

function drawAnnotation(ctx, annotation, padding) {
  ctx.save();
  ctx.strokeStyle = annotation.color;
  ctx.fillStyle = annotation.color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  switch (annotation.type) {
    case 'arrow':
      drawArrow(ctx, annotation);
      break;
    case 'line':
      drawLine(ctx, annotation);
      break;
    case 'circle':
      drawCircle(ctx, annotation);
      break;
    case 'rect':
      drawRect(ctx, annotation);
      break;
  }
  
  ctx.restore();
}

function drawArrow(ctx, annotation) {
  const { startX, startY, endX, endY } = annotation;
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  
  // Draw arrowhead
  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = 15;
  
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

function drawLine(ctx, annotation) {
  const { startX, startY, endX, endY } = annotation;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function drawCircle(ctx, annotation) {
  const { startX, startY, endX, endY } = annotation;
  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;
  const radiusX = Math.abs(endX - startX) / 2;
  const radiusY = Math.abs(endY - startY) / 2;
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.stroke();
}

function drawRect(ctx, annotation) {
  const { startX, startY, endX, endY } = annotation;
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  
  ctx.strokeRect(x, y, width, height);
}
