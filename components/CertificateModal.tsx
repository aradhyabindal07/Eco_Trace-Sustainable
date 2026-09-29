import { View, Text, StyleSheet, Modal, TouchableOpacity, Share, Platform } from 'react-native';
import { Award, X, Download, Leaf } from 'lucide-react-native';
import { Colors } from '@/lib/theme';

interface CertificateModalProps {
  visible: boolean;
  onClose: () => void;
  badgeName: string;
  tier: string;
  date: string;
  userName: string;
}

export default function CertificateModal({ visible, onClose, badgeName, tier, date, userName }: CertificateModalProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const tierColor = tier === 'gold' ? '#f59e0b' : tier === 'silver' ? '#94a3b8' : '#cd7f32';

  const handleDownload = async () => {
    const certText = `
ECOTRACE - CERTIFICATE OF ACHIEVEMENT

This certificate is proudly presented to

  ${userName}

for successfully earning the "${badgeName}" badge
in the ${tier.toUpperCase()} tier.

Awarded on: ${formattedDate}

EcoTrace - Track your green impact
    `.trim();

    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([certText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EcoTrace_${badgeName}_${tier}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        Share.share({ message: certText });
      }
    } else {
      Share.share({ message: certText });
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color={Colors.neutral[500]} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.certificate}>
            <View style={styles.certBorder}>
              <View style={styles.certHeader}>
                <View style={styles.certLogo}>
                  <Leaf size={24} color={Colors.primary[600]} strokeWidth={2} />
                </View>
                <Text style={styles.certAppName}>EcoTrace</Text>
              </View>

              <Text style={styles.certTitle}>Certificate of Achievement</Text>

              <Text style={styles.certPresentedTo}>This certificate is proudly presented to</Text>

              <Text style={styles.certUserName}>{userName}</Text>

              <View style={styles.certBadgeSection}>
                <View style={[styles.certBadgeIcon, { backgroundColor: tierColor }]}>
                  <Award size={32} color={Colors.white} strokeWidth={2} />
                </View>
                <Text style={styles.certBadgeName}>{badgeName}</Text>
                <View style={[styles.certTierPill, { backgroundColor: tierColor }]}>
                  <Text style={styles.certTierText}>{tier.toUpperCase()} TIER</Text>
                </View>
              </View>

              <Text style={styles.certDescription}>
                For outstanding commitment to environmental sustainability and successfully completing all requirements for this achievement.
              </Text>

              <View style={styles.certFooter}>
                <View style={styles.certFooterItem}>
                  <View style={styles.certLine} />
                  <Text style={styles.certFooterText}>{formattedDate}</Text>
                </View>
                <View style={styles.certFooterItem}>
                  <View style={styles.certLine} />
                  <Text style={styles.certFooterText}>EcoTrace</Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload} activeOpacity={0.85}>
            <Download size={20} color={Colors.white} strokeWidth={2} />
            <Text style={styles.downloadButtonText}>Download Certificate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: Colors.white, borderRadius: 24, padding: 20, width: '100%', maxWidth: 380 },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.neutral[100], justifyContent: 'center', alignItems: 'center' },
  certificate: { marginTop: 16 },
  certBorder: { borderWidth: 3, borderColor: Colors.primary[600], borderRadius: 16, padding: 24, backgroundColor: Colors.primary[50] },
  certHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  certLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary[100], justifyContent: 'center', alignItems: 'center' },
  certAppName: { fontFamily: 'Fraunces-Bold', fontSize: 22, color: Colors.primary[700] },
  certTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 18, color: Colors.neutral[800], textAlign: 'center', marginBottom: 16 },
  certPresentedTo: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[500], textAlign: 'center', marginBottom: 8 },
  certUserName: { fontFamily: 'Fraunces-Bold', fontSize: 26, color: Colors.neutral[900], textAlign: 'center', marginBottom: 20 },
  certBadgeSection: { alignItems: 'center', marginBottom: 20 },
  certBadgeIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  certBadgeName: { fontFamily: 'Inter-SemiBold', fontSize: 18, color: Colors.neutral[800], marginBottom: 6 },
  certTierPill: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  certTierText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: Colors.white },
  certDescription: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[600], textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  certFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  certFooterItem: { alignItems: 'center' },
  certLine: { width: 100, height: 1, backgroundColor: Colors.neutral[400], marginBottom: 4 },
  certFooterText: { fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.neutral[500] },
  downloadButton: { flexDirection: 'row', backgroundColor: Colors.primary[600], borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 },
  downloadButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.white },
});
