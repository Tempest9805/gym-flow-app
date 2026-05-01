/**
 * Email Confirmed Screen — Stitch "SYSTEM ACCESS" language:
 *   "ACCESS GRANTED" hero + Success icon + LOGIN CTA
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PURPLE_THEME } from '@/lib/store/themeStore';

const t = PURPLE_THEME.tokens;

export default function EmailConfirmedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]}>
      <View style={[styles.topBar, { backgroundColor: '#0A0A0A', borderBottomColor: '#2A2A2A' }]}>
        <Text style={[styles.topBarTitle, { color: t.primaryContainer }]}>SYSTEM ACCESS</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.successCircle, { borderColor: t.primaryContainer, shadowColor: t.primaryContainer }]}>
            <Text style={[styles.successIcon, { color: t.primaryContainer }]}>✓</Text>
          </View>
          <Text style={[styles.heroTitle, { color: t.onSurface }]}>ACCESS{'\n'}GRANTED</Text>
          <Text style={[styles.heroSubtitle, { color: t.onSurfaceVariant }]}>
            Identity verification complete. You are now authorized to access the system.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }]}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.primaryBtnText}>ENTER SYSTEM</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: { height: 64, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1 },
  topBarTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  content: { flex: 1, padding: 32, justifyContent: 'center', gap: 64 },
  hero: { gap: 24, alignItems: 'center' },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  successIcon: { fontSize: 48, fontWeight: '300' },
  heroTitle: { fontSize: 48, fontWeight: '800', lineHeight: 52, letterSpacing: -1, textAlign: 'center' },
  heroSubtitle: { fontSize: 18, textAlign: 'center', lineHeight: 28 },
  primaryBtn: { height: 64, borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.4, shadowRadius: 12 },
  primaryBtnText: { fontSize: 18, fontWeight: '800', letterSpacing: 2, color: '#000' },
});