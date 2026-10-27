import React, {useState} from 'react';
import {View, Text, StyleSheet, type LayoutChangeEvent} from 'react-native';
import Svg, {Path, Defs, LinearGradient, Stop, Line, Circle} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {Colors, Radius, Shadows} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import type {RevenueDataPoint, OrdersDataPoint} from '../../services/restaurantManagement';

const CHART_HEIGHT = 130;
const PAD_TOP = 10;
const PAD_BOTTOM = 6;
const PAD_X = 6;
const GRID_LINES = 3;
const MAX_X_LABELS = 6;
const X_LABEL_WIDTH = 48;

type Point = {x: number; y: number};

function getPointValue(
  point: RevenueDataPoint | OrdersDataPoint,
  valueKey: 'revenue' | 'orders',
): number {
  return valueKey === 'revenue' ? (point as RevenueDataPoint).revenue ?? 0 : (point as OrdersDataPoint).orders ?? 0;
}

function localeForLanguage(lang: string): string {
  if (lang === 'en') return 'en-GB';
  if (lang === 'de') return 'de-DE';
  return 'fr-FR';
}

function formatShortDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat(locale, {day: 'numeric', month: 'short'}).format(d);
}

// Courbe lissée (Catmull-Rom → Bézier) ; les points de contrôle sont bornés à la zone du graphe
// pour que la courbe ne passe jamais sous l'axe quand une valeur retombe à zéro.
function smoothPath(points: Point[], minY: number, maxY: number): string {
  if (points.length === 0) return '';
  const clampY = (y: number) => Math.min(Math.max(y, minY), maxY);
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clampY(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

export interface LineChartCardProps {
  data: RevenueDataPoint[] | OrdersDataPoint[];
  valueKey: 'revenue' | 'orders';
  color?: string;
  title: string;
  valueLabel: string;
  formatValue: (v: number) => string;
}

export default function LineChartCard({
  data,
  valueKey,
  color = Colors.primary,
  title,
  valueLabel,
  formatValue,
}: LineChartCardProps) {
  const {i18n} = useTranslation();
  const locale = localeForLanguage(i18n.language);
  const [width, setWidth] = useState(0);

  const values = data.map((d) => getPointValue(d, valueKey));
  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(...values, 1);
  const n = data.length;
  const bottomY = CHART_HEIGHT - PAD_BOTTOM;
  const stepX = n > 1 ? (width - PAD_X * 2) / (n - 1) : 0;
  const points: Point[] = values.map((v, i) => ({
    x: n > 1 ? PAD_X + i * stepX : width / 2,
    y: bottomY - (v / max) * (bottomY - PAD_TOP),
  }));
  const linePath = smoothPath(points, PAD_TOP, bottomY);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
      : '';
  const last = points[points.length - 1];
  const gradientId = `chart-fill-${valueKey}`;

  // Dates régulièrement espacées, la dernière toujours affichée (remplace la précédente si trop proche)
  const labelStep = n > MAX_X_LABELS ? Math.ceil((n - 1) / (MAX_X_LABELS - 1)) : 1;
  const labelIndexes: number[] = [];
  for (let i = 0; i < n; i += labelStep) labelIndexes.push(i);
  if (n > 0 && labelIndexes[labelIndexes.length - 1] !== n - 1) {
    if ((n - 1 - labelIndexes[labelIndexes.length - 1]) * stepX < X_LABEL_WIDTH) labelIndexes.pop();
    labelIndexes.push(n - 1);
  }

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.period}>{valueLabel}</Text>
      </View>
      <Text style={[styles.heroValue, {color}]}>{formatValue(total)}</Text>

      <View style={styles.chartArea} onLayout={onLayout}>
        {width > 0 && n > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.28} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {Array.from({length: GRID_LINES}, (_, i) => {
              const y = PAD_TOP + ((bottomY - PAD_TOP) / (GRID_LINES - 1)) * i;
              return (
                <Line
                  key={`grid-${i}`}
                  x1={0}
                  x2={width}
                  y1={y}
                  y2={y}
                  stroke={Colors.border}
                  strokeWidth={1}
                  strokeDasharray={i === GRID_LINES - 1 ? undefined : '4 6'}
                />
              );
            })}
            <Path d={areaPath} fill={`url(#${gradientId})`} />
            <Path d={linePath} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {last ? (
              <Circle cx={last.x} cy={last.y} r={5} fill={color} stroke={Colors.white} strokeWidth={2.5} />
            ) : null}
          </Svg>
        ) : null}
      </View>

      <View style={styles.xAxis}>
        {width > 0
          ? labelIndexes.map((i) => (
              <Text
                key={i}
                numberOfLines={1}
                style={[
                  styles.xLabel,
                  {
                    left: Math.min(Math.max(points[i].x - X_LABEL_WIDTH / 2, 0), width - X_LABEL_WIDTH),
                    width: X_LABEL_WIDTH,
                  },
                ]}>
                {formatShortDate((data[i] as {date: string}).date, locale)}
              </Text>
            ))
          : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  period: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  heroValue: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: secondaryFont,
    marginTop: 4,
    marginBottom: 10,
  },
  chartArea: {
    height: CHART_HEIGHT,
  },
  xAxis: {
    position: 'relative',
    height: 18,
    marginTop: 4,
  },
  xLabel: {
    position: 'absolute',
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
