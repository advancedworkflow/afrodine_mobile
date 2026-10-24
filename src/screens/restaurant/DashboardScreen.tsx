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
} from 'react-native';
import {useTranslation} from 'react-i18next';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
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

const DASHBOARD_CHART_HEIGHT = 100;
const DASHBOARD_BAR_MAX = 70;

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
  color = Colors.darkGreen,
  dayLabels,
}: {
  data: RevenueDataPoint[] | OrdersDataPoint[];
  valueKey: 'revenue' | 'orders';
  color?: string;
  dayLabels: string[];
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
              <Text style={dashboardStyles.barDay}>{dayLabels[new Date(dateStr).getDay()] ?? ''}</Text>
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
              <View style={[dashboardStyles.hChartBar, { width: Math.max(w, 4), backgroundColor: Colors.olive }]} />
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
    color: Colors.darkGreen,
    fontWeight: '600',
    textAlign: 'right',
  },
});

type ChartPeriod = '7d' | '30d' | '90d';
const PERIOD_VALUES: ChartPeriod[] = ['7d', '30d', '90d'];

const RestaurantDashboardScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const dayLabels = t('restaurantDashboard.dayLabels', {returnObjects: true}) as string[];
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
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.darkGreen]} />
        }>
        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.cardPrimary]}>
            <IconWrapper name="receipt-outline" size={28} color={Colors.white} />
            <Text style={styles.cardValueWhite}>{pending}</Text>
            <Text style={styles.cardLabelWhite}>{t('restaurantDashboard.pending')}</Text>
          </View>
          <View style={styles.card}>
            <IconWrapper name="cash-outline" size={28} color={Colors.darkGreen} />
            <Text style={styles.cardValue}>{todayRev.toFixed(0)} €</Text>
            <Text style={styles.cardLabel}>{t('restaurantDashboard.today')}</Text>
          </View>
        </View>
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <IconWrapper name="restaurant-outline" size={28} color={Colors.darkGreen} />
            <Text style={styles.cardValue}>{totalOrders}</Text>
            <Text style={styles.cardLabel}>{t('restaurantDashboard.orders')}</Text>
          </View>
          <View style={styles.card}>
            <IconWrapper name="pricetag-outline" size={28} color={Colors.darkGreen} />
            <Text style={styles.cardValue}>{totalDishes}</Text>
            <Text style={styles.cardLabel}>{t('restaurantDashboard.dishes')}</Text>
          </View>
        </View>

        <View style={[styles.periodRow, periodDropdownOpen && styles.periodRowDropdownOpen]}>
          <Text style={styles.periodLabel}>{t('restaurantDashboard.chartsPeriod')}</Text>
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
                color={Colors.darkGreen}
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
          color={Colors.darkGreen}
          title={t('restaurantDashboard.revenue')}
          valueLabel={PERIOD_OPTIONS.find((p) => p.value === chartPeriod)?.label ?? t('restaurantDashboard.totalPeriod', {period: chartPeriod})}
          formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k €` : `${v.toFixed(0)} €`)}
        />
        <LineChartCard
          data={ordersData.length > 0 ? ordersData : last7DaysOrders()}
          valueKey="orders"
          color={Colors.olive}
          title={t('restaurantDashboard.orders')}
          valueLabel={PERIOD_OPTIONS.find((p) => p.value === chartPeriod)?.label ?? t('restaurantDashboard.totalPeriod', {period: chartPeriod})}
          formatValue={(v) => `${v}`}
        />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('restaurantDashboard.totalRevenue')}</Text>
          <Text style={styles.revenueTotal}>{totalRev.toFixed(2)} €</Text>
          <Text style={styles.dataSourceLabel}>{t('restaurantDashboard.liveData')}</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="wallet-outline" size={22} color={Colors.darkGreen} />
            <Text style={styles.sectionTitle}>{t('restaurantDashboard.wallet')}</Text>
          </View>
          <Text style={styles.walletBalance}>{t('restaurantDashboard.availableBalance', {amount: walletBalance.toFixed(2)})}</Text>
          <TouchableOpacity
            style={styles.payoutButton}
            onPress={() => navigation.navigate('RestaurantWallet')}
            activeOpacity={0.8}>
            <IconWrapper name="card-outline" size={20} color={Colors.white} />
            <Text style={styles.payoutButtonText}>{t('restaurantDashboard.makePayout')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('RestaurantWallet')}
            activeOpacity={0.7}>
            <Text style={styles.linkButtonText}>{t('restaurantDashboard.viewWallet')}</Text>
            <IconWrapper name="chevron-forward" size={18} color={Colors.darkGreen} />
          </TouchableOpacity>
        </View>
        {topDishes.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('restaurantDashboard.popularDishesByRevenue')}</Text>
              <HorizontalBarChart
                items={topDishes}
                valueKey="revenue"
                labelFormat={(v) => `${v.toFixed(0)} €`}
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('restaurantDashboard.mostOrderedDishes')}</Text>
              <HorizontalBarChart
                items={topDishes}
                valueKey="orders"
                labelFormat={(v) => t('restaurantDashboard.orderAbbr', {count: v})}
              />
            </View>
          </>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('restaurantDashboard.reviews')}</Text>
          {recentReviews.length === 0 ? (
            <Text style={styles.mutedText}>{t('restaurantDashboard.noReviews')}</Text>
          ) : (
            recentReviews.map((review, index) => (
              <View key={review.id ?? index} style={styles.reviewRow}>
                <View style={styles.reviewRatingRow}>
                  <IconWrapper name="star" size={14} color={Colors.darkGreen} />
                  <Text style={styles.reviewRating}>{review.rating ?? review.score ?? '–'}</Text>
                </View>
                <Text style={styles.reviewComment} numberOfLines={2}>{review.comment || review.comment_text || '—'}</Text>
                <Text style={styles.reviewAuthor}>{review.client_name ?? review.user_name ?? t('restaurantDashboard.defaultClientName')}</Text>
              </View>
            ))
          )}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('RestaurantReviews')}
            activeOpacity={0.7}>
            <Text style={styles.linkButtonText}>{t('restaurantDashboard.viewReviews')}</Text>
            <IconWrapper name="chevron-forward" size={18} color={Colors.darkGreen} />
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="megaphone-outline" size={22} color={Colors.darkGreen} />
            <Text style={styles.sectionTitle}>{t('restaurantDashboard.announcements')}</Text>
          </View>
          <Text style={styles.mutedText}>{t('restaurantDashboard.announcementsHint')}</Text>
          <TouchableOpacity
            style={styles.traiteurButton}
            onPress={() => navigation.navigate('RestaurantAnnouncements')}
            activeOpacity={0.8}>
            <Text style={styles.traiteurButtonText}>{t('restaurantDashboard.viewAnnouncements')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="restaurant" size={22} color={Colors.darkGreen} />
            <Text style={styles.sectionTitle}>{t('restaurantDashboard.cateringService')}</Text>
          </View>
          <Text style={styles.mutedText}>{t('restaurantDashboard.cateringHint')}</Text>
          <TouchableOpacity
            style={styles.traiteurButton}
            onPress={() => navigation.navigate('CateringManagement')}
            activeOpacity={0.8}>
            <Text style={styles.traiteurButtonText}>{t('restaurantDashboard.goToCatering')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="storefront-outline" size={22} color={Colors.darkGreen} />
            <Text style={styles.sectionTitle}>{t('restaurantDashboard.groceryShop')}</Text>
          </View>
          <Text style={styles.mutedText}>{t('restaurantDashboard.groceryHint')}</Text>
          <TouchableOpacity
            style={styles.traiteurButton}
            onPress={() => navigation.navigate('GroceryManagement')}
            activeOpacity={0.8}>
            <Text style={styles.traiteurButtonText}>{t('restaurantDashboard.manageGrocery')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="pricetag-outline" size={22} color={Colors.darkGreen} />
            <Text style={styles.sectionTitle}>{t('restaurantDashboard.promotions')}</Text>
          </View>
          <Text style={styles.mutedText}>{t('restaurantDashboard.promotionsHint')}</Text>
          <TouchableOpacity
            style={styles.traiteurButton}
            onPress={() => navigation.navigate('PromotionsManagement')}
            activeOpacity={0.8}>
            <Text style={styles.traiteurButtonText}>{t('restaurantDashboard.managePromotions')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="people-outline" size={22} color={Colors.darkGreen} />
            <Text style={styles.sectionTitle}>{t('restaurantDashboard.employees')}</Text>
          </View>
          <Text style={styles.mutedText}>{t('restaurantDashboard.employeesHint')}</Text>
          <TouchableOpacity
            style={styles.traiteurButton}
            onPress={() => navigation.navigate('EmployeesManagement')}
            activeOpacity={0.8}>
            <Text style={styles.traiteurButtonText}>{t('restaurantDashboard.manageEmployees')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: Colors.darkGreen,
    borderColor: Colors.darkGreen,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkGreen,
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
    color: Colors.darkGreen,
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
    backgroundColor: Colors.olive + '20',
  },
  periodDropdownItemText: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  periodDropdownItemTextActive: {
    color: Colors.darkGreen,
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
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    marginBottom: 12,
  },
  revenueTotal: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.darkGreen,
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
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    marginBottom: 12,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.darkGreen,
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
    color: Colors.darkGreen,
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
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  traiteurButton: {
    backgroundColor: Colors.darkGreen,
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
});

export default RestaurantDashboardScreen;
