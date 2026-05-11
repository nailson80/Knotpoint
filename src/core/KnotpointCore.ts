/**
 * Parses element configuration attributes.
 */
export function getElementConfig(el: HTMLElement) {
  const compStyles = window.getComputedStyle(el);
  const baseFontSize = parseFloat(compStyles.fontSize) || 16;

  const minAttr = el.getAttribute('data-knotpoint-min');
  const maxAttr = el.getAttribute('data-knotpoint-max');
  const paddingAttr = el.getAttribute('data-knotpoint-padding');
  const fallbackAttr = el.getAttribute('data-knotpoint-fallback');
  const groupAttr = el.getAttribute('data-knotpoint-group');

  return {
    min: minAttr ? parseFloat(minAttr) : 12,
    max: maxAttr ? parseFloat(maxAttr) : baseFontSize,
    padding: paddingAttr ? parseFloat(paddingAttr) : 0,
    fallback: fallbackAttr === 'wrap' ? 'wrap' : 'ellipsis',
    group: groupAttr || null,
    // Original styles might be needed for the ghost element
    fontFamily: compStyles.fontFamily,
    fontWeight: compStyles.fontWeight,
    fontStyle: compStyles.fontStyle,
    letterSpacing: compStyles.letterSpacing,
    textTransform: compStyles.textTransform,
    lineHeight: compStyles.lineHeight,
  };
}

let ghostElement: HTMLElement | null = null;

function getGhostElement(): HTMLElement {
  if (!ghostElement) {
    ghostElement = document.createElement('div');
    ghostElement.style.position = 'absolute';
    ghostElement.style.visibility = 'hidden';
    ghostElement.style.pointerEvents = 'none';
    ghostElement.style.top = '-9999px';
    ghostElement.style.left = '-9999px';
    // Remove padding/margin
    ghostElement.style.margin = '0';
    ghostElement.style.padding = '0';
    document.body.appendChild(ghostElement);
  }
  return ghostElement;
}

/**
 * Uses a Ghost DOM element to measure if the text fits within maxW / maxH at given fontSize.
 */
function doesTextFit(text: string, fontSize: number, config: ReturnType<typeof getElementConfig>, maxW: number, maxH: number, isWrap: boolean = false): boolean {
  const ghost = getGhostElement();

  // Set styles
  ghost.style.fontFamily = config.fontFamily;
  ghost.style.fontWeight = config.fontWeight;
  ghost.style.fontStyle = config.fontStyle;
  ghost.style.letterSpacing = config.letterSpacing;
  ghost.style.textTransform = config.textTransform;
  ghost.style.lineHeight = config.lineHeight;
  ghost.style.fontSize = `${fontSize}px`;

  // Stage 1 (Shrink) should always measure text with nowrap so it tries to fit the string on a single line.
  // Word-wrapping should only be applied in Stage 2 if the text hits the min floor.
  if (isWrap) {
    ghost.style.width = `${maxW}px`;
    ghost.style.whiteSpace = 'normal';
    ghost.style.overflowWrap = 'break-word';
  } else {
    ghost.style.width = 'auto';
    ghost.style.whiteSpace = 'nowrap';
  }

  ghost.textContent = text;

  const width = ghost.scrollWidth;
  const height = ghost.scrollHeight;

  // Clear text
  ghost.textContent = '';

  // Epsilon for floating point rounding
  return width <= maxW + 1 && height <= maxH + 1;
}

/**
 * Calculates the best font size using Binary Search.
 */
export function calculateBestFit(el: HTMLElement): { fontSize: number, isMin: boolean, isOverflowing?: boolean } {
  const config = getElementConfig(el);
  const text = el.textContent || '';

  const compStyles = window.getComputedStyle(el);

  let elMaxWidth = parseFloat(compStyles.maxWidth);
  if (isNaN(elMaxWidth)) elMaxWidth = Infinity;

  let elMaxHeight = parseFloat(compStyles.maxHeight);
  if (isNaN(elMaxHeight)) elMaxHeight = Infinity;

  let baseW = el.clientWidth;
  let baseH = el.clientHeight;

  // If width is auto, max-content, min-content, fit-content or it's an inline element,
  // its clientWidth might shrink as we shrink font size.
  // We should try to determine the maximum available space.
  const isDynamicWidth = compStyles.width === 'auto' || compStyles.width.includes('content') || compStyles.display.includes('inline');
  const isDynamicHeight = compStyles.height === 'auto' || compStyles.height.includes('content') || compStyles.display.includes('inline');

  if (isDynamicWidth) {
    if (elMaxWidth !== Infinity) {
      baseW = elMaxWidth;
    } else if (el.parentElement) {
      const parentStyles = window.getComputedStyle(el.parentElement);
      const parentPadding = parseFloat(parentStyles.paddingLeft || '0') + parseFloat(parentStyles.paddingRight || '0');
      baseW = el.parentElement.clientWidth - parentPadding;
    }
  }

  if (isDynamicHeight) {
    if (elMaxHeight !== Infinity) {
      baseH = elMaxHeight;
    } else if (el.parentElement) {
      const parentStyles = window.getComputedStyle(el.parentElement);
      const parentPadding = parseFloat(parentStyles.paddingTop || '0') + parseFloat(parentStyles.paddingBottom || '0');
      baseH = el.parentElement.clientHeight - parentPadding;
    }
  }

  // Available dimensions minus padding (applied on both sides so we subtract 2 * padding)
  const maxW = Math.max(0, baseW - (config.padding * 2));
  const maxH = Math.max(0, baseH - (config.padding * 2));

  let low = config.min;
  let high = config.max;
  let bestFit = config.min;

  // If it fits at max, early return
  if (doesTextFit(text, high, config, maxW, maxH)) {
    return { fontSize: high, isMin: false };
  }

  // If it doesn't fit at min, return min
  if (!doesTextFit(text, low, config, maxW, maxH)) {
    return { fontSize: low, isMin: true };
  }

  // Binary search (O(log n)) for precision down to 0.5px
  const epsilon = 0.5;
  while (low <= high - epsilon) {
    const mid = low + (high - low) / 2;
    if (doesTextFit(text, mid, config, maxW, maxH)) {
      bestFit = mid;
      low = mid + epsilon; // try to find a bigger one
    } else {
      high = mid - epsilon; // try a smaller one
    }
  }

  // Ensure we round to nearest 0.5 to avoid weird fractional pixel rendering
  bestFit = Math.floor(bestFit * 2) / 2;

  const isMin = bestFit <= config.min;
  let isOverflowing = false;

  if (isMin && config.fallback === 'wrap') {
    // Stage 2 measurement: see if it fits vertically when wrapped
    if (!doesTextFit(text, bestFit, config, maxW, maxH, true)) {
      isOverflowing = true;
    }
  }

  // Return whether we hit the min limit (which triggers fallback)
  return { fontSize: bestFit, isMin, isOverflowing };
}