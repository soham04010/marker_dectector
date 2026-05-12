/**
 * Load reference images → compute grayscale+color features → register with detector.
 */

import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import { TEST_IMAGES, TestImage } from '../constants/testImages';
import { setReferences, computeFeatures } from './markerDetector';

let loaded = false;

export async function loadReferenceImages(): Promise<number> {
  if (loaded) return 0;

  const refs: { features: any; type: 'correct' | 'incorrect'; name: string }[] = [];

  for (const img of TEST_IMAGES) {
    try {
      const features = await computeFeaturesFromAsset(img);
      refs.push({ features, type: img.expectedResult, name: img.name });
    } catch (err) {
      console.warn(`[Refs] Failed "${img.name}":`, err);
    }
  }

  setReferences(refs);
  loaded = true;
  console.log(`[Refs] ${refs.length} patterns ready`);
  return refs.length;
}

export function isReferencesReady(): boolean { return loaded; }

async function computeFeaturesFromAsset(img: TestImage) {
  console.log(`[Refs] Loading asset: ${img.name}...`);

  const [asset] = await Asset.loadAsync(img.source);
  const uri = asset.localUri || asset.uri;

  if (!uri) {
    throw new Error(`No URI for asset "${img.name}" — asset may not be bundled`);
  }

  console.log(`[Refs] Asset "${img.name}" URI: ${uri.substring(0, 60)}...`);

  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 128, height: 128 } }],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!resized.base64) {
    throw new Error(`No base64 data after resize for "${img.name}"`);
  }

  const jpeg = require('jpeg-js');
  const { Buffer } = require('buffer');
  const decoded = jpeg.decode(Buffer.from(resized.base64, 'base64'), {
    useTArray: true, formatAsRGBA: true,
  });

  console.log(`[Refs] Decoded "${img.name}": ${decoded.width}×${decoded.height}`);

  // For reference images: use center region (marker is centered in reference images)
  return computeFeatures(decoded.data, decoded.width, decoded.height, true);
}

export function clearReferenceHashCache(): void { loaded = false; }
