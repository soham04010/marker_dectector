/**
 * Load reference images from EMBEDDED base64 data.
 *
 * This bypasses expo-asset entirely — the image data is embedded
 * directly in the JS bundle, so it works in both dev and production APK.
 */

import { EMBEDDED_REFS } from '../constants/embeddedRefs';
import { setReferences, computeFeatures } from './markerDetector';

let loaded = false;

export async function loadReferenceImages(): Promise<number> {
  if (loaded) return 0;

  console.log(`[Refs] Loading ${EMBEDDED_REFS.length} embedded references...`);

  const refs: { features: any; type: 'correct' | 'incorrect'; name: string }[] = [];

  for (const ref of EMBEDDED_REFS) {
    try {
      const features = decodeAndComputeFeatures(ref.base64);
      refs.push({ features, type: ref.type, name: ref.name });
      console.log(`[Refs] ✓ ${ref.name}`);
    } catch (err: any) {
      console.error(`[Refs] ✗ ${ref.name}: ${err?.message}`);
    }
  }

  setReferences(refs);
  loaded = refs.length > 0;
  console.log(`[Refs] Done: ${refs.length}/${EMBEDDED_REFS.length} loaded`);
  return refs.length;
}

export function isReferencesReady(): boolean { return loaded; }

function decodeAndComputeFeatures(base64: string) {
  const jpeg = require('jpeg-js');
  const { Buffer } = require('buffer');

  // Decode JPEG directly from base64 — no file system access needed
  const decoded = jpeg.decode(Buffer.from(base64, 'base64'), {
    useTArray: true,
    formatAsRGBA: true,
  });

  console.log(`[Refs] Decoded: ${decoded.width}×${decoded.height}`);

  // Compute features (center-weighted for reference images)
  return computeFeatures(decoded.data, decoded.width, decoded.height, true);
}

export function clearReferenceHashCache(): void { loaded = false; }
