/**
 * Import Routine Screen — Stitch `share_import_canonical_purple` import section:
 *   1. TopAppBar
 *   2. "RECEIVE PROTOCOL" hero text + subtitle
 *   3. Manual code input card (6-char, monospace, uppercase)
 *   4. OR divider
 *   5. Scan QR code card (camera view with overlay frame)
 *   6. IMPORT button primary CTA
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useImportRoutine } from '@/lib/hooks';

export default function ImportRoutineScreen() {
  const router = useRouter();
  const t = useTheme();
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { mutateAsync: importRoutine, isPending } = useImportRoutine();

  const handleImport = async (shareCode: string) => {
    if (!shareCode || shareCode.length < 6) return;
    try {
      await importRoutine(shareCode);
      Alert.alert('Success!', 'Routine imported successfully.', [
        { text: 'View Routines', onPress: () => router.push('/routines') },
      ]);
    } catch (e: any) {
      Alert.alert('Import Failed', e.message || 'Could not import routine. Check the code and try again.');
    }
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Required', 'Enable camera access in settings to scan QR codes.');
        return;
      }
    }
    setScanning(true);
  };

  // ── Camera scan view ──
  if (scanning) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={({ data }) => {
            setScanning(false);
            setCode(data.toUpperCase().slice(0, 6));
            handleImport(data);
          }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        {/* Scan overlay */}
        <View style={styles.scanOverlay}>
          <View style={[styles.scanFrame, { borderColor: t.primaryContainer }]} />
          <Text style={[styles.scanText, { color: '#fff' }]}>
            Point camera at QR code
          </Text>
        </View>
        <View style={styles.scanCancelArea}>
          <TouchableOpacity
            style={[styles.scanCancelBtn, { backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setScanning(false)}
          >
            <Text style={[styles.scanCancelText, { color: '#fff' }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <ScrollView
        style={[styles.scroll, { backgroundColor: t.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
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
              ⬇  RECEIVE HUB
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: t.onSurface }]}>
            RECEIVE{'\n'}PROTOCOL
          </Text>
          <Text style={[styles.heroSubtitle, { color: t.onSurfaceVariant }]}>
            Import a shared routine via code or QR
          </Text>
        </View>

        {/* ── Code Input Card ── */}
        <View
          style={[
            styles.codeCard,
            {
              backgroundColor: t.surfaceContainer,
              borderColor: t.surfaceContainerHighest,
            },
          ]}
        >
          <Text style={[styles.codeCardTitle, { color: t.onSurface }]}>
            ENTER SHARE CODE
          </Text>
          <Text style={[styles.codeCardSubtitle, { color: t.onSurfaceVariant }]}>
            6-character code from the sender
          </Text>
          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: t.surfaceContainerHigh,
                borderColor: code.length === 6 ? t.primaryContainer : t.surfaceContainerHighest,
                color: t.onSurface,
                // Glow when complete
                shadowColor: code.length === 6 ? t.primaryContainer : 'transparent',
              },
            ]}
            placeholder="• • • • • •"
            placeholderTextColor={t.outlineVariant}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase().slice(0, 6))}
            maxLength={6}
            autoCapitalize="characters"
            textAlign="center"
          />
          {/* Import CTA */}
          <TouchableOpacity
            style={[
              styles.importButton,
              {
                backgroundColor: code.length === 6 ? t.primaryContainer : t.surfaceContainerHighest,
                shadowColor: code.length === 6 ? t.primaryContainer : 'transparent',
              },
            ]}
            activeOpacity={0.85}
            onPress={() => handleImport(code)}
            disabled={code.length < 6 || isPending}
          >
            {isPending ? (
              <ActivityIndicator color={t.onPrimaryContainer} />
            ) : (
              <Text
                style={[
                  styles.importButtonText,
                  { color: code.length === 6 ? t.onPrimaryContainer : t.outlineVariant },
                ]}
              >
                IMPORT ROUTINE
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── OR Divider ── */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.surfaceContainerHighest }]} />
          <Text style={[styles.dividerLabel, { color: t.outlineVariant }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: t.surfaceContainerHighest }]} />
        </View>

        {/* ── Scan QR Card ── */}
        <View
          style={[
            styles.qrCard,
            {
              backgroundColor: t.surfaceContainer,
              borderColor: t.surfaceContainerHighest,
            },
          ]}
        >
          <Text style={[styles.qrCardTitle, { color: t.onSurface }]}>SCAN QR CODE</Text>
          <Text style={[styles.qrCardSubtitle, { color: t.onSurfaceVariant }]}>
            Point your camera at the sender's QR code to import instantly
          </Text>
          <TouchableOpacity
            style={[
              styles.scanButton,
              {
                borderColor: t.surfaceContainerHighest,
              },
            ]}
            activeOpacity={0.7}
            onPress={startScanning}
          >
            <Text style={[styles.scanButtonIcon, { color: t.onSurfaceVariant }]}>📷</Text>
            <Text style={[styles.scanButtonText, { color: t.onSurfaceVariant }]}>
              OPEN CAMERA
            </Text>
          </TouchableOpacity>
        </View>
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
    gap: 32,
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
  // Code card
  codeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    gap: 24,
    alignItems: 'center',
  },
  codeCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  codeCardSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  codeInput: {
    width: '100%',
    height: 88,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 12,
    textTransform: 'uppercase',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 4,
  },
  importButton: {
    width: '100%',
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 6,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  // QR card
  qrCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    gap: 16,
    alignItems: 'center',
  },
  qrCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  qrCardSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    gap: 12,
    height: 64,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonIcon: { fontSize: 22 },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Camera scan overlay
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  scanFrame: {
    width: 256,
    height: 256,
    borderWidth: 3,
    borderRadius: 16,
  },
  scanText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scanCancelArea: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
  },
  scanCancelBtn: {
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCancelText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
