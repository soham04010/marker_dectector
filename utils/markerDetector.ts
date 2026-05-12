/**
 * Marker detection via direct image comparison.
 *
 * Uses 8×8 grayscale + color feature grids with normalized cross-correlation (NCC).
 * NCC is invariant to brightness/contrast changes, making it robust for camera captures.
 * Compares center of capture against all references at 4 rotations.
 */

export interface DetectionResult {
  markerFound: boolean;
  isCorrectMarker: boolean;
  confidence: number;
  details: string;
}

interface Features {
  gray: number[];  // 8×8 = 64 normalized grayscale values
  color: number[]; // 8×8 = 64 normalized color-warmth values
}

interface Ref {
  features: Features;
  type: 'correct' | 'incorrect';
  name: string;
}

const S = 8; // grid size
let refs: Ref[] = [];

export function setReferences(r: Ref[]): void {
  refs = r;
  console.log(`[Detector] ${r.length} references loaded`);
}

// ── Main detection ──────────────────────────────────────────────────────────

export function detectMarker(
  pixels: Uint8Array, width: number, height: number
): DetectionResult {
  if (refs.length === 0) {
    return { markerFound: false, isCorrectMarker: false, confidence: 0, details: 'No references' };
  }

  // Compute features from CENTER of captured image (where marker is)
  const scan = computeFeatures(pixels, width, height, true);

  let bestCorrectScore = -1, bestCorrectName = '';
  let bestIncorrectScore = -1, bestIncorrectName = '';

  for (const ref of refs) {
    // Try all 4 rotations
    for (let rot = 0; rot < 4; rot++) {
      const rotScan = rotateFeatures(scan, rot);
      const grayNCC = ncc(rotScan.gray, ref.features.gray);
      const colorNCC = ncc(rotScan.color, ref.features.color);
      const score = 0.45 * grayNCC + 0.55 * colorNCC;

      if (ref.type === 'correct' && score > bestCorrectScore) {
        bestCorrectScore = score;
        bestCorrectName = ref.name;
      }
      if (ref.type === 'incorrect' && score > bestIncorrectScore) {
        bestIncorrectScore = score;
        bestIncorrectName = ref.name;
      }
    }
  }

  console.log(
    `[Detector] correct=${bestCorrectScore.toFixed(3)} (${bestCorrectName}) ` +
    `incorrect=${bestIncorrectScore.toFixed(3)} (${bestIncorrectName})`
  );

  const best = Math.max(bestCorrectScore, bestIncorrectScore);

  if (best < 0.10) {
    return { markerFound: false, isCorrectMarker: false, confidence: 0, details: `No match (${best.toFixed(2)})` };
  }

  if (bestCorrectScore >= bestIncorrectScore) {
    return {
      markerFound: true, isCorrectMarker: true,
      confidence: bestCorrectScore,
      details: `${bestCorrectName} (${(bestCorrectScore * 100).toFixed(0)}%)`,
    };
  }

  return {
    markerFound: true, isCorrectMarker: false,
    confidence: bestIncorrectScore,
    details: `${bestIncorrectName} (${(bestIncorrectScore * 100).toFixed(0)}%)`,
  };
}

// ── Feature computation ─────────────────────────────────────────────────────

export function computeFeatures(
  pixels: Uint8Array, width: number, height: number, centerOnly: boolean
): Features {
  // Analysis region
  const x1 = centerOnly ? Math.floor(width * 0.20) : 0;
  const y1 = centerOnly ? Math.floor(height * 0.20) : 0;
  const x2 = centerOnly ? Math.floor(width * 0.80) : width;
  const y2 = centerOnly ? Math.floor(height * 0.80) : height;

  const rw = x2 - x1, rh = y2 - y1;
  const cw = rw / S, ch = rh / S;

  const gray: number[] = [];
  const color: number[] = [];

  for (let gy = 0; gy < S; gy++) {
    for (let gx = 0; gx < S; gx++) {
      const cx1 = Math.floor(x1 + gx * cw);
      const cy1 = Math.floor(y1 + gy * ch);
      const cx2 = Math.floor(x1 + (gx + 1) * cw);
      const cy2 = Math.floor(y1 + (gy + 1) * ch);

      let rS = 0, gS = 0, bS = 0, n = 0;
      for (let y = cy1; y < cy2 && y < height; y++) {
        for (let x = cx1; x < cx2 && x < width; x++) {
          const i = (y * width + x) * 4;
          rS += pixels[i]; gS += pixels[i + 1]; bS += pixels[i + 2];
          n++;
        }
      }

      if (n === 0) { gray.push(128); color.push(0); continue; }

      const ar = rS / n, ag = gS / n, ab = bS / n;
      gray.push(0.299 * ar + 0.587 * ag + 0.114 * ab);
      color.push(ar - (ag + ab) / 2); // positive = warm, negative = cool
    }
  }

  normalize(gray);
  normalize(color);
  return { gray, color };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalize(arr: number[]): void {
  let mean = 0;
  for (const v of arr) mean += v;
  mean /= arr.length;

  let variance = 0;
  for (const v of arr) variance += (v - mean) ** 2;
  let std = Math.sqrt(variance / arr.length);
  if (std < 0.001) std = 1;

  for (let i = 0; i < arr.length; i++) arr[i] = (arr[i] - mean) / std;
}

function ncc(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length && i < b.length; i++) sum += a[i] * b[i];
  return sum / Math.max(a.length, 1);
}

function rotateFeatures(f: Features, rot: number): Features {
  if (rot === 0) return f;
  return { gray: rotateBlock(f.gray, rot), color: rotateBlock(f.color, rot) };
}

function rotateBlock(arr: number[], rot: number): number[] {
  const out = new Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let ny: number, nx: number;
      if (rot === 1) { ny = x; nx = S - 1 - y; }
      else if (rot === 2) { ny = S - 1 - y; nx = S - 1 - x; }
      else { ny = S - 1 - x; nx = y; }
      out[ny * S + nx] = arr[y * S + x];
    }
  }
  return out;
}

// ── Compat exports ──────────────────────────────────────────────────────────
export type PHash = boolean[];
export type BinaryGrid = number[];
export function setReferencePatterns(_p: any[]): void {}
export function computePHash(p: Uint8Array, w: number, h: number): PHash { return []; }
export function hammingDistance(a: PHash, b: PHash): number { return 64; }
export function setReferenceHashes(_c: PHash[], _i: PHash[]): void {}