import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import * as ordersApi from '../services/orders';
import {formatAxiosError} from '../utils/formatApiError';

type OrderForList = ordersApi.OrderForList;

const statusLabel: Record<string, string> = {
  delivered: 'Livrées',
  cancelled: 'Annulées',
  pending: 'En attente',
  confirmed: 'Confirmées',
  preparing: 'En préparation',
  ready: 'Prêtes',
};

const statusColor: Record<string, string> = {
  delivered: Colors.success,
  cancelled: Colors.error,
  pending: Colors.warning,
  confirmed: Colors.primaryLight,
  preparing: Colors.warning,
  ready: Colors.warning,
};

const metric = (value: number) => value.toLocaleString('fr-FR');
const euro = (value: number) =>
  value.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR', maximumFractionDigits: 2});

const OrderStatsScreen = ({navigation}: any) => {
  const [orders, setOrders] = useState<OrderForList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (isRefresh = false, getIsCancelled?: () => boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const list = await ordersApi.getMyOrders({limit: 100, sort_order: 'desc'});
      if (getIsCancelled?.()) return;
      setOrders(list);
    } catch (e: any) {
      if (getIsCancelled?.()) return;
      setError(formatAxiosError(e, 'Erreur de chargement des statistiques'));
      setOrders([]);
    } finally {
      if (!getIsCancelled?.()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadOrders(false, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadOrders]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const avgBasket = totalOrders > 0 ? totalSpent / totalOrders : 0;

    const byStatus = orders.reduce<Record<string, number>>((acc, order) => {
      const key = order.status || 'unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalOrders,
      totalSpent,
      deliveredOrders,
      cancelledOrders,
      avgBasket,
      byStatus,
      latest: orders.slice(0, 5),
    };
  }, [orders]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <IconWrapper name="alert-circle-outline" size={56} color={Colors.error} />
        <Text style={styles.errorTitle}>Impossible de charger</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadOrders()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} colors={[Colors.primary]} />
      }>
      <Text style={styles.sectionTitle}>Vue rapide</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total commandes</Text>
          <Text style={styles.metricValue}>{metric(stats.totalOrders)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Montant total</Text>
          <Text style={styles.metricValue}>{euro(stats.totalSpent)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Panier moyen</Text>
          <Text style={styles.metricValue}>{euro(stats.avgBasket)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Livrées / Annulées</Text>
          <Text style={styles.metricValue}>
            {metric(stats.deliveredOrders)} / {metric(stats.cancelledOrders)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Répartition par statut</Text>
      <View style={styles.card}>
        {Object.keys(stats.byStatus).length === 0 ? (
          <Text style={styles.emptyText}>Aucune commande pour le moment.</Text>
        ) : (
          Object.entries(stats.byStatus).map(([status, count]) => {
            const label = statusLabel[status] ?? 'Autres';
            const color = statusColor[status] ?? Colors.textLight;
            return (
              <View key={status} style={styles.statusRow}>
                <View style={styles.statusLeft}>
                  <View style={[styles.dot, {backgroundColor: color}]} />
                  <Text style={styles.statusLabel}>{label}</Text>
                </View>
                <Text style={styles.statusValue}>{count}</Text>
              </View>
            );
          })
        )}
      </View>

      <Text style={styles.sectionTitle}>Historique récent</Text>
      <View style={styles.card}>
        {stats.latest.length === 0 ? (
          <Text style={styles.emptyText}>Aucune commande récente.</Text>
        ) : (
          stats.latest.map(order => (
            <TouchableOpacity
              key={order.id}
              style={styles.historyItem}
              onPress={() => navigation.navigate('OrderDetails', {orderId: order.id})}>
              <View style={styles.historyTop}>
                <Text style={styles.historyRestaurant} numberOfLines={1}>
                  {order.restaurantName}
                </Text>
                <Text style={styles.historyAmount}>{euro(order.total || 0)}</Text>
              </View>
              <View style={styles.historyBottom}>
                <Text style={styles.historyMeta}>
                  {order.itemsCount} article{order.itemsCount > 1 ? 's' : ''}
                </Text>
                <Text style={styles.historyMeta}>
                  {statusLabel[order.status] ?? 'En cours'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.backgroundLight,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  errorTitle: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  errorText: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 14,
    marginBottom: 16,
    fontFamily: secondaryFont,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontFamily: secondaryFont,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 10,
    marginTop: 6,
    fontFamily: secondaryFont,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 10,
  },
  metricCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 6,
    fontFamily: secondaryFont,
  },
  metricValue: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray[100],
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: secondaryFont,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderColor: Colors.gray[100],
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.textLight,
    fontSize: 14,
    fontFamily: secondaryFont,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: secondaryFont,
  },
  statusValue: {
    color: Colors.text,
    fontWeight: '700',
    fontFamily: secondaryFont,
  },
  historyItem: {
    borderBottomColor: Colors.gray[100],
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  historyRestaurant: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  historyAmount: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: secondaryFont,
  },
  historyBottom: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyMeta: {
    color: Colors.textLight,
    fontSize: 13,
    fontFamily: secondaryFont,
  },
});

export default OrderStatsScreen;
