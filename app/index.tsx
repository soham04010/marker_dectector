import React, {
  useRef, useState, useEffect, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';

import CameraViewComp from '../components/CameraView';
import { detectMarker, BoundingBox } from '../utils/markerDetector';
import { resizeForDetection, cropAndResize } from '../utils/imageProcessor';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DETECT_SIZE   = 400; // size we scale image to for detection
const TARGET_COUNT  = 20;
const SCAN_INTERVAL = 1500; // ms between scans

export default function CameraScreen() {
  const navigation = useNavigation<any>();
  const cameraRef  = useRef<any>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady]   = useState(false);
  const [isScanning, setIsScanning]     = useState(false);
  const [captured, setCaptured]         = useState<string[]>([]);
  const [overlayBox, setOverlayBox]     = useState<BoundingBox | null>(null);
  const [status, setStatus]             = useState('Press Start to begin scanning');
  const [processing, setProcessing]     = useState(false);

  const isRunning   = useRef(false);
  const capturedRef = useRef<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep ref synced with state
  useEffect(() => { capturedRef.current = captured; }, [captured]);

  // Auto-navigate when 20 collected
  useEffect(() => {
    if (captured.length >= TARGET_COUNT) {
      setIsScanning(false);
      navigation.navigate('Results', { markers: captured });
    }
  }, [captured]);

  // ── Single detection cycle ─────────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    if (isRunning.current) return;
    if (!cameraRef.current) return;
    if (capturedRef.current.length >= TARGET_COUNT) return;

    isRunning.current = true;
    setProcessing(true);

    try {
      // 1 — Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
        base64: false,
      });

      if (!photo?.uri) return;

      // 2 — Resize to 400×400 for detection + get base64
      const small = await resizeForDetection(photo.uri, DETECT_SIZE);

      // 3 — Decode JPEG pixels using jpeg-js
      const jpeg     = require('jpeg-js');
      const buf      = Buffer.from(small.base64, 'base64');
      const decoded  = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });

      // 4 — Run marker detection
      const result   = detectMarker(decoded.data, decoded.width, decoded.height);

      if (result.detected && result.boundingBox) {
        setOverlayBox(result.boundingBox);
        setStatus(
          `✓ Marker found! Saving ${capturedRef.current.length + 1}/${TARGET_COUNT}`
        );

        // 5 — Crop from original full-res photo
        const scaleX  = small.origWidth  / DETECT_SIZE;
        const scaleY  = small.origHeight / DETECT_SIZE;
        const cropped = await cropAndResize(
          photo.uri,
          result.boundingBox.x,
          result.boundingBox.y,
          result.boundingBox.size,
          scaleX, scaleY,
          small.origWidth,
          small.origHeight
        );

        // 6 — Store result
        setCaptured(prev => [...prev, cropped]);

        // Fade overlay after 600ms
        setTimeout(() => setOverlayBox(null), 600);
      } else {
        setOverlayBox(null);
        setStatus('Scanning… hold marker steady');
      }
    } catch (err: any) {
      console.warn('Detection error:', err?.message ?? err);
      setStatus('Error — retrying…');
    } finally {
      isRunning.current = false;
      setProcessing(false);
    }
  }, []);

  // ── Interval management ────────────────────────────────────────────────────
  useEffect(() => {
    if (isScanning && cameraReady) {
      intervalRef.current = setInterval(runDetection, SCAN_INTERVAL);
      setStatus('Scanning… point at Marker 1');
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (!isScanning) setStatus('Press Start to begin scanning');
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isScanning, cameraReady]);

  // ── Permission states ──────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={styles.dimText}>Loading camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.white}>📷 Camera access needed</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Scale detection coords → screen coords
  const displayScale = SCREEN_W / DETECT_SIZE;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {/* Camera */}
      <CameraViewComp
        cameraRef={cameraRef}
        onReady={() => setCameraReady(true)}
        overlayBox={overlayBox}
        displayScale={displayScale}
      />

      {/* Top HUD */}
      <View style={styles.topHud}>
        <Text style={styles.statusText}>{status}</Text>
        <Text style={styles.countBadge}>
          {captured.length} / {TARGET_COUNT}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${(captured.length / TARGET_COUNT) * 100}%` },
          ]}
        />
      </View>

      {/* Processing indicator */}
      {processing && (
        <View style={styles.processingBadge}>
          <ActivityIndicator size="small" color="#00ff88" />
          <Text style={styles.processingText}>Analysing…</Text>
        </View>
      )}

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.startBtn, isScanning && styles.startBtnActive]}
          onPress={() => setIsScanning(v => !v)}
          disabled={!cameraReady}
        >
          <Text style={styles.startBtnText}>
            {isScanning ? '⏸  Pause' : '▶  Start Scan'}
          </Text>
        </TouchableOpacity>

        {captured.length > 0 && (
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => navigation.navigate('Results', { markers: captured })}
          >
            <Text style={styles.viewBtnText}>
              View {captured.length} results →
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#000' },
  centered:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d1a',
    gap: 20,
  },
  white:   { color: '#fff', fontSize: 18, marginBottom: 10 },
  dimText: { color: '#888', marginTop: 12, fontSize: 14 },

  // HUD
  topHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.60)',
  },
  statusText:  { color: '#ddd', fontSize: 13, flex: 1, marginRight: 8 },
  countBadge:  {
    color: '#00ff88',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Progress
  progressBg: {
    position: 'absolute',
    top: 98,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#00ff88',
  },

  // Processing badge
  processingBadge: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  processingText: { color: '#00ff88', fontSize: 12 },

  // Bottom
  bottomBar: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 14,
  },
  startBtn: {
    paddingHorizontal: 44,
    paddingVertical: 15,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 2,
    borderColor: '#444',
  },
  startBtnActive: {
    borderColor: '#00ff88',
    backgroundColor: 'rgba(0,40,20,0.80)',
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  viewBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: '#00ff88',
  },
  viewBtnText: { color: '#002a10', fontSize: 14, fontWeight: '700' },

  btn: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  btnText: { color: '#002a10', fontWeight: '700', fontSize: 15 },
});