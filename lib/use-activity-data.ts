import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { calculateEcoScore } from '@/lib/eco';
import { BadgeStats } from '@/lib/badges';

export interface ActivityRow {
  id: string;
  mode: string;
  category: string;
  distance_km: number;
  duration_min: number;
  co2_saved_kg: number;
  co2_emitted_kg: number;
  energy_saved_kwh: number;
  energy_used_kwh: number;
  water_saved_l: number;
  waste_recycled_kg: number;
  waste_recorded_kg: number;
  fuel_saved_l: number;
  fuel_used_l: number;
  points: number;
  detail: any;
  created_at: string;
}

export interface AggregatedStats {
  co2_saved: number;
  co2_emitted: number;
  energy_saved: number;
  energy_used: number;
  water_saved: number;
  waste_recycled: number;
  waste_recorded: number;
  fuel_saved: number;
  fuel_used: number;
  walk_km: number;
  cycle_km: number;
  vehicle_km: number;
  bus_km: number;
  train_km: number;
  active_travel_km: number;
  total_distance: number;
  bottle_count: number;
  points: number;
  activity_count: number;
  eco_score: number;
  streak: number;
  badge_stats: BadgeStats;
  categories_used: Set<string>;
}

export interface DayPoint {
  date: string;
  co2_saved: number;
  co2_emitted: number;
  energy_saved: number;
  waste_recycled: number;
  activity_count: number;
}

function getStreak(activities: ActivityRow[]): number {
  if (activities.length === 0) return 0;
  const days = new Set<string>();
  for (const a of activities) {
    days.add(a.created_at.slice(0, 10));
  }
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    if (days.has(ds)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function useActivityData() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setActivities((data || []) as ActivityRow[]);
    setLoading(false);
  }, [user]);

  const getStats = useCallback((since?: Date): AggregatedStats => {
    const filtered = since
      ? activities.filter((a) => new Date(a.created_at) >= since)
      : activities;

    const stats: AggregatedStats = {
      co2_saved: 0,
      co2_emitted: 0,
      energy_saved: 0,
      energy_used: 0,
      water_saved: 0,
      waste_recycled: 0,
      waste_recorded: 0,
      fuel_saved: 0,
      fuel_used: 0,
      walk_km: 0,
      cycle_km: 0,
      vehicle_km: 0,
      bus_km: 0,
      train_km: 0,
      active_travel_km: 0,
      total_distance: 0,
      bottle_count: 0,
      points: 0,
      activity_count: filtered.length,
      eco_score: 0,
      streak: 0,
      badge_stats: {
        activity_count: 0,
        waste_recycled_kg: 0,
        active_travel_km: 0,
        streak: 0,
        category_count: 0,
        bottle_count: 0,
        co2_saved_kg: 0,
        energy_saved_kwh: 0,
      },
      categories_used: new Set<string>(),
    };

    for (const a of filtered) {
      stats.co2_saved += a.co2_saved_kg || 0;
      stats.co2_emitted += a.co2_emitted_kg || 0;
      stats.energy_saved += a.energy_saved_kwh || 0;
      stats.energy_used += a.energy_used_kwh || 0;
      stats.water_saved += a.water_saved_l || 0;
      stats.waste_recycled += a.waste_recycled_kg || 0;
      stats.waste_recorded += a.waste_recorded_kg || 0;
      stats.fuel_saved += a.fuel_saved_l || 0;
      stats.fuel_used += a.fuel_used_l || 0;
      stats.points += a.points || 0;

      if (a.mode === 'walk' || a.mode === 'walking') stats.walk_km += a.distance_km || 0;
      if (a.mode === 'cycle' || a.mode === 'cycling') stats.cycle_km += a.distance_km || 0;
      if (a.mode === 'car' || a.mode === 'vehicle') stats.vehicle_km += a.distance_km || 0;
      if (a.mode === 'motorcycle') stats.vehicle_km += a.distance_km || 0;
      if (a.mode === 'bus') stats.bus_km += a.distance_km || 0;
      if (a.mode === 'train') stats.train_km += a.distance_km || 0;
      if (a.mode === 'plastic') stats.bottle_count += a.detail?.count || a.distance_km || 0;

      if (a.category) stats.categories_used.add(a.category);
    }

    stats.active_travel_km = stats.walk_km + stats.cycle_km;
    stats.total_distance = stats.walk_km + stats.cycle_km + stats.vehicle_km + stats.bus_km + stats.train_km;
    stats.streak = getStreak(activities);

    stats.badge_stats = {
      activity_count: activities.length,
      waste_recycled_kg: stats.waste_recycled,
      active_travel_km: stats.active_travel_km,
      streak: stats.streak,
      category_count: stats.categories_used.size,
      bottle_count: stats.bottle_count,
      co2_saved_kg: stats.co2_saved,
      energy_saved_kwh: stats.energy_saved,
    };

    stats.eco_score = calculateEcoScore(stats.co2_saved, stats.co2_emitted, stats.activity_count, stats.streak);

    return stats;
  }, [activities]);

  const getDayPoints = useCallback((days: number): DayPoint[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map: Record<string, DayPoint> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      map[ds] = { date: ds, co2_saved: 0, co2_emitted: 0, energy_saved: 0, waste_recycled: 0, activity_count: 0 };
    }
    for (const a of activities) {
      const ds = a.created_at.slice(0, 10);
      if (map[ds]) {
        map[ds].co2_saved += a.co2_saved_kg || 0;
        map[ds].co2_emitted += a.co2_emitted_kg || 0;
        map[ds].energy_saved += a.energy_saved_kwh || 0;
        map[ds].waste_recycled += a.waste_recycled_kg || 0;
        map[ds].activity_count += 1;
      }
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [activities]);

  const deleteActivity = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('activities').delete().eq('id', id).eq('user_id', user.id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, [user]);

  return { activities, loading, loadData, getStats, getDayPoints, deleteActivity };
}
