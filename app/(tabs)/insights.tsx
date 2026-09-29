import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Trash2, Lightbulb, Calendar, History, X, Flame } from 'lucide-react-native';
import { useActivityData, ActivityRow } from '@/lib/use-activity-data';
import { useTheme } from '@/lib/theme-context';
import { calculateHeat } from '@/lib/eco';
import SimpleChart from '@/components/SimpleChart';
import { EmptyState } from '@/components/EmptyState';
import { ACTIVITY_TYPES } from '@/lib/eco';

type RangeKey = '7D' | '30D' | '3M' | 'ALL';
const RANGES: Record<RangeKey, number> = { '7D': 7, '30D': 30, '3M': 90, 'ALL': 365 };

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function InsightsScreen() {
  const { colors, isDark } = useTheme();
  const { activities, loading, loadData, getStats, getDayPoints, deleteActivity } = useActivityData();
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<RangeKey>('7D');
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - RANGES[range]);
  const stats = getStats(sinceDate);
  const dayPoints = getDayPoints(RANGES[range]);

  // Heat released from screen time / activity duration
  const totalHeatKj = activities
    .filter((a) => new Date(a.created_at) >= sinceDate)
    .reduce((sum, a) => sum + calculateHeat(a.duration_min || 0), 0);

  // Category breakdown
  const categoryTotals: Record<string, { co2_saved: number; co2_emitted: number; count: number }> = {};
  for (const a of activities) {
    if (new Date(a.created_at) < sinceDate) continue;
    const cat = a.category || 'other';
    if (!categoryTotals[cat]) categoryTotals[cat] = { co2_saved: 0, co2_emitted: 0, count: 0 };
    categoryTotals[cat].co2_saved += a.co2_saved_kg || 0;
    categoryTotals[cat].co2_emitted += a.co2_emitted_kg || 0;
    categoryTotals[cat].count += 1;
  }

  // Smart suggestions
  const suggestions: string[] = [];
  if (stats.co2_emitted > stats.co2_saved && stats.co2_emitted > 1) {
    suggestions.push(`You emitted ${stats.co2_emitted.toFixed(1)} kg CO₂ this period. Consider replacing a car trip with walking, cycling, or public transport.`);
  }
  if (stats.walk_km < 2 && stats.vehicle_km > 10) {
    suggestions.push('You recorded several car trips. Consider replacing one short trip with walking or cycling.');
  }
  if (stats.bottle_count === 0 && activities.length > 3) {
    suggestions.push("You haven't logged any plastic bottle recycling yet. Start collecting to earn Eco Points and badges.");
  }
  if (stats.waste_recycled < 1 && activities.length > 5) {
    suggestions.push('Try recycling more — even a small amount of paper or plastic makes a difference.');
  }
  if (stats.streak >= 3) {
    suggestions.push(`Great streak of ${stats.streak} days! Keep logging daily to maintain your momentum.`);
  }
  if (suggestions.length === 0 && activities.length > 0) {
    suggestions.push("You're doing great! Keep tracking your activities to build a greener lifestyle.");
  }

  // Calendar data
  const activeDays = new Set(activities.map((a) => a.created_at.slice(0, 10)));
  const today = new Date();
  const calYear = today.getFullYear();
  const calMonth = today.getMonth();
  const firstDay = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startDayOfWeek = firstDay.getDay();

  const filteredActivities = historyFilter === 'all'
    ? activities
    : activities.filter((a) => a.category === historyFilter);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getActivityLabel = (a: ActivityRow): string => {
    const type = ACTIVITY_TYPES.find((t) => t.key === a.mode);
    return type?.label || a.mode;
  };

  const getActivityMetrics = (a: ActivityRow): string => {
    const parts: string[] = [];
    if (a.distance_km > 0) parts.push(`${a.distance_km.toFixed(2)} km`);
    if (a.duration_min > 0) parts.push(`${a.duration_min.toFixed(0)} min`);
    if (a.co2_saved_kg > 0) parts.push(`${a.co2_saved_kg.toFixed(2)} kg CO₂ saved`);
    if (a.co2_emitted_kg > 0) parts.push(`${a.co2_emitted_kg.toFixed(2)} kg CO₂ emitted`);
    if (a.energy_saved_kwh > 0) parts.push(`${a.energy_saved_kwh.toFixed(1)} kWh saved`);
    if (a.waste_recycled_kg > 0) parts.push(`${a.waste_recycled_kg.toFixed(1)} kg recycled`);
    if (a.points > 0) parts.push(`${a.points} pts`);
    return parts.join(' • ') || '—';
  };

  const hasData = dayPoints.some((d) => d.co2_saved > 0 || d.co2_emitted > 0 || d.energy_saved > 0 || d.waste_recycled > 0);
  const styles = makeStyles(colors, isDark);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[600]} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Understand your environmental impact</Text>

      {/* Range Tabs */}
      <View style={styles.rangeTabs}>
        {(['7D', '30D', '3M', 'ALL'] as RangeKey[]).map((r) => (
          <TouchableOpacity key={r} style={[styles.rangeTab, range === r && styles.rangeTabActive]} onPress={() => setRange(r)}>
            <Text style={[styles.rangeTabText, range === r && styles.rangeTabTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={[styles.summaryCard, styles.cardShadow]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.co2_saved.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>kg CO₂ saved</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.co2_emitted.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>kg CO₂ emitted</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalHeatKj.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>kJ heat released</Text>
          </View>
        </View>
      </View>

      {/* Charts */}
      {hasData ? (
        <View style={[styles.chartCard, styles.cardShadow]}>
          <SimpleChart data={dayPoints} metric="co2_saved" color={colors.primary[500]} label="CO₂ Saved (kg)" />
          <View style={styles.chartDivider} />
          <SimpleChart data={dayPoints} metric="co2_emitted" color={colors.warning[500]} label="CO₂ Emitted (kg)" />
          <View style={styles.chartDivider} />
          <SimpleChart data={dayPoints} metric="energy_saved" color={colors.accent[400]} label="Energy Saved (kWh)" />
          <View style={styles.chartDivider} />
          <SimpleChart data={dayPoints} metric="waste_recycled" color={colors.success[500]} label="Waste Recycled (kg)" />
        </View>
      ) : (
        <View style={[styles.chartCard, styles.cardShadow]}>
          <EmptyState icon="📊" title="Your impact journey will appear here" subtitle="Log activities to see your trends and environmental impact" />
        </View>
      )}

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <View style={[styles.breakdownCard, styles.cardShadow]}>
            {Object.entries(categoryTotals).map(([cat, vals]) => (
              <View key={cat} style={styles.breakdownRow}>
                <Text style={styles.breakdownCategory}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                <View style={styles.breakdownStats}>
                  <Text style={styles.breakdownSaved}>{vals.co2_saved.toFixed(2)} kg saved</Text>
                  {vals.co2_emitted > 0 && <Text style={styles.breakdownEmitted}>{vals.co2_emitted.toFixed(2)} kg emitted</Text>}
                  <Text style={styles.breakdownCount}>{vals.count} activities</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Your Next Green Step</Text>
          <View style={styles.suggestionsContainer}>
            {suggestions.map((s, i) => (
              <View key={i} style={[styles.suggestionCard, styles.cardShadow]}>
                <View style={styles.suggestionIcon}>
                  <Lightbulb size={18} color={colors.warning[600]} strokeWidth={2} />
                </View>
                <Text style={styles.suggestionText}>{s}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Calendar & History Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionButton, styles.cardShadow]} onPress={() => setCalendarVisible(true)}>
          <Calendar size={20} color={colors.primary[700]} strokeWidth={2} />
          <Text style={styles.actionLabel}>Eco Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.cardShadow]} onPress={() => setHistoryVisible(true)}>
          <History size={20} color={colors.primary[700]} strokeWidth={2} />
          <Text style={styles.actionLabel}>Activity History</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />

      {/* Calendar Modal */}
      <Modal visible={calendarVisible} animationType="slide" transparent onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.neutral[200] }]}>
              <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>Eco Calendar</Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.neutral[100] }]}>
                <X size={20} color={colors.neutral[500]} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.calendarMonth, { color: colors.neutral[800] }]}>{MONTH_NAMES[calMonth]} {calYear}</Text>
              <View style={styles.calendarGrid}>
                {DAY_LABELS.map((d, i) => (
                  <Text key={i} style={[styles.calendarDayLabel, { color: colors.neutral[400] }]}>{d}</Text>
                ))}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <View key={`e${i}`} style={styles.calendarEmptyDay} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasActivity = activeDays.has(ds);
                  const isToday = day === today.getDate();
                  return (
                    <View key={day} style={[
                      styles.calendarDay,
                      hasActivity && { backgroundColor: colors.primary[600] },
                      isToday && { borderWidth: 2, borderColor: colors.accent[400] },
                      { backgroundColor: hasActivity ? colors.primary[600] : colors.bg },
                    ]}>
                      <Text style={{
                        fontFamily: 'Inter-Medium', fontSize: 14,
                        color: hasActivity ? colors.white : colors.neutral[600],
                      }}>{day}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.calendarLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary[500] }]} />
                  <Text style={[styles.legendText, { color: colors.neutral[500] }]}>Day with activity</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.neutral[200] }]} />
                  <Text style={[styles.legendText, { color: colors.neutral[500] }]}>No activity</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={historyVisible} animationType="slide" transparent onRequestClose={() => setHistoryVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.neutral[200] }]}>
              <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>Activity History</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.neutral[100] }]}>
                <X size={20} color={colors.neutral[500]} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <TouchableOpacity style={[styles.filterPill, historyFilter === 'all' && { backgroundColor: colors.primary[600] }]} onPress={() => setHistoryFilter('all')}>
                  <Text style={[styles.filterPillText, historyFilter === 'all' && { color: colors.white }]}>All</Text>
                </TouchableOpacity>
                {['transport', 'food', 'energy', 'waste', 'plastic'].map((c) => (
                  <TouchableOpacity key={c} style={[styles.filterPill, historyFilter === c && { backgroundColor: colors.primary[600] }]} onPress={() => setHistoryFilter(c)}>
                    <Text style={[styles.filterPillText, historyFilter === c && { color: colors.white }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredActivities.length > 0 ? (
                <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                  {filteredActivities.map((a) => (
                    <View key={a.id} style={[styles.historyItem, { borderBottomColor: colors.neutral[200] }]}>
                      <View style={styles.historyItemLeft}>
                        <Text style={[styles.historyActivity, { color: colors.neutral[800] }]}>{getActivityLabel(a)}</Text>
                        <Text style={[styles.historyDate, { color: colors.neutral[400] }]}>{formatDate(a.created_at)}</Text>
                        <Text style={[styles.historyMetrics, { color: colors.neutral[500] }]}>{getActivityMetrics(a)}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => {
                          Alert.alert('Delete Activity', 'Remove this activity?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteActivity(a.id) },
                          ]);
                        }}
                      >
                        <Trash2 size={16} color={colors.error[500]} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <EmptyState icon="📋" title="No activities found" subtitle="Try a different filter" />
              )}
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
    rangeTabs: { flexDirection: 'row', gap: 6, marginBottom: 20, backgroundColor: c.neutral[100], borderRadius: 12, padding: 3 },
    rangeTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
    rangeTabActive: { backgroundColor: c.primary[600] },
    rangeTabText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: c.neutral[500] },
    rangeTabTextActive: { color: c.white },
    cardShadow: {
      shadowColor: isDark ? '#000' : '#15803d',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryCard: { backgroundColor: c.white, borderRadius: 18, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: c.neutral[200] },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: c.neutral[900] },
    summaryLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: c.neutral[400], marginTop: 4 },
    summaryDivider: { width: 1, height: 40, backgroundColor: c.neutral[200] },
    chartCard: { backgroundColor: c.white, borderRadius: 20, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: c.neutral[200] },
    chartDivider: { height: 1, backgroundColor: c.neutral[200], marginVertical: 14 },
    sectionTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 20, color: c.neutral[800], marginBottom: 12 },
    breakdownCard: { backgroundColor: c.white, borderRadius: 18, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: c.neutral[200] },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.neutral[200] },
    breakdownCategory: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: c.neutral[700], textTransform: 'capitalize' },
    breakdownStats: { alignItems: 'flex-end' },
    breakdownSaved: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 13, color: c.primary[600] },
    breakdownEmitted: { fontFamily: 'Inter-Regular', fontSize: 12, color: c.warning[600], marginTop: 2 },
    breakdownCount: { fontFamily: 'Inter-Regular', fontSize: 11, color: c.neutral[400], marginTop: 2 },
    suggestionsContainer: { gap: 10, marginBottom: 24 },
    suggestionCard: { flexDirection: 'row', backgroundColor: c.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.neutral[200], gap: 12, alignItems: 'flex-start' },
    suggestionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.warning[50], justifyContent: 'center', alignItems: 'center' },
    suggestionText: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: c.neutral[600], lineHeight: 20 },
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.white, borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: c.neutral[200] },
    actionLabel: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: c.neutral[700] },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 20 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    modalBody: { padding: 20, maxHeight: 500 },
    calendarMonth: { fontFamily: 'Fraunces-SemiBold', fontSize: 18, marginBottom: 16, textAlign: 'center' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    calendarDayLabel: { width: 38, textAlign: 'center', fontFamily: 'Inter-Medium', fontSize: 12, marginBottom: 4 },
    calendarEmptyDay: { width: 38, height: 38 },
    calendarDay: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    calendarLegend: { flexDirection: 'row', gap: 16, marginTop: 20, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendText: { fontFamily: 'Inter-Regular', fontSize: 12 },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: c.neutral[100], marginRight: 4 },
    filterPillText: { fontFamily: 'Inter-Medium', fontSize: 13, color: c.neutral[600], textTransform: 'capitalize' },
    historyList: { maxHeight: 400 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
    historyItemLeft: { flex: 1 },
    historyActivity: { fontFamily: 'Inter-SemiBold', fontSize: 15 },
    historyDate: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 2 },
    historyMetrics: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 },
    deleteBtn: { padding: 8 },
  });
}
