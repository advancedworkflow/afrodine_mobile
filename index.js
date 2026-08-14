/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

// Doit être enregistré avant AppRegistry.registerComponent : gère les notifications FCM
// reçues quand l'app est en arrière-plan ou totalement fermée.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message FCM reçu en arrière-plan:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);

