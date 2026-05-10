import { Buffer } from 'buffer';
global.Buffer = Buffer;

import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import CameraScreen from './app/index';
import ResultsScreen from './app/results';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{
            headerShown: true,
            title: 'Captured Markers',
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#fff',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}