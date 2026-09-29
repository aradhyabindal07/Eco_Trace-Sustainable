// Environmental calculation constants and functions for EcoTrace
// Sources: UK DEFRA greenhouse gas conversion factors, EPA waste reduction model (WARM),
// and publicly available lifecycle assessment data. All values are estimates.

// ─── Transport: CO2 per km (kg CO2e per passenger-km or vehicle-km) ───
// Source: UK DEFRA 2023 GHG conversion factors for company reporting
export const TRANSPORT_CO2_PER_KM: Record<string, number> = {
  walk: 0, // Walking emits nothing; "avoided" = what a car would have emitted
  cycle: 0, // Cycling emits nothing; "avoided" = what a car would have emitted
  car_petrol: 0.192,
  car_diesel: 0.171,
  car_hybrid: 0.128,
  car_electric: 0.053,
  motorcycle: 0.113,
  bus: 0.103,
  train: 0.041,
};

// Average car CO2 used for "avoided" calculations when walking/cycling replaces a car trip
export const AVERAGE_CAR_CO2_PER_KM = 0.192;
export const AVERAGE_PETROL_L_PER_KM = 0.07; // ~7 L/100km

// ─── Food: CO2 per meal (kg CO2e per meal) ───
// Source: Poore & Nemecek (2018) Science 360, 987-992; reduced to per-meal estimates
export const FOOD_CO2_PER_MEAL: Record<string, number> = {
  meat: 3.3,
  vegetarian: 1.6,
  vegan: 1.0,
};

export const FOOD_WASTE_CO2_PER_KG = 2.5; // kg CO2e per kg food waste (compost/landfill avoided)

// ─── Energy: CO2 per kWh (kg CO2e per kWh) ───
// Source: IEA 2022 average grid emission factor ~0.475 kg/kWh global average
export const GRID_CO2_PER_KWH = 0.475;

// ─── Plastic bottle recycling ───
// Source: EPA WARM Version 16 — PET recycling methodology
// CO2e avoided: 1.146 kg CO2e per kg PET (vs virgin PET)
// Energy benefit: 18.68 MJ per kg PET
// Default bottle weight: ~15g for 500ml bottle (estimated)
export const PET_CO2E_AVOIDED_PER_KG = 1.146;
export const PET_ENERGY_BENEFIT_MJ_PER_KG = 18.68;
export const PET_DEFAULT_BOTTLE_WEIGHT_G = 15; // estimated average for 500ml
export const BOTTLE_POINTS = 3; // app reward points per bottle
// Legacy compat
export const BOTTLE_CO2_SAVED_KG = 0.034; // 15g * 1.146 / 1000
export const BOTTLE_OIL_SAVED_ML = 0; // methodology-dependent, not claimed
export const BOTTLE_ENERGY_SAVED_KWH = 0.0078; // 15g * 18.68 MJ/kg / 3600 = ~0.078 MJ -> 0.0078 kWh... actually: 0.015 * 18.68 / 3.6 = 0.0778 kWh
export const BOTTLE_WATER_SAVED_L = 0; // methodology-dependent, not claimed

// ─── Waste recycling ───
// Source: EPA WARM model emission factors
export const WASTE_CO2_SAVED_PER_KG: Record<string, number> = {
  plastic: 1.5,
  paper: 0.9,
  general: 0.3,
};

// ─── Shopping ───
// Source: Estimated average from textile LCA studies
export const SHOPPING_CO2: Record<string, number> = {
  clothing: 10.0, // kg CO2e per item (new clothing avg)
  electronics: 80.0, // kg CO2e per item (small electronics avg)
  general: 5.0,
  reusable: -2.0, // negative = saved by using reusable instead of disposable
};

// ─── Screen time / phone heat ───
export const HEAT_PER_MIN_KJ = 0.18; // kJ heat released per minute of screen-on use

// ─── Types ───
export type ActivityCategory = 'transport' | 'food' | 'energy' | 'shopping' | 'waste' | 'plastic';

export interface ActivityType {
  key: string;
  label: string;
  category: ActivityCategory;
  icon: string;
  color: string;
  bgColor: string;
}

