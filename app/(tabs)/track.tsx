import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Vibration,
} from 'react-native';
import {
  Footprints, Bike, Car, Bus, TrainFront, Utensils, Zap, Trash2, Recycle,
  Play, Square, MapPin, AlertCircle, X, ChevronRight,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Colors, SHADOW } from '@/lib/theme';
import {
  ACTIVITY_TYPES, ActivityType,
  VEHICLE_FUEL_TYPES, FOOD_TYPES, WASTE_TYPES,
  calculateTransport, calculateFood, calculateEnergy, calculateWaste,
  calculateBottleResources, formatDistance,
  compareTransport,
} from '@/lib/eco';

const ICON_MAP: Record<string, any> = {
  Footprints, Bike, Car, Bus, TrainFront, Utensils, Zap, Trash2, Recycle,
};

const TRANSPORT_MODES = ['walk', 'cycle', 'car', 'motorcycle', 'bus', 'train'];

export default function TrackScreen() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [compareVisible, setCompareVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // GPS tracking state
  const [tracking, setTracking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastPosRef = useRef<{ lat: number; lon: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeMode, setActiveMode] = useState<string>('walk');
  const [fuelType, setFuelType] = useState<string>('petrol');

  // Non-transport form state (no time/distance — only type & quantity)
  const [foodType, setFoodType] = useState<string>('vegetarian');
  const [foodCount, setFoodCount] = useState('1');
  const [wasteType, setWasteType] = useState<string>('plastic');
  const [wasteKg, setWasteKg] = useState('');
  const [energyKwh, setEnergyKwh] = useState('');
  const [isEnergySaving, setIsEnergySaving] = useState(true);
  const [bottleCount, setBottleCount] = useState('1');
  const [bottleSize, setBottleSize] = useState('500ml');

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startGpsTracking = (mode: string) => {
    setActiveMode(mode);
    setTracking(true);
    setElapsed(0);
    setDistance(0);
    setGpsError(null);
    startTimeRef.current = Date.now();
    lastPosRef.current = null;

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setGpsError('Location permission denied. Enable location to track distance.');
          } else {
            setGpsError('Unable to get GPS. Check your location settings.');
          }
        },
        { enableHighAccuracy: true }
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (lastPosRef.current) {
            const d = haversine(lastPosRef.current.lat, lastPosRef.current.lon, latitude, longitude);
            if (d > 0.005) setDistance((prev) => prev + d);
          }
          lastPosRef.current = { lat: latitude, lon: longitude };
        },
        () => { setGpsError('GPS signal lost. Move to an open area.'); },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }
  };

  const stopGpsTracking = async () => {
    setTracking(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    const durationMin = elapsed / 60;
    const distKm = distance;

    if (user && (durationMin > 0.01 || distKm > 0.001)) {
      const result = calculateTransport(activeMode, distKm, activeMode === 'car' ? fuelType : undefined);
      await supabase.from('activities').insert({
        user_id: user.id,
        mode: activeMode,
        category: 'transport',
        distance_km: distKm,
        duration_min: durationMin,
        co2_saved_kg: result.co2_saved_kg,
        co2_emitted_kg: result.co2_emitted_kg,
        fuel_saved_l: result.fuel_saved_l,
        fuel_used_l: result.fuel_used_l,
        detail: { gps: true, fuelType: activeMode === 'car' ? fuelType : undefined },
      });
    }
    if (Platform.OS !== 'web') Vibration.vibrate(100);
    setElapsed(0);
    setDistance(0);
  };

  const openModal = (type: ActivityType) => {
    setSelectedType(type);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!user || !selectedType) return;
    setSaving(true);

    const mode = selectedType.key;
    const category = selectedType.category;
    let insertData: any = { user_id: user.id, mode, category };

    if (category === 'food') {
      const count = parseInt(foodCount) || 1;
      const waste = parseFloat(wasteKg) || 0;
      const result = calculateFood(foodType, count, waste);
      insertData = {
        ...insertData,
        co2_saved_kg: result.co2_saved_kg,
        co2_emitted_kg: result.co2_emitted_kg,
        waste_recycled_kg: result.waste_recycled_kg,
        detail: { foodType, count, wasteKg: waste },
      };
    } else if (category === 'energy') {
      const kwh = parseFloat(energyKwh) || 0;
      if (kwh <= 0) { setSaving(false); return; }
      const result = calculateEnergy(kwh, isEnergySaving);
      insertData = {
        ...insertData,
        co2_saved_kg: result.co2_saved_kg,
        co2_emitted_kg: result.co2_emitted_kg,
        energy_saved_kwh: result.energy_saved_kwh,
        energy_used_kwh: result.energy_used_kwh,
        detail: { kwh, isSaving: isEnergySaving },
      };
    } else if (category === 'waste') {
      const kg = parseFloat(wasteKg) || 0;
      if (kg <= 0) { setSaving(false); return; }
      const result = calculateWaste(wasteType, kg);
      insertData = {
        ...insertData,
        co2_saved_kg: result.co2_saved_kg,
        waste_recycled_kg: result.waste_recycled_kg,
        waste_recorded_kg: result.waste_recorded_kg,
        detail: { wasteType, kg },
      };
    } else if (category === 'plastic') {
      const count = parseInt(bottleCount) || 1;
      const resources = calculateBottleResources(count);
      insertData = {
        ...insertData,
        co2_saved_kg: resources.co2_saved_kg,
        energy_saved_kwh: resources.energy_saved_kwh,
        water_saved_l: resources.water_saved_l,
        points: resources.points,
        detail: { count, bottleSize, oil_saved_ml: resources.oil_saved_ml },
      };
    }

    await supabase.from('activities').insert(insertData);
    setSaving(false);
    setModalVisible(false);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const transportTypes = ACTIVITY_TYPES.filter((t) => t.category === 'transport');
  const otherTypes = ACTIVITY_TYPES.filter((t) => t.category !== 'transport');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Track Activity</Text>
      <Text style={styles.subtitle}>Pick an activity — distance & time are auto-calculated</Text>

      {/* GPS Live Tracking */}
      <View style={[styles.gpsCard, SHADOW.sm]}>
        <Text style={styles.gpsTitle}>Live GPS Tracking</Text>
        <Text style={styles.gpsSubtitle}>Auto-tracks distance & time while you move</Text>

        {!tracking ? (
          <>
            <Text style={styles.inputLabel}>Select transport mode</Text>
            <View style={styles.gpsModeGrid}>
              {transportTypes.map((t) => {
                const Icon = ICON_MAP[t.icon] || Footprints;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.gpsModeBtn, activeMode === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                    onPress={() => setActiveMode(t.key)}
                  >
                    <Icon size={18} color={activeMode === t.key ? Colors.white : Colors.neutral[500]} strokeWidth={2} />
                    <Text style={[styles.gpsModeLabel, activeMode === t.key && styles.gpsModeLabelActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeMode === 'car' && (
              <>
                <Text style={styles.inputLabel}>Fuel type</Text>
                <View style={styles.pillRow}>
                  {VEHICLE_FUEL_TYPES.map((f) => (
                    <TouchableOpacity key={f} style={[styles.pill, fuelType === f && styles.pillActive]} onPress={() => setFuelType(f)}>
                      <Text style={[styles.pillText, fuelType === f && styles.pillTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={[styles.gpsButton, styles.startButton]} onPress={() => startGpsTracking(activeMode)} activeOpacity={0.85}>
              <Play size={20} color={Colors.white} strokeWidth={2} fill={Colors.white} />
              <Text style={styles.gpsButtonText}>Start Tracking</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.trackingDisplay}>
              {gpsError && (
                <View style={styles.gpsError}>
                  <AlertCircle size={14} color={Colors.error[500]} strokeWidth={2} />
                  <Text style={styles.gpsErrorText}>{gpsError}</Text>
                </View>
              )}
              <Text style={styles.trackingMode}>
                {transportTypes.find((t) => t.key === activeMode)?.label || activeMode}
              </Text>
              <Text style={styles.timer}>{formatTime(elapsed)}</Text>
              <View style={styles.trackingMetrics}>
                <View style={styles.trackingMetric}>
                  <MapPin size={16} color={Colors.neutral[500]} strokeWidth={2} />
                  <Text style={styles.trackingMetricValue}>{formatDistance(distance, activeMode)}</Text>
                  <Text style={styles.trackingMetricLabel}>distance (auto)</Text>
                </View>
                <View style={styles.trackingMetric}>
                  <Text style={styles.trackingMetricValue}>{(elapsed / 60).toFixed(1)} min</Text>
                  <Text style={styles.trackingMetricLabel}>time (auto)</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={[styles.gpsButton, styles.stopButton]} onPress={stopGpsTracking} activeOpacity={0.85}>
              <Square size={20} color={Colors.white} strokeWidth={2} fill={Colors.white} />
              <Text style={styles.gpsButtonText}>Stop & Save</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Transport Comparison */}
      <TouchableOpacity style={styles.compareButton} onPress={() => setCompareVisible(true)} activeOpacity={0.85}>
        <Text style={styles.compareIcon}>🌱</Text>
        <View style={styles.compareText}>
          <Text style={styles.compareTitle}>Better Trip Comparison</Text>
          <Text style={styles.compareSubtitle}>Compare CO₂ for the same journey</Text>
        </View>
        <ChevronRight size={20} color={Colors.neutral[400]} strokeWidth={2} />
      </TouchableOpacity>

      {/* Transport — all handled by GPS tracking above */}
      <Text style={styles.sectionTitle}>Transport</Text>
      <Text style={styles.sectionHint}>Use GPS tracking above — all distance & time calculated automatically</Text>

      {/* Lifestyle activities — tap to log */}
      <Text style={styles.sectionTitle}>Lifestyle</Text>
      <Text style={styles.sectionHint}>Tap to log — no time or distance needed</Text>
      <View style={styles.activityGrid}>
        {otherTypes.map((type) => {
          const Icon = ICON_MAP[type.icon] || Utensils;
          return (
            <TouchableOpacity
              key={type.key}
              style={[styles.activityCard, { borderColor: type.color + '30' }, SHADOW.sm]}
              onPress={() => openModal(type)}
              activeOpacity={0.85}
            >
              <View style={[styles.activityIcon, { backgroundColor: type.bgColor }]}>
                <Icon size={22} color={type.color} strokeWidth={2} />
              </View>
              <Text style={styles.activityLabel}>{type.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 24 }} />

      {/* Lifestyle Detail Modal — no distance/time fields */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedType?.label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={Colors.neutral[500]} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedType?.category === 'food' && (
                <>
                  <Text style={styles.inputLabel}>Meal type</Text>
                  <View style={styles.pillRow}>
                    {FOOD_TYPES.map((f) => (
                      <TouchableOpacity key={f} style={[styles.pill, foodType === f && styles.pillActive]} onPress={() => setFoodType(f)}>
                        <Text style={[styles.pillText, foodType === f && styles.pillTextActive]}>
                          {f === 'food_waste' ? 'Food Waste' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {foodType !== 'food_waste' && (
                    <>
                      <Text style={styles.inputLabel}>Number of meals</Text>
                      <TextInput style={styles.input} placeholder="1" value={foodCount} onChangeText={setFoodCount} keyboardType="numeric" placeholderTextColor={Colors.neutral[400]} />
                    </>
                  )}
                  {foodType === 'food_waste' && (
                    <>
                      <Text style={styles.inputLabel}>Food waste (kg)</Text>
                      <TextInput style={styles.input} placeholder="e.g. 0.5" value={wasteKg} onChangeText={setWasteKg} keyboardType="numeric" placeholderTextColor={Colors.neutral[400]} />
                    </>
                  )}
                </>
              )}

              {selectedType?.category === 'energy' && (
                <>
                  <Text style={styles.inputLabel}>Type</Text>
                  <View style={styles.pillRow}>
                    <TouchableOpacity style={[styles.pill, isEnergySaving && styles.pillActive]} onPress={() => setIsEnergySaving(true)}>
                      <Text style={[styles.pillText, isEnergySaving && styles.pillTextActive]}>Energy Saved</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.pill, !isEnergySaving && styles.pillActive]} onPress={() => setIsEnergySaving(false)}>
                      <Text style={[styles.pillText, !isEnergySaving && styles.pillTextActive]}>Energy Used</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.inputLabel}>Amount (kWh)</Text>
                  <TextInput style={styles.input} placeholder="e.g. 2.5" value={energyKwh} onChangeText={setEnergyKwh} keyboardType="numeric" placeholderTextColor={Colors.neutral[400]} />
                </>
              )}

              {selectedType?.category === 'waste' && (
                <>
                  <Text style={styles.inputLabel}>Waste type</Text>
                  <View style={styles.pillRow}>
                    {WASTE_TYPES.map((w) => (
                      <TouchableOpacity key={w} style={[styles.pill, wasteType === w && styles.pillActive]} onPress={() => setWasteType(w)}>
                        <Text style={[styles.pillText, wasteType === w && styles.pillTextActive]}>
                          {w.charAt(0).toUpperCase() + w.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.inputLabel}>Amount (kg)</Text>
                  <TextInput style={styles.input} placeholder="e.g. 2.0" value={wasteKg} onChangeText={setWasteKg} keyboardType="numeric" placeholderTextColor={Colors.neutral[400]} />
                </>
              )}

              {selectedType?.category === 'plastic' && (
                <>
                  <Text style={styles.inputLabel}>Number of bottles</Text>
                  <TextInput style={styles.input} placeholder="1" value={bottleCount} onChangeText={setBottleCount} keyboardType="numeric" placeholderTextColor={Colors.neutral[400]} />
                  <Text style={styles.inputLabel}>Bottle size</Text>
                  <View style={styles.pillRow}>
                    {['250-500ml', '500-750ml', '750ml-1L', '1-1.5L', '1.5-2L', '2-3L'].map((s) => (
                      <TouchableOpacity key={s} style={[styles.pill, bottleSize === s && styles.pillActive]} onPress={() => setBottleSize(s)}>
                        <Text style={[styles.pillText, bottleSize === s && styles.pillTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.pointsInfo}>
                    <Text style={styles.pointsInfoText}>3 Eco Points per bottle</Text>
                  </View>
                </>
              )}

              <Text style={styles.estimateNote}>
                * Environmental values are estimates based on average factors. Actual impact may vary.
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Activity'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transport Comparison Modal */}
      <Modal visible={compareVisible} animationType="slide" transparent onRequestClose={() => setCompareVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trip Comparison</Text>
              <TouchableOpacity onPress={() => setCompareVisible(false)} style={styles.closeBtn}>
                <X size={20} color={Colors.neutral[500]} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <CompareContent />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function CompareContent() {
  const [compareDist, setCompareDist] = useState('5');
  const dist = parseFloat(compareDist) || 0;
  const results = compareTransport(dist);

  return (
    <View style={styles.modalBody}>
      <Text style={styles.inputLabel}>Journey distance (km)</Text>
      <TextInput style={styles.input} placeholder="e.g. 5" value={compareDist} onChangeText={setCompareDist} keyboardType="numeric" placeholderTextColor={Colors.neutral[400]} />
      <View style={styles.compareResults}>
        {results.map((r) => (
          <View key={r.key} style={styles.compareResultRow}>
            <Text style={styles.compareResultMode}>{r.label}</Text>
            <View style={styles.compareResultValues}>
              {r.saved > 0 ? (
                <Text style={styles.compareResultSaved}>-{r.saved.toFixed(3)} kg CO₂</Text>
              ) : (
                <Text style={styles.compareResultEmitted}>{r.co2.toFixed(3)} kg CO₂</Text>
              )}
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.estimateNote}>
        These are estimates based on average emission factors. Actual emissions vary based on vehicle, occupancy, route, fuel source and other factors. No single method is universally "best".
      </Text>
    </View>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontFamily: 'Fraunces-Bold', fontSize: 28, color: Colors.neutral[900], marginTop: 8 },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[500], marginTop: 4, marginBottom: 24 },
  gpsCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: Colors.primary[100], ...SHADOW.md },
  gpsTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 18, color: Colors.neutral[800] },
  gpsSubtitle: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[400], marginTop: 4, marginBottom: 16 },
  gpsModeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  gpsModeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: Colors.neutral[100], borderWidth: 1.5, borderColor: Colors.neutral[200] },
  gpsModeLabel: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral[600] },
  gpsModeLabelActive: { color: Colors.white },
  trackingDisplay: { alignItems: 'center', marginBottom: 16 },
  trackingMode: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral[700], marginBottom: 8 },
  gpsError: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.error[50], borderRadius: 8 },
  gpsErrorText: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.error[600], flex: 1 },
  timer: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 48, color: Colors.primary[800], marginBottom: 12 },
  trackingMetrics: { flexDirection: 'row', gap: 24 },
  trackingMetric: { alignItems: 'center', gap: 4 },
  trackingMetricValue: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 18, color: Colors.neutral[900] },
  trackingMetricLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[500] },
  gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16, ...SHADOW.md },
  startButton: { backgroundColor: Colors.primary[600] },
  stopButton: { backgroundColor: Colors.error[500] },
  gpsButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
  compareButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.primary[100], gap: 12, ...SHADOW.sm },
  compareIcon: { fontSize: 24 },
  compareText: { flex: 1 },
  compareTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral[800] },
  compareSubtitle: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[400], marginTop: 2 },
  sectionTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 18, color: Colors.neutral[700], marginBottom: 4 },
  sectionHint: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[400], marginBottom: 12 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  activityCard: { width: '31%', backgroundColor: Colors.white, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.neutral[100], ...SHADOW.sm },
  activityIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  activityLabel: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral[700] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.neutral[100] },
  modalTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 20, color: Colors.neutral[900] },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.neutral[100], justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: 20, maxHeight: 400 },
  inputLabel: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.neutral[700], marginBottom: 6, marginTop: 12 },
  input: { fontFamily: 'Inter-Regular', fontSize: 16, borderWidth: 1, borderColor: Colors.neutral[200], borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.bg, color: Colors.neutral[900] },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.neutral[100] },
  pillActive: { backgroundColor: Colors.primary[600] },
  pillText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral[600], textTransform: 'capitalize' },
  pillTextActive: { color: Colors.white },
  pointsInfo: { backgroundColor: Colors.primary[50], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12 },
  pointsInfoText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.primary[700] },
  estimateNote: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[400], marginTop: 16, lineHeight: 18 },
  saveButton: { backgroundColor: Colors.primary[600], borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 8, ...SHADOW.md },
  saveButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 17, color: Colors.white },
  compareResults: { marginTop: 16, gap: 8 },
  compareResultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: Colors.bg, borderRadius: 12 },
  compareResultMode: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral[700] },
  compareResultValues: { alignItems: 'flex-end' },
  compareResultSaved: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 14, color: Colors.primary[600] },
  compareResultEmitted: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 14, color: Colors.warning[600] },
});
