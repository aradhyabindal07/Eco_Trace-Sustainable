import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/lib/theme';

interface EcoScoreProps {
  score: number;
}

export default function EcoScore({ score }: EcoScoreProps) {
  const getColor = (s: number) => {
    if (s >= 75) return Colors.success[600];
    if (s >= 50) return Colors.primary[600];
    if (s >= 25) return Colors.warning[500];
    return Colors.error[500];
  };

  const color = getColor(score);

  return (
    <View style={styles.container}>
      <View style={[styles.ringOuter, { borderColor: color + '15' }]}>
        <View style={[styles.ringMid, { borderColor: color + '30' }]}>
          <View style={[styles.ringInner, { borderColor: color, backgroundColor: color + '08' }]}>
            <Text style={[styles.score, { color }]}>{score}</Text>
            <Text style={[styles.max, { color: color + 'aa' }]}>/100</Text>
          </View>
        </View>
      </View>
      <Text style={styles.label}>Eco Score</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  ringOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringMid: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 30 },
  max: { fontFamily: 'Inter-Medium', fontSize: 11, marginTop: -2 },
  label: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral[500], marginTop: 8 },
});
