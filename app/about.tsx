import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, User, Leaf, Target, Eye, Heart, FlaskConical } from 'lucide-react-native';
import { Colors, SHADOW } from '@/lib/theme';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About EcoTrace</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.logoWrap}>
            <Leaf size={32} color={Colors.primary[700]} strokeWidth={2} />
          </View>
          <Text style={styles.appName}>EcoTrace</Text>
          <Text style={styles.tagline}>Track your impact. Understand your habits. Build a greener future.</Text>
        </View>

        {/* Founder */}
        <Text style={styles.sectionTitle}>Founder / Creator</Text>
        <View style={[styles.card, SHADOW.md]}>
          <View style={styles.founderRow}>
            <View style={styles.founderPhoto}>
              <User size={32} color={Colors.neutral[400]} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.founderName}>Aradhya Bindal</Text>
              <Text style={styles.founderRole}>Founder / Creator of EcoTrace</Text>
            </View>
          </View>
          <Text style={styles.founderNote}>
            Photo placeholder — the founder's real photo can be uploaded here later.
          </Text>
        </View>

        {/* Mission */}
        <Text style={styles.sectionTitle}>Mission</Text>
        <View style={[styles.card, SHADOW.sm]}>
          <View style={styles.cardIconWrap}>
            <Target size={20} color={Colors.primary[600]} strokeWidth={2} />
          </View>
          <Text style={styles.cardText}>
            EcoTrace helps people understand the environmental impact of everyday actions. Users can track activities, see estimated environmental impact, build sustainable habits, and monitor their progress.
          </Text>
        </View>

        {/* Why EcoTrace */}
        <Text style={styles.sectionTitle}>Why EcoTrace</Text>
        <View style={[styles.card, SHADOW.sm]}>
          <View style={styles.cardIconWrap}>
            <Heart size={20} color={Colors.error[500]} strokeWidth={2} />
          </View>
          <Text style={styles.cardText}>
            Many people want to make greener choices but don't know how their actions translate into environmental impact. EcoTrace makes that information simple, personal, and actionable.
          </Text>
        </View>

        {/* Impact */}
        <Text style={styles.sectionTitle}>Impact</Text>
        <View style={[styles.card, SHADOW.sm]}>
          <View style={styles.cardIconWrap}>
            <Leaf size={20} color={Colors.success[600]} strokeWidth={2} />
          </View>
          <Text style={styles.cardText}>
            EcoTrace aims to encourage environmental awareness, recycling, responsible choices, and long-term sustainable habits.
          </Text>
        </View>

        {/* Vision */}
        <Text style={styles.sectionTitle}>Vision</Text>
        <View style={[styles.card, SHADOW.sm]}>
          <View style={styles.cardIconWrap}>
            <Eye size={20} color={Colors.accent[600]} strokeWidth={2} />
          </View>
          <Text style={styles.cardText}>
            Make environmental tracking simple, transparent, and accessible so small everyday actions can become lasting habits.
          </Text>
        </View>

        {/* Calculation Transparency */}
        <Text style={styles.sectionTitle}>Calculation Transparency</Text>
        <View style={[styles.card, SHADOW.sm]}>
          <View style={styles.cardIconWrap}>
            <FlaskConical size={20} color={Colors.warning[500]} strokeWidth={2} />
          </View>
          <Text style={styles.cardText}>
            All environmental calculations use reputable sources including UK DEFRA, EPA WARM, IEA, and peer-reviewed lifecycle assessments. Every estimate is clearly labeled. Actual impact may vary based on vehicle, route, fuel source, and other factors.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary[800],
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[900] + '60', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 20, color: Colors.white },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  logoWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.primary[50], justifyContent: 'center', alignItems: 'center', marginBottom: 16, ...SHADOW.md },
  appName: { fontFamily: 'Fraunces-Bold', fontSize: 32, color: Colors.primary[800] },
  tagline: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[500], textAlign: 'center', marginTop: 6, lineHeight: 20 },
  sectionTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 18, color: Colors.neutral[800], marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.primary[100], flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary[50], justifyContent: 'center', alignItems: 'center' },
  cardText: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[600], lineHeight: 22 },
  founderRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  founderPhoto: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.neutral[200], justifyContent: 'center', alignItems: 'center' },
  founderName: { fontFamily: 'Fraunces-SemiBold', fontSize: 20, color: Colors.neutral[900] },
  founderRole: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[500], marginTop: 2 },
  founderNote: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[400], lineHeight: 18 },
});
