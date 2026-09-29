import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Plus, Target, Trash2, X, Check, Flame, Award, TrendingUp, Download } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useActivityData } from '@/lib/use-activity-data';
import { useTheme } from '@/lib/theme-context';
import { BADGES, getBadgeProgress } from '@/lib/badges';
import { EmptyState } from '@/components/EmptyState';
import CertificateModal from '@/components/CertificateModal';

interface Goal {
  id: string;
  title: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  completed: boolean;
  created_at: string;
}

const GOAL_CATEGORIES = [
  { key: 'walk_more', label: 'Walk More', unit: 'km', icon: '🚶' },
  { key: 'cycle_more', label: 'Cycle More', unit: 'km', icon: '🚲' },
  { key: 'reduce_transport', label: 'Reduce Transport Impact', unit: 'kg CO₂', icon: '🚗' },
  { key: 'reduce_food_waste', label: 'Reduce Food Waste', unit: 'kg', icon: '🍽️' },
  { key: 'recycle_more', label: 'Recycle More', unit: 'kg', icon: '♻️' },
  { key: 'reduce_plastic', label: 'Collect Plastic Bottles', unit: 'bottles', icon: '🧴' },
  { key: 'save_energy', label: 'Save Energy', unit: 'kWh', icon: '⚡' },
  { key: 'reduce_co2', label: 'Reduce CO₂ Emissions', unit: 'kg CO₂', icon: '🌍' },
  { key: 'eco_streak', label: 'Maintain Eco Streak', unit: 'days', icon: '🔥' },
];

