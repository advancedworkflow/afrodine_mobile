import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import * as ordersApi from '../services/orders';
import {formatAxiosError} from '../utils/formatApiError';

type OrderForList = ordersApi.OrderForList;
type OrderStatus = ordersApi.OrderStatus;

const statusLabel: Record<string, string> = {
  delivered: 'Livrée',
  cancelled: 'Annulée',
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  paid: 'Payée',
  payment_failed: 'Paiement échoué',
};

const statusColor: Record<string, string> = {
  delivered: Colors.success,
  cancelled: Colors.error,
  pending: Colors.warning,
  confirmed: Colors.primaryLight,
  preparing: Colors.warning,
  ready: Colors.warning,
  paid: Colors.success,
  payment_failed: Colors.error,
};

function getStatusDisplay(status: string): {label: string; color: string} {
  return {
    label: statusLabel[status] ?? 'En cours',
    color: statusColor[status] ?? Colors.textLight,
  };
}

const OrderHistoryScreen = ({navigation}: any) => {
  const [orders, setOrders] = useState<OrderForList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (isRefresh = false, getIsCancelled?: () => boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const list = await ordersApi.getMyOrders({limit: 50, sort_order: 'desc'});
      if (getIsCancelled?.()) return;
      setOrders(list);
    } catch (e: any) {
      if (getIsCancelled?.()) return;
      setError(formatAxiosError(e, 'Erreur de chargement'));
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrder = ({item}: {item: OrderForList}) => {
    const {label, color} = getStatusDisplay(item.status);
    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('OrderDetails', {orderId: item.id})}>
        <View style={styles.orderHeader}>
          <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          <View style={[styles.statusBadge, {backgroundColor: color + '20'}]}>
            <Text style={[styles.statusText, {color}]}>{label}</Text>
          </View>
        </View>
        <View style={styles.orderMeta}>
          <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
          <Text style={styles.orderItems}>
            {item.itemsCount} article{item.itemsCount > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{item.total.toFixed(2)}€</Text>
        </View>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => navigation.navigate('OrderDetails', {orderId: item.id})}>
          <Text style={styles.detailButtonText}>Détail de la commande</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <IconWrapper name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.emptyTitle}>Erreur</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => loadOrders()}>
            <Text style={styles.browseButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconWrapper name="receipt-outline" size={80} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>Aucune commande</Text>
          <Text style={styles.emptyText}>
            Vos commandes passées apparaîtront ici.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Restaurants')}>
            <Text style={styles.browseButtonText}>Découvrir les restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadOrders(true)}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    ...(Platform.OS !== 'web' && {
      shadowColor: Colors.black,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    }),
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    }),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    fontFamily: secondaryFont,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  orderItems: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
    fontFamily: secondaryFont,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: secondaryFont,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: secondaryFont,
  },
  detailButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryLight + '30',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  detailButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
});

export default OrderHistoryScreen;
