import { View, Text, StyleSheet } from 'react-native';
import { Colors, SHADOW } from '@/lib/theme';

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontFamily: 'Fraunces-SemiBold', fontSize: 18, color: Colors.neutral[700], textAlign: 'center' },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[400], textAlign: 'center', marginTop: 4 },
});
