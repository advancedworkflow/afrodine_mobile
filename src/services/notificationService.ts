import PushNotification from 'react-native-push-notification';
import {Platform} from 'react-native';

class NotificationService {
  configure = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
        // Envoyer le token au backend
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        // Gérer la notification
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

