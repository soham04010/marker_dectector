import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, Animated, Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { detectMarker } from '../utils/markerDetector';
import { resizeForDetection } from '../utils/imageProcessor';
import { loadReferenceImages, isReferencesReady } from '../utils/referenceHashes';
import { MARKER_SPEC } from '../constants/markerSpec';

const { width: SW } = Dimensions.get('window');
const TARGET = MARKER_SPEC.targetCount;

type Card = 'none' | 'correct' | 'incorrect';

export default function CameraScreen() {
  const nav    = useNavigation<any>();
  const camRef = useRef<any>(null);
  const [perm, requestPerm] = useCameraPermissions();

  const [analyzing, setAnalyzing]     = useState(false);
  const [card, setCard]               = useState<Card>('none');
  const [captured, setCaptured]       = useState<string[]>([]);
  const [detailMsg, setDetailMsg]     = useState('');
  const [refsReady, setRefsReady]     = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const scale   = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const capturedRef  = useRef<string[]>([]);
  const camReadyRef  = useRef(false);
  const cardTimer    = useRef<any>(null);
  const scanningRef  = useRef(false);

  capturedRef.current = captured;

  // ── Load reference images on mount ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const count = await loadReferenceImages();
        if (!cancelled) {
          setRefsReady(true);
          setLoadingRefs(false);
          console.log(`[Camera] ${count} references ready`);
        }
      } catch (err) {
        console.warn('[Camera] Failed to load references:', err);
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useFocusEffect(useCallback(() => { return () => {}; }, []));

  // ── Animated result card ──────────────────────────────────────────────────
  const showCard = useCallback((type: Card, detail?: string) => {
    setCard(type);
    if (detail) setDetailMsg(detail);
    scale.setValue(0.5);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, speed: 25, bounciness: 12, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    Vibration.vibrate(type === 'correct' ? [0, 60, 60, 60] : [0, 200]);

    if (cardTimer.current) clearTimeout(cardTimer.current);
    cardTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true })
        .start(() => { setCard('none'); scanningRef.current = false; });
    }, type === 'correct' ? 2500 : 1500);
  }, []);

  // ── Scan: capture → resize → compare against references ──────────────────
  const doScan = useCallback(async () => {
    if (!camRef.current || !camReadyRef.current || !refsReady) return;
    if (scanningRef.current) return;
    scanningRef.current = true;
    setAnalyzing(true);

    try {
      const photo = await camRef.current.takePictureAsync({
        quality: 0.4, skipProcessing: true, base64: false,
      });
      if (!photo?.uri) { setAnalyzing(false); scanningRef.current = false; return; }

      const small = await resizeForDetection(photo.uri, 128);

      const jpeg = require('jpeg-js');
      const { Buffer } = require('buffer');
      const decoded = jpeg.decode(
        Buffer.from(small.base64, 'base64'),
        { useTArray: true, formatAsRGBA: true }
      );

      setAnalyzing(false);

      const result = detectMarker(decoded.data, decoded.width, decoded.height);

      if (result.markerFound && result.isCorrectMarker) {
        showCard('correct', result.details);
        const next = [...capturedRef.current, photo.uri];
        capturedRef.current = next;
        setCaptured(next);
        if (next.length >= TARGET) {
          setTimeout(() => nav.navigate('Results', { markers: next }), 2500);
        }
      } else {
        showCard('incorrect', result.details);
      }
    } catch (e: any) {
      console.warn('[Scan] Error:', e?.message);
      setAnalyzing(false);
      scanningRef.current = false;
    }
  }, [showCard, nav, refsReady]);

  const onCamReady = useCallback(() => { camReadyRef.current = true; }, []);

  // ── Permission ────────────────────────────────────────────────────────────
  if (!perm) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#00ff88" />
    </View>
  );
  if (!perm.granted) return (
    <View style={s.center}>
      <Text style={s.permIcon}>📸</Text>
      <Text style={s.permTitle}>Camera Access Required</Text>
      <Text style={s.permSub}>We need camera access to scan markers.</Text>
      <TouchableOpacity style={s.grantBtn} onPress={requestPerm}>
        <Text style={s.grantTxt}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <CameraView
        ref={camRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={onCamReady}
      />

      <View style={s.guideWrap} pointerEvents="none">
        <View style={s.guide}>
          <View style={[s.corner, s.tl]} />
          <View style={[s.corner, s.tr]} />
          <View style={[s.corner, s.bl]} />
          <View style={[s.corner, s.br]} />
          <Text style={s.guideText}>
            {loadingRefs ? 'Loading references…' : analyzing ? 'Analyzing…' : 'Point at marker & tap Scan'}
          </Text>
        </View>
      </View>

      {card !== 'none' && (
        <View style={s.cardWrap} pointerEvents="none">
          <Animated.View style={[
            s.card,
            card === 'correct' ? s.cardGreen : s.cardRed,
            { opacity, transform: [{ scale }] },
          ]}>
            <Text style={s.icon}>{card === 'correct' ? '✓' : '✗'}</Text>
            <Text style={s.title}>
              {card === 'correct' ? 'Scan Successful!' : 'Try Again'}
            </Text>
            <Text style={s.sub}>
              {card === 'correct'
                ? `${capturedRef.current.length} of ${TARGET} saved`
                : detailMsg || 'Not a valid marker'}
            </Text>
          </Animated.View>
        </View>
      )}

      <View style={s.topBar}>
        <View style={s.pill}>
          {(analyzing || loadingRefs) && <ActivityIndicator size="small" color="#00ff88" style={{ marginRight: 6 }} />}
          <Text style={s.pillTxt}>
            {loadingRefs ? 'Loading…' : analyzing ? 'Analyzing…' : '● Ready'}
          </Text>
        </View>
        <View style={s.countPill}>
          <Text style={s.countTxt}>{captured.length} / {TARGET}</Text>
        </View>
      </View>
      <View style={s.progBg}>
        <View style={[s.progFill, { width: `${(captured.length / TARGET) * 100}%` }]} />
      </View>

      <View style={s.bottom}>
        {captured.length > 0 && card === 'none' && !analyzing && (
          <TouchableOpacity
            style={s.viewBtn}
            onPress={() => nav.navigate('Results', { markers: captured })}
          >
            <Text style={s.viewTxt}>
              View {captured.length} result{captured.length !== 1 ? 's' : ''} →
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.scanBtn, (analyzing || card !== 'none' || !refsReady) && s.scanBtnOff]}
          onPress={doScan}
          disabled={analyzing || card !== 'none' || !refsReady}
          activeOpacity={0.7}
        >
          {analyzing
            ? <ActivityIndicator size="small" color="#002a10" />
            : <Text style={s.scanBtnTxt}>{refsReady ? 'SCAN' : '...'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CS = 28, CT = 3;
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a18', gap: 16 },
  permIcon:  { fontSize: 52 },
  permTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  permSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  grantBtn:  { backgroundColor: '#00ff88', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 30, marginTop: 8 },
  grantTxt:  { color: '#002a10', fontWeight: '700', fontSize: 15 },

  guideWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guide:     { width: SW * 0.72, height: SW * 0.72, alignItems: 'center', justifyContent: 'center' },
  guideText: { color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  corner:    { position: 'absolute', width: CS, height: CS, borderColor: 'rgba(0,255,136,0.45)' },
  tl: { top: 0, left: 0, borderTopWidth: CT, borderLeftWidth: CT },
  tr: { top: 0, right: 0, borderTopWidth: CT, borderRightWidth: CT },
  bl: { bottom: 0, left: 0, borderBottomWidth: CT, borderLeftWidth: CT },
  br: { bottom: 0, right: 0, borderBottomWidth: CT, borderRightWidth: CT },

  cardWrap:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  card:      { width: SW * 0.78, paddingVertical: 44, paddingHorizontal: 32, borderRadius: 32, alignItems: 'center', gap: 10, borderWidth: 3 },
  cardGreen: { backgroundColor: 'rgba(0,20,10,0.97)', borderColor: '#00ff88' },
  cardRed:   { backgroundColor: 'rgba(28,0,0,0.97)',   borderColor: '#ff4040' },
  icon:      { fontSize: 80, color: '#fff', lineHeight: 88 },
  title:     { color: '#fff', fontSize: 30, fontWeight: '800', textAlign: 'center' },
  sub:       { color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', marginTop: 4 },

  topBar:    { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  pill:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  pillTxt:   { color: '#aaa', fontSize: 13 },
  countPill: { backgroundColor: 'rgba(0,255,136,0.12)', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, borderWidth: 2, borderColor: '#00ff88' },
  countTxt:  { color: '#00ff88', fontSize: 17, fontWeight: '800', letterSpacing: 1 },
  progBg:    { position: 'absolute', top: 100, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.06)' },
  progFill:  { height: 3, backgroundColor: '#00ff88', borderRadius: 2 },

  bottom:    { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', gap: 14 },
  viewBtn:   { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, backgroundColor: 'rgba(0,255,136,0.15)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.4)' },
  viewTxt:   { color: '#00ff88', fontSize: 14, fontWeight: '600' },
  scanBtn:   { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00ff88', alignItems: 'center', justifyContent: 'center', elevation: 10 },
  scanBtnOff:{ backgroundColor: 'rgba(0,255,136,0.3)', elevation: 0 },
  scanBtnTxt:{ fontSize: 14, color: '#002a10', fontWeight: '900', letterSpacing: 2 },
});