import React from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text, SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MarkerGrid from '../components/MarkerGrid';

export default function ResultsScreen() {
  const route      = useRoute<any>();
  const navigation = useNavigation<any>();
  const { markers } = route.params as { markers: string[] };

  return (
    <SafeAreaView style={styles.root}>
      <MarkerGrid markers={markers} />

      {markers.length < 20 && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Back to Scan More</Text>
        </TouchableOpacity>
      )}

      {markers.length >= 20 && (
        <View style={styles.doneBox}>
          <Text style={styles.doneText}>🎉 All 20 markers captured!</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d1a' },
  backBtn: {
    margin: 16,
    padding: 14,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  backBtnText: { color: '#00ff88', fontWeight: '600', fontSize: 15 },
  doneBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#0a2e1a',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  doneText: { color: '#00ff88', fontSize: 16, fontWeight: '700' },
});