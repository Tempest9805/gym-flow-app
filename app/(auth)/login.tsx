/**
 * Login Screen — Stitch `login_canonical_purple` layout:
 *   1. TopAppBar (static, no tabs)
 *   2. Logo + subtitle
 *   3. Email input (h-64, icon prefix)
 *   4. Password input (h-64, icon prefix, forgot password link)
 *   5. LOG IN primary CTA (h-64, neon glow)
 *   6. Sign Up secondary link (full-width outlined button)
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/lib/store/themeStore';
import { PURPLE_THEME } from '@/lib/store/themeStore';
import { authApi } from '@/lib/api';

// Auth screens always use purple theme regardless of user setting
// (user hasn't logged in yet, no preference stored)
const t = PURPLE_THEME.tokens;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const { error } = await authApi.signIn({ email, password });
      if (error) Alert.alert('Login Failed', error.message);
    } catch (e) {
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
        <View style={styles.topBarSpacer} />
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
        <View style={styles.topBarSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.canvas}>
          {/* ── Hero Text ── */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: t.onSurface }]}>
              SYSTEM{'\n'}ACCESS
            </Text>
            <Text style={[styles.heroSubtitle, { color: t.onSurfaceVariant }]}>
              Identify yourself to continue.
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
                  {
                    backgroundColor: t.surfaceContainer,
                    borderColor: t.surfaceVariant,
                  },
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
              <View style={styles.inputLabelRow}>
                <Text style={[styles.inputLabel, { color: t.onSurfaceVariant }]}>
                  Security Code
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.forgotLink, { color: t.primaryContainer }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: t.surfaceContainer,
                    borderColor: t.surfaceVariant,
                  },
                ]}
              >
                <Text style={[styles.inputIcon, { color: t.outlineVariant }]}>◉</Text>
                <TextInput
                  style={[styles.input, { color: t.onSurface }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
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
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[styles.primaryButtonText, { color: '#0A0A0A' }]}>LOG IN</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up link */}
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  borderColor: t.surfaceVariant,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Text style={[styles.secondaryButtonText, { color: t.onSurface }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  topBarSpacer: { width: 48 },
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
    flex: 1,
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
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  input: {
    flex: 1,
    fontSize: 18,
    lineHeight: 22,
  },
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