export const ACTIVITY_TYPES: ActivityType[] = [
  { key: 'walk', label: 'Walking', category: 'transport', icon: 'Footprints', color: '#15803d', bgColor: '#dcfce7' },
  { key: 'cycle', label: 'Cycling', category: 'transport', icon: 'Bike', color: '#0369a1', bgColor: '#e0f2fe' },
  { key: 'car', label: 'Car', category: 'transport', icon: 'Car', color: '#d97706', bgColor: '#fef3c7' },
  { key: 'motorcycle', label: 'Motorcycle', category: 'transport', icon: 'Bike', color: '#b45309', bgColor: '#fef3c7' },
  { key: 'bus', label: 'Bus', category: 'transport', icon: 'Bus', color: '#7c3aed', bgColor: '#ede9fe' },
  { key: 'train', label: 'Train', category: 'transport', icon: 'TrainFront', color: '#0891b2', bgColor: '#cffafe' },
  { key: 'food', label: 'Food', category: 'food', icon: 'Utensils', color: '#ea580c', bgColor: '#ffedd5' },
  { key: 'energy', label: 'Energy', category: 'energy', icon: 'Zap', color: '#ca8a04', bgColor: '#fef9c3' },
  { key: 'waste', label: 'Waste', category: 'waste', icon: 'Trash2', color: '#65a30d', bgColor: '#ecfccb' },
  { key: 'plastic', label: 'Plastic Bottles', category: 'plastic', icon: 'Recycle', color: '#16a34a', bgColor: '#dcfce7' },
];

export const VEHICLE_FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric'] as const;
export const FOOD_TYPES = ['meat', 'vegetarian', 'vegan', 'food_waste'] as const;
export const WASTE_TYPES = ['plastic', 'paper', 'general'] as const;
export const SHOPPING_TYPES = ['clothing', 'electronics', 'general', 'reusable'] as const;

// ─── Calculation functions ───

export function formatDistance(km: number, mode: string): string {
  if (mode === 'car' || mode === 'motorcycle' || mode === 'bus' || mode === 'train' || mode === 'vehicle') {
    return `${km.toFixed(2)} km`;
  }
  const meters = Math.round(km * 1000);
  if (meters < 1000) return `${meters} m`;
  return `${km.toFixed(2)} km (${meters} m)`;
}

export function calculateHeat(durationMin: number): number {
  return HEAT_PER_MIN_KJ * durationMin;
}

export function calculateBottleResources(count: number, bottleWeightG?: number) {
  const weightG = bottleWeightG ?? PET_DEFAULT_BOTTLE_WEIGHT_G;
  const petKg = (weightG * count) / 1000;
  const co2SavedKg = petKg * PET_CO2E_AVOIDED_PER_KG;
  const energyMj = petKg * PET_ENERGY_BENEFIT_MJ_PER_KG;
  const energyKwh = energyMj / 3.6;
  return {
    co2_saved_kg: co2SavedKg,
    oil_saved_ml: 0, // methodology-dependent
    energy_saved_kwh: energyKwh,
    water_saved_l: 0, // methodology-dependent
    points: BOTTLE_POINTS * count,
    pet_kg: petKg,
    energy_mj: energyMj,
    waste_diverted_g: weightG * count,
  };
}

// Transport calculation
export function calculateTransport(
  mode: string,
  distanceKm: number,
  fuelType?: string
): {
  co2_saved_kg: number;
  co2_emitted_kg: number;
  fuel_saved_l: number;
  fuel_used_l: number;
} {
  if (mode === 'walk' || mode === 'cycle') {
    // Walking/cycling avoids the car trip
    const avoided = AVERAGE_CAR_CO2_PER_KM * distanceKm;
    return {
      co2_saved_kg: avoided,
      co2_emitted_kg: 0,
      fuel_saved_l: AVERAGE_PETROL_L_PER_KM * distanceKm,
      fuel_used_l: 0,
    };
  }

  let co2PerKm = TRANSPORT_CO2_PER_KM.car_petrol;
  if (mode === 'car' && fuelType) {
    co2PerKm = TRANSPORT_CO2_PER_KM[`car_${fuelType}`] || co2PerKm;
  } else if (mode === 'motorcycle') {
    co2PerKm = TRANSPORT_CO2_PER_KM.motorcycle;
  } else if (mode === 'bus') {
    co2PerKm = TRANSPORT_CO2_PER_KM.bus;
  } else if (mode === 'train') {
    co2PerKm = TRANSPORT_CO2_PER_KM.train;
  } else if (mode === 'vehicle') {
    co2PerKm = TRANSPORT_CO2_PER_KM.car_petrol;
  }

  const emitted = co2PerKm * distanceKm;
  return {
    co2_saved_kg: 0,
    co2_emitted_kg: emitted,
    fuel_saved_l: 0,
    fuel_used_l: mode === 'car' && fuelType !== 'electric' ? AVERAGE_PETROL_L_PER_KM * distanceKm : 0,
  };
}

