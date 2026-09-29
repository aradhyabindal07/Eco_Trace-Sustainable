import { View, Text, StyleSheet } from 'react-native';
import { Colors, SHADOW } from '@/lib/theme';

interface CategoryCardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  bgColor: string;
}

export default function CategoryCard({ icon, label, value, subValue, color, bgColor }: CategoryCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color }, SHADOW.sm]}>
      <View style={styles.cardContent}>
        <View style={[styles.iconWrap, { backgroundColor: bgColor, borderColor: color + '20' }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
          {subValue && <Text style={[styles.subValue, { color }]}>{subValue}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    borderLeftWidth: 4,
    flex: 1,
    minWidth: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  icon: { fontSize: 22 },
  textWrap: { flex: 1, minWidth: 0 },
  value: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 17, color: Colors.neutral[900] },
  subValue: { fontFamily: 'Inter-Medium', fontSize: 11, marginTop: 2 },
  label: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[500], marginBottom: 2 },
});
