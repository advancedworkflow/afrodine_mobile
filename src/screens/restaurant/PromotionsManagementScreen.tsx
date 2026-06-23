import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {
  getManagementPromotions,
  deleteManagementPromotion,
  getManagementPromotionStats,
  type ManagementPromotion,
  type PromotionStats,
} from '../../services/restaurantManagement';
import ConfirmModal from '../../components/ConfirmModal';
import {formatAxiosError} from '../../utils/formatApiError';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Active',
  paused: 'En pause',
  expired: 'Expirée',
  cancelled: 'Annulée',
};

const PromotionsManagementScreen = ({navigation}: any) => {
  const [promotions, setPromotions] = useState<ManagementPromotion[]>([]);
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagementPromotion | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [list, statsRes] = await Promise.all([
        getManagementPromotions(),
        getManagementPromotionStats(),
      ]);
      setPromotions(list);
      setStats(statsRes ?? null);
    } catch {
      setPromotions([]);
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => load(true);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteManagementPromotion(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      Alert.alert('Succès', 'Promotion supprimée.');
    } catch (e: any) {
      Alert.alert('Erreur', formatAxiosError(e, 'Impossible de supprimer.'));
    }
  };

  const statusLabel = (s?: string) => (s ? STATUS_LABELS[s] ?? s : '—');

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar
          navigation={navigation}
          title="Promotions"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title="Promotions"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }>
        {stats && (stats.total_promotions != null || stats.active_promotions != null) && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total_promotions ?? 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.active_promotions ?? 0}</Text>
              <Text style={styles.statLabel}>Actives</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total_uses ?? 0}</Text>
              <Text style={styles.statLabel}>Utilisations</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('PromotionForm', {promotion: undefined})}
          activeOpacity={0.8}>
          <IconWrapper name="add-circle-outline" size={24} color={Colors.white} />
          <Text style={styles.addButtonText}>Nouvelle promotion</Text>
        </TouchableOpacity>

        {promotions.length === 0 ? (
          <View style={styles.empty}>
            <IconWrapper name="pricetag-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Aucune promotion</Text>
            <Text style={styles.emptyText}>
              Créez une promotion pour mettre en avant vos plats ou menus.
            </Text>
          </View>
        ) : (
          promotions.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => navigation.navigate('PromotionForm', {promotion: p})}
              activeOpacity={0.8}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{p.title}</Text>
                {p.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {p.description}
                  </Text>
                ) : null}
                <View style={styles.cardMeta}>
                  <Text style={styles.statusBadge}>{statusLabel(p.status)}</Text>
                  {p.final_price_display != null && (
                    <Text style={styles.cardPrice}>{p.final_price_display}</Text>
                  )}
                  {p.discount_display != null && (
                    <Text style={styles.discountBadge}>{p.discount_display}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setDeleteTarget(p)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <IconWrapper name="trash-outline" size={22} color={Colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={deleteTarget != null}
        title="Supprimer la promotion"
        message={`Supprimer « ${deleteTarget?.title} » ?`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    fontFamily: secondaryFont,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  statusBadge: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  cardPrice: {
    fontSize: 13,
    color: Colors.text,
  },
  discountBadge: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
  },
});

export default PromotionsManagementScreen;
