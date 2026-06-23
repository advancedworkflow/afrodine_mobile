import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import * as ordersApi from '../services/orders';
import {formatAxiosError} from '../utils/formatApiError';

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

const OrderDetailsScreen = ({navigation, route}: any) => {
  const orderId = route.params?.orderId ?? route.params?.order_id;
  const [order, setOrder] = useState<ordersApi.OrderApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (orderId == null) {
      setError('Commande introuvable');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getOrderById(orderId);
      setOrder(data);
    } catch (e: any) {
      setError(formatAxiosError(e, 'Erreur de chargement'));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <IconWrapper name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{error ?? 'Commande introuvable'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status = order.status as keyof typeof statusLabel;
  const label = statusLabel[status] ?? 'En cours';
  const color = statusColor[status] ?? Colors.textLight;
  const total = order.paid_amount ?? order.items?.reduce((s, i) => s + (i.total_price || 0), 0) ?? 0;
  const paymentDone = order.paid || order.status === 'paid';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.orderId}>Commande #{order.id}</Text>
          <View style={[styles.statusBadge, {backgroundColor: color + '20'}]}>
            <Text style={[styles.statusText, {color}]}>{label}</Text>
          </View>
        </View>
        <Text style={styles.date}>{formatDate(order.created)}</Text>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Adresse de livraison</Text>
          <Text style={styles.blockText}>{order.address}</Text>
          {order.phone ? (
            <Text style={styles.blockText}>Tél. {order.phone}</Text>
          ) : null}
          {order.email ? (
            <Text style={styles.blockText}>{order.email}</Text>
          ) : null}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Détail des articles</Text>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                Article #{item.dish_id} × {item.quantity}
              </Text>
              <Text style={styles.itemPrice}>{item.total_price.toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Paiement</Text>
          <Text style={[styles.blockText, paymentDone ? styles.paymentSuccess : styles.paymentPending]}>
            {paymentDone ? 'Payé' : 'En attente de paiement'}
          </Text>
          {order.paid_at ? (
            <Text style={styles.blockText}>Validé le {formatDate(order.paid_at)}</Text>
          ) : null}
          {order.paid_amount != null ? (
            <Text style={styles.blockText}>
              Montant payé: {Number(order.paid_amount).toFixed(2)} {order.paid_currency?.toUpperCase() || 'EUR'}
            </Text>
          ) : null}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{Number(total).toFixed(2)} €</Text>
        </View>

        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.detailButtonText}>Retour à l'historique</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    fontFamily: secondaryFont,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: secondaryFont,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  date: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 20,
    fontFamily: secondaryFont,
  },
  block: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    ...(Platform.OS !== 'web' && {
      shadowColor: Colors.black,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    }),
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    fontFamily: secondaryFont,
  },
  blockText: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  paymentSuccess: {
    color: Colors.success,
    fontWeight: '600',
  },
  paymentPending: {
    color: Colors.warning,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray[100],
  },
  itemName: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    fontFamily: secondaryFont,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryLight + '15',
    borderRadius: 12,
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  detailButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
});

export default OrderDetailsScreen;
