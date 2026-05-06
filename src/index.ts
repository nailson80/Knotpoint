import { KnotpointManager } from './core/KnotpointManager';
import { KnotpointDebugger } from './core/KnotpointDebugger';

const defaultManager = new KnotpointManager();

export const Knotpoint = {
  /**
   * Initializes the Knotpoint manager and automatically tracks [data-knotpoint] elements.
   */
  init: () => defaultManager.init(),

  /**
   * Manually observe a specific element.
   */
  observe: (el: HTMLElement) => defaultManager.observe(el),

  /**
   * Stop observing an element.
   */
  unobserve: (el: HTMLElement) => defaultManager.unobserve(el),

  /**
   * Enables or disables debug mode.
   * Highlights elements:
   *  - Green: Fits at original size
   *  - Yellow: Successfully shrunk to fit
   *  - Red: Hit min-size and triggered fallback
   */
  enableDebug: (enabled: boolean = true) => KnotpointDebugger.enable(enabled)
};

export default Knotpoint;