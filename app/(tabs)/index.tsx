import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Plus, Flame, Leaf, ChevronRight, Recycle, Zap, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useActivityData } from '@/lib/use-activity-data';
import { Colors, SHADOW } from '@/lib/theme';
import { COUNTRIES } from '@/lib/countries';
import { calculateBottleResources } from '@/lib/eco';
import EcoScore from '@/components/EcoScore';
import CategoryCard from '@/components/CategoryCard';
import ImpactColumnChart from '@/components/ImpactColumnChart';
import { EmptyState } from '@/components/EmptyState';
import SurveyModal from '@/components/SurveyModal';

type RangeKey = '7D' | '30D' | '3M' | 'ALL';
const RANGES: Record<RangeKey, number> = { '7D': 7, '30D': 30, '3M': 90, 'ALL': 365 };

export default function HomeScreen() {
  const { profile } = useAuth();
  const { activities, loading, loadData, getStats, getDayPoints } = useActivityData();
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<RangeKey>('7D');
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [surveyPromptVisible, setSurveyPromptVisible] = useState(false);

  useEffect(() => {
    const checkSurvey = () => {
      try {
        const lastDate = localStorage.getItem('ecovibe-survey-date');
        const skipDate = localStorage.getItem('ecovibe-survey-skip');
        if (!lastDate && !skipDate) {
          setSurveyPromptVisible(true);
        } else if (skipDate) {
          const days = (Date.now() - new Date(skipDate).getTime()) / 86400000;
          if (days >= 5) setSurveyPromptVisible(true);
        } else if (lastDate) {
          const days = (Date.now() - new Date(lastDate).getTime()) / 86400000;
          if (days >= 30) setSurveyPromptVisible(true);
        }
      } catch {}
    };
    const t = setTimeout(checkSurvey, 2000);
    return () => clearTimeout(t);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - RANGES[range]);
  const stats = getStats(sinceDate);
  const dayPoints = getDayPoints(RANGES[range]);
  const country = COUNTRIES.find((c) => c.code === profile?.country_code);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const hasData = activities.length > 0;

  // Plastic recycling breakdown
  const plasticActivities = activities.filter((a) => a.category === 'plastic');
  const totalBottles = plasticActivities.reduce((sum, a) => sum + (a.detail?.count || 0), 0);
  const bottleResources = calculateBottleResources(totalBottles);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[600]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{profile?.name || 'Eco Hero'} 🌱</Text>
            {country && (
              <View style={styles.countryPill}>
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <Text style={styles.countryText}>{country.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Eco Score + Streak inside hero */}
        <View style={styles.heroStats}>
          <View style={styles.heroScoreWrap}>
            <EcoScore score={stats.eco_score} />
          </View>
          <View style={styles.heroSide}>
            <View style={styles.heroStatItem}>
              <Flame size={20} color={Colors.warning[400]} strokeWidth={2} />
              <Text style={styles.heroStatValue}>{stats.streak}</Text>
              <Text style={styles.heroStatLabel}>day streak</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Leaf size={20} color={Colors.primary[200]} strokeWidth={2} />
              <Text style={styles.heroStatValue}>{stats.co2_saved.toFixed(1)}</Text>
              <Text style={styles.heroStatLabel}>kg CO₂ saved</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Track Activity — primary action */}
      <TouchableOpacity
        style={styles.trackButton}
        onPress={() => router.push('/(tabs)/track')}
        activeOpacity={0.85}
      >
        <View style={styles.trackIconWrap}>
          <Plus size={22} color={Colors.primary[700]} strokeWidth={2.5} />
        </View>
        <Text style={styles.trackButtonText}>Track Activity</Text>
        <ChevronRight size={20} color={Colors.primary[400]} strokeWidth={2} />
      </TouchableOpacity>

      {/* Category Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Impact</Text>
        {hasData && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/insights')}>
            <Text style={styles.seeAll}>Details</Text>
          </TouchableOpacity>
        )}
      </View>
      {hasData ? (
        <View style={styles.categoryGrid}>
          <CategoryCard icon="🌍" label="CO₂ Saved" value={`${stats.co2_saved.toFixed(2)} kg`} color={Colors.primary[600]} bgColor={Colors.primary[50]} />
          <CategoryCard icon="⚡" label="Energy Saved" value={`${stats.energy_saved.toFixed(1)} kWh`} color={Colors.warning[500]} bgColor={Colors.warning[50]} />
          <CategoryCard icon="💧" label="Water Saved" value={`${stats.water_saved.toFixed(0)} L`} color={Colors.accent[600]} bgColor={Colors.accent[50]} />
          <CategoryCard icon="♻️" label="Waste Recycled" value={`${stats.waste_recycled.toFixed(1)} kg`} color={Colors.success[600]} bgColor={Colors.success[50]} />
          <CategoryCard icon="🧴" label="Plastic Collected" value={`${stats.bottle_count} bottles`} subValue={`${stats.points} pts`} color={Colors.primary[700]} bgColor={Colors.primary[50]} />
          <CategoryCard icon="🚶" label="Active Travel" value={`${stats.active_travel_km.toFixed(1)} km`} subValue="walk + cycle" color={Colors.accent[700]} bgColor={Colors.accent[50]} />
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <EmptyState icon="🌱" title="No activities yet" subtitle="Start tracking to see your impact" />
        </View>
      )}

      {/* Impact Column Chart — CO2 saved, CO2 emitted, energy saved */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Impact Breakdown</Text>
        <View style={styles.rangeTabs}>
          {(['7D', '30D', '3M', 'ALL'] as RangeKey[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeTab, range === r && styles.rangeTabActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.rangeTabText, range === r && styles.rangeTabTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.chartCard}>
        {dayPoints.some((d) => d.co2_saved > 0 || d.co2_emitted > 0 || d.energy_saved > 0) ? (
          <ImpactColumnChart data={dayPoints} days={RANGES[range]} />
        ) : (
          <EmptyState icon="📊" title="Not enough data yet" subtitle="Log activities to see your impact breakdown" />
        )}
      </View>

      {/* Plastic Recycling Impact */}
      {totalBottles > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Plastic Recycling Impact</Text>
          </View>
          <View style={styles.plasticCard}>
            <View style={styles.plasticHeader}>
              <View style={styles.plasticIconWrap}>
                <Recycle size={22} color={Colors.primary[700]} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.plasticTitle}>{totalBottles} Bottles Recycled</Text>
                <Text style={styles.plasticSubtitle}>{bottleResources.points} Eco Points earned</Text>
              </View>
            </View>
            <View style={styles.plasticStatsGrid}>
              <View style={styles.plasticStatItem}>
                <Leaf size={16} color={Colors.primary[600]} strokeWidth={2} />
                <Text style={styles.plasticStatValue}>{bottleResources.co2_saved_kg.toFixed(2)}</Text>
                <Text style={styles.plasticStatLabel}>kg CO₂ saved</Text>
              </View>
              <View style={styles.plasticStatItem}>
                <Zap size={16} color={Colors.warning[500]} strokeWidth={2} />
                <Text style={styles.plasticStatValue}>{bottleResources.energy_saved_kwh.toFixed(2)}</Text>
                <Text style={styles.plasticStatLabel}>kWh energy saved</Text>
              </View>
              <View style={styles.plasticStatItem}>
                <Text style={styles.plasticStatValue}>{bottleResources.water_saved_l.toFixed(0)}</Text>
                <Text style={styles.plasticStatLabel}>L water saved</Text>
              </View>
              <View style={styles.plasticStatItem}>
                <Text style={styles.plasticStatValue}>{bottleResources.oil_saved_ml}</Text>
                <Text style={styles.plasticStatLabel}>mL oil saved</Text>
              </View>
            </View>
            <Text style={styles.plasticNote}>
              Estimates based on EPA WARM model factors. Actual impact varies by bottle design and recycling process.
            </Text>
          </View>
        </>
      )}

      <View style={{ height: 32 }} />

      {/* Survey Prompt */}
      <Modal visible={surveyPromptVisible} animationType="fade" transparent onRequestClose={() => setSurveyPromptVisible(false)}>
        <View style={styles.surveyOverlay}>
          <View style={[styles.surveyPromptCard, SHADOW.lg]}>
            <View style={styles.surveyPromptIcon}>
              <Sparkles size={28} color={Colors.primary[600]} strokeWidth={2} />
            </View>
            <Text style={styles.surveyPromptTitle}>Help us make EcoVibe better</Text>
            <Text style={styles.surveyPromptText}>Just a few quick questions about your experience.</Text>
            <Text style={styles.surveyPromptNote}>If you skip, we'll gently ask again in 5 days. If you complete it, you won't see this again for 30 days.</Text>
            <View style={styles.surveyPromptButtons}>
              <TouchableOpacity style={styles.surveyMaybeBtn} onPress={() => {
                try { localStorage.setItem('ecovibe-survey-skip', new Date().toISOString()); } catch {}
                setSurveyPromptVisible(false);
              }}>
                <Text style={styles.surveyMaybeText}>Maybe Later</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.surveyStartBtn} onPress={() => {
                setSurveyPromptVisible(false);
                setSurveyVisible(true);
              }}>
                <Text style={styles.surveyStartText}>Start Survey</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Survey Modal */}
      <SurveyModal visible={surveyVisible} onClose={() => setSurveyVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  hero: {
    backgroundColor: Colors.primary[800],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 28,
    marginBottom: 24,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.primary[200], marginBottom: 2 },
  name: { fontFamily: 'Fraunces-Bold', fontSize: 28, color: Colors.white },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[900] + '80',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.primary[700],
  },
  countryFlag: { fontSize: 16 },
  countryText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.primary[100] },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroScoreWrap: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 8,
    ...SHADOW.lg,
  },
  heroSide: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  heroStatItem: { alignItems: 'center', gap: 4 },
  heroStatValue: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 22, color: Colors.white },
  heroStatLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.primary[200] },
  heroStatDivider: { width: 1, height: 36, backgroundColor: Colors.primary[600] },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 28,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    gap: 14,
    ...SHADOW.md,
  },
  trackIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackButtonText: { flex: 1, fontFamily: 'Fraunces-SemiBold', fontSize: 18, color: Colors.neutral[900] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 20 },
  sectionTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 20, color: Colors.neutral[800] },
  seeAll: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.primary[600] },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28, paddingHorizontal: 20 },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 28, borderWidth: 1, borderColor: Colors.neutral[100], ...SHADOW.sm },
  rangeTabs: { flexDirection: 'row', gap: 4, backgroundColor: Colors.neutral[100], borderRadius: 10, padding: 3 },
  rangeTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  rangeTabActive: { backgroundColor: Colors.primary[600], ...SHADOW.sm },
  rangeTabText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: Colors.neutral[500] },
  rangeTabTextActive: { color: Colors.white },
  chartCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 18, marginHorizontal: 20, marginBottom: 28, borderWidth: 1, borderColor: Colors.primary[100], ...SHADOW.sm },
  plasticCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 28, borderWidth: 1, borderColor: Colors.primary[100], ...SHADOW.md },
  plasticHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  plasticIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.primary[50], justifyContent: 'center', alignItems: 'center' },
  plasticTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 18, color: Colors.neutral[900] },
  plasticSubtitle: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[500], marginTop: 2 },
  plasticStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  plasticStatItem: { width: '47%', alignItems: 'center', gap: 4, backgroundColor: Colors.bg, borderRadius: 12, paddingVertical: 14 },
  plasticStatValue: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 18, color: Colors.neutral[900] },
  plasticStatLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[500] },
  plasticNote: { fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.neutral[400], lineHeight: 16 },
  surveyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  surveyPromptCard: { backgroundColor: Colors.white, borderRadius: 28, padding: 28, alignItems: 'center', width: '100%', maxWidth: 360 },
  surveyPromptIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary[50], justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  surveyPromptTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 20, color: Colors.neutral[900], textAlign: 'center', marginBottom: 8 },
  surveyPromptText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[600], textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  surveyPromptNote: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[400], textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  surveyPromptButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  surveyMaybeBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.neutral[100], alignItems: 'center' },
  surveyMaybeText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.neutral[600] },
  surveyStartBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.primary[600], alignItems: 'center', ...SHADOW.md },
  surveyStartText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.white },
});
