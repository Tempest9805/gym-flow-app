/**
 * Reset Password Screen — Stitch "SYSTEM ACCESS" language:
 *   "UPDATE CODE" hero + tall icon-prefixed password inputs + UPDATE CTA
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
import { PURPLE_THEME } from '@/lib/store/themeStore';
import { authApi } from '@/lib/api';

const t = PURPLE_THEME.tokens;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error } = await authApi.updatePassword(password);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Security code updated successfully.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]}>
      <View style={[styles.topBar, { backgroundColor: '#0A0A0A', borderBottomColor: '#2A2A2A' }]}>
        <Text style={[styles.topBarTitle, { color: t.primaryContainer }]}>SYSTEM ACCESS</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={[styles.heroTitle, { color: t.onSurface }]}>UPDATE{'\n'}CODE</Text>
            <Text style={[styles.heroSubtitle, { color: t.onSurfaceVariant }]}>Establish a new athlete security protocol.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.onSurfaceVariant }]}>NEW SECURITY CODE</Text>
              <View style={[styles.inputRow, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant }]}>
                <Text style={[styles.inputIcon, { color: t.outlineVariant }]}>🔒</Text>
                <TextInput
                  style={[styles.input, { color: t.onSurface }]}
                  placeholder="MIN. 6 CHARACTERS"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.onSurfaceVariant }]}>CONFIRM CODE</Text>
              <View style={[styles.inputRow, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant }]}>
                <Text style={[styles.inputIcon, { color: t.outlineVariant }]}>✓</Text>
                <TextInput
                  style={[styles.input, { color: t.onSurface }]}
                  placeholder="REPEAT NEW CODE"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>UPDATE PROTOCOL</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: { height: 64, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1 },
  topBarTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  kav: { flex: 1 },
  content: { flex: 1, padding: 32, justifyContent: 'center', gap: 48 },
  hero: { gap: 12, alignItems: 'center' },
  heroTitle: { fontSize: 48, fontWeight: '800', lineHeight: 52, letterSpacing: -1, textAlign: 'center' },
  heroSubtitle: { fontSize: 18, textAlign: 'center', lineHeight: 28 },
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  inputRow: { height: 64, flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, gap: 12 },
  inputIcon: { fontSize: 18 },
  input: { flex: 1, fontSize: 18 },
  primaryBtn: { height: 64, borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.4, shadowRadius: 12 },
  primaryBtnText: { fontSize: 18, fontWeight: '800', letterSpacing: 2, color: '#000' },
});