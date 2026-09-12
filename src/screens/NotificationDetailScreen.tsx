import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {Colors, Radius} from '../utils/colors';
import {fontDisplay, fontHeading, fontUI} from '../utils/fonts';

interface NotificationDetail {
  id: number;
  title: string;
  message: string;
  type?: string;
  category?: string | null;
  is_read: boolean;
  created_at: string;
  data?: Record<string, any> | null;
}

const TYPE_META: Record<string, {icon: string; color: string}> = {
  success: {icon: 'checkmark-circle', color: Colors.olive},
  warning: {icon: 'alert-circle', color: Colors.mustard},
  error: {icon: 'close-circle', color: '#ef4444'},
  info: {icon: 'information-circle', color: Colors.darkGreen},
};

const CATEGORY_LABELS: Record<string, string> = {
  order: 'Commande',
  review: 'Avis',
  favorite: 'Favori',
  catering: 'Traiteur',
  promotion: 'Promotion',
  complaint: 'Réclamation',
  general: 'Général',
};

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const NotificationDetailScreen = ({route, navigation}: any) => {
  const notification: NotificationDetail = route.params?.notification;

  if (!notification) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Notification introuvable.</Text>
      </View>
    );
  }

  const meta = TYPE_META[notification.type ?? 'info'] ?? TYPE_META.info;
  const categoryLabel = notification.category ? CATEGORY_LABELS[notification.category] ?? notification.category : null;
  const orderId = notification.data?.order_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.iconCircle, {backgroundColor: `${meta.color}1A`}]}>
        <IconWrapper name={`${meta.icon}-outline`} size={32} color={meta.color} />
      </View>

      {categoryLabel && (
        <View style={styles.categoryChip}>
          <Text style={styles.categoryChipText}>{categoryLabel}</Text>
        </View>
      )}

      <Text style={styles.title}>{notification.title}</Text>
      <Text style={styles.date}>{formatDateTime(notification.created_at)}</Text>

      <View style={styles.messageCard}>
        <Text style={styles.message}>{notification.message}</Text>
      </View>

      {orderId != null && (
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('OrderDetails', {orderId})}>
          <Text style={styles.actionButtonText}>Voir la commande</Text>
          <IconWrapper name="chevron-forward-outline" size={18} color={Colors.white} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    padding: 22,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  categoryChipText: {
    fontSize: 11.5,
    fontFamily: fontHeading,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.darkGreen,
  },
  title: {
    fontSize: 22,
    fontFamily: fontDisplay,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginBottom: 24,
  },
  messageCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  message: {
    fontSize: 15.5,
    fontFamily: fontUI,
    color: Colors.text,
    lineHeight: 23,
  },
  actionButton: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.darkGreen,
    borderRadius: Radius.pill,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignSelf: 'stretch',
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: fontHeading,
    color: Colors.white,
  },
});

export default NotificationDetailScreen;
