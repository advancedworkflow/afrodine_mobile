import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import IconWrapper from '../components/IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import * as ordersApi from '../services/orders';
import {formatAxiosError} from '../utils/formatApiError';

type OrderForList = ordersApi.OrderForList;
type OrderStatus = ordersApi.OrderStatus;

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

const KNOWN_STATUSES = [
  'delivered',
  'cancelled',
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'paid',
  'payment_failed',
];

function getStatusDisplay(
  status: string,
  t: (key: string) => string,
): {label: string; color: string} {
  return {
    label: KNOWN_STATUSES.includes(status)
      ? t(`orderHistory.status.${status}`)
      : t('orderHistory.status.inProgress'),
    color: statusColor[status] ?? Colors.textLight,
  };
}

const OrderHistoryScreen = ({navigation}: any) => {
  const {t, i18n} = useTranslation();
  const dateLocale = i18n.language === 'en' ? 'en-GB' : i18n.language === 'de' ? 'de-DE' : 'fr-FR';
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
      setError(formatAxiosError(e, t('orderHistory.loadError')));
      setOrders([]);
    } finally {
      if (!getIsCancelled?.()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    loadOrders(false, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadOrders]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(dateLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrder = ({item}: {item: OrderForList}) => {
    const {label, color} = getStatusDisplay(item.status, t);
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
            {t('orderHistory.itemsCount', {count: item.itemsCount})}
          </Text>
        </View>
        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>{t('orderHistory.total')}</Text>
          <Text style={styles.totalValue}>{item.total.toFixed(2)}€</Text>
        </View>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => navigation.navigate('OrderDetails', {orderId: item.id})}>
          <Text style={styles.detailButtonText}>{t('orderHistory.orderDetailButton')}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('orderHistory.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <IconWrapper name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.emptyTitle}>{t('orderHistory.errorTitle')}</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => loadOrders()}>
            <Text style={styles.browseButtonText}>{t('orderHistory.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconWrapper name="receipt-outline" size={80} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>{t('orderHistory.emptyTitle')}</Text>
          <Text style={styles.emptyText}>
            {t('orderHistory.emptyText')}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.popTo('MainTabs', {screen: 'Restaurants'})}>
            <Text style={styles.browseButtonText}>{t('orderHistory.discoverRestaurants')}</Text>
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
    fontSize: 17,
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
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
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
    fontSize: 13,
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
    fontSize: 15,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  orderItems: {
    fontSize: 15,
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
    fontSize: 15,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  totalValue: {
    fontSize: 19,
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
    fontSize: 17,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 25,
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
    fontSize: 17,
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
    fontSize: 15,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
});

export default OrderHistoryScreen;
