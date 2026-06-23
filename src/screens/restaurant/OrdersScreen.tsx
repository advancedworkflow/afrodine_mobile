import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {
  getRestaurantOrders,
  updateOrderStatus,
  type RestaurantOrder,
} from '../../services/restaurantManagement';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivered: 'Livrée',
  paid: 'Payée',
  cancelled: 'Annulée',
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

const RestaurantOrdersScreen = ({navigation}: any) => {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getRestaurantOrders(statusFilter || undefined);
      setOrders(data);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getRestaurantOrders(statusFilter || undefined);
        if (!cancelled) setOrders(data);
      } catch (e) {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const onRefresh = () => {
    load(true);
  };

  const handleUpdateStatus = (orderId: number, newStatus: string) => {
    Alert.alert(
      'Changer le statut',
      `Passer la commande au statut « ${STATUS_LABELS[newStatus] || newStatus } » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            setUpdating(true);
            try {
              await updateOrderStatus(orderId, newStatus);
              setSelectedOrder(null);
              load(true);
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de mettre à jour le statut.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  const renderOrder = ({ item }: { item: RestaurantOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => setSelectedOrder(item)}
      activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[item.status] ?? item.status}</Text>
        </View>
      </View>
      <Text style={styles.orderDate}>{item.orderDate ?? item.created_at}</Text>
      <Text style={styles.orderTotal}>{item.total?.toFixed(2) ?? item.restaurant_total?.toFixed(2)} €</Text>
      <Text style={styles.orderItems}>{item.items_count} article(s)</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title="Commandes" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title="Commandes" />
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, !statusFilter && styles.filterChipActive]}
          onPress={() => setStatusFilter('')}>
          <Text style={[styles.filterChipText, !statusFilter && styles.filterChipTextActive]}>
            Toutes
          </Text>
        </TouchableOpacity>
        {(['pending', 'confirmed', 'preparing', 'ready'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            onPress={() => setStatusFilter(s)}>
            <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
              {STATUS_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconWrapper name="receipt-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucune commande</Text>
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
                <Text style={styles.modalLabel}>Client</Text>
                <Text style={styles.modalText}>{selectedOrder.customer?.name ?? '—'}</Text>
                <Text style={styles.modalText}>{selectedOrder.phone}</Text>
                <Text style={styles.modalText}>{selectedOrder.address}</Text>
                <Text style={styles.modalLabel}>Articles</Text>
                {selectedOrder.items?.map((i) => (
                  <Text key={i.id} style={styles.modalText}>
                    {i.quantity}× {i.name} — {i.price.toFixed(2)} €
                  </Text>
                ))}
                <Text style={styles.modalTotal}>Total: {selectedOrder.total?.toFixed(2) ?? selectedOrder.restaurant_total?.toFixed(2)} €</Text>
                <Text style={styles.modalLabel}>Changer le statut</Text>
                <View style={styles.statusButtons}>
                  {STATUS_OPTIONS.filter((s) => s !== selectedOrder.status).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={styles.statusBtn}
                      onPress={() => handleUpdateStatus(selectedOrder.id, s)}
                      disabled={updating}>
                      <Text style={styles.statusBtnText}>{STATUS_LABELS[s]}</Text>
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
    confirmed: Colors.primaryLighter,
    preparing: Colors.primaryLight,
    ready: Colors.success,
    delivered: Colors.primary,
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
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 6,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  orderItems: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
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
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginTop: 12,
    marginBottom: 4,
  },
  modalText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  modalTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statusBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statusBtnText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600',
  },
});

export default RestaurantOrdersScreen;
