import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import { Colors } from '../../utils/colors';
import { secondaryFont } from '../../utils/fonts';
import { getManagementAnnouncements, type ManagementAnnouncement } from '../../services/restaurantManagement';

const AnnouncementsScreen = ({ navigation }: any) => {
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
    if (!expiresAt) return 'Sans expiration';
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (!Number.isFinite(ms)) return 'Expiration invalide';
    if (ms <= 0) return 'Expiree';
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days <= 1) return "Expire aujourd'hui";
    return `Expire dans ${days} jours`;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const t = new Date(expiresAt).getTime();
    if (!Number.isFinite(t)) return false;
    return t <= Date.now();
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
      <TopBar navigation={navigation} title="Annonces" showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.primary]} />}
      >
        <View style={styles.tabsRow}>
          <TabBtn label={`Actives (${activeCount})`} active={view === 'active'} onPress={() => setView('active')} />
          <TabBtn label={`Archives (${archivedCount})`} active={view === 'archived'} onPress={() => setView('archived')} />
          <TabBtn label={`Toutes (${allCount})`} active={view === 'all'} onPress={() => setView('all')} />
        </View>
        <View style={styles.tabsRow}>
          <TabBtn label="Plus recentes" active={sortBy === 'date_desc'} onPress={() => setSortBy('date_desc')} />
          <TabBtn label="Plus anciennes" active={sortBy === 'date_asc'} onPress={() => setSortBy('date_asc')} />
          <TabBtn label="Urgentes d'abord" active={sortBy === 'urgent_first'} onPress={() => setSortBy('urgent_first')} />
        </View>
        {loading ? (
          <Text style={styles.emptyText}>Chargement des annonces...</Text>
        ) : visibleAnnouncements.length === 0 ? (
          <Text style={styles.emptyText}>Aucune annonce dans cette vue.</Text>
        ) : (
          visibleAnnouncements.map((ann) => (
            <View key={ann.id} style={[styles.card, ann.is_urgent ? styles.cardUrgent : null]}>
              <View style={styles.row}>
                <Text style={styles.title}>{ann.title}</Text>
                {ann.is_urgent && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Urgent</Text>
                  </View>
                )}
              </View>
              <Text style={styles.contentText}>{ann.content}</Text>
              <View style={styles.metaRow}>
                <IconWrapper name="calendar-outline" size={14} color={Colors.textLight} />
                <Text style={styles.metaText}>
                  {ann.created_at ? new Date(ann.created_at).toLocaleDateString('fr-FR') : '-'}
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
    fontSize: 13,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
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
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
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
    fontSize: 10,
    fontWeight: '700',
  },
  contentText: {
    fontSize: 14,
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
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  expiryText: {
    marginTop: 4,
    fontSize: 12,
    color: '#a16207',
    fontFamily: secondaryFont,
  },
});

export default AnnouncementsScreen;
