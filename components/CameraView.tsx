import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { CameraView as ExpoCam } from 'expo-camera';

interface OverlayBox {
  x: number;
  y: number;
  size: number;
}

interface Props {
  cameraRef: React.RefObject<any>;
  onReady: () => void;
  overlayBox?: OverlayBox | null;
  displayScale: number;
}

export default function CameraView({
  cameraRef, onReady, overlayBox, displayScale,
}: Props) {
  return (
    <View style={styles.container}>
      <ExpoCam
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={onReady}
      />

      {/* Crosshair guide in center */}
      <View pointerEvents="none" style={styles.guide}>
        <View style={styles.corner} />
        <Text style={styles.guideText}>Aim at Marker 1</Text>
      </View>

      {/* Green box when marker detected */}
      {overlayBox && (
        <View
          pointerEvents="none"
          style={[
            styles.detectionBox,
            {
              left:   overlayBox.x    * displayScale,
              top:    overlayBox.y    * displayScale,
              width:  overlayBox.size * displayScale,
              height: overlayBox.size * displayScale,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  guide: {
    position: 'absolute',
    top: '35%',
    left: '20%',
    width: '60%',
    height: '30%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00ff88',
    borderRadius: 2,
  },
  guideText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    letterSpacing: 1,
  },
  detectionBox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#00ff88',
    borderRadius: 6,
    backgroundColor: 'rgba(0,255,136,0.10)',
  },
});