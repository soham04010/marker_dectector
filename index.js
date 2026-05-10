import { Buffer } from 'buffer';
global.Buffer = Buffer;

import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);