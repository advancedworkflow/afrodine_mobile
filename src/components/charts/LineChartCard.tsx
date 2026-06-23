import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import type {RevenueDataPoint, OrdersDataPoint} from '../../services/restaurantManagement';

const LINE_CHART_HEIGHT = 140;

function getPointValue(
  point: RevenueDataPoint | OrdersDataPoint,
  valueKey: 'revenue' | 'orders',
): number {
  return valueKey === 'revenue' ? (point as RevenueDataPoint).revenue ?? 0 : (point as OrdersDataPoint).orders ?? 0;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
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
  const values = data.map((d) => getPointValue(d, valueKey));
  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(...values, 1);
  const chartWidth = Dimensions.get('window').width - 32 - 48;
  const chartHeight = LINE_CHART_HEIGHT - 28;
  const padding = 8;
  const n = data.length;
  const stepX = n > 1 ? (chartWidth - padding * 2) / (n - 1) : 0;
  const points: { x: number; y: number }[] = data.map((point, i) => {
    const v = getPointValue(point, valueKey);
    const x = padding + i * stepX;
    const y = padding + chartHeight - (max > 0 ? (v / max) * (chartHeight - padding * 2) : 0);
    return { x, y };
  });

  const bottomY = padding + chartHeight;
  const areaStrips: { left: number; width: number; top: number; height: number }[] = [];
  const stripStep = 2;
  for (let py = bottomY - stripStep; py >= padding; py -= stripStep) {
    let xMin = chartWidth + padding;
    let xMax = padding;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const yMin = Math.min(a.y, b.y);
      const yMax = Math.max(a.y, b.y);
      if (py >= yMin - 0.5 && py <= yMax + 0.5 && yMax > yMin) {
        const t = (py - a.y) / (b.y - a.y);
        const x = a.x + t * (b.x - a.x);
        xMin = Math.min(xMin, x);
        xMax = Math.max(xMax, x);
      }
    }
    if (points.length === 1 && py >= points[0].y) {
      xMin = Math.min(xMin, points[0].x);
      xMax = Math.max(xMax, points[0].x);
    }
    if (xMax > xMin) {
      areaStrips.push({ left: xMin, width: xMax - xMin, top: py, height: stripStep });
    }
  }

  const chartAreaWidth = chartWidth + 16;
  const xLabelWidth = 44;
  const maxXLabels = 8;
  const xLabelStep = n > maxXLabels ? Math.ceil(n / maxXLabels) : 1;
  const showXLabel = (i: number) => i % xLabelStep === 0 || i === n - 1;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.period}>{valueLabel}</Text>
      </View>
      <View style={styles.heroMetric}>
        <Text style={styles.heroValue}>{formatValue(total)}</Text>
        <Text style={styles.heroLabel}>{valueLabel}</Text>
      </View>
      <View style={[styles.chartArea, { width: chartWidth + 16, height: chartHeight + 16 }]}>
        {areaStrips.map((s, i) => (
          <View
            key={`area-${i}`}
            style={[
              styles.areaStrip,
              {
                left: s.left,
                width: s.width,
                top: s.top,
                height: s.height,
                backgroundColor: color.startsWith('rgb') ? 'rgba(34, 197, 94, 0.2)' : (color + '20').replace('##', '#'),
              },
            ]}
          />
        ))}
        {points.slice(0, -1).map((p, i) => {
          const next = points[i + 1];
          const dx = next.x - p.x;
          const dy = next.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const length = Math.max(dist + 2, 2);
          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
          const midX = (p.x + next.x) / 2;
          const midY = (p.y + next.y) / 2;
          const half = length / 2;
          return (
            <View key={`s-${i}`} style={[styles.segment, { left: midX, top: midY }]}>
              <View
                style={[
                  styles.segmentInner,
                  {
                    width: length,
                    height: 3,
                    backgroundColor: color,
                    transform: [
                      { translateX: -half },
                      { translateY: -1.5 },
                      { rotate: `${angleDeg}deg` },
                    ],
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={[styles.xAxis, { width: chartAreaWidth }]}>
        {data.map((point, i) =>
          showXLabel(i) ? (
            <View
              key={i}
              style={[
                styles.xLabelWrap,
                {
                  left: padding + i * stepX - xLabelWidth / 2,
                  width: xLabelWidth,
                },
              ]}>
              <Text style={[styles.xLabel, n > 14 && styles.xLabelSmall]} numberOfLines={1}>
                {formatShortDate((point as { date: string }).date)}
              </Text>
            </View>
          ) : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  period: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  heroMetric: {
    marginBottom: 16,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  heroLabel: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
    fontFamily: secondaryFont,
  },
  chartArea: {
    position: 'relative',
    marginBottom: 8,
  },
  segment: {
    position: 'absolute',
    width: 1,
    height: 1,
  },
  segmentInner: {
    height: 3,
    position: 'absolute',
  },
  xAxis: {
    position: 'relative',
    height: 22,
    paddingHorizontal: 0,
  },
  xLabelWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xLabel: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'center',
  },
  xLabelSmall: {
    fontSize: 9,
  },
});
