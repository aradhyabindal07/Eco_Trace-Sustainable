import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import {
  User, Mail, Calendar, MapPin, Leaf, LogOut, ChevronRight, Shield,
  FileText, Info, Trash2, Award, Lock, Sun, Moon, Smartphone,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { COUNTRIES } from '@/lib/countries';

export default function ProfileScreen() {
  const { colors, isDark, mode, setMode } = useTheme();
  const { profile, user, signOut, deleteAccount, isOwner } = useAuth();
  const [aboutVisible, setAboutVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [calcVisible, setCalcVisible] = useState(false);

  const country = COUNTRIES.find((c) => c.code === profile?.country_code);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: () => {
          Alert.alert('Confirm', 'Are you absolutely sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes, Delete', style: 'destructive', onPress: () => deleteAccount() },
          ]);
        }},
      ]
    );
  };

  const styles = makeStyles(colors, isDark);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Profile</Text>

      {/* Profile Card */}
      <View style={[styles.profileCard, styles.cardShadow]}>
        <View style={styles.avatar}>
          <Leaf size={28} color={colors.white} strokeWidth={2} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.name || 'Eco Hero'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Shield size={12} color={colors.white} strokeWidth={2} />
              <Text style={styles.ownerBadgeText}>Owner</Text>
            </View>
          )}
        </View>
      </View>

      {/* Details */}
      <View style={[styles.detailsCard, styles.cardShadow]}>
        <DetailRow icon={User} label="Name" value={profile?.name} colors={colors} />
        <DetailDivider colors={colors} />
        <DetailRow icon={Mail} label="Email" value={user?.email} colors={colors} />
        <DetailDivider colors={colors} />
        <DetailRow icon={Calendar} label="Age" value={`${profile?.age || '—'} years`} colors={colors} />
        <DetailDivider colors={colors} />
        <DetailRow icon={MapPin} label="Country" value={`${country?.flag || ''} ${country?.name || ''}`} colors={colors} />
      </View>

      {/* Owner Dashboard Access */}
      {isOwner && (
        <TouchableOpacity style={[styles.menuItem, styles.cardShadow]} onPress={() => router.push('/owner')} activeOpacity={0.85}>
          <View style={[styles.menuIcon, { backgroundColor: colors.primary[100] }]}>
            <Shield size={18} color={colors.primary[700]} strokeWidth={2} />
          </View>
          <Text style={styles.menuLabel}>Owner Dashboard</Text>
          <ChevronRight size={20} color={colors.neutral[300]} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Appearance */}
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={[styles.appearanceCard, styles.cardShadow]}>
        <AppearanceOption icon={Sun} label="Light" active={mode === 'light'} onPress={() => setMode('light')} colors={colors} />
        <DetailDivider colors={colors} />
        <AppearanceOption icon={Moon} label="Dark" active={mode === 'dark'} onPress={() => setMode('dark')} colors={colors} />
        <DetailDivider colors={colors} />
        <AppearanceOption icon={Smartphone} label="System" active={mode === 'system'} onPress={() => setMode('system')} colors={colors} />
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={[styles.menuCard, styles.cardShadow]}>
        <MenuButton icon={Info} label="About EcoVibe" color={colors.primary[700]} bgColor={colors.primary[50]} onPress={() => setAboutVisible(true)} colors={colors} />
        <DetailDivider colors={colors} />
        <MenuButton icon={FileText} label="Calculation Sources" color={colors.accent[600]} bgColor={colors.accent[50]} onPress={() => setCalcVisible(true)} colors={colors} />
      </View>

      {/* Legal */}
      <Text style={styles.sectionTitle}>Legal</Text>
      <View style={[styles.menuCard, styles.cardShadow]}>
        <MenuButton icon={Lock} label="Privacy Policy" color={colors.neutral[700]} bgColor={colors.neutral[100]} onPress={() => setPrivacyVisible(true)} colors={colors} />
        <DetailDivider colors={colors} />
        <MenuButton icon={FileText} label="Terms & Conditions" color={colors.neutral[700]} bgColor={colors.neutral[100]} onPress={() => setTermsVisible(true)} colors={colors} />
      </View>

      {/* Account */}
      <Text style={styles.sectionTitle}>Account</Text>
      <TouchableOpacity style={[styles.dangerButton, styles.cardShadow]} onPress={handleSignOut} activeOpacity={0.85}>
        <LogOut size={18} color={colors.error[500]} strokeWidth={2} />
        <Text style={styles.dangerText}>Sign Out</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.dangerButton, styles.cardShadow, { borderColor: colors.error[400] }]} onPress={handleDelete} activeOpacity={0.85}>
        <Trash2 size={18} color={colors.error[500]} strokeWidth={2} />
        <Text style={styles.dangerText}>Delete Account & Data</Text>
      </TouchableOpacity>

      <Text style={styles.version}>EcoVibe v2.0.0 — Live Greener. Feel Better.</Text>
      <View style={{ height: 24 }} />

      {/* About Modal */}
      <InfoModal visible={aboutVisible} onClose={() => setAboutVisible(false)} title="About EcoVibe" colors={colors}>
        <Text style={styles.modalBodyText}>
          EcoVibe is a complete sustainability platform that helps you track everyday activities — walking, cycling, driving, plastic recycling, and more — and calculates your environmental impact.
        </Text>
        <Text style={styles.modalBodyText}>
          Our mission is to help you understand and reduce your environmental footprint through simple, actionable tracking and insights. Live Greener. Feel Better.
        </Text>
        <Text style={styles.sectionSubTitle}>Founder / Creator</Text>
        <View style={styles.founderCard}>
          <View style={styles.founderPhotoPlaceholder}>
            <User size={36} color={colors.neutral[400]} strokeWidth={1.5} />
          </View>
          <View>
            <Text style={styles.founderName}>Aradhya Bindal</Text>
            <Text style={styles.founderRole}>Founder / Creator of EcoVibe</Text>
          </View>
        </View>
      </InfoModal>

      {/* Privacy Policy Modal */}
      <InfoModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} title="Privacy Policy" colors={colors}>
        <Text style={styles.modalBodyText}>
          EcoVibe collects only the information necessary to provide its features:
        </Text>
        <Text style={styles.bulletItem}>• Your name, age, and country (provided during registration)</Text>
        <Text style={styles.bulletItem}>• Your email address (for account authentication)</Text>
        <Text style={styles.bulletItem}>• Activity data you voluntarily log (walking, cycling, recycling, etc.)</Text>
        <Text style={styles.bulletItem}>• Approximate location data only when you actively use GPS tracking</Text>
        <Text style={styles.bulletItem}>• Screen-time data you manually log (device-reported where supported)</Text>
        <Text style={styles.bulletItem}>• Survey responses you voluntarily submit</Text>
        <Text style={styles.modalBodyText}>
          Location is used only for GPS distance tracking during active sessions and is not stored or shared. Your data is stored securely and is only visible to you. You can delete your account and all associated data at any time.
        </Text>
      </InfoModal>

      {/* Terms Modal */}
      <InfoModal visible={termsVisible} onClose={() => setTermsVisible(false)} title="EcoVibe — Terms & Conditions" colors={colors}>
        <Text style={styles.sectionSubTitle}>User Accounts</Text>
        <Text style={styles.modalBodyText}>
          You are responsible for maintaining the security of your account credentials. You must provide accurate information during registration and keep it up to date.
        </Text>
        <Text style={styles.sectionSubTitle}>Eco Points</Text>
        <Text style={styles.modalBodyText}>
          Eco Points are EcoVibe engagement points. They are not carbon credits, monetary value, or verified carbon offsets. Points are earned for eligible environmental actions such as recycling, walking, and cycling.
        </Text>
        <Text style={styles.sectionSubTitle}>Plastic Recycling</Text>
        <Text style={styles.modalBodyText}>
          Plastic recycling calculations use EPA WARM Version 16 methodology. PET mass is estimated from bottle count and weight. If bottle weight is not measured, an estimated average is used and clearly labeled. Environmental calculations are estimates based on the methodology and information available to EcoVibe. Actual environmental impact may vary.
        </Text>
        <Text style={styles.sectionSubTitle}>Activity Tracking</Text>
        <Text style={styles.modalBodyText}>
          Automatic activity detection uses available device signals such as GPS, movement, and supported activity data. Accuracy can vary depending on device capabilities, permissions, signal quality, and environmental conditions. Environmental calculations are estimates and not exact atmospheric measurements.
        </Text>
        <Text style={styles.sectionSubTitle}>GPS & Location</Text>
        <Text style={styles.modalBodyText}>
          Full automatic background activity detection requires supported mobile device capabilities and permissions. A normal browser cannot guarantee continuous background GPS or activity tracking after the browser is closed or the device is locked.
        </Text>
        <Text style={styles.sectionSubTitle}>Screen-Time Tracking</Text>
        <Text style={styles.modalBodyText}>
          Automatic screen-time tracking requires supported mobile device access. Where supported, actual device-reported data is used. On unsupported platforms, manual logging is available. EcoVibe does not generate random or fake screen-time values.
        </Text>
        <Text style={styles.sectionSubTitle}>Health/Activity Data</Text>
        <Text style={styles.modalBodyText}>
          EcoVibe may use supported health and activity data (steps, cadence, motion) where available and permitted. This data is used only for activity classification and is not shared with third parties.
        </Text>
        <Text style={styles.sectionSubTitle}>Privacy</Text>
        <Text style={styles.modalBodyText}>
          Users can only access their own personal data. Account information, location, activity, health, screen-time, recycling, and survey data are protected through secure authentication and database access rules.
        </Text>
        <Text style={styles.sectionSubTitle}>Notifications</Text>
        <Text style={styles.modalBodyText}>
          EcoVibe may send reminders for goals, activities, surveys, and inactivity. You can control notification preferences in your device settings.
        </Text>
        <Text style={styles.sectionSubTitle}>Third-Party Services</Text>
        <Text style={styles.modalBodyText}>
          EcoVibe uses Supabase for authentication and data storage. Environmental calculation factors are derived from publicly available sources including UK DEFRA, EPA WARM, and IEA data.
        </Text>
        <Text style={styles.sectionSubTitle}>User Responsibilities</Text>
        <Text style={styles.modalBodyText}>
          You are responsible for the accuracy of the activities you log. Do not attempt to access other users' data or misuse the platform.
        </Text>
        <Text style={styles.sectionSubTitle}>Data Accuracy</Text>
        <Text style={styles.modalBodyText}>
          Environmental calculations are estimates based on the methodology and information available to EcoVibe. Actual environmental impact may vary. EcoVibe distinguishes between measured data, device-reported data, estimated data, and Eco Points.
        </Text>
        <Text style={styles.sectionSubTitle}>App Availability</Text>
        <Text style={styles.modalBodyText}>
          EcoVibe is provided "as is" without warranties of any kind. We may modify or discontinue features at any time.
        </Text>
        <Text style={styles.sectionSubTitle}>Changes to EcoVibe</Text>
        <Text style={styles.modalBodyText}>
          We may update these Terms as the app evolves. Continued use after changes constitutes acceptance of the updated terms.
        </Text>
      </InfoModal>

      {/* Calculation Sources Modal */}
      <InfoModal visible={calcVisible} onClose={() => setCalcVisible(false)} title="Calculation Sources & Methodology" colors={colors}>
        <Text style={styles.modalBodyText}>
          Environmental calculations in EcoVibe use the following sources:
        </Text>
        <Text style={styles.bulletItem}>• Transport CO₂: UK DEFRA 2023 GHG conversion factors for company reporting</Text>
        <Text style={styles.bulletItem}>• Food CO₂: Poore & Nemecek (2018), Science 360, 987-992</Text>
        <Text style={styles.bulletItem}>• Energy CO₂: IEA 2022 average grid emission factors</Text>
        <Text style={styles.bulletItem}>• Plastic recycling: EPA WARM Version 16 — PET methodology</Text>
        <Text style={styles.bulletItem}>• Waste recycling: EPA WARM model emission factors</Text>
        <Text style={styles.sectionSubTitle}>PET Recycling (EPA WARM v16)</Text>
        <Text style={styles.bulletItem}>• CO2e avoided: 1.146 kg CO2e per kg PET</Text>
        <Text style={styles.bulletItem}>• Energy benefit: 18.68 MJ per kg PET</Text>
        <Text style={styles.bulletItem}>• Methodology version: EPA WARM v16 / EcoVibe v2.0</Text>
        <Text style={styles.modalBodyText}>
          All values are estimates. Actual impact may vary based on vehicle, route, fuel source, recycling process, and other factors.
        </Text>
        <Text style={styles.sectionSubTitle}>EcoVibe Methodology Badge</Text>
        <Text style={styles.modalBodyText}>
          EcoVibe uses source-based environmental methodology. This is not government certified, EPA certified, ISO certified, or carbon certified unless actual certification exists.
        </Text>
      </InfoModal>
    </ScrollView>
  );
}

