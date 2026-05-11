# 🎯 Knotpoint

**Knotpoint** is a lightweight, intelligent TypeScript library that automatically adjusts font sizes to fit text perfectly within its container. No more overflowing text, awkward line breaks, or manual font-size calculations. Knotpoint uses binary search and DOM measurement to find the optimal font size in real-time.

## ✨ Features

- **🔍 Smart Binary Search** – Efficiently calculates the perfect font size using binary search algorithm
- **📦 Automatic Tracking** – Observes elements with `data-knotpoint` attribute and handles changes automatically
- **🔄 Reactive Updates** – Responds to container resizing, text changes, and font loading
- **👥 Group Synchronization** – Keep multiple elements at the same font size by grouping them
- **🎨 Flexible Fallback** – Choose between ellipsis or word-wrap when text hits minimum size
- **🐛 Debug Mode** – Visual color-coded feedback (green/yellow/red) for sizing results
- **⚡ Performance Optimized** – Batched updates with `requestAnimationFrame`, debounced resize handling
- **🪶 Zero Dependencies** – Pure TypeScript, minimal footprint

## 📦 Installation

```bash
npm install knotpoint
```

Or via yarn:

```bash
yarn add knotpoint
```

## 🚀 Quick Start

### 1. Import and Initialize

```typescript
import Knotpoint from 'knotpoint';

// Initialize after DOM is ready
Knotpoint.init();
```

### 2. Add Data Attributes to Your HTML

```html
<div 
  class="box" 
  data-knotpoint
  data-knotpoint-min="12"
  data-knotpoint-max="32"
  data-knotpoint-padding="10"
>
  This text will automatically resize to fit!
</div>
```

That's it! Knotpoint will automatically adjust the font size as the container resizes or text changes.

## 🎛️ Configuration

Configure elements using data attributes:

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-knotpoint` | flag | - | **Required.** Marks element for Knotpoint tracking |
| `data-knotpoint-min` | number | `12` | Minimum font size in pixels |
| `data-knotpoint-max` | number | computed | Maximum font size (defaults to element's computed font size) |
| `data-knotpoint-padding` | number | `0` | Internal padding to subtract from available space (px) |
| `data-knotpoint-fallback` | `"ellipsis"` \| `"wrap"` | `"ellipsis"` | Behavior when text hits minimum size. Note that for `wrap`, we enforce `word-break: break-word` and `overflow: hidden` to guarantee that long words wrap properly instead of bleeding out. For `ellipsis`, we enforce `overflow: hidden` to ensure truncation cleanly occurs. |
| `data-knotpoint-group` | string | - | Group name for synchronized sizing across multiple elements |

### Example with All Options

```html
<div 
  data-knotpoint
  data-knotpoint-min="16"
  data-knotpoint-max="48"
  data-knotpoint-padding="20"
  data-knotpoint-fallback="wrap"
  data-knotpoint-group="headers"
>
  Custom Configuration
</div>
```

## 📖 API Reference

### `Knotpoint.init()`

Initializes Knotpoint and automatically tracks all elements with `[data-knotpoint]` attribute.

```typescript
Knotpoint.init();
```

### `Knotpoint.observe(element)`

Manually observe a specific element for font size adjustments.

```typescript
const myElement = document.querySelector('.my-element');
Knotpoint.observe(myElement);
```

### `Knotpoint.unobserve(element)`

Stop observing an element.

```typescript
Knotpoint.unobserve(myElement);
```

### `Knotpoint.enableDebug(enabled)`

Enable or disable debug mode. When enabled, elements are visually highlighted:
- **🟢 Green** – Text fits at original size (no adjustment needed)
- **🟡 Yellow** – Successfully shrunk to fit within bounds
- **🔴 Red** – Hit minimum size and triggered fallback behavior

```typescript
// Enable debug mode
Knotpoint.enableDebug(true);

// Disable debug mode
Knotpoint.enableDebug(false);
```

## 🎯 Use Cases

### Responsive Cards

```html
<div class="card" style="width: 200px; height: 100px;">
  <div 
    data-knotpoint
    data-knotpoint-min="14"
    data-knotpoint-max="24"
    data-knotpoint-padding="15"
  >
    Product Name That Might Be Long
  </div>
</div>
```

### Synchronized Headings

Keep multiple elements at the same font size using groups:

```html
<h2 
  data-knotpoint
  data-knotpoint-group="section-headers"
  data-knotpoint-min="18"
>
  Chapter One: The Beginning
</h2>

<h2 
  data-knotpoint
  data-knotpoint-group="section-headers"
  data-knotpoint-min="18"
>
  Chapter Two
</h2>
```

Both headers will automatically adjust to the same font size based on the most restrictive constraint.

### Dynamic Content

Knotpoint automatically responds to content changes:

```javascript
const element = document.querySelector('[data-knotpoint]');
element.textContent = 'New dynamic content!';
// Font size automatically recalculates
```

### Responsive Layouts

Knotpoint listens to container resize events:

```html
<div class="resizable-container" style="resize: both; overflow: auto;">
  <div data-knotpoint>
    This text adjusts as you resize the container!
  </div>
</div>
```

## 🏗️ How It Works

1. **Observation** – Uses `ResizeObserver` and `MutationObserver` to detect changes
2. **Measurement** – Creates a ghost DOM element to measure text dimensions at different font sizes
3. **Binary Search** – Efficiently finds the largest font size that fits within constraints
4. **Batching** – Groups updates using `requestAnimationFrame` for optimal performance
5. **Font Loading** – Waits for custom fonts to load before calculating sizes

## 🎨 Styling Tips

Knotpoint works best with:
- Fixed or explicitly set container dimensions
- `display: flex` with `align-items: center` for vertical centering
- Reasonable min/max ranges for smooth visual transitions

### Dynamic Width Elements
If your element's width is not fixed (for example, `width: auto` or `display: inline-flex`), Knotpoint calculates the available bounds based on its **`max-width`** (if explicitly set) or the **parent element's available width**. This prevents infinite shrinking loops, ensuring that your text maintains proper sizing while growing and shrinking dynamically!

## 🔧 Development

### Build

```bash
npm run build
```

### Dev Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

## 📄 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Issues

If you find a bug or have a feature request, please open an issue on [GitHub](https://github.com/nailson80/Knotpoint/issues).

## 🌟 Credits

Created with ❤️ using TypeScript, Vite, and modern browser APIs.

---

**Made for developers who value precision and performance in responsive typography.**
