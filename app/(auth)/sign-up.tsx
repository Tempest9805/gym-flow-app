/**
 * Sign Up Screen — Stitch `login_canonical_purple` visual language extended to sign-up:
 *   "NEW RECRUIT" hero text + 3 tall icon-prefixed inputs + CREATE ACCOUNT CTA
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PURPLE_THEME } from '@/lib/store/themeStore';
import { authApi } from '@/lib/api';

// Auth screens always use the purple theme (user hasn't set preference yet)
const t = PURPLE_THEME.tokens;

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const { data, error } = await authApi.signUp({ email, password });
      if (error) {
        if (error.message?.includes('rate limit') || error.message?.includes('Too many requests')) {
          Alert.alert('Please Wait', 'A confirmation email was already sent. Check your inbox.');
        } else {
          Alert.alert('Sign Up Failed', error.message);
        }
        return;
      }
      if (data.user && !data.session) {
        Alert.alert(
          'Check Your Email',
          'We sent a confirmation link to activate your account.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      } else if (data.session) {
        router.replace('/(app)');
      }
    } catch (e: any) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: t.surface, borderBottomColor: t.surfaceVariant }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: t.primaryContainer }]}>←</Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.topBarTitle,
            {
              color: t.primaryContainer,
              textShadowColor: t.glowPrimary,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
            },
          ]}
        >
          ELITE PERFORMANCE
        </Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.canvas}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero Text ── */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: t.onSurface }]}>
              NEW{'\n'}RECRUIT
            </Text>
            <Text style={[styles.heroSubtitle, { color: t.onSurfaceVariant }]}>
              Create your athlete profile.
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.onSurfaceVariant }]}>
                Email Designation
              </Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant },
                ]}
              >
                <Text style={[styles.inputIcon, { color: t.outlineVariant }]}>@</Text>
                <TextInput
                  style={[styles.input, { color: t.onSurface }]}
                  placeholder="ATHLETE@GYMFLOW.COM"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.onSurfaceVariant }]}>
                Security Code
              </Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant },
                ]}
              >
                <Text style={[styles.inputIcon, { color: t.outlineVariant }]}>◉</Text>
                <TextInput
                  style={[styles.input, { color: t.onSurface }]}
                  placeholder="MIN. 6 CHARACTERS"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.onSurfaceVariant }]}>
                Confirm Code
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: t.surfaceContainer,
                    borderColor:
                      confirmPassword && confirmPassword !== password
                        ? t.error
                        : t.surfaceVariant,
                  },
                ]}
              >
                <Text style={[styles.inputIcon, { color: t.outlineVariant }]}>✓</Text>
                <TextInput
                  style={[styles.input, { color: t.onSurface }]}
                  placeholder="REPEAT SECURITY CODE"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Primary CTA */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: t.primaryContainer,
                  shadowColor: t.primaryContainer,
                },
              ]}
              activeOpacity={0.85}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[styles.primaryButtonText, { color: '#0A0A0A' }]}>
                  CREATE ACCOUNT
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to login */}
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: t.surfaceVariant }]}
              activeOpacity={0.7}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={[styles.secondaryButtonText, { color: t.onSurface }]}>
                Already a member? Log In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backBtn: { width: 48, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 24, fontWeight: '300' },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  kav: { flex: 1 },
  canvas: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 48,
    gap: 32,
  },
  // Hero
  heroSection: { gap: 8, alignItems: 'center' },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  // Form
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  inputRow: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputIcon: { fontSize: 18 },
  input: { flex: 1, fontSize: 18, lineHeight: 22 },
  primaryButton: {
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '400',
  },
});