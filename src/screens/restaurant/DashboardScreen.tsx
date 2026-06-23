import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {formatAxiosError} from '../../utils/formatApiError';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getOrdersAnalytics,
  getManagementReviews,
  getWalletInfo,
  requestPayout,
  getStripeConnectStatus,
  getStripeConnectBalance,
  getStripeConnectPayouts,
  createStripeConnectOnboardingLink,
  type DashboardStats,
  type RevenueDataPoint,
  type OrdersDataPoint,
  type ManagementReview,
  type StripeConnectStatus,
  type StripeConnectBalance,
  type StripeConnectPayout,
} from '../../services/restaurantManagement';

import LineChartCard from '../../components/charts/LineChartCard';

const DASHBOARD_CHART_HEIGHT = 100;
const DASHBOARD_BAR_MAX = 70;
const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function getPointValue(point: RevenueDataPoint | OrdersDataPoint, valueKey: 'revenue' | 'orders'): number {
  return valueKey === 'revenue' ? (point as RevenueDataPoint).revenue ?? 0 : (point as OrdersDataPoint).orders ?? 0;
}

function last7DaysRevenue(): RevenueDataPoint[] {
  const out: RevenueDataPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), revenue: 0 });
  }
  return out;
}

function last7DaysOrders(): OrdersDataPoint[] {
  const out: OrdersDataPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), orders: 0 });
  }
  return out;
}

