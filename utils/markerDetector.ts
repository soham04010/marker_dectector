import { MARKER_SPEC } from '../constants/markerSpec';

export interface BoundingBox {
  x: number;
  y: number;
  size: number;
}

export interface DetectionResult {
  detected: boolean;
  boundingBox?: BoundingBox;
  confidence: number;
}

// Sample every N pixels for speed
const STEP = 3;

// ─── Public API ───────────────────────────────────────────────────────────────
export function detectMarker(
  pixels: Uint8Array,
  width: number,
  height: number
): DetectionResult {
  const gray   = toGrayscale(pixels, width, height);
  const binary = threshold(gray, MARKER_SPEC.darkPixelThreshold);

  const minPx = Math.min(width, height) * MARKER_SPEC.minSizeRatio;
  const maxPx = Math.min(width, height) * MARKER_SPEC.maxSizeRatio;

  let best: DetectionResult = { detected: false, confidence: 0 };

  // Coarse scan grid — covers the whole image
  for (let y = 0; y < height - minPx; y += 8) {
    for (let x = 0; x < width - minPx; x += 8) {
      for (let sz = minPx; sz <= maxPx; sz += 10) {
        if (x + sz >= width || y + sz >= height) continue;

        const r = scoreMarker1(binary, width, x, y, sz);
        if (r.detected && r.confidence > best.confidence) {
          best = r;
          if (best.confidence > 0.92) return best; // good enough — exit early
        }
      }
    }
  }

  return best;
}

// ─── Marker 1 scoring ─────────────────────────────────────────────────────────
function scoreMarker1(
  bin: Uint8Array,
  width: number,
  x: number,
  y: number,
  size: number
): DetectionResult {
  const borderPx = size * (MARKER_SPEC.borderThickness / MARKER_SPEC.totalSize);

  // ── 1. All four borders must be dark ──────────────────────────────────────
  const topDark    = darkRatio(bin, width, x, y, x + size, y + borderPx);
  const bottomDark = darkRatio(bin, width, x, y + size - borderPx, x + size, y + size);
  const leftDark   = darkRatio(bin, width, x, y, x + borderPx, y + size);
  const rightDark  = darkRatio(bin, width, x + size - borderPx, y, x + size, y + size);

  const minBorder = MARKER_SPEC.minBorderDarkRatio;
  if (
    topDark < minBorder ||
    bottomDark < minBorder ||
    leftDark < minBorder ||
    rightDark < minBorder
  ) return fail();

  // ── 2. Inner area must be mostly white ────────────────────────────────────
  const ix1 = x + borderPx;
  const iy1 = y + borderPx;
  const ix2 = x + size - borderPx;
  const iy2 = y + size - borderPx;

  const innerDark = darkRatio(bin, width, ix1, iy1, ix2, iy2);
  if (1 - innerDark < MARKER_SPEC.minInnerWhiteRatio) return fail();

  // ── 3. Small black square at top-left of inner area ───────────────────────
  const innerSz    = ix2 - ix1;
  const sqOffRatio = MARKER_SPEC.innerSquare.offsetX / MARKER_SPEC.totalSize;
  const sqSzRatio  = MARKER_SPEC.innerSquare.size    / MARKER_SPEC.totalSize;

  const sqX1 = ix1 + innerSz * sqOffRatio;
  const sqY1 = iy1 + innerSz * sqOffRatio;
  const sqX2 = sqX1 + innerSz * sqSzRatio;
  const sqY2 = sqY1 + innerSz * sqSzRatio;

  const cornerDark = darkRatio(bin, width, sqX1, sqY1, sqX2, sqY2);
  if (cornerDark < MARKER_SPEC.minCornerDarkRatio) return fail();

  // ── 4. Area OUTSIDE the corner square must be mostly white ───────────────
  //    (This rejects things like a plain filled square)
  const restDark = darkRatio(bin, width, sqX2 + 4, iy1, ix2, iy2 * 0.65);
  if (restDark > 0.30) return fail();

  // ── Confidence score ──────────────────────────────────────────────────────
  const conf =
    0.20 +
    Math.min((topDark + bottomDark + leftDark + rightDark) / 4, 1) * 0.30 +
    (1 - innerDark) * 0.25 +
    cornerDark * 0.25;

  return {
    detected: true,
    boundingBox: { x: Math.round(x), y: Math.round(y), size: Math.round(size) },
    confidence: conf,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fail(): DetectionResult {
  return { detected: false, confidence: 0 };
}

function darkRatio(
  bin: Uint8Array,
  width: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  let dark = 0, total = 0;
  for (let py = Math.floor(y1); py < Math.ceil(y2); py += STEP) {
    for (let px = Math.floor(x1); px < Math.ceil(x2); px += STEP) {
      if (px < 0 || px >= width || py < 0) continue;
      total++;
      if (bin[py * width + px] === 0) dark++;
    }
  }
  return total === 0 ? 0 : dark / total;
}

function toGrayscale(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = Math.round(
      0.299 * pixels[i * 4] +
      0.587 * pixels[i * 4 + 1] +
      0.114 * pixels[i * 4 + 2]
    );
  }
  return gray;
}

function threshold(gray: Uint8Array, t: number): Uint8Array {
  return gray.map(v => (v < t ? 0 : 255));
}