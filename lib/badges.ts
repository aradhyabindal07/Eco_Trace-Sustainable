export interface BadgeDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  metric: string;
  tiers: { tier: 'bronze' | 'silver' | 'gold'; threshold: number }[];
}

export const BADGES: BadgeDef[] = [
  {
    key: 'first_bottle',
    name: 'First Bottle',
    description: 'Recycle your first plastic bottle',
    icon: 'Recycle',
    metric: 'bottle_count',
    tiers: [
      { tier: 'bronze', threshold: 1 },
      { tier: 'silver', threshold: 50 },
      { tier: 'gold', threshold: 500 },
    ],
  },
  {
    key: 'plastic_reducer',
    name: 'Plastic Reducer',
    description: 'Collect plastic bottles',
    icon: 'Recycle',
    metric: 'bottle_count',
    tiers: [
      { tier: 'bronze', threshold: 10 },
      { tier: 'silver', threshold: 100 },
      { tier: 'gold', threshold: 500 },
    ],
  },
  {
    key: 'eco_collector',
    name: 'Eco Collector',
    description: 'Recycle different materials',
    icon: 'Recycle',
    metric: 'waste_recycled_kg',
    tiers: [
      { tier: 'bronze', threshold: 1 },
      { tier: 'silver', threshold: 10 },
      { tier: 'gold', threshold: 50 },
    ],
  },
  {
    key: 'collection_champion',
    name: 'Collection Champion',
    description: 'Master recycler',
    icon: 'Award',
    metric: 'waste_recycled_kg',
    tiers: [
      { tier: 'bronze', threshold: 5 },
      { tier: 'silver', threshold: 25 },
      { tier: 'gold', threshold: 100 },
    ],
  },
  {
    key: 'first_walk',
    name: 'First Walk',
    description: 'Log your first walking trip',
    icon: 'Footprints',
    metric: 'activity_count',
    tiers: [
      { tier: 'bronze', threshold: 1 },
      { tier: 'silver', threshold: 10 },
      { tier: 'gold', threshold: 50 },
    ],
  },
  {
    key: 'first_cycle',
    name: 'First Cycle',
    description: 'Log your first cycling trip',
    icon: 'Bike',
    metric: 'active_travel_km',
    tiers: [
      { tier: 'bronze', threshold: 1 },
      { tier: 'silver', threshold: 50 },
      { tier: 'gold', threshold: 200 },
    ],
  },
  {
    key: 'green_traveler',
    name: 'Green Traveler',
    description: 'Walk and cycle distance',
    icon: 'Bike',
    metric: 'active_travel_km',
    tiers: [
      { tier: 'bronze', threshold: 5 },
      { tier: 'silver', threshold: 50 },
      { tier: 'gold', threshold: 200 },
    ],
  },
  {
    key: 'activity_explorer',
    name: 'Activity Explorer',
    description: 'Try different activity types',
    icon: 'Compass',
    metric: 'category_count',
    tiers: [
      { tier: 'bronze', threshold: 3 },
      { tier: 'silver', threshold: 5 },
      { tier: 'gold', threshold: 8 },
    ],
  },
  {
    key: 'eco_streak',
    name: 'Eco Streak',
    description: 'Maintain a daily logging streak',
    icon: 'Flame',
    metric: 'streak',
    tiers: [
      { tier: 'bronze', threshold: 3 },
      { tier: 'silver', threshold: 14 },
      { tier: 'gold', threshold: 30 },
    ],
  },
  {
    key: 'eco_champion',
    name: 'Eco Champion',
    description: 'Total CO2 saved',
    icon: 'Leaf',
    metric: 'co2_saved_kg',
    tiers: [
      { tier: 'bronze', threshold: 1 },
      { tier: 'silver', threshold: 25 },
      { tier: 'gold', threshold: 100 },
    ],
  },
];

export interface BadgeStats {
  activity_count: number;
  waste_recycled_kg: number;
  active_travel_km: number;
  streak: number;
  category_count: number;
  bottle_count: number;
  co2_saved_kg: number;
  energy_saved_kwh: number;
}

export function getBadgeProgress(
  badge: BadgeDef,
  stats: BadgeStats
): { current: number; nextTier: 'bronze' | 'silver' | 'gold' | null; threshold: number; progress: number; earned: boolean } {
  const current = (stats as any)[badge.metric] || 0;
  let earnedTier: 'bronze' | 'silver' | 'gold' | null = null;
  let nextTier: 'bronze' | 'silver' | 'gold' | null = null;
  let threshold = 0;

  for (const t of badge.tiers) {
    if (current >= t.threshold) {
      earnedTier = t.tier;
    } else if (!nextTier) {
      nextTier = t.tier;
      threshold = t.threshold;
    }
  }

  if (!nextTier && earnedTier) {
    return { current, nextTier: null, threshold: badge.tiers[badge.tiers.length - 1].threshold, progress: 1, earned: true };
  }

  const prevThreshold = earnedTier
    ? badge.tiers.find((t) => t.tier === earnedTier)!.threshold
    : 0;
  const progress = nextTier
    ? Math.min(1, (current - prevThreshold) / (threshold - prevThreshold))
    : 1;

  return { current, nextTier, threshold, progress, earned: !!earnedTier };
}