// Food calculation
export function calculateFood(
  foodType: string,
  count: number,
  wasteKg: number
): { co2_emitted_kg: number; co2_saved_kg: number; waste_recycled_kg: number } {
  if (foodType === 'food_waste') {
    return {
      co2_emitted_kg: 0,
      co2_saved_kg: FOOD_WASTE_CO2_PER_KG * wasteKg,
      waste_recycled_kg: wasteKg,
    };
  }
  const co2 = (FOOD_CO2_PER_MEAL[foodType] || 0) * count;
  return { co2_emitted_kg: co2, co2_saved_kg: 0, waste_recycled_kg: 0 };
}

// Energy calculation
export function calculateEnergy(
  kWh: number,
  isSaving: boolean
): { co2_saved_kg: number; co2_emitted_kg: number; energy_saved_kwh: number; energy_used_kwh: number } {
  if (isSaving) {
    return {
      co2_saved_kg: GRID_CO2_PER_KWH * kWh,
      co2_emitted_kg: 0,
      energy_saved_kwh: kWh,
      energy_used_kwh: 0,
    };
  }
  return {
    co2_saved_kg: 0,
    co2_emitted_kg: GRID_CO2_PER_KWH * kWh,
    energy_saved_kwh: 0,
    energy_used_kwh: kWh,
  };
}

// Waste calculation
export function calculateWaste(
  wasteType: string,
  kg: number
): { co2_saved_kg: number; waste_recycled_kg: number; waste_recorded_kg: number } {
  const factor = WASTE_CO2_SAVED_PER_KG[wasteType] || 0;
  const isRecycled = wasteType !== 'general';
  return {
    co2_saved_kg: isRecycled ? factor * kg : 0,
    waste_recycled_kg: isRecycled ? kg : 0,
    waste_recorded_kg: kg,
  };
}

// Shopping calculation
export function calculateShopping(
  shoppingType: string,
  count: number
): { co2_saved_kg: number; co2_emitted_kg: number } {
  const factor = SHOPPING_CO2[shoppingType] || 0;
  if (factor < 0) {
    return { co2_saved_kg: Math.abs(factor) * count, co2_emitted_kg: 0 };
  }
  return { co2_saved_kg: 0, co2_emitted_kg: factor * count };
}

// Transport comparison for a given distance
export function compareTransport(distanceKm: number) {
  const modes = [
    { key: 'walk', label: 'Walking', co2: 0, saved: AVERAGE_CAR_CO2_PER_KM * distanceKm },
    { key: 'cycle', label: 'Cycling', co2: 0, saved: AVERAGE_CAR_CO2_PER_KM * distanceKm },
    { key: 'bus', label: 'Bus', co2: TRANSPORT_CO2_PER_KM.bus * distanceKm, saved: 0 },
    { key: 'train', label: 'Train', co2: TRANSPORT_CO2_PER_KM.train * distanceKm, saved: 0 },
    { key: 'car', label: 'Car', co2: TRANSPORT_CO2_PER_KM.car_petrol * distanceKm, saved: 0 },
    { key: 'motorcycle', label: 'Motorcycle', co2: TRANSPORT_CO2_PER_KM.motorcycle * distanceKm, saved: 0 },
  ];
  return modes.map((m) => ({
    ...m,
    co2: Math.round(m.co2 * 1000) / 1000,
    saved: Math.round(m.saved * 1000) / 1000,
  }));
}

// Eco Score: 0-100 based on net CO2 saved, activities logged, and streak
export function calculateEcoScore(
  co2Saved: number,
  co2Emitted: number,
  activityCount: number,
  streak: number
): number {
  const netCo2 = Math.max(0, co2Saved - co2Emitted);
  const co2Score = Math.min(40, netCo2 * 4); // up to 40 pts from CO2
  const activityScore = Math.min(30, activityCount * 2); // up to 30 pts from activities
  const streakScore = Math.min(30, streak * 3); // up to 30 pts from streak
  return Math.min(100, Math.round(co2Score + activityScore + streakScore));
}
