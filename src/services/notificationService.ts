import {Platform, PermissionsAndroid} from 'react-native';
import type {RemoteMessage} from '@react-native-firebase/messaging';
import api from '../utils/api';

// react-native-push-notification et Firebase Messaging n'existent pas sur le build web
// (react-native-web) — chargés uniquement sur Android/iOS.
const PushNotification = Platform.OS !== 'web' ? require('react-native-push-notification').default : null;
const firebaseMessaging = Platform.OS !== 'web' ? require('@react-native-firebase/messaging') : null;

class NotificationService {
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  private foregroundMessageUnsubscribe: (() => void) | null = null;

  configure = () => {
    if (!PushNotification) {
      return;
    }

    PushNotification.configure({
      onRegister: function (token: unknown) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification: unknown) {
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
      (created: boolean) => console.log(`createChannel returned '${created}'`),
    );

    // Affiche localement les notifications push reçues pendant que l'app est au premier plan
    // (Android/iOS n'affichent pas nativement une notif FCM "data+notification" en foreground).
    if (firebaseMessaging && !this.foregroundMessageUnsubscribe) {
      this.foregroundMessageUnsubscribe = firebaseMessaging.onMessage(firebaseMessaging.getMessaging(), async (remoteMessage: RemoteMessage) => {
        const title = remoteMessage.notification?.title || 'Afrodine';
        const body = remoteMessage.notification?.body || '';
        this.localNotification(title, body);
      });
    }
  };

  /** Demande la permission d'envoyer des notifications (Android 13+ et iOS). */
  requestPermission = async (): Promise<boolean> => {
    if (!firebaseMessaging) {
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
      const authStatus = await firebaseMessaging.requestPermission(firebaseMessaging.getMessaging());
      const enabled =
        authStatus === firebaseMessaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === firebaseMessaging.AuthorizationStatus.PROVISIONAL;
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
    if (!firebaseMessaging) {
      return;
    }

    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return;
      }

      const fcmToken = await firebaseMessaging.getToken(firebaseMessaging.getMessaging());
      if (fcmToken) {
        await api.post('/users/me/device-tokens', {
          fcm_token: fcmToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        });
      }

      if (!this.tokenRefreshUnsubscribe) {
        this.tokenRefreshUnsubscribe = firebaseMessaging.onTokenRefresh(firebaseMessaging.getMessaging(), async (newToken: string) => {
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
    if (!PushNotification) {
      return;
    }

    PushNotification.localNotification({
      channelId: 'afrodine-channel',
      title,
      message,
      playSound: true,
      soundName: 'default',
    });
  };

  scheduleNotification = (title: string, message: string, date: Date) => {
    if (!PushNotification) {
      return;
    }

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
    if (!PushNotification) {
      return;
    }

    PushNotification.cancelAllLocalNotifications();
  };
}

export default new NotificationService();
