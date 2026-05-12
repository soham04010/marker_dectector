// All your uploaded test images — hardcoded because React Native
// requires static require() calls

export type TestImage = {
  id: number;
  name: string;
  source: any;
  expectedResult: 'correct' | 'incorrect';
};

export const TEST_IMAGES: TestImage[] = [
  // ── Marker 1 correct images ───────────────────────────────────────────────
  {
    id: 1,
    name: 'Marker1 – Test 1',
    source: require('../assets/test-images/Marker1-TestImage1-Correct.jpg'),
    expectedResult: 'correct',
  },
  {
    id: 2,
    name: 'Marker1 – Test 2',
    source: require('../assets/test-images/Marker1-TestImage2-Correct.jpg'),
    expectedResult: 'correct',
  },
  {
    id: 3,
    name: 'Marker1 – Test 3',
    source: require('../assets/test-images/Marker1-TestImage3-Correct.jpg'),
    expectedResult: 'correct',
  },

  // ── Marker 1 incorrect images ─────────────────────────────────────────────
  {
    id: 4,
    name: 'Marker1 – Test 4',
    source: require('../assets/test-images/Marker1-TestImage4-Incorrect.jpg'),
    expectedResult: 'incorrect',
  },
  {
    id: 5,
    name: 'Marker1 – Test 5',
    source: require('../assets/test-images/Marker1-TestImage5-Incorrect.jpg'),
    expectedResult: 'incorrect',
  },
  {
    id: 6,
    name: 'Marker1 – Test 6',
    source: require('../assets/test-images/Marker1-TestImage6-Incorrect.jpg'),
    expectedResult: 'incorrect',
  },
  {
    id: 7,
    name: 'Marker1 – Test 7',
    source: require('../assets/test-images/Marker1-TestImage7-Incorrect.jpg'),
    expectedResult: 'incorrect',
  },

  // ── Marker 2 correct images ───────────────────────────────────────────────
  {
    id: 8,
    name: 'Marker2 – Test 1',
    source: require('../assets/test-images/Marker2-TestImage1-Correct.jpg'),
    expectedResult: 'correct',
  },
  {
    id: 9,
    name: 'Marker2 – Test 2',
    source: require('../assets/test-images/Marker2-TestImage2-Correct.jpg'),
    expectedResult: 'correct',
  },
  {
    id: 10,
    name: 'Marker2 – Test 3',
    source: require('../assets/test-images/Marker2-TestImage3-Correct.jpg'),
    expectedResult: 'correct',
  },

  // ── Marker 2 incorrect images ─────────────────────────────────────────────
  {
    id: 11,
    name: 'Marker2 – Test 4',
    source: require('../assets/test-images/Marker2-TestImage4-Incorrect.jpg'),
    expectedResult: 'incorrect',
  },
  {
    id: 12,
    name: 'Marker2 – Test 5',
    source: require('../assets/test-images/Marker2-TestImage5-Incorrect.jpg'),
    expectedResult: 'incorrect',
  },
  {
    id: 13,
    name: 'Marker2 – Test 6',
    source: require('../assets/test-images/Marker2-TestImage6-Incorrect.jpg'),
    expectedResult: 'incorrect',
  },
  {
    id: 14,
    name: 'Marker2 – Test 7',
    source: require('../assets/test-images/Marker2-TestImage7-Incorrect.jpg'),
    expectedResult: 'incorrect',
  },
];