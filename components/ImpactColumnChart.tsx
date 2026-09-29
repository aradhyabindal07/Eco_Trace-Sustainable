import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/lib/theme';

interface ImpactColumnChartProps {
  data: { date: string; co2_saved: number; co2_emitted: number; energy_saved: number }[];
  days?: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ImpactColumnChart({ data, days = 7 }: ImpactColumnChartProps) {
  const recent = data.slice(-days);
  const maxVal = Math.max(
    ...recent.map((d) => Math.max(d.co2_saved, d.co2_emitted, d.energy_saved)),
    0.01
  );

  return (
    <View style={styles.container}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary[500] }]} />
          <Text style={styles.legendText}>CO₂ Saved</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.warning[500] }]} />
          <Text style={styles.legendText}>CO₂ Emitted</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accent[400] }]} />
          <Text style={styles.legendText}>Energy Saved</Text>
        </View>
      </View>
      <View style={styles.chart}>
        {recent.map((d, i) => {
          const date = new Date(d.date);
          const hSaved = (d.co2_saved / maxVal) * 100;
          const hEmitted = (d.co2_emitted / maxVal) * 100;
          const hEnergy = (d.energy_saved / maxVal) * 100;
          return (
            <View key={i} style={styles.barGroup}>
              <View style={styles.barWrap}>
                <View style={[styles.barCol, { height: `${Math.max(hSaved, 1)}%`, backgroundColor: Colors.primary[500] }]} />
                <View style={[styles.barCol, { height: `${Math.max(hEmitted, 1)}%`, backgroundColor: Colors.warning[500] }]} />
                <View style={[styles.barCol, { height: `${Math.max(hEnergy, 1)}%`, backgroundColor: Colors.accent[400] }]} />
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
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.neutral[500] },
  chart: { flexDirection: 'row', height: 180, alignItems: 'flex-end', gap: 4 },
  barGroup: { flex: 1, alignItems: 'center' },
  barWrap: { height: 160, width: '100%', justifyContent: 'flex-end', alignItems: 'center', flexDirection: 'row', gap: 2 },
  barCol: { width: 8, borderRadius: 4, minHeight: 2 },
  dayLabel: { fontFamily: 'Inter-Regular', fontSize: 10, color: Colors.neutral[400], marginTop: 6 },
});
