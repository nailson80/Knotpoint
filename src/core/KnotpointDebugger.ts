export class KnotpointDebugger {
  private static isEnabled = false;
  private static styleElement: HTMLStyleElement | null = null;

  public static enable(enabled: boolean = true) {
    if (this.isEnabled === enabled) return;
    this.isEnabled = enabled;

    if (enabled) {
      this.injectStyles();
    } else {
      this.removeStyles();
    }
  }

  private static injectStyles() {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'knotpoint-debug-styles';
    this.styleElement.innerHTML = `
      [data-knotpoint] {
        position: relative;
        transition: outline 0.2s ease-in-out;
      }

      /* Fit at original/max size */
      [data-knotpoint-status="max"] {
        outline: 2px solid #4CAF50 !important; /* Green */
      }

      /* Successfully shrunk to fit */
      [data-knotpoint-status="fit"] {
        outline: 2px solid #FFC107 !important; /* Yellow */
      }

      /* Hit the floor and triggered fallback */
      [data-knotpoint-status="min"] {
        outline: 2px solid #F44336 !important; /* Red */
      }

      /* Hover Tooltip displaying calculated font size */
      [data-knotpoint]:hover::after {
        content: var(--kp-font-size, "Unknown");
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-family: monospace;
        white-space: nowrap;
        pointer-events: none;
        z-index: 9999;
        margin-bottom: 4px;
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  private static removeStyles() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }
}