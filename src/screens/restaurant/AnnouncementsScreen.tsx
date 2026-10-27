import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import { Colors } from '../../utils/colors';
import { secondaryFont } from '../../utils/fonts';
import { getManagementAnnouncements, type ManagementAnnouncement } from '../../services/restaurantManagement';

const LOCALE_MAP: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE' };

const AnnouncementsScreen = ({ navigation }: any) => {
  const { t, i18n } = useTranslation();
  const dateLocale = LOCALE_MAP[i18n.language] || 'fr-FR';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<ManagementAnnouncement[]>([]);
  const [view, setView] = useState<'active' | 'archived' | 'all'>('active');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'urgent_first'>('date_desc');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const list = await getManagementAnnouncements();
    setAnnouncements(list);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getExpiryLabel = (expiresAt?: string) => {
    if (!expiresAt) return t('restaurantAnnouncements.noExpiry');
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (!Number.isFinite(ms)) return t('restaurantAnnouncements.invalidExpiry');
    if (ms <= 0) return t('restaurantAnnouncements.expired');
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days <= 1) return t('restaurantAnnouncements.expiresToday');
    return t('restaurantAnnouncements.expiresInDays', { count: days });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expiryTime = new Date(expiresAt).getTime();
    if (!Number.isFinite(expiryTime)) return false;
    return expiryTime <= Date.now();
  };

  const visibleAnnouncements = announcements.filter((ann) => {
    if (view === 'active') return !isExpired(ann.expires_at);
    if (view === 'archived') return isExpired(ann.expires_at);
    return true;
  }).sort((a, b) => {
    const toTime = (v?: string) => {
      const t = new Date(v || 0).getTime();
      return Number.isFinite(t) ? t : 0;
    };
    const urgency = (ann: ManagementAnnouncement) =>
      ann?.is_urgent ? 2 : ((ann?.priority || '').toLowerCase() === 'high' ? 1 : 0);
    if (sortBy === 'date_asc') return toTime(a.created_at) - toTime(b.created_at);
    if (sortBy === 'urgent_first') return urgency(b) - urgency(a) || (toTime(b.created_at) - toTime(a.created_at));
    return toTime(b.created_at) - toTime(a.created_at);
  });
  const activeCount = announcements.filter((ann) => !isExpired(ann.expires_at)).length;
  const archivedCount = announcements.filter((ann) => isExpired(ann.expires_at)).length;
  const allCount = announcements.length;

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title={t('restaurantAnnouncements.title')} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.darkGreen]} />}
      >
        <View style={styles.tabsRow}>
          <TabBtn label={t('restaurantAnnouncements.tabActive', { count: activeCount })} active={view === 'active'} onPress={() => setView('active')} />
          <TabBtn label={t('restaurantAnnouncements.tabArchived', { count: archivedCount })} active={view === 'archived'} onPress={() => setView('archived')} />
          <TabBtn label={t('restaurantAnnouncements.tabAll', { count: allCount })} active={view === 'all'} onPress={() => setView('all')} />
        </View>
        <View style={styles.tabsRow}>
          <TabBtn label={t('restaurantAnnouncements.sortNewest')} active={sortBy === 'date_desc'} onPress={() => setSortBy('date_desc')} />
          <TabBtn label={t('restaurantAnnouncements.sortOldest')} active={sortBy === 'date_asc'} onPress={() => setSortBy('date_asc')} />
          <TabBtn label={t('restaurantAnnouncements.sortUrgentFirst')} active={sortBy === 'urgent_first'} onPress={() => setSortBy('urgent_first')} />
        </View>
        {loading ? (
          <Text style={styles.emptyText}>{t('restaurantAnnouncements.loading')}</Text>
        ) : visibleAnnouncements.length === 0 ? (
          <Text style={styles.emptyText}>{t('restaurantAnnouncements.emptyView')}</Text>
        ) : (
          visibleAnnouncements.map((ann) => (
            <View key={ann.id} style={[styles.card, ann.is_urgent ? styles.cardUrgent : null]}>
              <View style={styles.row}>
                <Text style={styles.title}>{ann.title}</Text>
                {ann.is_urgent && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t('restaurantAnnouncements.urgent')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.contentText}>{ann.content}</Text>
              <View style={styles.metaRow}>
                <IconWrapper name="calendar-outline" size={14} color={Colors.textLight} />
                <Text style={styles.metaText}>
                  {ann.created_at ? new Date(ann.created_at).toLocaleDateString(dateLocale) : '-'}
                </Text>
              </View>
              <Text style={styles.expiryText}>{getExpiryLabel(ann.expires_at)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const TabBtn = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Text
    onPress={onPress}
    style={[styles.tabBtn, active ? styles.tabBtnActive : styles.tabBtnInactive]}
  >
    {label}
  </Text>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundLight },
  content: { flex: 1, padding: 16 },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    fontFamily: secondaryFont,
    fontSize: 14,
  },
  tabBtnActive: {
    backgroundColor: Colors.darkGreen,
    color: Colors.white,
  },
  tabBtnInactive: {
    backgroundColor: Colors.white,
    color: Colors.textLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardUrgent: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#f59e0b',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  contentText: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: secondaryFont,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  expiryText: {
    marginTop: 4,
    fontSize: 13,
    color: '#a16207',
    fontFamily: secondaryFont,
  },
});

export default AnnouncementsScreen;
