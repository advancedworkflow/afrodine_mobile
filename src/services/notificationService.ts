import PushNotification from 'react-native-push-notification';
import {Platform, PermissionsAndroid} from 'react-native';
import type {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import api from '../utils/api';

// Firebase Messaging n'existe pas sur le build web (react-native-web) — chargé
// uniquement sur Android/iOS.
const messaging = Platform.OS !== 'web' ? require('@react-native-firebase/messaging').default : null;

class NotificationService {
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  private foregroundMessageUnsubscribe: (() => void) | null = null;

  configure = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Créer le canal de notification pour Android
    PushNotification.createChannel(
      {
        channelId: 'afrodine-channel',
        channelName: 'namke',
        channelDescription: 'Notifications pour l\'application namke',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`createChannel returned '${created}'`),
    );

    // Affiche localement les notifications push reçues pendant que l'app est au premier plan
    // (Android/iOS n'affichent pas nativement une notif FCM "data+notification" en foreground).
    if (messaging && !this.foregroundMessageUnsubscribe) {
      this.foregroundMessageUnsubscribe = messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const title = remoteMessage.notification?.title || 'Afrodine';
        const body = remoteMessage.notification?.body || '';
        this.localNotification(title, body);
      });
    }
  };

  /** Demande la permission d'envoyer des notifications (Android 13+ et iOS). */
  requestPermission = async (): Promise<boolean> => {
    if (!messaging) {
      return false;
    }

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) {
        return false;
      }
    }

    return true;
  };

  /**
   * Récupère le token FCM de l'appareil et l'enregistre côté backend pour l'utilisateur
   * connecté. À appeler après un login réussi (le endpoint /users/me/device-tokens requiert
   * d'être authentifié).
   */
  registerDeviceToken = async (): Promise<void> => {
    if (!messaging) {
      return;
    }

    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return;
      }

      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await api.post('/users/me/device-tokens', {
          fcm_token: fcmToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        });
      }

      if (!this.tokenRefreshUnsubscribe) {
        this.tokenRefreshUnsubscribe = messaging().onTokenRefresh(async (newToken: string) => {
          try {
            await api.post('/users/me/device-tokens', {
              fcm_token: newToken,
              platform: Platform.OS === 'ios' ? 'ios' : 'android',
            });
          } catch (e) {
            console.warn('Erreur lors du renouvellement du token FCM:', e);
          }
        });
      }
    } catch (e) {
      console.warn('Erreur lors de l\'enregistrement du token push:', e);
    }
  };

  localNotification = (title: string, message: string) => {
    PushNotification.localNotification({
      channelId: 'afrodine-channel',
      title,
      message,
      playSound: true,
      soundName: 'default',
    });
  };

  scheduleNotification = (title: string, message: string, date: Date) => {
    PushNotification.localNotificationSchedule({
      channelId: 'afrodine-channel',
      title,
      message,
      date,
      playSound: true,
      soundName: 'default',
    });
  };

  cancelAll = () => {
    PushNotification.cancelAllLocalNotifications();
  };
}

export default new NotificationService();
