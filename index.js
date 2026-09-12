/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import App from './App';
import {name as appName} from './app.json';

// Doit être enregistré avant AppRegistry.registerComponent : gère les notifications FCM
// reçues quand l'app est en arrière-plan ou totalement fermée. Les messages "notification"
// sont affichés nativement par le système, mais les messages "data-only" ne le sont pas
// automatiquement : on les affiche nous-mêmes via une notification locale.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message FCM reçu en arrière-plan:', remoteMessage);

  if (!remoteMessage.notification) {
    const title = remoteMessage.data?.title || 'Afrodine';
    const body = remoteMessage.data?.body || '';
    PushNotification.localNotification({
      channelId: 'afrodine-channel',
      title: String(title),
      message: String(body),
      playSound: true,
      soundName: 'default',
    });
  }
});

AppRegistry.registerComponent(appName, () => App);

