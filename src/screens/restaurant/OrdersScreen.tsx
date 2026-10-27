import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {alert} from '../../utils/alert';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors, Radius, Shadows} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {
  getRestaurantOrders,
  getGroceryShopOrders,
  updateOrderStatus,
  type RestaurantOrder,
} from '../../services/restaurantManagement';

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

// Onglets calqués sur le travail en cuisine : chaque statut appartient à un seul onglet
type TabKey = 'todo' | 'inProgress' | 'ready' | 'done';
const TABS: {key: TabKey; statuses: string[]}[] = [
  {key: 'todo', statuses: ['pending']},
  {key: 'inProgress', statuses: ['confirmed', 'preparing']},
  {key: 'ready', statuses: ['ready']},
  {key: 'done', statuses: ['delivered', 'paid', 'cancelled']},
];

// Étape suivante proposée sur la carte, selon le statut courant
const NEXT_STEP: Record<string, {status: string; labelKey: string}> = {
  pending: {status: 'confirmed', labelKey: 'restaurantOrders.actions.accept'},
  confirmed: {status: 'preparing', labelKey: 'restaurantOrders.actions.startPreparing'},
  preparing: {status: 'ready', labelKey: 'restaurantOrders.actions.markReady'},
  ready: {status: 'delivered', labelKey: 'restaurantOrders.actions.markDelivered'},
};

const ITEMS_PREVIEW = 2;