export default function GoalsScreen() {
  const { colors, isDark } = useTheme();
  const { user, profile } = useAuth();
  const { getStats } = useActivityData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState(GOAL_CATEGORIES[0]);
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [certVisible, setCertVisible] = useState(false);
  const [certBadge, setCertBadge] = useState<{ name: string; tier: string } | null>(null);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setGoals((data || []) as Goal[]);
  }, [user]);

  useFocusEffect(useCallback(() => { loadGoals(); }, [loadGoals]));

  const onRefresh = async () => { setRefreshing(true); await loadGoals(); setRefreshing(false); };

  const stats = getStats();

  useEffect(() => {
    const updateProgress = async () => {
      if (!user || goals.length === 0) return;
      for (const goal of goals) {
        if (goal.completed) continue;
        let currentVal = 0;
        if (goal.category === 'walk_more') currentVal = stats.walk_km;
        else if (goal.category === 'cycle_more') currentVal = stats.cycle_km;
        else if (goal.category === 'reduce_transport') currentVal = stats.co2_saved;
        else if (goal.category === 'reduce_food_waste') currentVal = stats.waste_recycled;
        else if (goal.category === 'recycle_more') currentVal = stats.waste_recycled;
        else if (goal.category === 'reduce_plastic') currentVal = stats.bottle_count;
        else if (goal.category === 'save_energy') currentVal = stats.energy_saved;
        else if (goal.category === 'reduce_co2') currentVal = stats.co2_saved;
        else if (goal.category === 'eco_streak') currentVal = stats.streak;

        if (Math.abs(currentVal - goal.current_value) > 0.01) {
          await supabase.from('goals').update({
            current_value: currentVal,
            completed: currentVal >= goal.target_value,
          }).eq('id', goal.id);
        }
      }
      loadGoals();
    };
    updateProgress();
  }, [stats, goals.length]);

  const handleAddGoal = async () => {
    const target = parseFloat(targetValue);
    if (!target || target <= 0) return;
    setSaving(true);
    await supabase.from('goals').insert({
      user_id: user!.id,
      title: selectedCat.label,
      category: selectedCat.key,
      target_value: target,
      current_value: 0,
      unit: selectedCat.unit,
      deadline: deadline || null,
    });
    setSaving(false);
    setAddVisible(false);
    setTargetValue('');
    setDeadline('');
    loadGoals();
  };

  const handleDeleteGoal = (id: string) => {
    Alert.alert('Delete Goal', 'Remove this goal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('goals').delete().eq('id', id).eq('user_id', user!.id);
        loadGoals();
      }},
    ]);
  };

  const badgeStats = stats.badge_stats;
  const styles = makeStyles(colors, isDark);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[600]} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Goals</Text>
      <Text style={styles.subtitle}>Set targets and track your progress</Text>

      {/* Streak & Achievements Summary */}
      <View style={[styles.summaryCard, styles.cardShadow]}>
        <View style={styles.summaryItem}>
          <Flame size={22} color={colors.warning[500]} strokeWidth={2} />
          <Text style={styles.summaryValue}>{stats.streak}</Text>
          <Text style={styles.summaryLabel}>Day Streak</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Award size={22} color={colors.primary[600]} strokeWidth={2} />
          <Text style={styles.summaryValue}>
            {BADGES.filter((b) => getBadgeProgress(b, badgeStats).earned).length}
          </Text>
          <Text style={styles.summaryLabel}>Badges Earned</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <TrendingUp size={22} color={colors.accent[600]} strokeWidth={2} />
          <Text style={styles.summaryValue}>{stats.eco_score}</Text>
          <Text style={styles.summaryLabel}>Eco Score</Text>
        </View>
      </View>

      {/* Add Goal Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setAddVisible(true)} activeOpacity={0.85}>
        <Plus size={20} color={colors.white} strokeWidth={2} />
        <Text style={styles.addButtonText}>Create Goal</Text>
      </TouchableOpacity>

      {/* Goals List */}
      {goals.length > 0 ? (
        <View style={styles.goalsList}>
          {goals.map((goal) => {
            const progress = Math.min(1, goal.current_value / goal.target_value);
            const cat = GOAL_CATEGORIES.find((c) => c.key === goal.category);
            return (
              <View key={goal.id} style={[styles.goalCard, styles.cardShadow, goal.completed && { borderColor: colors.primary[300], backgroundColor: colors.primary[50] }]}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalIcon}>{cat?.icon || '🎯'}</Text>
                  <View style={styles.goalHeaderText}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    {goal.deadline && <Text style={styles.goalDeadline}>By {goal.deadline}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)} style={styles.deleteBtn}>
                    <Trash2 size={16} color={colors.neutral[400]} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <View style={styles.goalProgressRow}>
                  <Text style={styles.goalProgressValue}>
                    {goal.current_value.toFixed(1)} / {goal.target_value} {goal.unit}
                  </Text>
                  {goal.completed && (
                    <View style={styles.completedBadge}>
                      <Check size={12} color={colors.white} strokeWidth={3} />
                      <Text style={styles.completedText}>Done</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.goalProgressBar, { backgroundColor: colors.neutral[200] }]}>
                  <View style={[styles.goalProgressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary[500] }]} />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <EmptyState icon="🎯" title="No goals yet" subtitle="Create a goal to start tracking progress" />
      )}

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      <Text style={styles.badgeHint}>Tap an earned badge to download your certificate</Text>
      <View style={styles.badgesGrid}>
        {BADGES.map((badge) => {
          const prog = getBadgeProgress(badge, badgeStats);
          const earnedTier = prog.earned
            ? badge.tiers.filter((t) => prog.current >= t.threshold).pop()
            : null;
          return (
            <TouchableOpacity
              key={badge.key}
              style={[styles.badgeCard, prog.earned && { borderColor: colors.primary[300], backgroundColor: colors.primary[50] }, styles.cardShadow]}
              disabled={!prog.earned}
              onPress={() => {
                if (prog.earned && earnedTier) {
                  setCertBadge({ name: badge.name, tier: earnedTier.tier });
                  setCertVisible(true);
                }
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.badgeIcon, prog.earned ? { backgroundColor: colors.primary[600] } : { backgroundColor: colors.neutral[100] }]}>
                <Award size={20} color={prog.earned ? colors.white : colors.neutral[400]} strokeWidth={2} />
              </View>
              <Text style={[styles.badgeName, { color: colors.neutral[800] }]} numberOfLines={1}>{badge.name}</Text>
              <View style={[styles.badgeProgress, { backgroundColor: colors.neutral[200] }]}>
                <View style={[styles.badgeProgressFill, { width: `${prog.progress * 100}%`, backgroundColor: colors.primary[500] }]} />
              </View>
              <Text style={[styles.badgeProgressText, { color: colors.neutral[500] }]}>
                {prog.earned ? `${earnedTier?.tier ?? 'bronze'} earned` : `${prog.current.toFixed(1)} / ${prog.threshold}`}
              </Text>
              {prog.earned && (
                <View style={styles.badgeDownloadRow}>
                  <Download size={12} color={colors.primary[600]} strokeWidth={2} />
                  <Text style={[styles.badgeDownloadText, { color: colors.primary[600] }]}>Certificate</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Certificate Modal */}
      <CertificateModal
        visible={certVisible}
        onClose={() => setCertVisible(false)}
        badgeName={certBadge?.name || ''}
        tier={certBadge?.tier || 'bronze'}
        date={new Date().toISOString()}
        userName={profile?.name || 'Eco Hero'}
      />

      <View style={{ height: 24 }} />

      {/* Add Goal Modal */}
      <Modal visible={addVisible} animationType="slide" transparent onRequestClose={() => setAddVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.neutral[200] }]}>
              <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>Create Goal</Text>
              <TouchableOpacity onPress={() => setAddVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.neutral[100] }]}>
                <X size={20} color={colors.neutral[500]} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.neutral[700] }]}>Goal type</Text>
              <ScrollView style={styles.catList} showsVerticalScrollIndicator={false}>
                {GOAL_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.catItem, selectedCat.key === c.key && { backgroundColor: colors.primary[50], borderWidth: 1, borderColor: colors.primary[300] }]}
                    onPress={() => setSelectedCat(c)}
                  >
                    <Text style={styles.catIcon}>{c.icon}</Text>
                    <Text style={[styles.catLabel, selectedCat.key === c.key && { color: colors.primary[700] }]}>{c.label}</Text>
                    {selectedCat.key === c.key && <Check size={18} color={colors.primary[600]} strokeWidth={2} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={[styles.inputLabel, { color: colors.neutral[700] }]}>Target ({selectedCat.unit})</Text>
              <TextInput style={[styles.input, { borderColor: colors.neutral[200], backgroundColor: colors.bg, color: colors.neutral[900] }]} placeholder={`e.g. 50 ${selectedCat.unit}`} value={targetValue} onChangeText={setTargetValue} keyboardType="numeric" placeholderTextColor={colors.neutral[400]} />
              <Text style={[styles.inputLabel, { color: colors.neutral[700] }]}>Deadline (optional, YYYY-MM-DD)</Text>
              <TextInput style={[styles.input, { borderColor: colors.neutral[200], backgroundColor: colors.bg, color: colors.neutral[900] }]} placeholder="e.g. 2026-12-31" value={deadline} onChangeText={setDeadline} placeholderTextColor={colors.neutral[400]} />
              <TouchableOpacity style={styles.saveButton} onPress={handleAddGoal} disabled={saving} activeOpacity={0.85}>
                <Text style={styles.saveButtonText}>{saving ? 'Creating...' : 'Create Goal'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(c: any, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontFamily: 'Fraunces-Bold', fontSize: 28, color: c.neutral[900], marginTop: 8 },
    subtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: c.neutral[500], marginTop: 4, marginBottom: 20 },
    cardShadow: {
      shadowColor: isDark ? '#000' : '#15803d',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryCard: { flexDirection: 'row', backgroundColor: c.white, borderRadius: 18, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: c.neutral[200], alignItems: 'center' },
    summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
    summaryValue: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 22, color: c.neutral[900] },
    summaryLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: c.neutral[400] },
    summaryDivider: { width: 1, height: 44, backgroundColor: c.neutral[200] },
    addButton: { flexDirection: 'row', backgroundColor: c.primary[600], borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
    addButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: c.white },
    goalsList: { gap: 12, marginBottom: 24 },
    goalCard: { backgroundColor: c.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: c.neutral[200] },
    goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    goalIcon: { fontSize: 24 },
    goalHeaderText: { flex: 1 },
    goalTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: c.neutral[800] },
    goalDeadline: { fontFamily: 'Inter-Regular', fontSize: 12, color: c.neutral[400], marginTop: 2 },
    deleteBtn: { padding: 4 },
    goalProgressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    goalProgressValue: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 14, color: c.neutral[700] },
    completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.primary[600], borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    completedText: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: c.white },
    goalProgressBar: { height: 8, borderRadius: 4 },
    goalProgressFill: { height: 8, borderRadius: 4 },
    sectionTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 20, color: c.neutral[800], marginBottom: 12 },
    badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    badgeCard: { width: '47%', backgroundColor: c.white, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.neutral[200] },
    badgeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    badgeName: { fontFamily: 'Inter-SemiBold', fontSize: 13, marginBottom: 8 },
    badgeProgress: { width: '100%', height: 6, borderRadius: 3, marginBottom: 4 },
    badgeProgressFill: { height: 6, borderRadius: 3 },
    badgeProgressText: { fontFamily: 'Inter-Regular', fontSize: 11 },
    badgeHint: { fontFamily: 'Inter-Regular', fontSize: 12, color: c.neutral[400], marginBottom: 12 },
    badgeDownloadRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    badgeDownloadText: { fontFamily: 'Inter-SemiBold', fontSize: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 20 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    modalBody: { padding: 20 },
    inputLabel: { fontFamily: 'Inter-SemiBold', fontSize: 14, marginBottom: 6, marginTop: 12 },
    catList: { maxHeight: 200, marginBottom: 4 },
    catItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: c.bg, marginBottom: 4 },
    catIcon: { fontSize: 20 },
    catLabel: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: c.neutral[700] },
    input: { fontFamily: 'Inter-Regular', fontSize: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
    saveButton: { backgroundColor: c.primary[600], borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
    saveButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 17, color: c.white },
  });
}
