import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Resize an image for pHash detection.
 * Returns a small image with base64 data for JPEG decoding → pixel extraction.
 */
export async function resizeForDetection(
  uri: string,
  targetSize = 64
): Promise<{ base64: string; width: number; height: number }> {
  const small = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: targetSize, height: targetSize } }],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  return {
    base64: small.base64!,
    width: small.width,
    height: small.height,
  };
}