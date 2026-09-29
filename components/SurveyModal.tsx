import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Animated } from 'react-native';
import { X, ChevronLeft, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Colors, SHADOW } from '@/lib/theme';

interface SurveyProps {
  visible: boolean;
  onClose: () => void;
}

interface Question {
  id: string;
  prompt: string;
  type: 'choice' | 'multi' | 'text';
  options?: string[];
  optional?: boolean;
}

const QUESTIONS: Question[] = [
  { id: 'overall_rating', prompt: 'How would you rate your overall EcoVibe experience?', type: 'choice', options: ['Very poor', 'Poor', 'Okay', 'Good', 'Excellent'] },
  { id: 'ease_of_use', prompt: 'How easy is EcoVibe to use?', type: 'choice', options: ['Very difficult', 'Difficult', 'Neutral', 'Easy', 'Very easy'] },
  { id: 'most_used_features', prompt: 'Which EcoVibe features do you use most?', type: 'multi', options: ['Plastic Recycling', 'Walking Tracking', 'Cycling Tracking', 'Vehicle Tracking', 'Screen-Time Tracking', 'Eco Points', 'Environmental Impact', 'Dashboard', 'Other'] },
  { id: 'environmental_information_rating', prompt: 'How useful do you find the environmental impact information?', type: 'choice', options: ['Not useful', 'Slightly useful', 'Moderately useful', 'Very useful', 'Extremely useful'] },
  { id: 'automatic_tracking_rating', prompt: 'How satisfied are you with automatic activity tracking?', type: 'choice', options: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied', 'I have not used it yet'] },
  { id: 'dashboard_rating', prompt: 'How satisfied are you with the EcoVibe dashboard?', type: 'choice', options: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
  { id: 'design_rating', prompt: 'How do you feel about the EcoVibe design?', type: 'choice', options: ['Needs major improvement', 'Needs some improvement', 'Good', 'Very good', 'Excellent'] },
  { id: 'improvement_areas', prompt: 'What would you most like EcoVibe to improve?', type: 'multi', options: ['Automatic activity detection', 'GPS tracking', 'Screen-time tracking', 'Dashboard', 'Environmental calculations', 'Plastic recycling features', 'Eco Points', 'App speed', 'App design', 'Notifications', 'Other'] },
  { id: 'new_feature_request', prompt: 'What new feature would you like to see in EcoVibe?', type: 'text' },
  { id: 'recommendation_rating', prompt: 'Would you recommend EcoVibe to someone interested in living more sustainably?', type: 'choice', options: ['Definitely not', 'Probably not', 'Not sure', 'Probably yes', 'Definitely yes'] },
  { id: 'liked_feature', prompt: 'What is one thing you like about EcoVibe?', type: 'text', optional: true },
  { id: 'final_feedback', prompt: 'Any final suggestions or feedback?', type: 'text', optional: true },
];

export default function SurveyModal({ visible, onClose }: SurveyProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const totalSteps = QUESTIONS.length;
  const isIntro = step === -1;
  const isFinished = done;

  const reset = useCallback(() => {
    setStep(0);
    setAnswers({});
    setDone(false);
    setSubmitting(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const animateNext = (nextStep: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleAnswer = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    const currentIdx = QUESTIONS.findIndex((q) => q.id === qId);
    if (currentIdx < totalSteps - 1) {
      setTimeout(() => animateNext(currentIdx + 1), 250);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    if (user) {
      await supabase.from('user_survey_responses').insert({
        user_id: user.id,
        overall_rating: answers.overall_rating || null,
        ease_of_use: answers.ease_of_use || null,
        most_used_features: answers.most_used_features || null,
        environmental_information_rating: answers.environmental_information_rating || null,
        automatic_tracking_rating: answers.automatic_tracking_rating || null,
        dashboard_rating: answers.dashboard_rating || null,
        design_rating: answers.design_rating || null,
        improvement_areas: answers.improvement_areas || null,
        new_feature_request: answers.new_feature_request || null,
        recommendation_rating: answers.recommendation_rating || null,
        liked_feature: answers.liked_feature || null,
        final_feedback: answers.final_feedback || null,
      });
      try { localStorage.setItem('ecovibe-survey-date', new Date().toISOString()); } catch {}
    }
    setSubmitting(false);
    setDone(true);
  };

  const progress = ((step + 1) / totalSteps) * 100;

  if (isFinished) {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <View style={[styles.card, SHADOW.lg]}>
            <View style={styles.doneIcon}>
              <Check size={40} color={Colors.primary[600]} strokeWidth={2.5} />
            </View>
            <Text style={styles.doneTitle}>Thank you for helping EcoVibe grow</Text>
            <Text style={styles.doneText}>Your feedback has been submitted successfully.</Text>
            <Text style={styles.doneSubtext}>Your responses help us improve the app for everyone.</Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleClose} activeOpacity={0.85}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const q = QUESTIONS[step];
  if (!q) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={Colors.neutral[500]} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your feedback matters</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>Question {step + 1} of {totalSteps}</Text>
          </View>

          <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
            <Text style={styles.questionText}>{q.prompt}</Text>

            {q.type === 'choice' && q.options && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.optionsList}>
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optionBtn, selected && styles.optionBtnActive]}
                      onPress={() => handleAnswer(q.id, opt)}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{opt}</Text>
                      {selected && <Check size={18} color={Colors.white} strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {q.type === 'multi' && q.options && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.optionsList}>
                {q.options.map((opt) => {
                  const selected = (answers[q.id] || []).includes(opt);
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optionBtn, selected && styles.optionBtnActive]}
                      onPress={() => {
                        const cur = answers[q.id] || [];
                        const next = selected ? cur.filter((v: string) => v !== opt) : [...cur, opt];
                        setAnswers((prev) => ({ ...prev, [q.id]: next }));
                      }}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{opt}</Text>
                      {selected && <Check size={18} color={Colors.white} strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity style={styles.nextMultiBtn} onPress={() => {
                  if (step < totalSteps - 1) animateNext(step + 1);
                }}>
                  <Text style={styles.nextMultiText}>Continue</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {q.type === 'text' && (
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Tell us what you would love to see..."
                  placeholderTextColor={Colors.neutral[400]}
                  value={answers[q.id] || ''}
                  onChangeText={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.submitBtn, !q.optional && !answers[q.id] && styles.submitBtnDisabled]}
                  onPress={() => {
                    if (step < totalSteps - 1) animateNext(step + 1);
                    else handleSubmit();
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.submitBtnText}>
                    {step < totalSteps - 1 ? 'Next' : submitting ? 'Submitting...' : 'Submit Survey'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => animateNext(step - 1)}>
              <ChevronLeft size={16} color={Colors.neutral[500]} strokeWidth={2} />
              <Text style={styles.backText}>Previous</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: Colors.white, borderRadius: 28, padding: 32, alignItems: 'center', width: '100%', maxWidth: 380 },
  doneIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary[50], justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  doneTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 22, color: Colors.neutral[900], textAlign: 'center', marginBottom: 8 },
  doneText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[600], textAlign: 'center', lineHeight: 20 },
  doneSubtext: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[400], textAlign: 'center', lineHeight: 18, marginTop: 4, marginBottom: 24 },
  doneButton: { backgroundColor: Colors.primary[600], borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, ...SHADOW.md },
  doneButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
  sheet: { backgroundColor: Colors.white, borderRadius: 28, width: '100%', maxWidth: 420, maxHeight: '90%', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 8 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.neutral[100], justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Fraunces-SemiBold', fontSize: 16, color: Colors.neutral[800] },
  progressWrap: { paddingHorizontal: 20, marginBottom: 12 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.neutral[200], marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary[500] },
  progressText: { fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.neutral[400], textAlign: 'right' },
  body: { padding: 20, flex: 1 },
  questionText: { fontFamily: 'Fraunces-SemiBold', fontSize: 20, color: Colors.neutral[900], lineHeight: 28, marginBottom: 20 },
  optionsList: { flex: 1 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 18, borderRadius: 14, backgroundColor: Colors.bg, marginBottom: 8, borderWidth: 1.5, borderColor: Colors.neutral[200] },
  optionBtnActive: { backgroundColor: Colors.primary[600], borderColor: Colors.primary[600] },
  optionText: { fontFamily: 'Inter-Medium', fontSize: 15, color: Colors.neutral[700] },
  optionTextActive: { color: Colors.white },
  nextMultiBtn: { alignSelf: 'flex-end', marginTop: 12, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: Colors.primary[50], borderRadius: 12 },
  nextMultiText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.primary[700] },
  textInput: { fontFamily: 'Inter-Regular', fontSize: 15, borderWidth: 1.5, borderColor: Colors.neutral[200], borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.bg, color: Colors.neutral[900], minHeight: 120, marginBottom: 16 },
  submitBtn: { backgroundColor: Colors.primary[600], borderRadius: 14, paddingVertical: 16, alignItems: 'center', ...SHADOW.md },
  submitBtnDisabled: { backgroundColor: Colors.neutral[300] },
  submitBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, paddingBottom: 20 },
  backText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral[500] },
});
