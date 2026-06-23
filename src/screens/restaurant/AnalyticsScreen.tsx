import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {
  getRestaurantAnalytics,
  getRevenueAnalytics,
  getOrdersAnalytics,
  getDashboardStats,
  type RestaurantAnalytics,
  type RevenueDataPoint,
  type OrdersDataPoint,
} from '../../services/restaurantManagement';

const CHART_HEIGHT = 160;
const BAR_MAX_HEIGHT = 120;
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = DAY_LABELS[d.getDay()] ?? '?';
    const num = d.getDate();
    return `${day} ${num}`;
  } catch {
    return dateStr.slice(0, 10);
  }
}

function BarChart<T extends { date: string }>({
  data,
  valueKey,
  labelFormat,
  color = Colors.primary,
  title,
}: {
  data: T[];
  valueKey: keyof T & string;
  labelFormat: (v: number) => string;
  color?: string;
  title: string;
}) {
  const values = data.map((d) => Number((d as Record<string, unknown>)[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const width = Dimensions.get('window').width - 32 - 32;
  const barWidth = data.length > 0 ? (width / data.length) * 0.6 : 24;
  const gap = data.length > 0 ? (width / data.length) * 0.4 : 8;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartContainer}>
        <View style={styles.barRow}>
          {data.map((point) => {
            const v = Number((point as Record<string, unknown>)[valueKey]) || 0;
            const h = max > 0 ? (v / max) * BAR_MAX_HEIGHT : 0;
            return (
              <View key={point.date} style={[styles.barWrapper, { width: barWidth + gap }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: barWidth,
                      height: Math.max(h, 4),
                      backgroundColor: color,
                    },
                  ]}
                />
                <Text style={styles.barValue} numberOfLines={1}>
                  {labelFormat(v)}
                </Text>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {formatDateLabel(point.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TopDishesChart({
  items,
  valueKey,
  title,
  labelFormat,
  barColor = Colors.primaryLight,
}: {
  items: { id: number; name: string; orders?: number; revenue?: number }[];
  valueKey: 'orders' | 'revenue';
  title: string;
  labelFormat: (v: number) => string;
  barColor?: string;
}) {
  const values = items.map((i) => (valueKey === 'orders' ? (i.orders ?? 0) : (i.revenue ?? 0)));
  const max = Math.max(...values, 1);
  const maxWidth = 140;

  return (
    <View style={styles.topDishesCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      {items.slice(0, 6).map((item) => {
        const v = valueKey === 'orders' ? (item.orders ?? 0) : (item.revenue ?? 0);
        const w = max > 0 ? (v / max) * maxWidth : 0;
        return (
          <View key={item.id} style={styles.topDishesRow}>
            <Text style={styles.topDishesLabel} numberOfLines={1}>{item.name}</Text>
            <View style={styles.topDishesBarBg}>
              <View style={[styles.topDishesBar, { width: Math.max(w, 6), backgroundColor: barColor }]} />
            </View>
            <Text style={styles.topDishesValue}>{labelFormat(v)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function RevenueShareChart({
  items,
}: {
  items: { id: number; name: string; revenue?: number }[];
}) {
  const total = items.reduce((s, i) => s + (i.revenue ?? 0), 0);
  const top5 = items.slice(0, 5).filter((i) => (i.revenue ?? 0) > 0);
  if (top5.length === 0 || total <= 0) return null;

  return (
    <View style={styles.topDishesCard}>
      <Text style={styles.chartTitle}>Répartition du CA (top 5 plats)</Text>
      {top5.map((item) => {
        const v = item.revenue ?? 0;
        const pct = total > 0 ? (v / total) * 100 : 0;
        const w = Math.max((pct / 100) * 140, 4);
        return (
          <View key={item.id} style={styles.topDishesRow}>
            <Text style={styles.topDishesLabel} numberOfLines={1}>{item.name}</Text>
            <View style={styles.topDishesBarBg}>
              <View style={[styles.topDishesBar, { width: w, backgroundColor: Colors.primary }]} />
            </View>
            <Text style={styles.topDishesValue}>{pct.toFixed(0)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

function CombinedBarChart({
  revenueData,
  ordersData,
}: {
  revenueData: RevenueDataPoint[];
  ordersData: OrdersDataPoint[];
}) {
  const days = revenueData.length > 0 ? revenueData.map((d) => d.date) : ordersData.map((d) => d.date);
  if (days.length === 0) return null;
  const revenues = days.map((d) => revenueData.find((r) => r.date === d)?.revenue ?? 0);
  const orders = days.map((d) => ordersData.find((o) => o.date === d)?.orders ?? 0);
  const maxR = Math.max(...revenues, 1);
  const maxO = Math.max(...orders, 1);
  const width = Dimensions.get('window').width - 32 - 32;
  const barW = days.length > 0 ? (width / days.length) * 0.25 : 12;
  const gap = days.length > 0 ? (width / days.length) * 0.1 : 4;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Revenus et commandes (7 derniers jours)</Text>
      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
        <Text style={styles.legendText}>Revenus (€)</Text>
        <View style={[styles.legendDot, { backgroundColor: Colors.primaryLight }]} />
        <Text style={styles.legendText}>Commandes</Text>
      </View>
      <View style={[styles.chartContainer, { height: CHART_HEIGHT }]}>
        <View style={styles.barRow}>
          {days.map((date, i) => (
            <View key={date} style={[styles.combinedBarWrap, { width: barW * 2 + gap + 8 }]}>
              <View style={styles.combinedBarGroup}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: barW,
                      height: Math.max((revenues[i] / maxR) * BAR_MAX_HEIGHT, 4),
                      backgroundColor: Colors.primary,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      width: barW,
                      height: Math.max((orders[i] / maxO) * BAR_MAX_HEIGHT, 4),
                      backgroundColor: Colors.primaryLight,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>{formatDateLabel(date)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const RestaurantAnalyticsScreen = ({navigation}: any) => {
  const [analytics, setAnalytics] = useState<RestaurantAnalytics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [ordersData, setOrdersData] = useState<OrdersDataPoint[]>([]);
  const [topDishes, setTopDishes] = useState<{ id: number; name: string; orders?: number; revenue?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [analyticsRes, revenueRes, ordersRes, statsRes] = await Promise.all([
        getRestaurantAnalytics(),
        getRevenueAnalytics('7d'),
        getOrdersAnalytics('7d'),
        getDashboardStats(),
      ]);
      const analyticsValid = analyticsRes && typeof analyticsRes === 'object' && !('error' in analyticsRes);
      const statsValid = statsRes && typeof statsRes === 'object' && !('error' in statsRes);
      setAnalytics(analyticsValid ? analyticsRes : {});
      setRevenueData(Array.isArray(revenueRes) ? revenueRes : []);
      setOrdersData(Array.isArray(ordersRes) ? ordersRes : []);
      setTopDishes(statsValid && statsRes?.top_dishes ? statsRes.top_dishes : []);
    } catch (e) {
      setAnalytics({});
      setRevenueData([]);
      setOrdersData([]);
      setTopDishes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title="Statistiques" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const todayOrders = analytics?.todayOrders ?? 0;
  const ordersChange = analytics?.ordersChange ?? '—';
  const todayRevenue = analytics?.todayRevenue ?? 0;
  const revenueChange = analytics?.revenueChange ?? '—';
  const uniqueCustomers = analytics?.uniqueCustomers ?? 0;
  const customersChange = analytics?.customersChange ?? '—';
  const averageOrder = analytics?.averageOrder ?? 0;
  const averageOrderChange = analytics?.averageOrderChange ?? '—';

  // Données 7 jours pour afficher les graphiques même sans données (valeurs à 0)
  const revenueChartData =
    revenueData.length > 0
      ? revenueData
      : Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return { date: d.toISOString().slice(0, 10), revenue: 0 };
        });
  const ordersChartData =
    ordersData.length > 0
      ? ordersData
      : Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return { date: d.toISOString().slice(0, 10), orders: 0 };
        });

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title="Statistiques" />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <IconWrapper name="receipt-outline" size={28} color={Colors.primary} />
            <View style={styles.cardBody}>
              <Text style={styles.cardLabel}>Commandes aujourd'hui</Text>
              <Text style={styles.cardValue}>{todayOrders}</Text>
              <Text style={styles.cardChange}>{ordersChange}</Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <IconWrapper name="cash-outline" size={28} color={Colors.primary} />
            <View style={styles.cardBody}>
              <Text style={styles.cardLabel}>Revenus aujourd'hui (API)</Text>
              <Text style={styles.cardValue}>{todayRevenue.toFixed(2)} €</Text>
              <Text style={styles.cardChange}>{revenueChange}</Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <IconWrapper name="people-outline" size={28} color={Colors.primary} />
            <View style={styles.cardBody}>
              <Text style={styles.cardLabel}>Clients uniques</Text>
              <Text style={styles.cardValue}>{uniqueCustomers}</Text>
              <Text style={styles.cardChange}>{customersChange}</Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <IconWrapper name="pricetag-outline" size={28} color={Colors.primary} />
            <View style={styles.cardBody}>
              <Text style={styles.cardLabel}>Panier moyen</Text>
              <Text style={styles.cardValue}>{averageOrder.toFixed(2)} €</Text>
              <Text style={styles.cardChange}>{averageOrderChange}</Text>
            </View>
          </View>
        </View>

        <BarChart
          title="Revenus (7 derniers jours)"
          data={revenueChartData}
          valueKey="revenue"
          labelFormat={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k€` : `${v.toFixed(0)} €`)}
          color={Colors.primary}
        />

        <BarChart
          title="Commandes (7 derniers jours)"
          data={ordersChartData}
          valueKey="orders"
          labelFormat={(v) => `${v}`}
          color={Colors.primaryLight}
        />

        <CombinedBarChart revenueData={revenueChartData} ordersData={ordersChartData} />

        {topDishes.length > 0 && (
          <>
            <TopDishesChart
              items={topDishes}
              valueKey="orders"
              title="Top plats (commandes) — API"
              labelFormat={(v) => `${v}`}
              barColor={Colors.primaryLight}
            />
            <TopDishesChart
              items={topDishes}
              valueKey="revenue"
              title="Top plats (revenus) — API"
              labelFormat={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k €` : `${v.toFixed(0)} €`)}
              barColor={Colors.primary}
            />
            <RevenueShareChart items={topDishes} />
          </>
        )}
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardBody: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  cardChange: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
    marginBottom: 16,
  },
  chartContainer: {
    height: CHART_HEIGHT,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + 44,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 6,
    minHeight: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginTop: 4,
    maxWidth: 48,
    textAlign: 'center',
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textLight,
    marginTop: 2,
    maxWidth: 48,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  combinedBarWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  combinedBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  topDishesCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topDishesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  topDishesLabel: {
    width: 100,
    fontSize: 13,
    color: Colors.text,
    flexShrink: 1,
  },
  topDishesBarBg: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  topDishesBar: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    minWidth: 6,
  },
  topDishesValue: {
    width: 36,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'right',
  },
});

export default RestaurantAnalyticsScreen;
