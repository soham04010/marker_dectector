export const MARKER_SPEC = {
  // Marker 1 physical size (px in spec)
  totalSize: 140,
  borderThickness: 15,

  // Small black square top-left inside the border
  innerSquare: {
    size: 20,
    offsetX: 20,
    offsetY: 20,
  },

  targetOutputSize: 300,

  // Detection thresholds
  darkPixelThreshold: 90,
  minBorderDarkRatio: 0.65,
  minInnerWhiteRatio: 0.55,
  minCornerDarkRatio: 0.50,

  // How much of the image the marker can occupy
  minSizeRatio: 0.12,
  maxSizeRatio: 0.92,
};