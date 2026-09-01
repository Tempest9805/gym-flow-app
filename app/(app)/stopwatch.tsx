/**
 * Cronómetro — count up, with laps.
 *
 * For everything the rest countdown does not cover: timing a hold, a carry,
 * a circuit. Like the rest timer it stores instants rather than a ticking
 * counter, so backgrounding the app does not lose time.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';

import { formatStopwatch } from '@/lib/domain/time';
import { useTheme } from '@/lib/hooks/useTheme';

const KEEP_AWAKE_TAG = 'stopwatch';

export default function StopwatchScreen() {
  const t = useTheme();
  const router = useRouter();

  /** When the current run started; null while stopped. */
  const startedAt = useRef<number | null>(null);
  /** Time banked by previous runs, so pause/resume adds up. */
  const banked = useRef(0);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);

  const read = () =>
    banked.current + (startedAt.current === null ? 0 : Date.now() - startedAt.current);

  // Redraw ~30 times a second while running; hundredths need it, seconds do not.
  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => setElapsed(read()), 33);
    return () => clearInterval(id);
  }, [running]);

  // Catch up immediately when the app comes back to the front.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setElapsed(read());
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (running) activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    else deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
  }, [running]);

  useEffect(() => () => {
    deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
  }, []);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

    if (running) {
      banked.current = read();
      startedAt.current = null;
      setRunning(false);
    } else {
      startedAt.current = Date.now();
      setRunning(true);
    }
    setElapsed(read());
  };

  const reset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    banked.current = 0;
    startedAt.current = null;
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  };

  const lap = () => {
    Haptics.selectionAsync().catch(() => undefined);
    setLaps((previous) => [read(), ...previous]);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <View className="flex-row items-center px-2 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="items-center justify-center"
          style={{ width: 44, minHeight: 44 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={t.onSurface} />
        </Pressable>
        <Text className="text-[18px] font-extrabold" style={{ color: t.onSurface }}>
          Cronómetro
        </Text>
      </View>

      <View className="items-center justify-center py-10">
        <Text
          accessibilityLabel={`Tiempo ${formatStopwatch(elapsed)}`}
          className="font-extrabold"
          style={{
            color: running ? t.primaryContainer : t.onSurface,
            fontSize: 64,
            fontVariant: ['tabular-nums'],
          }}
        >
          {formatStopwatch(elapsed)}
        </Text>
      </View>

      <View className="flex-row gap-3 px-6">
        <Pressable
          onPress={running ? lap : reset}
          disabled={!running && elapsed === 0}
          accessibilityRole="button"
          accessibilityLabel={running ? 'Marcar vuelta' : 'Reiniciar'}
          className="flex-1 rounded-2xl border items-center justify-center"
          style={{
            borderColor: t.outlineVariant,
            minHeight: 64,
            opacity: !running && elapsed === 0 ? 0.4 : 1,
          }}
        >
          <Text className="text-[16px] font-bold" style={{ color: t.onSurfaceVariant }}>
            {running ? 'Vuelta' : 'Reiniciar'}
          </Text>
        </Pressable>

        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={running ? 'Pausar' : 'Empezar'}
          className="flex-1 rounded-2xl items-center justify-center"
          style={{ backgroundColor: running ? t.errorContainer : t.primaryContainer, minHeight: 64 }}
        >
          <Text
            className="text-[16px] font-bold"
            style={{ color: running ? t.onSurface : t.onPrimaryContainer }}
          >
            {running ? 'Pausar' : elapsed > 0 ? 'Seguir' : 'Empezar'}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}>
        {laps.map((time, index) => {
          const number = laps.length - index;
          const previous = laps[index + 1] ?? 0;

          return (
            <View
              key={`${number}-${time}`}
              className="flex-row items-center justify-between border-b py-3"
              style={{ borderBottomColor: t.outlineVariant }}
            >
              <Text className="text-[14px]" style={{ color: t.onSurfaceVariant }}>
                Vuelta {number}
              </Text>
              <Text
                className="text-[15px] font-semibold"
                style={{ color: t.onSurfaceVariant, fontVariant: ['tabular-nums'] }}
              >
                +{formatStopwatch(time - previous)}
              </Text>
              <Text
                className="text-[15px] font-bold"
                style={{ color: t.onSurface, fontVariant: ['tabular-nums'] }}
              >
                {formatStopwatch(time)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
