import * as ImageManipulator from 'expo-image-manipulator';

// Shrink image to 400x400 and return base64 — used for fast detection
export async function resizeForDetection(imageUri: string): Promise<{
  base64: string;
  width: number;
  height: number;
}> {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 400, height: 400 } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  return {
    base64: result.base64!,
    width: result.width,
    height: result.height,
  };
}

// Crop the detected marker from full image and resize to 300x300
export async function cropAndResizeTo300(
  imageUri: string,
  cropX: number,
  cropY: number,
  cropSize: number,
  scaleX: number, // full_image_width  / detection_image_width
  scaleY: number  // full_image_height / detection_image_height
): Promise<string> {
  const actualX    = Math.max(0, Math.round(cropX    * scaleX));
  const actualY    = Math.max(0, Math.round(cropY    * scaleY));
  const actualSize = Math.round(cropSize * Math.min(scaleX, scaleY));

  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [
      {
        crop: {
          originX: actualX,
          originY: actualY,
          width:   actualSize,
          height:  actualSize,
        },
      },
      { resize: { width: 300, height: 300 } },
    ],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
}