import React from 'react';
import {
  View, Image, FlatList, StyleSheet,
  Text, Dimensions,
} from 'react-native';

interface Props {
  markers: string[];
}

const SCREEN_W  = Dimensions.get('window').width;
const CELL_SIZE = (SCREEN_W - 48) / 2;

export default function MarkerGrid({ markers }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {markers.length} / 20 markers collected
        </Text>
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${(markers.length / 20) * 100}%` },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={markers}
        numColumns={2}
        keyExtractor={(_, i) => String(i)}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={styles.cell}>
            <Image
              source={{ uri: item }}
              style={styles.img}
              resizeMode="cover"
            />
            <Text style={styles.label}>#{index + 1}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No markers captured yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBg: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#00ff88',
    borderRadius: 2,
  },
  list: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cell: {
    width: CELL_SIZE,
    backgroundColor: '#1e1e3a',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  img: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  label: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 5,
  },
  empty: {
    color: '#555',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 14,
  },
});