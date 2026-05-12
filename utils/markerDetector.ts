/**
 * Marker detection via structural analysis + color content detection.
 *
 * How it works:
 * 1. Detect if there's a marker-like structure (dark borders around lighter center)
 * 2. Analyze inner content for COLOR — correct markers have colored animal
 *    illustrations (pig, dog), incorrect ones are pure black & white geometry
 * 3. Fast: runs in < 30ms on any device
 */

export interface DetectionResult {
  markerFound: boolean;
  isCorrectMarker: boolean;
  confidence: number;
  details: string;
}

const STEP = 2; // sample every 2px for speed

/**
 * Main detection function. Pass in RGBA pixel data from a resized capture.
 */
export function detectMarker(
  pixels: Uint8Array,
  width: number,
  height: number
): DetectionResult {
  // Focus on center 60% of frame (where user aims the marker)
  const mx = Math.floor(width * 0.2);
  const my = Math.floor(height * 0.2);
  const mw = Math.floor(width * 0.6);
  const mh = Math.floor(height * 0.6);

  // ── Step 1: Border detection ──────────────────────────────────────────────
  const borderThick = Math.floor(Math.min(mw, mh) * 0.15);
  let outerDark = 0, outerTotal = 0;
  let innerLight = 0, innerTotal = 0;

  for (let y = my; y < my + mh; y += STEP) {
    for (let x = mx; x < mx + mw; x += STEP) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
      const inBorder =
        (x - mx) < borderThick || (mx + mw - x) < borderThick ||
        (y - my) < borderThick || (my + mh - y) < borderThick;

      if (inBorder) {
        outerTotal++;
        if (gray < 100) outerDark++;
      } else {
        innerTotal++;
        if (gray > 150) innerLight++;
      }
    }
  }

  const outerDarkRatio = outerTotal > 0 ? outerDark / outerTotal : 0;
  const innerLightRatio = innerTotal > 0 ? innerLight / innerTotal : 0;
  const hasMarkerBorder = outerDarkRatio > 0.30 && innerLightRatio > 0.25;

  if (!hasMarkerBorder) {
    return {
      markerFound: false,
      isCorrectMarker: false,
      confidence: 0,
      details: 'No marker structure detected',
    };
  }

  // ── Step 2: Color content analysis (inner area only) ──────────────────────
  // Correct markers have colored animal illustrations → measurable saturation
  // Incorrect markers are purely black & white → near-zero saturation
  const innerX = mx + borderThick + 2;
  const innerY = my + borderThick + 2;
  const innerW = mw - borderThick * 2 - 4;
  const innerH = mh - borderThick * 2 - 4;

  let colorfulPixels = 0;
  let analyzedPixels = 0;

  for (let y = innerY; y < innerY + innerH; y += STEP) {
    for (let x = innerX; x < innerX + innerW; x += STEP) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // Quick saturation check: a pixel is "colorful" if the color channels
      // differ significantly from each other (not gray)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      // Exclude very dark (< 30) and very bright (> 240) pixels
      // as they can't reliably show color
      if (max > 30 && max < 240 && diff > 25) {
        colorfulPixels++;
      }
      analyzedPixels++;
    }
  }

  const colorRatio = analyzedPixels > 0 ? colorfulPixels / analyzedPixels : 0;

  // ── Step 3: Decision ──────────────────────────────────────────────────────
  if (colorRatio > 0.02) {
    // Has colored content → correct marker (animal illustration present)
    return {
      markerFound: true,
      isCorrectMarker: true,
      confidence: Math.min(1, 0.5 + colorRatio * 6),
      details: `Correct marker (${(colorRatio * 100).toFixed(1)}% color)`,
    };
  }

  // No colored content → incorrect marker (just black & white geometry)
  return {
    markerFound: true,
    isCorrectMarker: false,
    confidence: 0.7,
    details: 'Incorrect marker - no color content',
  };
}