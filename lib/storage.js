/**
 * CleanShot - Screenshot Background Extension
 * Storage Manager
 * Handles persistence of settings, presets, and recent backgrounds
 */

const CleanShotStorage = {
  /**
   * Storage keys
   */
  KEYS: {
    SETTINGS: 'cleanShotSettings',
    THEME: 'cleanShotTheme',
    CUSTOM_PRESETS: 'cleanShotCustomPresets',
    RECENT_BACKGROUNDS: 'cleanShotRecentBackgrounds',
    PENDING_SCREENSHOT: 'pendingScreenshot',
    PENDING_CROP_BOUNDS: 'pendingCropBounds'
  },

  /**
   * Get settings from storage
   */
  async getSettings() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.SETTINGS);
      return result[this.KEYS.SETTINGS] || this.getDefaultSettings();
    } catch (error) {
      console.error('CleanShot: Error getting settings:', error);
      return this.getDefaultSettings();
    }
  },

  /**
   * Save settings to storage
   */
  async saveSettings(settings) {
    try {
      await chrome.storage.local.set({ [this.KEYS.SETTINGS]: settings });
      return true;
    } catch (error) {
      console.error('CleanShot: Error saving settings:', error);
      return false;
    }
  },

  /**
   * Get theme preference
   */
  async getTheme() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.THEME);
      return result[this.KEYS.THEME] || 'dark';
    } catch (error) {
      console.error('CleanShot: Error getting theme:', error);
      return 'dark';
    }
  },

  /**
   * Save theme preference
   */
  async saveTheme(theme) {
    try {
      await chrome.storage.local.set({ [this.KEYS.THEME]: theme });
      return true;
    } catch (error) {
      console.error('CleanShot: Error saving theme:', error);
      return false;
    }
  },

  /**
   * Get custom presets
   */
  async getCustomPresets() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.CUSTOM_PRESETS);
      return result[this.KEYS.CUSTOM_PRESETS] || [];
    } catch (error) {
      console.error('CleanShot: Error getting custom presets:', error);
      return [];
    }
  },

  /**
   * Save custom preset
   */
  async saveCustomPreset(name, settings) {
    try {
      const presets = await this.getCustomPresets();
      const existingIndex = presets.findIndex(p => p.name === name);
      
      const preset = {
        name,
        settings: { ...settings },
        createdAt: Date.now()
      };

      if (existingIndex >= 0) {
        presets[existingIndex] = preset;
      } else {
        presets.push(preset);
      }

      // Keep only last 20 presets
      const trimmedPresets = presets.slice(-20);
      
      await chrome.storage.local.set({ [this.KEYS.CUSTOM_PRESETS]: trimmedPresets });
      return true;
    } catch (error) {
      console.error('CleanShot: Error saving custom preset:', error);
      return false;
    }
  },

  /**
   * Delete custom preset
   */
  async deleteCustomPreset(name) {
    try {
      const presets = await this.getCustomPresets();
      const filtered = presets.filter(p => p.name !== name);
      await chrome.storage.local.set({ [this.KEYS.CUSTOM_PRESETS]: filtered });
      return true;
    } catch (error) {
      console.error('CleanShot: Error deleting custom preset:', error);
      return false;
    }
  },

  /**
   * Add to recent backgrounds
   */
  async addRecentBackground(background) {
    try {
      const result = await chrome.storage.local.get(this.KEYS.RECENT_BACKGROUNDS);
      let recents = result[this.KEYS.RECENT_BACKGROUNDS] || [];
      
      // Remove duplicate if exists
      recents = recents.filter(b => 
        JSON.stringify(b) !== JSON.stringify(background)
      );
      
      // Add to front
      recents.unshift(background);
      
      // Keep only last 10
      recents = recents.slice(0, 10);
      
      await chrome.storage.local.set({ [this.KEYS.RECENT_BACKGROUNDS]: recents });
      return true;
    } catch (error) {
      console.error('CleanShot: Error adding recent background:', error);
      return false;
    }
  },

  /**
   * Get recent backgrounds
   */
  async getRecentBackgrounds() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.RECENT_BACKGROUNDS);
      return result[this.KEYS.RECENT_BACKGROUNDS] || [];
    } catch (error) {
      console.error('CleanShot: Error getting recent backgrounds:', error);
      return [];
    }
  },

  /**
   * Clear all storage
   */
  async clearAll() {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('CleanShot: Error clearing storage:', error);
      return false;
    }
  },

  /**
   * Get storage usage info
   */
  async getStorageInfo() {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse();
      return {
        bytesInUse,
        maxBytes: chrome.storage.local.QUOTA_BYTES,
        percentUsed: (bytesInUse / chrome.storage.local.QUOTA_BYTES * 100).toFixed(2)
      };
    } catch (error) {
      console.error('CleanShot: Error getting storage info:', error);
      return null;
    }
  },

  /**
   * Default settings
   */
  getDefaultSettings() {
    return {
      bgType: 'gradient',
      gradient: 'dark',
      solidColor: '#1a1a2e',
      bgImage: null,
      padding: 60,
      borderRadius: 16,
      shadow: true,
      alignment: 'center',
      exportFormat: 'png'
    };
  }
};
