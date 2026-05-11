import { calculateBestFit, getElementConfig } from './KnotpointCore';

export class KnotpointManager {
  private mutationObserver: MutationObserver;
  private resizeObserver: ResizeObserver;

  private trackedElements: Set<HTMLElement> = new Set();
  private pendingUpdates: Set<HTMLElement> = new Set();
  private isProcessingElements: Set<HTMLElement> = new Set();
  private isUpdateScheduled: boolean = false;
  private isFontsReady: boolean = false;

  constructor() {
    this.mutationObserver = new MutationObserver(this.handleMutations.bind(this));
    this.resizeObserver = new ResizeObserver(this.debounce(this.handleResizes.bind(this), 100));

    // Wait for fonts to load
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        this.isFontsReady = true;
        this.scheduleUpdateAll();
      });
    } else {
      // Fallback if document.fonts is not supported
      this.isFontsReady = true;
      // Wait for next frame
      requestAnimationFrame(() => this.scheduleUpdateAll());
    }
  }

  public init() {
    // Automatically find all elements with data-knotpoint
    const elements = document.querySelectorAll<HTMLElement>('[data-knotpoint]');
    elements.forEach(el => this.observe(el));
  }

  public observe(el: HTMLElement) {
    if (this.trackedElements.has(el)) return;
    this.trackedElements.add(el);

    // Observe text changes
    this.mutationObserver.observe(el, { characterData: true, childList: true, subtree: true });
    // Observe resize changes
    this.resizeObserver.observe(el);

    this.scheduleUpdate(el);
  }

  public unobserve(el: HTMLElement) {
    this.trackedElements.delete(el);
    this.mutationObserver.disconnect(); // We have to re-observe everything else
    this.resizeObserver.unobserve(el);

    // Re-observe remaining elements
    this.trackedElements.forEach(trackedEl => {
      this.mutationObserver.observe(trackedEl, { characterData: true, childList: true, subtree: true });
    });
  }

  private handleMutations(mutations: MutationRecord[]) {
    mutations.forEach(mutation => {
      // Find closest tracked element
      let target = mutation.target as Node | null;
      while (target && target.nodeType !== Node.ELEMENT_NODE) {
        target = target.parentNode;
      }

      if (target && target instanceof HTMLElement) {
        const el = target.closest<HTMLElement>('[data-knotpoint]');
        if (el && this.trackedElements.has(el)) {
          if (this.isProcessingElements.has(el)) return;
          this.scheduleUpdate(el);
        }
      }
    });
  }

  private handleResizes(entries: ResizeObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.target instanceof HTMLElement && this.trackedElements.has(entry.target)) {
        if (this.isProcessingElements.has(entry.target)) return;
        this.scheduleUpdate(entry.target);
      }
    });
  }

  private scheduleUpdate(el: HTMLElement) {
    this.pendingUpdates.add(el);
    if (!this.isUpdateScheduled) {
      this.isUpdateScheduled = true;
      requestAnimationFrame(this.processUpdates.bind(this));
    }
  }

  private scheduleUpdateAll() {
    this.trackedElements.forEach(el => this.pendingUpdates.add(el));
    if (!this.isUpdateScheduled) {
      this.isUpdateScheduled = true;
      requestAnimationFrame(this.processUpdates.bind(this));
    }
  }

  private processUpdates() {
    this.isUpdateScheduled = false;
    if (!this.isFontsReady) {
      // Re-schedule until fonts are ready
      this.isUpdateScheduled = true;
      requestAnimationFrame(this.processUpdates.bind(this));
      return;
    }

    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();

    const groupMap = new Map<string, HTMLElement[]>();
    const standalone: HTMLElement[] = [];

    // Separate into standalone vs groups
    // If an element is updated and it belongs to a group, we should probably update the whole group
    // We will find all elements in the group that are tracked and calculate their best fit.

    // First, identify all groups that need updating
    const groupsToUpdate = new Set<string>();

    updates.forEach(el => {
      const config = getElementConfig(el);
      if (config.group) {
        groupsToUpdate.add(config.group);
      } else {
        standalone.push(el);
      }
    });

    // Process standalone elements
    standalone.forEach(el => {
      const { fontSize, isMin } = calculateBestFit(el);
      this.applyStyles(el, fontSize, isMin);
    });

    const processedGroupElements: HTMLElement[] = [];

    // Process groups
    groupsToUpdate.forEach(groupName => {
      // Find all tracked elements in this group
      const groupElements: HTMLElement[] = [];
      this.trackedElements.forEach(el => {
        if (getElementConfig(el).group === groupName) {
          groupElements.push(el);
          this.isProcessingElements.add(el);
          processedGroupElements.push(el);
        }
      });

      if (groupElements.length === 0) return;

      // Calculate best fit for all elements in the group
      let minFontSize = Infinity;
      const groupResults = groupElements.map(el => {
        const result = calculateBestFit(el);
        if (result.fontSize < minFontSize) {
          minFontSize = result.fontSize;
        }
        return { el, result };
      });

      // Apply the smallest valid font size to all elements in the group
      groupResults.forEach(({ el }) => {
        const config = getElementConfig(el);
        // Recalculate isMin based on the group minFontSize
        const isMin = minFontSize <= config.min;
        this.applyStyles(el, minFontSize, isMin);
      });
    });

    if (processedGroupElements.length > 0) {
      Promise.resolve().then(() => {
        processedGroupElements.forEach(el => this.isProcessingElements.delete(el));
      });
    }
  }

  private applyStyles(el: HTMLElement, fontSize: number, isMin: boolean) {
    const config = getElementConfig(el);

    // Set font size
    el.style.fontSize = `${fontSize}px`;

    const isMinStatus = Math.abs(fontSize - config.min) < 0.1;

    // Handle fallbacks if hit min size
    if (isMin) {
      if (config.fallback === 'wrap') {
        el.style.whiteSpace = 'normal';
        el.style.overflowWrap = 'break-word';
        // Reset text-overflow in case it was previously ellipsis
        el.style.textOverflow = 'clip';
      } else {
        // Default to ellipsis
        el.style.whiteSpace = 'nowrap';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
      }
      el.setAttribute('data-knotpoint-status', 'min');
    } else {
      // Reset fallback styles if we are above min size
      if (config.fallback === 'wrap') {
        el.style.whiteSpace = 'normal';
        el.style.overflowWrap = 'break-word';
        el.style.textOverflow = 'clip';
      } else {
        el.style.whiteSpace = 'nowrap';
        el.style.overflow = 'visible';
        el.style.textOverflow = 'clip';
      }

      const isMaxStatus = Math.abs(fontSize - config.max) < 0.1;
      el.setAttribute('data-knotpoint-status', isMaxStatus ? 'max' : (isMinStatus ? 'min' : 'fit'));
    }

    // We set a css variable for the debugger to read
    el.style.setProperty('--kp-font-size', `${fontSize}px`);

    // Dispatch ready event
    el.dispatchEvent(new CustomEvent('knotpoint:ready', { bubbles: true }));
  }

  // Utility for debouncing ResizeObserver callbacks
  private debounce(func: Function, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: any[]) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }
}