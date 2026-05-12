import React from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { CameraView as ExpoCam } from 'expo-camera';

export type OverlayState = 'none' | 'correct' | 'incorrect';

interface OverlayBox {
  x: number;
  y: number;
  size: number;
}

interface Props {
  cameraRef: React.RefObject<any>;
  onReady: () => void;
  overlayBox?: OverlayBox | null;
  overlayState?: OverlayState;
  displayScale: number;
}

export default function CameraView({
  cameraRef,
  onReady,
  overlayBox,
  overlayState = 'none',
  displayScale,
}: Props) {

  const borderColor =
    overlayState === 'correct'   ? '#00ff88' :
    overlayState === 'incorrect' ? '#ff3b3b' :
    '#00ff88';

  const bgColor =
    overlayState === 'correct'   ? 'rgba(0,255,136,0.12)' :
    overlayState === 'incorrect' ? 'rgba(255,59,59,0.12)' :
    'rgba(0,255,136,0.08)';

  return (
    <View style={styles.container}>
      <ExpoCam
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={onReady}
        // Request highest quality — Expo will pick best available size
        pictureSize="3088x2316"
      />

      {/* Aim guide — always visible */}
      <View pointerEvents="none" style={styles.guide}>
        {/* Four corner brackets */}
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
        <Text style={styles.guideText}>Point at Marker 1</Text>
      </View>

      {/* Detection overlay — shown when marker is found or rejected */}
      {overlayBox && overlayState !== 'none' && (
        <View
          pointerEvents="none"
          style={[
            styles.detectionBox,
            {
              left:        overlayBox.x    * displayScale,
              top:         overlayBox.y    * displayScale,
              width:       overlayBox.size * displayScale,
              height:      overlayBox.size * displayScale,
              borderColor: borderColor,
              backgroundColor: bgColor,
            },
          ]}
        >
          <Text style={[styles.detectionLabel, { color: borderColor }]}>
            {overlayState === 'correct' ? '✓ Marker detected' : '✗ Not Marker 1'}
          </Text>
        </View>
      )}
    </View>
  );
}

const cornerSize = 20;
const cornerThick = 3;

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', backgroundColor: '#000' },

  guide: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    height: '35%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideText: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Corner bracket pieces
  corner: {
    position: 'absolute',
    width: cornerSize,
    height: cornerSize,
    borderColor: 'rgba(255,255,255,0.50)',
  },
  tl: { top: 0, left: 0, borderTopWidth: cornerThick, borderLeftWidth: cornerThick },
  tr: { top: 0, right: 0, borderTopWidth: cornerThick, borderRightWidth: cornerThick },
  bl: { bottom: 0, left: 0, borderBottomWidth: cornerThick, borderLeftWidth: cornerThick },
  br: { bottom: 0, right: 0, borderBottomWidth: cornerThick, borderRightWidth: cornerThick },

  detectionBox: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  detectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
});