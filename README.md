# Framy - Screenshot Background Extension

A Chrome browser extension that captures screenshots and adds beautiful backgrounds with one click. Perfect for social media, blogs, and documentation.

![Framy Extension](icons/icon128.png)

## ✨ Features

### Screenshot Capture
- **Visible Tab** - Capture what's currently visible
- **Select Area** - Click and drag to capture a specific region

### Background Enhancement
- **Gradients** - Beautiful gradient presets (purple-blue, teal-green, sunset, etc.)
- **Solid Colors** - Pick any color you want
- **Noise/Grain** - Add subtle texture overlay
- **Blur Backdrop** - Blurred version of your screenshot as background
- **Custom Image** - Upload your own background image

### Customization
- Padding size slider (20-150px)
- Corner radius control (0-40px)
- Drop shadow toggle
- Alignment options (top, center, bottom)

### Export Options
- PNG, JPG, WebP formats
- Copy to clipboard
- Direct download

### Social Media Presets
- **Twitter/X** - Optimized for 1200×675
- **LinkedIn** - Professional look, 1200×627
- **Instagram** - Square format, 1080×1080
- **Dev Blog** - Wide format, 1600×900

### UI/UX
- Dark & Light theme
- Minimal, modern interface
- Smooth animations
- Settings persistence

---

## 🚀 Installation

### Load as Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `Framy` folder
5. The extension icon should appear in your toolbar

### Keyboard Shortcut

- **Alt + Shift + S** - Quick capture visible tab

### Context Menu

Right-click on any page → **Framy Screenshot** → Choose capture type

---

## 📖 Usage

1. Click the Framy icon in your browser toolbar
2. Click one of the capture buttons:
   - 📷 **Visible Tab** - Captures what you see
   - ✂️ **Select Area** - Draw a selection rectangle
3. Your screenshot appears in the preview with a default background
4. Customize using the controls:
   - Choose background type (gradient, solid, noise, blur, image)
   - Adjust padding and corner radius
   - Toggle shadow on/off
   - Set alignment
5. (Optional) Apply a social media preset
6. Choose export format (PNG, JPG, WebP)
7. Click **Download** or **Copy** to clipboard

---

## 🎨 How Background Rendering Works

1. **Capture**: Screenshot is captured using `chrome.tabs.captureVisibleTab()` as base64 PNG

2. **Canvas Setup**: 
   - Creates canvas with dimensions = screenshot + (2 × padding)
   - Background is drawn first

3. **Background Types**:
   - **Gradient**: Uses `ctx.createLinearGradient()` with color stops
   - **Solid**: Simple `ctx.fillRect()` with chosen color
   - **Noise**: Gradient + pixel manipulation for grain effect
   - **Blur**: Screenshot scaled up, blurred with CSS filter, darkened overlay
   - **Image**: Custom image scaled to cover canvas

4. **Screenshot Composition**:
   - Border radius applied using `ctx.clip()` with rounded rectangle path
   - Shadow drawn first using `ctx.shadowBlur` and `ctx.shadowOffsetY`
   - Screenshot drawn clipped to rounded rectangle

5. **Export**:
   - `canvas.toDataURL('image/png')` for PNG
   - `canvas.toDataURL('image/jpeg', 0.92)` for JPG
   - `canvas.toDataURL('image/webp', 0.92)` for WebP

---

## 📁 File Structure

```
Framy/
├── manifest.json          # Extension configuration (MV3)
├── background.js          # Service worker for capture logic
├── content.js             # Area selection overlay
├── popup/
│   ├── popup.html         # Popup UI structure
│   ├── popup.css          # Styles with dark/light theme
│   └── popup.js           # UI interactions and export
├── lib/
│   ├── canvas-renderer.js # Image composition engine
│   ├── background-effects.js # Gradient, noise, blur generators
│   ├── presets.js         # Social media presets
│   └── storage.js         # Chrome storage management
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🔒 Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab for screenshot |
| `tabs` | Query tab information |
| `storage` | Save user preferences |
| `scripting` | Inject content script for area selection |
| `contextMenus` | Add right-click menu options |
| `downloads` | Save exported images |

---

## 🛠️ Development

This extension uses:
- **Manifest V3** (latest Chrome extension format)
- **Vanilla JavaScript** (no build step required)
- **Canvas API** for image manipulation
- **Chrome Storage API** for persistence

### Extending

- Add new gradients in `lib/presets.js` → `GRADIENT_LIBRARY`
- Add social presets in `lib/presets.js` → `SOCIAL_PRESETS`
- Add background effects in `lib/background-effects.js`

---

## 📄 License

MIT License - Feel free to use and modify!

---

Made with ❤️ by sanketttt26