function DetailRow({ icon: Icon, label, value, colors }: { icon: any; label: string; value?: string; colors: any }) {
  const styles = makeStyles(colors, false);
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}><Icon size={18} color={colors.neutral[600]} strokeWidth={2} /></View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function DetailDivider({ colors }: { colors: any }) {
  return <View style={{ height: 1, backgroundColor: colors.neutral[200], marginLeft: 48 }} />;
}

function AppearanceOption({ icon: Icon, label, active, onPress, colors }: { icon: any; label: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 }} onPress={onPress} activeOpacity={0.85}>
      <Icon size={18} color={active ? colors.primary[600] : colors.neutral[500]} strokeWidth={2} />
      <Text style={{ flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 15, color: active ? colors.primary[700] : colors.neutral[800] }}>{label}</Text>
      {active && <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary[600], justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.white, fontSize: 12, fontFamily: 'Inter-Bold' }}>✓</Text>
      </View>}
    </TouchableOpacity>
  );
}

function MenuButton({ icon: Icon, label, color, bgColor, onPress, colors }: { icon: any; label: string; color: string; bgColor: string; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 }} onPress={onPress} activeOpacity={0.85}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}><Icon size={18} color={color} strokeWidth={2} /></View>
      <Text style={{ flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.neutral[800] }}>{label}</Text>
      <ChevronRight size={20} color={colors.neutral[300]} strokeWidth={2} />
    </TouchableOpacity>
  );
}

