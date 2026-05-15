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
        {/* ── Hero Header ── */}
        <View className="gap-3 mb-10">
          <View
            className="flex-row items-center gap-2 border rounded-full px-3 py-1 self-start"
            style={{
              backgroundColor: `${t.primaryContainer}22`,
              borderColor: `${t.primaryContainer}44`,
            }}
          >
            <Text className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: t.primaryContainer }}>
              ⬆  SHARE HUB
            </Text>
          </View>
          <Text className="text-[48px] font-extrabold leading-[52px] tracking-tighter uppercase" style={{ color: t.onSurface }}>
            DISTRIBUTION{'\n'}HUB
          </Text>
          <Text className="text-lg leading-7" style={{ color: t.onSurfaceVariant }}>
            Share your routine via QR or code
          </Text>
        </View>

        {/* ── QR Card ── */}
        <View
          className="rounded-2xl border-[1.5px] p-10 items-center justify-center min-h-[320px] shadow-2xl elevation-md mb-10"
          style={{
            backgroundColor: t.surfaceContainer,
            borderColor: isPending ? t.surfaceContainerHighest : t.primaryContainer,
            shadowColor: isPending ? 'transparent' : t.primaryContainer,
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 24,
          }}
        >
          {isPending || !share ? (
            <View className="items-center gap-4 p-6">
              <ActivityIndicator size="large" color={t.primaryContainer} />
              <Text className="text-base font-semibold tracking-widest uppercase" style={{ color: t.onSurfaceVariant }}>
                Generating...
              </Text>
            </View>
          ) : (
            <View className="items-center gap-6">
              {/* QR Code on white bg */}
              <View className="bg-white rounded-lg p-4">
                <QRCode value={share.share_code} size={200} />
              </View>
              {/* Scan label */}
              <Text className="text-sm leading-5 uppercase tracking-[1.5px] font-semibold" style={{ color: t.onSurfaceVariant }}>
                Scan to import routine
              </Text>
            </View>
          )}
        </View>

        {/* ── Share Code ── */}
        {share && (
          <View className="items-center gap-4 mb-10">
            <Text className="text-[12px] font-bold tracking-[3px] uppercase" style={{ color: t.onSurfaceVariant }}>
              OR SHARE THIS CODE
            </Text>
            <View
              className="rounded-xl border px-8 py-6 items-center w-full"
              style={{
                backgroundColor: t.surfaceContainer,
                borderColor: t.surfaceContainerHighest,
              }}
            >
              <Text className="text-[40px] font-extrabold uppercase tracking-[12px]" style={{ color: t.onSurface }}>
                {share.share_code}
              </Text>
            </View>
            <TouchableOpacity
              className="border rounded-lg px-6 py-3 min-h-[48px] items-center justify-center"
              style={{ borderColor: t.surfaceContainerHighest }}
              activeOpacity={0.7}
              onPress={handleCopyCode}
            >
              <Text className="text-sm font-bold tracking-[2px] uppercase" style={{ color: t.onSurfaceVariant }}>
                ⧉  COPY CODE
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Done CTA ── */}
        <TouchableOpacity
          className="w-full h-16 rounded-lg items-center justify-center shadow-2xl elevation-md"
          style={{
            backgroundColor: t.primaryContainer,
            shadowColor: t.primaryContainer,
            shadowOpacity: 0.35,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 16,
          }}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <Text className="text-lg font-bold tracking-[3px] uppercase" style={{ color: t.onPrimaryContainer }}>
            DONE
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
