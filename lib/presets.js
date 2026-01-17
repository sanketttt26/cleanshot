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
 * Extended gradient library - Black & White focused
 */
const GRADIENT_LIBRARY = {
  // Dark gradients
  'dark': ['#0a0a0a', '#1a1a1a'],
  'midnight': ['#0f0f0f', '#2a2a2a'],
  'carbon': ['#1a1a1a', '#0a0a0a'],
  'slate': ['#1e1e1e', '#2d2d2d'],
  'noir': ['#000000', '#1a1a1a'],
  'charcoal': ['#2a2a2a', '#1a1a1a'],
  
  // Light gradients
  'snow': ['#f5f5f5', '#ffffff'],
  'silver': ['#e8e8e8', '#f8f8f8'],
  'pearl': ['#fafafa', '#f0f0f0'],
  'cream': ['#f8f8f8', '#efefef'],
  
  // Contrast gradients
  'monochrome': ['#000000', '#333333', '#000000'],
  'studio': ['#1a1a1a', '#0a0a0a', '#1a1a1a'],
  
  // Legacy color gradients (for users who want some color)
  'purple-blue': ['#667eea', '#764ba2'],
  'teal-green': ['#11998e', '#38ef7d'],
  'orange-pink': ['#f093fb', '#f5576c'],
  'blue-cyan': ['#4facfe', '#00f2fe'],
  'sunset': ['#fa709a', '#fee140']
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