// Onglet « Commandes » (plats) ou écran « Commandes grocery » (route GroceryOrders, params.grocery)
const RestaurantOrdersScreen = ({navigation, route}: any) => {
  const {t} = useTranslation();
  const grocery = route?.params?.grocery === true;
  const fetchOrders = grocery ? getGroceryShopOrders : getRestaurantOrders;
  const title = grocery ? t('restaurantOrders.groceryTitle') : t('restaurantOrders.title');
  const topBarBack = grocery ? {showBackButton: true, onBackPress: () => navigation.goBack()} : {};
  const statusLabels: Record<string, string> = {
    pending: t('restaurantOrders.status.pending'),
    confirmed: t('restaurantOrders.status.confirmed'),
    preparing: t('restaurantOrders.status.preparing'),
    ready: t('restaurantOrders.status.ready'),
    delivered: t('restaurantOrders.status.delivered'),
    paid: t('restaurantOrders.status.paid'),
    cancelled: t('restaurantOrders.status.cancelled'),
  };
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('todo');
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Toutes les commandes sont chargées d'un coup : les onglets filtrent localement et affichent leurs compteurs
  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        setOrders(await fetchOrders());
      } catch (e) {
        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchOrders],
  );

  useEffect(() => {
    load();
  }, [load]);

  const applyStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? {...o, status: newStatus} : o)));
      setSelectedOrder(null);
    } catch (e) {
      alert(t('restaurantOrders.errorTitle'), t('restaurantOrders.updateStatusError'));
    } finally {
      setUpdatingId(null);
    }
  };

  // Les étapes intermédiaires se font d'un geste ; la livraison (qui crédite le restaurant) est confirmée
  const handleNextStep = (order: RestaurantOrder) => {
    const next = NEXT_STEP[order.status];
    if (!next) return;
    if (next.status !== 'delivered') {
      applyStatus(order.id, next.status);
      return;
    }
    alert(t('restaurantOrders.deliveredConfirmTitle'), t('restaurantOrders.deliveredConfirmMessage'), [
      {text: t('restaurantOrders.cancel'), style: 'cancel'},
      {text: 'OK', onPress: () => applyStatus(order.id, next.status)},
    ]);
  };

  // Correction manuelle depuis le détail (ex. retour en arrière après une erreur)
  const handleUpdateStatus = (orderId: number, newStatus: string) => {
    alert(
      t('restaurantOrders.changeStatusTitle'),
      t('restaurantOrders.changeStatusMessage', {status: statusLabels[newStatus] || newStatus}),
      [
        {text: t('restaurantOrders.cancel'), style: 'cancel'},
        {text: 'OK', onPress: () => applyStatus(orderId, newStatus)},
      ],
    );
  };

  const countFor = (tab: (typeof TABS)[number]) => orders.filter((o) => tab.statuses.includes(o.status)).length;
  const visibleOrders = orders.filter((o) =>
    TABS.find((tab) => tab.key === activeTab)!.statuses.includes(o.status),
  );

  const renderOrder = ({item}: {item: RestaurantOrder}) => {
    const next = NEXT_STEP[item.status];
    const items = item.items ?? [];
    const total = item.total ?? item.restaurant_total;
    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => setSelectedOrder(item)} activeOpacity={0.8}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{item.orderTime ?? item.orderDate ?? item.created_at}</Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusColor(item.status)}]}>
            <Text style={styles.statusText}>{statusLabels[item.status] ?? item.status}</Text>
          </View>
        </View>

        {item.customer?.name ? (
          <View style={styles.customerRow}>
            <IconWrapper name="person-outline" size={14} color={Colors.textLight} />
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer.name}
            </Text>
          </View>
        ) : null}

        <View style={styles.itemsBlock}>
          {items.slice(0, ITEMS_PREVIEW).map((i) => (
            <Text key={i.id} style={styles.itemLine} numberOfLines={1}>
              {i.quantity}
              {i.unit && i.unit !== 'piece' ? ` ${i.unit}` : '×'} {i.name}
            </Text>
          ))}
          {items.length > ITEMS_PREVIEW ? (
            <Text style={styles.moreItems}>
              {t('restaurantOrders.moreItems', {count: items.length - ITEMS_PREVIEW})}
            </Text>
          ) : null}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>{total?.toFixed(2)} €</Text>
          {next ? (
            <TouchableOpacity
              style={[styles.nextButton, updatingId === item.id && styles.nextButtonDisabled]}
              onPress={() => handleNextStep(item)}
              disabled={updatingId === item.id}
              activeOpacity={0.85}>
              {updatingId === item.id ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.nextButtonText}>{t(next.labelKey)}</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title={title} {...topBarBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title={title} {...topBarBack} />
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          const count = countFor(tab);
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                {t(`restaurantOrders.tabs.${tab.key}`)}
              </Text>
              {count > 0 ? (
                <View style={[styles.tabCount, active && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{count}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <FlatList
        data={visibleOrders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.darkGreen]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconWrapper name="receipt-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>
              {orders.length === 0
                ? grocery
                  ? t('restaurantOrders.noGroceryOrders')
                  : t('restaurantOrders.noOrders')
                : t('restaurantOrders.noOrdersInTab')}
            </Text>
          </View>
        }
      />
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedOrder(null)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedOrder.orderNumber}</Text>
                  <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                    <IconWrapper name="close-outline" size={28} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalLabel}>{t('restaurantOrders.customer')}</Text>
                <Text style={styles.modalText}>{selectedOrder.customer?.name ?? '—'}</Text>
                <Text style={styles.modalText}>{selectedOrder.phone}</Text>
                <Text style={styles.modalText}>{selectedOrder.address}</Text>
                <Text style={styles.modalLabel}>{t('restaurantOrders.items')}</Text>
                {selectedOrder.items?.map((i) => (
                  <Text key={i.id} style={styles.modalText}>
                    {i.quantity}{i.unit && i.unit !== 'piece' ? ` ${i.unit}` : '×'} {i.name} — {i.price.toFixed(2)} €
                  </Text>
                ))}
                <Text style={styles.modalTotal}>{t('restaurantOrders.totalLabel', {amount: (selectedOrder.total?.toFixed(2) ?? selectedOrder.restaurant_total?.toFixed(2))})}</Text>
                <Text style={styles.modalLabel}>{t('restaurantOrders.changeStatus')}</Text>
                <View style={styles.statusButtons}>
                  {STATUS_OPTIONS.filter((s) => s !== selectedOrder.status).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={styles.statusBtn}
                      onPress={() => handleUpdateStatus(selectedOrder.id, s)}
                      disabled={updatingId !== null}>
                      <Text style={styles.statusBtnText}>{statusLabels[s]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

function statusColor(s: string): string {
  const map: Record<string, string> = {
    pending: Colors.warning,
    confirmed: '#FBC7B4',
    preparing: Colors.terracotta,
    ready: Colors.success,
    delivered: Colors.darkGreen,
    paid: Colors.success,
    cancelled: Colors.error,
  };
  return map[s] ?? Colors.gray[400];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
  },
  tabActive: {
    backgroundColor: Colors.darkGreen,
  },
  tabText: {
    fontSize: 13,
    fontFamily: secondaryFont,
    color: Colors.text,
    flexShrink: 1,
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  tabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.terracotta,
  },
  tabCountActive: {
    backgroundColor: Colors.white,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  tabCountTextActive: {
    color: Colors.darkGreen,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
    ...Shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  orderNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  customerName: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  itemsBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 2,
  },
  itemLine: {
    fontSize: 15,
    color: Colors.text,
  },
  moreItems: {
    fontSize: 13,
    color: Colors.textLight,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  orderTotal: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.darkGreen,
  },
  nextButton: {
    minWidth: 140,
    alignItems: 'center',
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.pill,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 17,
    color: Colors.textLight,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginTop: 12,
    marginBottom: 4,
  },
  modalText: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  modalTotal: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.darkGreen,
    marginTop: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statusBtn: {
    backgroundColor: Colors.darkGreen,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statusBtnText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
});

export default RestaurantOrdersScreen;