function InfoModal({ visible, onClose, title, children, colors }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; colors: any }) {
  const styles = makeStyles(colors, false);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.neutral[200] }]}>
            <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.neutral[100] }]}>
              <Text style={{ fontSize: 16, color: colors.neutral[500] }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: any, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontFamily: 'Fraunces-Bold', fontSize: 28, color: c.neutral[900], marginTop: 8, marginBottom: 24 },
    cardShadow: {
      shadowColor: isDark ? '#000' : '#15803d',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.white, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: c.neutral[200], gap: 16 },
    avatar: { width: 56, height: 56, borderRadius: 18, backgroundColor: c.primary[600], justifyContent: 'center', alignItems: 'center' },
    profileInfo: { flex: 1 },
    profileName: { fontFamily: 'Fraunces-SemiBold', fontSize: 20, color: c.neutral[900] },
    profileEmail: { fontFamily: 'Inter-Regular', fontSize: 14, color: c.neutral[500], marginTop: 2 },
    ownerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.primary[700], borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6 },
    ownerBadgeText: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: c.white },
    detailsCard: { backgroundColor: c.white, borderRadius: 18, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: c.neutral[200] },
    detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
    detailIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' },
    detailLabel: { fontFamily: 'Inter-Regular', fontSize: 14, color: c.neutral[500], width: 60 },
    detailValue: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: c.neutral[900], flex: 1, textAlign: 'right' },
    sectionTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 18, color: c.neutral[700], marginBottom: 10, marginTop: 8 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.neutral[200], gap: 12 },
    menuCard: { backgroundColor: c.white, borderRadius: 18, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: c.neutral[200] },
    appearanceCard: { backgroundColor: c.white, borderRadius: 18, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: c.neutral[200] },
    menuLabel: { flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 15, color: c.neutral[800] },
    dangerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: c.white, borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: c.neutral[200], marginBottom: 10 },
    dangerText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: c.error[500] },
    version: { fontFamily: 'Inter-Regular', fontSize: 12, color: c.neutral[400], textAlign: 'center', marginTop: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 20 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    modalBody: { padding: 20, maxHeight: 500 },
    modalBodyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: c.neutral[600], lineHeight: 22, marginBottom: 12 },
    modalBodyTextSmall: { fontFamily: 'Inter-Regular', fontSize: 13, color: c.neutral[400], lineHeight: 18, marginBottom: 8 },
    bulletItem: { fontFamily: 'Inter-Regular', fontSize: 14, color: c.neutral[600], lineHeight: 22, marginBottom: 4 },
    sectionSubTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 16, color: c.neutral[800], marginTop: 16, marginBottom: 10 },
    founderCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.bg, borderRadius: 16, padding: 16, marginBottom: 8 },
    founderPhotoPlaceholder: { width: 64, height: 64, borderRadius: 20, backgroundColor: c.neutral[200], justifyContent: 'center', alignItems: 'center' },
    founderName: { fontFamily: 'Fraunces-SemiBold', fontSize: 18, color: c.neutral[900] },
    founderRole: { fontFamily: 'Inter-Regular', fontSize: 13, color: c.neutral[500], marginTop: 2 },
  });
}
