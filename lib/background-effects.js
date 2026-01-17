/**
 * CleanShot - Screenshot Background Extension
 * Background Effects
 * Various background generation functions: gradients, solid, noise, blur
 */

const BackgroundEffects = {
  /**
   * Create linear gradient background
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {string[]} colors - Array of color stops
   * @param {number} angle - Gradient angle in degrees (default 135)
   */
  createGradient(ctx, width, height, colors, angle = 135) {
    // Convert angle to radians and calculate gradient coordinates
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const length = Math.sqrt(width * width + height * height) / 2;
    
    const x1 = centerX - cos * length;
    const y1 = centerY - sin * length;
    const x2 = centerX + cos * length;
    const y2 = centerY + sin * length;
    
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    
    colors.forEach((color, index) => {
      if (typeof color === 'object' && color.color) {
        // Handle object stop: { color: '#fff', offset: 0.5 }
        gradient.addColorStop(color.offset, color.color);
      } else {
        // Handle simple string color
        gradient.addColorStop(index / (colors.length - 1), color);
      }
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  },

  /**
   * Create radial gradient background
   */
  createRadialGradient(ctx, width, height, colors) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.max(width, height) / 1.5;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    
    colors.forEach((color, index) => {
      if (typeof color === 'object' && color.color) {
        gradient.addColorStop(color.offset, color.color);
      } else {
        gradient.addColorStop(index / (colors.length - 1), color);
      }
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  },

  /**
   * Create solid color background
   */
  createSolidColor(ctx, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  },

  /**
   * Add noise overlay for grain effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} intensity - Noise intensity (0-1)
   */
  addNoiseOverlay(ctx, width, height, intensity = 0.05) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 255 * intensity;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));     // R
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // G
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // B
    }
    
    ctx.putImageData(imageData, 0, 0);
  },

  /**
   * Create blurred backdrop from screenshot
   */
  async createBlurBackdrop(ctx, width, height, screenshot, padding) {
    // Create temporary canvas for blur
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Scale up the screenshot to fill the background
    const scale = Math.max(
      width / screenshot.width,
      height / screenshot.height
    ) * 1.2;
    
    const scaledWidth = screenshot.width * scale;
    const scaledHeight = screenshot.height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    
    // Draw scaled screenshot
    tempCtx.drawImage(screenshot, offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Apply blur effect using CSS filter
    ctx.filter = 'blur(30px) saturate(1.2) brightness(0.7)';
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
    
    // Add subtle overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
  },

  /**
   * Create image background
   */
  async createImageBackground(ctx, width, height, imageDataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Cover the entire canvas
        const scale = Math.max(width / img.width, height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;
        
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
        resolve();
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  },

  /**
   * Create mesh gradient (more complex, aesthetic gradient)
   */
  createMeshGradient(ctx, width, height, colors) {
    // Base gradient
    this.createGradient(ctx, width, height, colors.slice(0, 2));
    
    // Add radial overlays for mesh effect
    if (colors.length > 2) {
      ctx.globalCompositeOperation = 'overlay';
      
      const gradient1 = ctx.createRadialGradient(
        width * 0.2, height * 0.3, 0,
        width * 0.2, height * 0.3, width * 0.5
      );
      gradient1.addColorStop(0, colors[2] || colors[0]);
      gradient1.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, width, height);
      
      if (colors.length > 3) {
        const gradient2 = ctx.createRadialGradient(
          width * 0.8, height * 0.7, 0,
          width * 0.8, height * 0.7, width * 0.4
        );
        gradient2.addColorStop(0, colors[3]);
        gradient2.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient2;
        ctx.fillRect(0, 0, width, height);
      }
      
      ctx.globalCompositeOperation = 'source-over';
    }
  }
};
