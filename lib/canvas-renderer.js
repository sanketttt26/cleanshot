/**
 * Framy - Screenshot Background Extension
 * Canvas Renderer
 * Handles image composition with backgrounds, padding, shadows, etc.
 */

const CanvasRenderer = {
  /**
   * Render screenshot with background onto canvas
   * @param {HTMLCanvasElement} canvas - Target canvas element
   * @param {string} screenshotDataUrl - Base64 data URL of screenshot
   * @param {Object} options - Rendering options
   * @returns {Promise<boolean>} - Success status
   */
  async render(canvas, screenshotDataUrl, options) {
    const ctx = canvas.getContext('2d');
    
    // Load screenshot image
    const screenshot = await this.loadImage(screenshotDataUrl);
    
    // Handle cropping if bounds provided
    let srcX = 0, srcY = 0, srcWidth = screenshot.width, srcHeight = screenshot.height;
    if (options.cropBounds) {
      srcX = options.cropBounds.x;
      srcY = options.cropBounds.y;
      srcWidth = options.cropBounds.width;
      srcHeight = options.cropBounds.height;
    }

    // Calculate canvas dimensions
    const padding = options.padding || 60;
    const canvasWidth = srcWidth + (padding * 2);
    const canvasHeight = srcHeight + (padding * 2);

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw background
    await this.drawBackground(ctx, canvasWidth, canvasHeight, screenshot, options);

    // Calculate screenshot position based on alignment
    let screenshotY = padding;
    if (options.alignment === 'top') {
      screenshotY = padding / 2;
    } else if (options.alignment === 'bottom') {
      screenshotY = canvasHeight - srcHeight - (padding / 2);
    }

    // Draw shadow
    if (options.shadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;
      
      // Draw shadow-casting rectangle
      this.drawRoundedRect(ctx, padding, screenshotY, srcWidth, srcHeight, options.borderRadius || 0);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fill();
      ctx.restore();
    }

    // Draw screenshot with rounded corners
    ctx.save();
    this.drawRoundedRect(ctx, padding, screenshotY, srcWidth, srcHeight, options.borderRadius || 0);
    ctx.clip();
    
    // Draw the actual screenshot
    ctx.drawImage(
      screenshot,
      srcX, srcY, srcWidth, srcHeight,
      padding, screenshotY, srcWidth, srcHeight
    );
    ctx.restore();

    // Optional: Add subtle border
    if (options.borderRadius > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      this.drawRoundedRect(ctx, padding, screenshotY, srcWidth, srcHeight, options.borderRadius);
      ctx.stroke();
      ctx.restore();
    }

    return true;
  },

  /**
   * Draw background based on type
   */
  async drawBackground(ctx, width, height, screenshot, options) {
    switch (options.bgType) {
      case 'gradient':
        BackgroundEffects.createGradient(ctx, width, height, options.gradientColors || ['#667eea', '#764ba2']);
        break;
      
      case 'solid':
        BackgroundEffects.createSolidColor(ctx, width, height, options.solidColor || '#1a1a2e');
        break;
      
      case 'noise':
        BackgroundEffects.createGradient(ctx, width, height, options.gradientColors || ['#667eea', '#764ba2']);
        BackgroundEffects.addNoiseOverlay(ctx, width, height, 0.08);
        break;
      
      case 'blur':
        await BackgroundEffects.createBlurBackdrop(ctx, width, height, screenshot, options.padding || 60);
        break;
      
      case 'image':
        if (options.bgImage) {
          await BackgroundEffects.createImageBackground(ctx, width, height, options.bgImage);
        } else {
          BackgroundEffects.createGradient(ctx, width, height, ['#667eea', '#764ba2']);
        }
        break;
      
      default:
        BackgroundEffects.createGradient(ctx, width, height, ['#667eea', '#764ba2']);
    }
  },

  /**
   * Draw rounded rectangle path
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  /**
   * Load image from data URL
   */
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
};
