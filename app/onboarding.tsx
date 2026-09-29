import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Leaf, ChevronDown, Check, Footprints, BarChart3, TrendingUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { COUNTRIES } from '@/lib/countries';
import { Colors, SHADOW } from '@/lib/theme';

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleComplete = async () => {
    if (!name.trim() || !age.trim()) {
      setError('Please fill in your name and age');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError('Please enter a valid age');
      return;
    }
    if (!user) {
      setError('No user session found');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      name: name.trim(),
      age: ageNum,
      country: country.name,
      country_code: country.code,
    });
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    await refreshProfile();
    router.replace('/(tabs)');
  };

  const nextStep = () => {
    if (step === 0) {
      setStep(1);
      fadeIn();
    } else if (step === 1) {
      handleComplete();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          <View style={styles.welcomeSection}>
            <View style={styles.logoCircle}>
              <Leaf size={36} color={Colors.white} strokeWidth={2} />
            </View>
            <Text style={styles.welcomeTitle}>Welcome to{'\n'}EcoTrace</Text>
            <Text style={styles.welcomeEmoji}>🌱</Text>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Footprints size={20} color={Colors.primary[700]} strokeWidth={2} />
                </View>
                <Text style={styles.featureTitle}>Track</Text>
                <Text style={styles.featureDesc}>your everyday activities</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <BarChart3 size={20} color={Colors.primary[700]} strokeWidth={2} />
                </View>
                <Text style={styles.featureTitle}>Understand</Text>
                <Text style={styles.featureDesc}>your environmental impact</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <TrendingUp size={20} color={Colors.primary[700]} strokeWidth={2} />
                </View>
                <Text style={styles.featureTitle}>Improve</Text>
                <Text style={styles.featureDesc}>your habits over time</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.button} onPress={nextStep} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Tell us about you</Text>
            <Text style={styles.formSubtitle}>This helps personalize your experience</Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.neutral[400]}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              placeholderTextColor={Colors.neutral[400]}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Country</Text>
            <TouchableOpacity
              style={styles.countryPicker}
              onPress={() => setShowCountries(!showCountries)}
              activeOpacity={0.85}
            >
              <Text style={styles.countryFlag}>{country.flag}</Text>
              <Text style={styles.countryName}>{country.name}</Text>
              <ChevronDown size={20} color={Colors.neutral[500]} strokeWidth={2} />
            </TouchableOpacity>

            {showCountries && (
              <View style={styles.countryList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                  {COUNTRIES.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={styles.countryItem}
                      onPress={() => {
                        setCountry(c);
                        setShowCountries(false);
                      }}
                    >
                      <Text style={styles.countryFlag}>{c.flag}</Text>
                      <Text style={styles.countryName}>{c.name}</Text>
                      {country.code === c.code && (
                        <Check size={18} color={Colors.primary[600]} strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.label}>Email</Text>
            <View style={styles.emailDisplay}>
              <Text style={styles.emailText}>{user?.email}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={nextStep} disabled={loading} activeOpacity={0.85}>
              <Text style={styles.buttonText}>
                {loading ? 'Setting up...' : 'Start Tracking'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  welcomeSection: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 600 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontFamily: 'Fraunces-Bold',
    fontSize: 34,
    color: Colors.neutral[900],
    textAlign: 'center',
    lineHeight: 42,
  },
  welcomeEmoji: { fontSize: 40, marginTop: 16, marginBottom: 32 },
  featureRow: { width: '100%', gap: 16, marginBottom: 40 },
  featureItem: { alignItems: 'center' },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 16, color: Colors.neutral[800] },
  featureDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[500], marginTop: 2 },
  formSection: { flex: 1, paddingTop: 60 },
  formTitle: { fontFamily: 'Fraunces-Bold', fontSize: 26, color: Colors.neutral[900] },
  formSubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[500], marginTop: 4, marginBottom: 24 },
  label: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.neutral[700], marginBottom: 2, marginTop: 12 },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.error[500], marginBottom: 4 },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    color: Colors.neutral[900],
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    gap: 10,
  },
  countryFlag: { fontSize: 22 },
  countryName: { fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.neutral[900], flex: 1 },
  countryList: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 12,
    backgroundColor: Colors.white,
    marginTop: 4,
    overflow: 'hidden',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  emailDisplay: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.neutral[100],
  },
  emailText: { fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.neutral[500] },
  button: {
    backgroundColor: Colors.primary[600],
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    ...SHADOW.md,
  },
  buttonText: { fontFamily: 'Inter-SemiBold', fontSize: 17, color: Colors.white },
});
