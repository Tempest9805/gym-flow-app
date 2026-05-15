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
      <View className="flex-1">
        <CameraView
          className="flex-1"
          onBarcodeScanned={({ data }) => {
            setScanning(false);
            setCode(data.toUpperCase().slice(0, 6));
            handleImport(data);
          }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        {/* Scan overlay */}
        <View className="absolute inset-0 items-center justify-center gap-6">
          <View className="w-64 h-64 border-[3px] rounded-2xl" style={{ borderColor: t.primaryContainer }} />
          <Text className="text-base font-semibold tracking-widest text-white shadow-2xl">
            Point camera at QR code
          </Text>
        </View>
        <View className="absolute bottom-[60px] left-6 right-6">
          <TouchableOpacity
            className="h-14 rounded-lg border items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.2)' }}
            onPress={() => setScanning(false)}
          >
            <Text className="text-sm font-bold tracking-[3px] text-white">CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: t.background }}
        contentContainerStyle={{
          paddingTop: 24,
          paddingHorizontal: 24,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View className="gap-3 mb-8">
          <View
            className="flex-row items-center gap-2 border rounded-full px-3 py-1 self-start"
            style={{
              backgroundColor: `${t.primaryContainer}22`,
              borderColor: `${t.primaryContainer}44`,
            }}
          >
            <Text className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: t.primaryContainer }}>
              ⬇  RECEIVE HUB
            </Text>
          </View>
          <Text className="text-[48px] font-extrabold leading-[52px] tracking-tighter uppercase" style={{ color: t.onSurface }}>
            RECEIVE{'\n'}PROTOCOL
          </Text>
          <Text className="text-lg leading-7" style={{ color: t.onSurfaceVariant }}>
            Import a shared routine via code or QR
          </Text>
        </View>

        {/* ── Code Input Card ── */}
        <View
          className="rounded-2xl border p-8 gap-6 items-center"
          style={{
            backgroundColor: t.surfaceContainer,
            borderColor: t.surfaceContainerHighest,
          }}
        >
          <Text className="text-[22px] font-bold uppercase tracking-widest text-center" style={{ color: t.onSurface }}>
            ENTER SHARE CODE
          </Text>
          <Text className="text-base leading-[22px] text-center" style={{ color: t.onSurfaceVariant }}>
            6-character code from the sender
          </Text>
          <TextInput
            className="w-full h-[88px] rounded-xl border-[1.5px] text-[40px] font-extrabold tracking-[12px] uppercase shadow-2xl elevation-sm"
            style={{
              backgroundColor: t.surfaceContainerHigh,
              borderColor: code.length === 6 ? t.primaryContainer : t.surfaceContainerHighest,
              color: t.onSurface,
              shadowColor: code.length === 6 ? t.primaryContainer : 'transparent',
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 12,
            }}
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
            className="w-full h-16 rounded-lg items-center justify-center shadow-2xl elevation-md"
            style={{
              backgroundColor: code.length === 6 ? t.primaryContainer : t.surfaceContainerHighest,
              shadowColor: code.length === 6 ? t.primaryContainer : 'transparent',
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 16,
            }}
            activeOpacity={0.85}
            onPress={() => handleImport(code)}
            disabled={code.length < 6 || isPending}
          >
            {isPending ? (
              <ActivityIndicator color={t.onPrimaryContainer} />
            ) : (
              <Text
                className="text-base font-bold tracking-[3px] uppercase"
                style={{ color: code.length === 6 ? t.onPrimaryContainer : t.outlineVariant }}
              >
                IMPORT ROUTINE
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── OR Divider ── */}
        <View className="flex-row items-center gap-4">
          <View className="flex-1 h-[1px]" style={{ backgroundColor: t.surfaceContainerHighest }} />
          <Text className="text-sm font-bold tracking-[3px] uppercase" style={{ color: t.outlineVariant }}>OR</Text>
          <View className="flex-1 h-[1px]" style={{ backgroundColor: t.surfaceContainerHighest }} />
        </View>

        {/* ── Scan QR Card ── */}
        <View
          className="rounded-2xl border p-8 gap-4 items-center"
          style={{
            backgroundColor: t.surfaceContainer,
            borderColor: t.surfaceContainerHighest,
          }}
        >
          <Text className="text-[22px] font-bold uppercase tracking-widest text-center" style={{ color: t.onSurface }}>SCAN QR CODE</Text>
          <Text className="text-base leading-[22px] text-center" style={{ color: t.onSurfaceVariant }}>
            Point your camera at the sender's QR code to import instantly
          </Text>
          <TouchableOpacity
            className="flex-row gap-3 h-16 w-full rounded-lg border border-dashed items-center justify-center"
            style={{ borderColor: t.surfaceContainerHighest }}
            activeOpacity={0.7}
            onPress={startScanning}
          >
            <Text className="text-[22px]" style={{ color: t.onSurfaceVariant }}>◎</Text>
            <Text className="text-base font-semibold tracking-widest uppercase" style={{ color: t.onSurfaceVariant }}>
              OPEN CAMERA
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
