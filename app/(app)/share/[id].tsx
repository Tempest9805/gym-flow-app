/**
 * Share Routine Screen — Stitch `share_import_canonical_purple` layout:
 *   1. TopAppBar
 *   2. "DISTRIBUTION HUB" hero text + subtitle
 *   3. QR code card (white bg, centered, with neon border)
 *   4. Share code display (monospace, large, letter-spaced)
 *   5. COPY CODE button (secondary)
 *   6. Close / Done CTA
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useCreateShare } from '@/lib/hooks';

export default function ShareRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { mutate: createShare, data: share, isPending } = useCreateShare();

  useEffect(() => {
    if (id && typeof id === 'string') {
      createShare({ routineId: id, type: 'qr' });
    }
  }, [id]);

  const handleCopyCode = () => {
    if (share?.share_code) {
      Clipboard.setString(share.share_code);
      Alert.alert('Copied!', 'Share code copied to clipboard.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <ScrollView
        style={[styles.scroll, { backgroundColor: t.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ── */}
        <View style={styles.hero}>
          <View
            style={[
              styles.heroBadge,
              {
                backgroundColor: `${t.primaryContainer}22`,
                borderColor: `${t.primaryContainer}44`,
              },
            ]}
          >
            <Text style={[styles.heroBadgeText, { color: t.primaryContainer }]}>
              ⬆  SHARE HUB
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: t.onSurface }]}>
            DISTRIBUTION{'\n'}HUB
          </Text>
          <Text style={[styles.heroSubtitle, { color: t.onSurfaceVariant }]}>
            Share your routine via QR or code
          </Text>
        </View>

        {/* ── QR Card ── */}
        <View
          style={[
            styles.qrCard,
            {
              backgroundColor: t.surfaceContainer,
              borderColor: isPending ? t.surfaceContainerHighest : t.primaryContainer,
              shadowColor: isPending ? 'transparent' : t.primaryContainer,
            },
          ]}
        >
          {isPending || !share ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color={t.primaryContainer} />
              <Text style={[styles.qrLoadingText, { color: t.onSurfaceVariant }]}>
                Generating...
              </Text>
            </View>
          ) : (
            <View style={styles.qrContent}>
              {/* QR Code on white bg */}
              <View style={styles.qrCodeWrapper}>
                <QRCode value={share.share_code} size={200} />
              </View>
              {/* Scan label */}
              <Text style={[styles.scanLabel, { color: t.onSurfaceVariant }]}>
                Scan to import routine
              </Text>
            </View>
          )}
        </View>

        {/* ── Share Code ── */}
        {share && (
          <View style={styles.codeSection}>
            <Text style={[styles.codeSectionLabel, { color: t.onSurfaceVariant }]}>
              OR SHARE THIS CODE
            </Text>
            <View
              style={[
                styles.codeDisplay,
                {
                  backgroundColor: t.surfaceContainer,
                  borderColor: t.surfaceContainerHighest,
                },
              ]}
            >
              <Text style={[styles.codeText, { color: t.onSurface, letterSpacing: 12 }]}>
                {share.share_code}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.copyButton,
                {
                  borderColor: t.surfaceContainerHighest,
                },
              ]}
              activeOpacity={0.7}
              onPress={handleCopyCode}
            >
              <Text style={[styles.copyButtonText, { color: t.onSurfaceVariant }]}>
                ⧉  COPY CODE
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Done CTA ── */}
        <TouchableOpacity
          style={[
            styles.doneButton,
            {
              backgroundColor: t.primaryContainer,
              shadowColor: t.primaryContainer,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <Text style={[styles.doneButtonText, { color: t.onPrimaryContainer }]}>
            DONE
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 40,
  },
  // Hero
  hero: { gap: 12 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontSize: 18,
    lineHeight: 28,
  },
  // QR Card
  qrCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 8,
  },
  qrPlaceholder: {
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  qrLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  qrContent: {
    alignItems: 'center',
    gap: 24,
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  scanLabel: {
    fontSize: 14,
    lineHeight: 20,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  // Share code
  codeSection: {
    alignItems: 'center',
    gap: 16,
  },
  codeSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  codeDisplay: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: 'center',
    width: '100%',
  },
  codeText: {
    fontSize: 40,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  copyButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Done CTA
  doneButton: {
    width: '100%',
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
