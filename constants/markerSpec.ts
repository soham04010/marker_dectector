/** Detection thresholds for perceptual hash matching */
export const MARKER_SPEC = {
  // pHash matching threshold
  // Hamming distance: 0 = identical, 64 = completely different
  // ≤ 10 = very confident match
  // ≤ 14 = likely match
  // > 14 = no match
  matchThreshold: 14,

  // How many markers to collect before auto-navigating to results
  targetCount: 20,

  // Image resize for hashing (smaller = faster, 64 is a good balance)
  hashImageSize: 64,

  // Output size for saved marker images
  targetOutputSize: 300,
};