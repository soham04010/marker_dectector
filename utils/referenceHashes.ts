/**
 * Reference hash loader.
 *
 * On app startup, loads all test images from assets, decodes them to pixels,
 * and computes their perceptual hashes. These hashes are cached and used
 * for instant comparison when the camera captures a frame.
 */

import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import { TEST_IMAGES, TestImage } from '../constants/testImages';
import { computePHash, PHash } from './markerDetector';

export interface ReferenceHash {
  hash: PHash;
  name: string;
  id: number;
  expectedResult: 'correct' | 'incorrect';
}

// Cached hashes — computed once, reused for all scans
let cachedCorrectHashes: ReferenceHash[] | null = null;
let cachedIncorrectHashes: ReferenceHash[] | null = null;

/**
 * Load all reference images, compute their pHashes, and cache them.
 * Call this once at app startup (takes ~1-2 seconds).
 *
 * Returns { correct, incorrect } hash arrays.
 */
export async function loadReferenceHashes(): Promise<{
  correct: ReferenceHash[];
  incorrect: ReferenceHash[];
}> {
  // Return cached if already loaded
  if (cachedCorrectHashes && cachedIncorrectHashes) {
    return { correct: cachedCorrectHashes, incorrect: cachedIncorrectHashes };
  }

  const correct: ReferenceHash[] = [];
  const incorrect: ReferenceHash[] = [];

  // Process each test image
  for (const img of TEST_IMAGES) {
    try {
      const hash = await computeHashFromAsset(img);
      const ref: ReferenceHash = {
        hash,
        name: img.name,
        id: img.id,
        expectedResult: img.expectedResult,
      };

      if (img.expectedResult === 'correct') {
        correct.push(ref);
      } else {
        incorrect.push(ref);
      }
    } catch (err) {
      console.warn(`Failed to hash reference image "${img.name}":`, err);
    }
  }

  console.log(
    `[ReferenceHashes] Loaded ${correct.length} correct + ${incorrect.length} incorrect references`
  );

  cachedCorrectHashes = correct;
  cachedIncorrectHashes = incorrect;

  return { correct, incorrect };
}

/**
 * Compute the pHash for a bundled asset image.
 */
async function computeHashFromAsset(img: TestImage): Promise<PHash> {
  // Step 1: Load the asset to get a local URI
  const [asset] = await Asset.loadAsync(img.source);
  const uri = asset.localUri || asset.uri;

  // Step 2: Resize to 64×64 and get base64
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 64, height: 64 } }],
    {
      compress: 0.9,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  // Step 3: Decode JPEG to raw pixels
  const jpeg = require('jpeg-js');
  const { Buffer } = require('buffer');
  const decoded = jpeg.decode(Buffer.from(resized.base64!, 'base64'), {
    useTArray: true,
    formatAsRGBA: true,
  });

  // Step 4: Compute pHash
  return computePHash(decoded.data, decoded.width, decoded.height);
}

/**
 * Clear cached hashes (useful for testing or reloading).
 */
export function clearReferenceHashCache(): void {
  cachedCorrectHashes = null;
  cachedIncorrectHashes = null;
}
