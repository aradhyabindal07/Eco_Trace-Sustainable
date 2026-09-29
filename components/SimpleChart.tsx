import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/lib/theme';
import { DayPoint } from '@/lib/use-activity-data';

interface SimpleChartProps {
  data: DayPoint[];
  metric: 'co2_saved' | 'co2_emitted' | 'energy_saved' | 'waste_recycled' | 'activity_count';
  color?: string;
  label?: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SimpleChart({ data, metric, color, label }: SimpleChartProps) {
  const chartColor = color || Colors.primary[500];
  const maxVal = Math.max(...data.map((d) => d[metric]), 0.01);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.chart}>
        {data.map((d, i) => {
          const h = (d[metric] / maxVal) * 100;
          const date = new Date(d.date);
          return (
            <View key={i} style={styles.barGroup}>
              <View style={styles.barWrap}>
                <View style={[styles.bar, { height: `${Math.max(h, 2)}%`, backgroundColor: chartColor }]} />
              </View>
              <Text style={styles.dayLabel}>{DAY_LABELS[date.getDay()]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral[500], marginBottom: 8 },
  chart: { flexDirection: 'row', height: 220, alignItems: 'flex-end', gap: 6 },
  barGroup: { flex: 1, alignItems: 'center' },
  barWrap: { height: 200, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 20, borderRadius: 6, minHeight: 2 },
  dayLabel: { fontFamily: 'Inter-Regular', fontSize: 10, color: Colors.neutral[400], marginTop: 6 },
});
