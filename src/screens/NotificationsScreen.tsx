import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import api from '../utils/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async (getIsCancelled?: () => boolean) => {
    setLoading(true);
    try {
      const response = await api.get('/notifications/');
      if (getIsCancelled?.()) return;
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      if (!getIsCancelled?.()) setNotifications([]);
    } finally {
      if (!getIsCancelled?.()) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadNotifications(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? {...n, is_read: true} : n)),
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const renderNotification = ({item}: {item: Notification}) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.unreadNotification,
      ]}
      onPress={() => markAsRead(item.id)}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationDate}>
          {new Date(item.created_at).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadNotifications}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconWrapper name="notifications-off-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  notificationItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: Colors.backgroundLight,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
    fontFamily: secondaryFont,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
    fontFamily: secondaryFont,
  },
  notificationDate: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 16,
    fontFamily: secondaryFont,
  },
});

export default NotificationsScreen;

