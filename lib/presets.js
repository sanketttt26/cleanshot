/**
 * CleanShot - Screenshot Background Extension
 * Presets Library
 * Pre-configured settings for social media and common use cases
 */

const SOCIAL_PRESETS = {
  twitter: {
    bgType: 'gradient',
    gradient: 'dark',
    padding: 60,
    borderRadius: 12,
    shadow: true,
    alignment: 'center',
    // Twitter optimal image size: 1200x675
    dimensions: { width: 1200, height: 675 }
  },
  
  linkedin: {
    bgType: 'gradient',
    gradient: 'slate',
    padding: 80,
    borderRadius: 8,
    shadow: true,
    alignment: 'center',
    // LinkedIn optimal image size: 1200x627
    dimensions: { width: 1200, height: 627 }
  },
  
  instagram: {
    bgType: 'gradient',
    gradient: 'noir',
    padding: 100,
    borderRadius: 20,
    shadow: true,
    alignment: 'center',
    // Instagram square: 1080x1080
    dimensions: { width: 1080, height: 1080 }
  },
  
  blog: {
    bgType: 'gradient',
    gradient: 'midnight',
    padding: 80,
    borderRadius: 16,
    shadow: true,
    alignment: 'center',
    // Blog header: 1600x900
    dimensions: { width: 1600, height: 900 }
  },
  
  minimal: {
    bgType: 'solid',
    solidColor: '#ffffff',
    padding: 40,
    borderRadius: 8,
    shadow: true,
    alignment: 'center'
  },
  
  dark: {
    bgType: 'solid',
    solidColor: '#000000',
    padding: 60,
    borderRadius: 12,
    shadow: true,
    alignment: 'center'
  },
  
  contrast: {
    bgType: 'gradient',
    gradient: 'carbon',
    padding: 80,
    borderRadius: 24,
    shadow: true,
    alignment: 'center'
  },
  
  clean: {
    bgType: 'gradient',
    gradient: 'silver',
    padding: 50,
    borderRadius: 10,
    shadow: false,
    alignment: 'center'
  }
};

/**
 * Extended gradient library - Vibrant color gradients
 */
const GRADIENT_LIBRARY = {
  // New vibrant gradients with multiple color stops
  'sunset': [
    { color: '#fff3d9', offset: 0 },
    { color: '#ff9b8a', offset: 0.25 },
    { color: '#ff5f61', offset: 0.5 },
    { color: '#d6303e', offset: 0.75 },
    { color: '#b51024', offset: 1 }
  ],
  'ocean': [
    { color: '#a0806d', offset: 0 },
    { color: '#6a9e8e', offset: 0.25 },
    { color: '#3a8a9a', offset: 0.5 },
    { color: '#0a5a75', offset: 0.75 },
    { color: '#001530', offset: 1 }
  ],
  'midnight': [
    { color: '#0a0a2e', offset: 0 },
    { color: '#2d5a6b', offset: 0.25 },
    { color: '#d4b85f', offset: 0.5 },
    { color: '#e08a2f', offset: 0.75 },
    { color: '#3d1600', offset: 1 }
  ],
  'fire': [
    { color: '#2d0a1a', offset: 0 },
    { color: '#8c280f', offset: 0.25 },
    { color: '#ff7a1a', offset: 0.5 },
    { color: '#ffd84a', offset: 0.75 },
    { color: '#ffff8a', offset: 1 }
  ],
  'purple': [
    { color: '#4f46b5', offset: 0 },
    { color: '#9b4db8', offset: 0.25 },
    { color: '#d45cb0', offset: 0.5 },
    { color: '#e8839e', offset: 0.75 },
    { color: '#f2b28b', offset: 1 }
  ],
  'tropical': [
    { color: '#0b9fe0', offset: 0 },
    { color: '#0fc4cb', offset: 0.25 },
    { color: '#1dd4b8', offset: 0.5 },
    { color: '#26e5a5', offset: 0.75 },
    { color: '#2ef092', offset: 1 }
  ],
  'sky': [
    { color: '#7ab8e8', offset: 0 },
    { color: '#94d4ff', offset: 0.25 },
    { color: '#a8dcff', offset: 0.5 },
    { color: '#bcd8ff', offset: 0.75 },
    { color: '#d0d4ff', offset: 1 }
  ],
  'cream': [
    { color: '#e8e8d0', offset: 0 },
    { color: '#fefed4', offset: 0.25 },
    { color: '#ffffdc', offset: 0.5 },
    { color: '#fffde0', offset: 0.75 },
    { color: '#f0eee8', offset: 1 }
  ]
};

/**
 * Get all available gradients
 */
function getAvailableGradients() {
  return Object.keys(GRADIENT_LIBRARY);
}

/**
 * Get gradient colors by name
 */
function getGradientColors(name) {
  return GRADIENT_LIBRARY[name] || GRADIENT_LIBRARY['dark'];
}

/**
 * Get preset by name
 */
function getPreset(name) {
  return SOCIAL_PRESETS[name] || SOCIAL_PRESETS['blog'];
}

/**
 * Get all preset names
 */
function getAvailablePresets() {
  return Object.keys(SOCIAL_PRESETS);
}