function MiniBarChart({
  data,
  valueKey,
  color = Colors.primary,
}: {
  data: RevenueDataPoint[] | OrdersDataPoint[];
  valueKey: 'revenue' | 'orders';
  color?: string;
}) {
  const values = data.map((d) => getPointValue(d, valueKey));
  const max = Math.max(...values, 1);
  const width = Dimensions.get('window').width - 32 - 32;
  const barWidth = data.length > 0 ? Math.max((width / data.length) * 0.55, 20) : 20;
  const gap = data.length > 0 ? (width / data.length) * 0.45 : 6;

  return (
    <View style={dashboardStyles.chartWrap}>
      <View style={dashboardStyles.barRow}>
        {data.map((point) => {
          const v = getPointValue(point, valueKey);
          const h = max > 0 ? (v / max) * DASHBOARD_BAR_MAX : 0;
          const dateStr = (point as { date: string }).date;
          return (
            <View key={dateStr} style={[dashboardStyles.barWrap, { width: barWidth + gap }]}>
              <View
                style={[
                  dashboardStyles.bar,
                  {
                    width: barWidth,
                    height: Math.max(h, 4),
                    backgroundColor: color,
                  },
                ]}
              />
              <Text style={dashboardStyles.barDay}>{DAY_LABELS[new Date(dateStr).getDay()] ?? ''}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function HorizontalBarChart({
  items,
  valueKey,
  labelFormat,
  maxWidth = 120,
}: {
  items: { id: number; name: string; orders?: number; revenue?: number }[];
  valueKey: 'orders' | 'revenue';
  labelFormat: (v: number) => string;
  maxWidth?: number;
}) {
  const values = items.map((i) => (valueKey === 'orders' ? (i.orders ?? 0) : (i.revenue ?? 0)));
  const max = Math.max(...values, 1);

  return (
    <View style={dashboardStyles.hChartList}>
      {items.slice(0, 5).map((item) => {
        const v = valueKey === 'orders' ? (item.orders ?? 0) : (item.revenue ?? 0);
        const w = max > 0 ? (v / max) * maxWidth : 0;
        return (
          <View key={item.id} style={dashboardStyles.hChartRow}>
            <Text style={dashboardStyles.hChartLabel} numberOfLines={1}>{item.name}</Text>
            <View style={dashboardStyles.hChartBarBg}>
              <View style={[dashboardStyles.hChartBar, { width: Math.max(w, 4), backgroundColor: Colors.primaryLight }]} />
            </View>
            <Text style={dashboardStyles.hChartValue}>{labelFormat(v)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const dashboardStyles = StyleSheet.create({
  chartWrap: {
    height: DASHBOARD_CHART_HEIGHT,
    marginTop: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: DASHBOARD_BAR_MAX + 22,
  },
  barWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  barDay: {
    fontSize: 9,
    color: Colors.textLight,
    marginTop: 4,
  },
  hChartList: {
    marginTop: 8,
  },
  hChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  hChartLabel: {
    width: 80,
    fontSize: 12,
    color: Colors.text,
    flexShrink: 1,
  },
  hChartBarBg: {
    flex: 1,
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 7,
    overflow: 'hidden',
  },
  hChartBar: {
    height: '100%',
    borderRadius: 7,
    minWidth: 4,
  },
  hChartValue: {
    width: 44,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
});

type ChartPeriod = '7d' | '30d' | '90d';
const PERIOD_OPTIONS: { value: ChartPeriod; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
];

const RestaurantDashboardScreen = ({navigation}: any) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [ordersData, setOrdersData] = useState<OrdersDataPoint[]>([]);
  const [recentReviews, setRecentReviews] = useState<ManagementReview[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [connectBalance, setConnectBalance] = useState<StripeConnectBalance | null>(null);
  const [lastPayout, setLastPayout] = useState<StripeConnectPayout | null>(null);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('7d');
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

  const loadWallet = async () => {
    try {
      const [info, statusData] = await Promise.all([
        getWalletInfo(),
        getStripeConnectStatus(),
      ]);
      const shouldLoadStripeDetails =
        !!statusData &&
        (statusData.charges_enabled === true ||
          statusData.payouts_enabled === true ||
          statusData.details_submitted === true);
      const [balanceData, payoutsData] = shouldLoadStripeDetails
        ? await Promise.all([getStripeConnectBalance(), getStripeConnectPayouts(1)])
        : [null, []];
      setWalletBalance(info?.balance ?? info?.available_balance ?? 0);
      setConnectStatus(statusData);
      setConnectBalance(balanceData);
      setLastPayout(Array.isArray(payoutsData) && payoutsData.length > 0 ? payoutsData[0] : null);
    } catch {
      setWalletBalance(0);
      setConnectStatus(null);
      setConnectBalance(null);
      setLastPayout(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [statsRes, revenueRes, ordersRes] = await Promise.all([
          getDashboardStats(),
          getRevenueAnalytics(chartPeriod),
          getOrdersAnalytics(chartPeriod),
        ]);
        if (!cancelled) {
          const statsValid = statsRes && typeof statsRes === 'object' && !('error' in statsRes);
          setStats(statsValid ? statsRes : {});
          setRevenueData(Array.isArray(revenueRes) ? revenueRes : []);
          setOrdersData(Array.isArray(ordersRes) ? ordersRes : []);
        }
        try {
          const reviewsList = await getManagementReviews();
          if (!cancelled) setRecentReviews(Array.isArray(reviewsList) ? reviewsList.slice(0, 2) : []);
        } catch {
          if (!cancelled) setRecentReviews([]);
        }
        try {
          const [info, statusData] = await Promise.all([
            getWalletInfo(),
            getStripeConnectStatus(),
          ]);
          const shouldLoadStripeDetails =
            !!statusData &&
            (statusData.charges_enabled === true ||
              statusData.payouts_enabled === true ||
              statusData.details_submitted === true);
          const [balanceData, payoutsData] = shouldLoadStripeDetails
            ? await Promise.all([getStripeConnectBalance(), getStripeConnectPayouts(1)])
            : [null, []];
          if (!cancelled) {
            setWalletBalance(info?.balance ?? info?.available_balance ?? 0);
            setConnectStatus(statusData);
            setConnectBalance(balanceData);
            setLastPayout(Array.isArray(payoutsData) && payoutsData.length > 0 ? payoutsData[0] : null);
          }
        } catch {
          if (!cancelled) {
            setWalletBalance(0);
            setConnectStatus(null);
            setConnectBalance(null);
            setLastPayout(null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setStats({});
          setRevenueData([]);
          setOrdersData([]);
          setRecentReviews([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [chartPeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [statsRes, revenueRes, ordersRes] = await Promise.all([
        getDashboardStats(),
        getRevenueAnalytics(chartPeriod),
        getOrdersAnalytics(chartPeriod),
      ]);
      const statsValid = statsRes && typeof statsRes === 'object' && !('error' in statsRes);
      setStats(statsValid ? statsRes : {});
      setRevenueData(Array.isArray(revenueRes) ? revenueRes : []);
      setOrdersData(Array.isArray(ordersRes) ? ordersRes : []);
      try {
        const reviewsList = await getManagementReviews();
        setRecentReviews(Array.isArray(reviewsList) ? reviewsList.slice(0, 2) : []);
      } catch {
        setRecentReviews([]);
      }
      await loadWallet();
    } catch (e) {
      setStats({});
      setRevenueData([]);
      setOrdersData([]);
      setRecentReviews([]);
    } finally {
      setRefreshing(false);
    }
  };

  const onConfirmPayout = async () => {
    const amount = parseFloat(payoutAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Montant invalide', 'Saisissez un montant positif.');
      return;
    }
    if (amount > walletBalance) {
      Alert.alert('Solde insuffisant', `Solde disponible : ${walletBalance.toFixed(2)} €`);
      return;
    }
    setPayoutLoading(true);
    try {
      const result = await requestPayout(amount, 'Retrait manuel');
      if (result?.success) {
        setPayoutModalVisible(false);
        setPayoutAmount('');
        setWalletBalance(result?.new_balance ?? walletBalance - amount);
        Alert.alert('Succès', `Payout de ${amount.toFixed(2)} € demandé. Arrivée sous 1-3 jours ouvrés.`);
      } else {
        Alert.alert('Erreur', (result as any)?.message ?? 'Impossible d\'effectuer le retrait.');
      }
    } catch (e: any) {
      Alert.alert('Erreur', formatAxiosError(e, 'Impossible d\'effectuer le retrait.'));
    } finally {
      setPayoutLoading(false);
    }
  };

  const onOpenConnectOnboarding = async () => {
    const link = await createStripeConnectOnboardingLink();
    if (!link?.url) {
      Alert.alert('Stripe Connect', 'Impossible de generer le lien onboarding pour le moment.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(link.url);
      if (!canOpen) {
        Alert.alert('Stripe Connect', 'Impossible d’ouvrir le navigateur sur cet appareil.');
        return;
      }
      await Linking.openURL(link.url);
    } catch {
      Alert.alert('Stripe Connect', 'Impossible d’ouvrir le lien onboarding. Reessayez.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar
          navigation={navigation}
          title="Tableau de bord"
          showOptionsMenu
          showNotifications={true}
          optionsMenuItems={[
            { label: 'Profil', onPress: () => navigation.navigate('RestaurantProfile') },
            { label: 'Paramètres', onPress: () => navigation.navigate('Settings') },
          ]}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const pending = stats?.pending_orders ?? 0;
  const todayRev = stats?.today_revenue ?? 0;
  const totalRev = stats?.total_revenue ?? 0;
  const totalOrders = stats?.total_orders ?? 0;
  const totalDishes = stats?.total_dishes ?? 0;
  const topDishes = stats?.top_dishes ?? [];

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title="Tableau de bord"
        showOptionsMenu
        showNotifications={true}
        optionsMenuItems={[
          { label: 'Profil', onPress: () => navigation.navigate('RestaurantProfile') },
          { label: 'Paramètres', onPress: () => navigation.navigate('Settings') },
        ]}
      />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }>
        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.cardPrimary]}>
            <IconWrapper name="receipt-outline" size={28} color={Colors.white} />
            <Text style={styles.cardValueWhite}>{pending}</Text>
            <Text style={styles.cardLabelWhite}>En attente</Text>
          </View>
          <View style={styles.card}>
            <IconWrapper name="cash-outline" size={28} color={Colors.primary} />
            <Text style={styles.cardValue}>{todayRev.toFixed(0)} €</Text>
            <Text style={styles.cardLabel}>Aujourd'hui</Text>
          </View>
        </View>
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <IconWrapper name="restaurant-outline" size={28} color={Colors.primary} />
            <Text style={styles.cardValue}>{totalOrders}</Text>
            <Text style={styles.cardLabel}>Commandes</Text>
          </View>
          <View style={styles.card}>
            <IconWrapper name="pricetag-outline" size={28} color={Colors.primary} />
            <Text style={styles.cardValue}>{totalDishes}</Text>
            <Text style={styles.cardLabel}>Plats</Text>
          </View>
        </View>

        <View style={[styles.periodRow, periodDropdownOpen && styles.periodRowDropdownOpen]}>
          <Text style={styles.periodLabel}>Période des graphiques</Text>
          <View style={styles.periodDropdownWrap}>
            <TouchableOpacity
              style={styles.periodDropdownButton}
              onPress={() => setPeriodDropdownOpen(!periodDropdownOpen)}
              activeOpacity={0.8}>
              <Text style={styles.periodDropdownButtonText}>
                {PERIOD_OPTIONS.find((p) => p.value === chartPeriod)?.label ?? chartPeriod}
              </Text>
              <IconWrapper
                name={periodDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
            {periodDropdownOpen && (
              <View style={styles.periodDropdownMenu}>
                {PERIOD_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.periodDropdownItem, chartPeriod === opt.value && styles.periodDropdownItemActive]}
                    onPress={() => {
                      setChartPeriod(opt.value);
                      setPeriodDropdownOpen(false);
                    }}
                    activeOpacity={0.7}>
                    <Text style={[styles.periodDropdownItemText, chartPeriod === opt.value && styles.periodDropdownItemTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <LineChartCard
          data={revenueData.length > 0 ? revenueData : last7DaysRevenue()}
          valueKey="revenue"
          color={Colors.primary}
          title="Revenus"
          valueLabel={PERIOD_OPTIONS.find((p) => p.value === chartPeriod)?.label ?? `Total ${chartPeriod}`}
          formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k €` : `${v.toFixed(0)} €`)}
        />
        <LineChartCard
          data={ordersData.length > 0 ? ordersData : last7DaysOrders()}
          valueKey="orders"
          color={Colors.primaryLight}
          title="Commandes"
          valueLabel={PERIOD_OPTIONS.find((p) => p.value === chartPeriod)?.label ?? `Total ${chartPeriod}`}
          formatValue={(v) => `${v}`}
        />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenu total</Text>
          <Text style={styles.revenueTotal}>{totalRev.toFixed(2)} €</Text>
          <Text style={styles.dataSourceLabel}>Données en direct (API)</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="wallet-outline" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Portefeuille</Text>
          </View>
          <Text style={styles.walletBalance}>{walletBalance.toFixed(2)} € disponibles</Text>
          <TouchableOpacity
            style={styles.payoutButton}
            onPress={() => setPayoutModalVisible(true)}
            activeOpacity={0.8}
            disabled={walletBalance <= 0}>
            <IconWrapper name="card-outline" size={20} color={Colors.white} />
            <Text style={styles.payoutButtonText}>Effectuer un payout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="card-outline" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Stripe Connect</Text>
          </View>
          <View style={styles.connectRow}>
            <Text style={styles.connectLabel}>Statut</Text>
            <Text style={styles.connectValue}>
              {connectStatus?.charges_enabled && connectStatus?.payouts_enabled
                ? 'Actif'
                : (connectStatus?.status || 'Non configure')}
            </Text>
          </View>
          <View style={styles.connectRow}>
            <Text style={styles.connectLabel}>Disponible Connect</Text>
            <Text style={styles.connectValue}>{(connectBalance?.available_balance ?? 0).toFixed(2)} €</Text>
          </View>
          <View style={styles.connectRow}>
            <Text style={styles.connectLabel}>En attente Connect</Text>
            <Text style={styles.connectValue}>{(connectBalance?.pending_balance ?? 0).toFixed(2)} €</Text>
          </View>
          <View style={styles.connectRow}>
            <Text style={styles.connectLabel}>Dernier payout</Text>
            <Text style={styles.connectValue}>
              {lastPayout?.amount != null ? `${Number(lastPayout.amount).toFixed(2)} €` : 'Aucun'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={onOpenConnectOnboarding}
            activeOpacity={0.8}>
            <Text style={styles.connectButtonText}>Activer / Mettre a jour Connect</Text>
          </TouchableOpacity>
        </View>
        {topDishes.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plats populaires (CA)</Text>
              <HorizontalBarChart
                items={topDishes}
                valueKey="revenue"
                labelFormat={(v) => `${v.toFixed(0)} €`}
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plats les plus commandés</Text>
              <HorizontalBarChart
                items={topDishes}
                valueKey="orders"
                labelFormat={(v) => `${v} cmd`}
              />
            </View>
          </>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avis</Text>
          {recentReviews.length === 0 ? (
            <Text style={styles.mutedText}>Aucun avis pour le moment.</Text>
          ) : (
            recentReviews.map((review, index) => (
              <View key={review.id ?? index} style={styles.reviewRow}>
                <View style={styles.reviewRatingRow}>
                  <IconWrapper name="star" size={14} color={Colors.primary} />
                  <Text style={styles.reviewRating}>{review.rating ?? review.score ?? '–'}</Text>
                </View>
                <Text style={styles.reviewComment} numberOfLines={2}>{review.comment || review.comment_text || '—'}</Text>
                <Text style={styles.reviewAuthor}>{review.client_name ?? review.user_name ?? 'Client'}</Text>
              </View>
            ))
          )}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('RestaurantReviews')}
            activeOpacity={0.7}>
            <Text style={styles.linkButtonText}>Voir avis</Text>
            <IconWrapper name="chevron-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="megaphone-outline" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Annonces</Text>
          </View>
          <Text style={styles.mutedText}>Consultez les annonces de l'administration.</Text>
          <TouchableOpacity
            style={styles.traiteurButton}
            onPress={() => navigation.navigate('RestaurantAnnouncements')}
            activeOpacity={0.8}>
            <Text style={styles.traiteurButtonText}>Voir les annonces</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="restaurant" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Service traiteur</Text>
          </View>
          <Text style={styles.mutedText}>Gérez vos demandes traiteur et formules pour événements.</Text>
          <TouchableOpacity
            style={styles.traiteurButton}
            onPress={() => navigation.navigate('CateringManagement')}
            activeOpacity={0.8}>
            <Text style={styles.traiteurButtonText}>Accéder au traiteur</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="pricetag-outline" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Promotions</Text>
          </View>
          <Text style={styles.mutedText}>Créez et gérez vos offres promotionnelles.</Text>
          <TouchableOpacity
            style={styles.traiteurButton}
            onPress={() => navigation.navigate('PromotionsManagement')}
            activeOpacity={0.8}>
            <Text style={styles.traiteurButtonText}>Gérer les promotions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        visible={payoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !payoutLoading && setPayoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Effectuer un payout</Text>
            <Text style={styles.modalHint}>Montant à retirer (€)</Text>
            <TextInput
              style={styles.modalInput}
              value={payoutAmount}
              onChangeText={setPayoutAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
              editable={!payoutLoading}
            />
            <Text style={styles.modalBalance}>Solde : {walletBalance.toFixed(2)} €</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => !payoutLoading && setPayoutModalVisible(false)}
                disabled={payoutLoading}>
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={onConfirmPayout}
                disabled={payoutLoading}>
                {payoutLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cardPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
    marginTop: 8,
    textAlign: 'center',
  },
  cardValueWhite: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: secondaryFont,
    marginTop: 8,
    textAlign: 'center',
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  cardLabelWhite: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    textAlign: 'center',
  },
  periodRow: {
    marginTop: 16,
    marginBottom: 8,
    zIndex: 20,
    elevation: 20,
  },
  periodRowDropdownOpen: {
    marginBottom: 160,
  },
  periodLabel: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
    marginBottom: 8,
  },
  periodDropdownWrap: {
    position: 'relative',
    zIndex: 10,
  },
  periodDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  periodDropdownButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  periodDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  periodDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  periodDropdownItemActive: {
    backgroundColor: Colors.primaryLight + '20',
  },
  periodDropdownItemText: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  periodDropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
    marginBottom: 12,
  },
  revenueTotal: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: secondaryFont,
    textAlign: 'center',
  },
  dataSourceLabel: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 6,
    fontFamily: secondaryFont,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
    marginBottom: 12,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 4,
  },
  payoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalHint: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  modalBalance: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Colors.border,
  },
  modalBtnConfirm: {
    backgroundColor: Colors.primary,
  },
  modalBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  modalBtnConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  dishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dishName: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  dishMeta: {
    fontSize: 13,
    color: Colors.textLight,
  },
  mutedText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
  },
  reviewRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  reviewRating: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: secondaryFont,
    marginBottom: 2,
  },
  reviewAuthor: {
    fontSize: 12,
    color: Colors.textLight,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  traiteurButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  traiteurButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  connectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  connectLabel: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  connectValue: {
    fontSize: 14,
    color: Colors.primaryDark,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  connectButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  connectButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: secondaryFont,
  },
});

export default RestaurantDashboardScreen;
