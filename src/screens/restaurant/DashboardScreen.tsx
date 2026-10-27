import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors, Radius, Spacing, Shadows} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getOrdersAnalytics,
  getManagementReviews,
  getLedgerBalance,
  type DashboardStats,
  type RevenueDataPoint,
  type OrdersDataPoint,
  type ManagementReview,
} from '../../services/restaurantManagement';

import LineChartCard from '../../components/charts/LineChartCard';

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

// Classement des plats : rang, nom et valeur au-dessus d'une barre proportionnelle au premier
function HorizontalBarChart({
  items,
  valueKey,
  labelFormat,
  color,
}: {
  items: { id: number; name: string; orders?: number; revenue?: number }[];
  valueKey: 'orders' | 'revenue';
  labelFormat: (v: number) => string;
  color: string;
}) {
  const valueOf = (i: { orders?: number; revenue?: number }) => (valueKey === 'orders' ? (i.orders ?? 0) : (i.revenue ?? 0));
  const max = Math.max(...items.map(valueOf), 1);

  return (
    <View style={dashboardStyles.hChartList}>
      {items.slice(0, 5).map((item, index) => {
        const v = valueOf(item);
        return (
          <View key={item.id} style={dashboardStyles.hChartRow}>
            <Text style={dashboardStyles.hChartRank}>{index + 1}</Text>
            <View style={dashboardStyles.hChartBody}>
              <View style={dashboardStyles.hChartTop}>
                <Text style={dashboardStyles.hChartLabel} numberOfLines={1}>{item.name}</Text>
                <Text style={dashboardStyles.hChartValue}>{labelFormat(v)}</Text>
              </View>
              <View style={dashboardStyles.hChartBarBg}>
                <View style={[dashboardStyles.hChartBar, { width: `${Math.max((v / max) * 100, 3)}%`, backgroundColor: color }]} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const dashboardStyles = StyleSheet.create({
  hChartList: {
    marginTop: Spacing[3],
    gap: Spacing[3],
  },
  hChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  hChartRank: {
    width: 18,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textLight,
    textAlign: 'center',
  },
  hChartBody: {
    flex: 1,
  },
  hChartTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: Spacing[2],
  },
  hChartLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  hChartValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  hChartBarBg: {
    height: 8,
    backgroundColor: Colors.gray[100],
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  hChartBar: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});

type ChartPeriod = '7d' | '30d' | '90d';
const PERIOD_VALUES: ChartPeriod[] = ['7d', '30d', '90d'];

const RestaurantDashboardScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const PERIOD_OPTIONS: { value: ChartPeriod; label: string }[] = PERIOD_VALUES.map((value) => ({
    value,
    label: t(`restaurantDashboard.periods.${value}`),
  }));
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [ordersData, setOrdersData] = useState<OrdersDataPoint[]>([]);
  const [recentReviews, setRecentReviews] = useState<ManagementReview[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('7d');

  const loadWallet = async () => {
    try {
      const balance = await getLedgerBalance();
      setWalletBalance(balance?.available_balance ?? 0);
    } catch {
      setWalletBalance(0);
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
          const balance = await getLedgerBalance();
          if (!cancelled) setWalletBalance(balance?.available_balance ?? 0);
        } catch {
          if (!cancelled) setWalletBalance(0);
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

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar
          navigation={navigation}
          title={t('restaurantDashboard.title')}
          showOptionsMenu
          showNotifications={true}
          optionsMenuItems={[
            { label: t('restaurantDashboard.menuProfile'), onPress: () => navigation.navigate('RestaurantProfile') },
            { label: t('restaurantDashboard.menuSettings'), onPress: () => navigation.navigate('Settings') },
          ]}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
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
  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === chartPeriod)?.label ?? t('restaurantDashboard.totalPeriod', {period: chartPeriod});

  const shortcuts = [
    { icon: 'megaphone-outline', title: t('restaurantDashboard.announcements'), hint: t('restaurantDashboard.announcementsHint'), screen: 'RestaurantAnnouncements' },
    { icon: 'restaurant-outline', title: t('restaurantDashboard.cateringService'), hint: t('restaurantDashboard.cateringHint'), screen: 'CateringManagement' },
    { icon: 'storefront-outline', title: t('restaurantDashboard.groceryShop'), hint: t('restaurantDashboard.groceryHint'), screen: 'GroceryManagement' },
    { icon: 'pricetag-outline', title: t('restaurantDashboard.promotions'), hint: t('restaurantDashboard.promotionsHint'), screen: 'PromotionsManagement' },
    { icon: 'people-outline', title: t('restaurantDashboard.employees'), hint: t('restaurantDashboard.employeesHint'), screen: 'EmployeesManagement' },
  ];

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title={t('restaurantDashboard.title')}
        showOptionsMenu
        showNotifications={true}
        optionsMenuItems={[
          { label: t('restaurantDashboard.menuProfile'), onPress: () => navigation.navigate('RestaurantProfile') },
          { label: t('restaurantDashboard.menuSettings'), onPress: () => navigation.navigate('Settings') },
        ]}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.darkGreen]} />
        }>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{t('restaurantDashboard.today')}</Text>
          <Text style={styles.heroValue}>{todayRev.toFixed(0)} €</Text>
          <View style={styles.heroPill}>
            <View style={styles.heroDot} />
            <Text style={styles.heroPillText}>{pending} {t('restaurantDashboard.pending')}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>{t('restaurantDashboard.orders')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalDishes}</Text>
            <Text style={styles.statLabel}>{t('restaurantDashboard.dishes')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalRev.toFixed(0)} €</Text>
            <Text style={styles.statLabel}>{t('restaurantDashboard.totalRevenue')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.card, styles.row]}
          onPress={() => navigation.navigate('RestaurantWallet')}
          activeOpacity={0.7}>
          <View style={styles.rowIcon}>
            <IconWrapper name="wallet-outline" size={20} color={Colors.darkGreen} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{t('restaurantDashboard.wallet')}</Text>
            <Text style={styles.rowHint}>{t('restaurantDashboard.availableBalance', {amount: walletBalance.toFixed(2)})}</Text>
          </View>
          <IconWrapper name="chevron-forward" size={18} color={Colors.gray[400]} />
        </TouchableOpacity>

        <View style={styles.segmented}>
          {PERIOD_OPTIONS.map((opt) => {
            const active = chartPeriod === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => setChartPeriod(opt.value)}
                activeOpacity={0.7}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <LineChartCard
          data={revenueData.length > 0 ? revenueData : last7DaysRevenue()}
          valueKey="revenue"
          color={Colors.darkGreen}
          title={t('restaurantDashboard.revenue')}
          valueLabel={periodLabel}
          formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k €` : `${v.toFixed(0)} €`)}
        />
        <LineChartCard
          data={ordersData.length > 0 ? ordersData : last7DaysOrders()}
          valueKey="orders"
          color={Colors.olive}
          title={t('restaurantDashboard.orders')}
          valueLabel={periodLabel}
          formatValue={(v) => `${v}`}
        />

        {topDishes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('restaurantDashboard.popularDishesByRevenue')}</Text>
            <HorizontalBarChart
              items={topDishes}
              valueKey="revenue"
              labelFormat={(v) => `${v.toFixed(0)} €`}
              color={Colors.darkGreen}
            />
            <Text style={[styles.cardTitle, styles.cardTitleSpaced]}>{t('restaurantDashboard.mostOrderedDishes')}</Text>
            <HorizontalBarChart
              items={topDishes}
              valueKey="orders"
              labelFormat={(v) => t('restaurantDashboard.orderAbbr', {count: v})}
              color={Colors.primary}
            />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('restaurantDashboard.reviews')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RestaurantReviews')} activeOpacity={0.7} hitSlop={8}>
              <Text style={styles.link}>{t('restaurantDashboard.viewReviews')}</Text>
            </TouchableOpacity>
          </View>
          {recentReviews.length === 0 ? (
            <Text style={styles.mutedText}>{t('restaurantDashboard.noReviews')}</Text>
          ) : (
            recentReviews.map((review, index) => (
              <View key={review.id ?? index} style={[styles.reviewRow, index > 0 && styles.hairline]}>
                <View style={styles.reviewRatingRow}>
                  <IconWrapper name="star" size={13} color={Colors.mustard} />
                  <Text style={styles.reviewRating}>{review.rating ?? review.score ?? '–'}</Text>
                  <Text style={styles.reviewAuthor}>· {review.client_name ?? review.user_name ?? t('restaurantDashboard.defaultClientName')}</Text>
                </View>
                <Text style={styles.reviewComment} numberOfLines={2}>{review.comment || review.comment_text || '—'}</Text>
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, styles.listCard]}>
          {shortcuts.map((s, index) => (
            <TouchableOpacity
              key={s.screen}
              style={[styles.row, styles.listRow, index > 0 && styles.hairline]}
              onPress={() => navigation.navigate(s.screen)}
              activeOpacity={0.7}>
              <View style={styles.rowIcon}>
                <IconWrapper name={s.icon} size={20} color={Colors.darkGreen} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{s.title}</Text>
                <Text style={styles.rowHint} numberOfLines={1}>{s.hint}</Text>
              </View>
              <IconWrapper name="chevron-forward" size={18} color={Colors.gray[400]} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
    gap: Spacing[3],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    backgroundColor: Colors.darkGreen,
    borderRadius: Radius.lg,
    padding: Spacing[6],
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: secondaryFont,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: secondaryFont,
    marginTop: Spacing[1],
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: Spacing[3],
    paddingVertical: 6,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.mustard,
  },
  heroPillText: {
    fontSize: 13,
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    ...Shadows.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[100],
    borderRadius: Radius.pill,
    padding: 4,
    marginTop: Spacing[2],
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderRadius: Radius.pill,
  },
  segmentActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  segmentText: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  segmentTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  cardTitleSpaced: {
    marginTop: Spacing[4],
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  listCard: {
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  listRow: {
    paddingVertical: Spacing[3],
  },
  hairline: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  rowHint: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 1,
  },
  mutedText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  reviewRow: {
    paddingVertical: Spacing[2],
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  reviewRating: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  reviewAuthor: {
    fontSize: 12,
    color: Colors.textLight,
  },
});

export default RestaurantDashboardScreen;
