/**
 * El resumen que sale al terminar un tabata.
 *
 * Aqui no hay nada que decidir: se mira medio segundo y se cierra. Por eso solo
 * lleva el tiempo, las rondas, los ciclos y dos botones.
 *
 * Estaba pintada a mano con un verde neon y un boton blanco con texto blanco
 * encima - invisible, 1:1. Ahora usa los tokens, que es lo que evita repetirlo.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/hooks/useTheme';

function formatTotalTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

/** Una cifra con su etiqueta. Las dos de abajo son iguales salvo el texto. */
function Stat({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const t = useTheme();

  return (
    <View
      className="flex-1 rounded-xl p-5 items-center"
      style={{
        backgroundColor: t.surfaceContainer,
        borderWidth: 1,
        borderColor: t.outlineVariant,
      }}
    >
      <Text
        className="text-[10px] font-bold uppercase text-center mb-2"
        style={{ color: t.onSurfaceVariant, letterSpacing: 4 }}
      >
        {label}
      </Text>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-3xl font-bold" style={{ color: t.onSurface }}>
          {value}
        </Text>
        <Text className="text-base" style={{ color: t.outline }}>
          /{total}
        </Text>
      </View>
    </View>
  );
}

export default function TabataSummaryScreen() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    totalSeconds: string;
    roundsCompleted: string;
    totalRounds: string;
    cyclesCompleted: string;
    totalCycles: string;
  }>();

  const totalSeconds = Number(params.totalSeconds) || 0;
  const roundsCompleted = Number(params.roundsCompleted) || 0;
  const totalRounds = Number(params.totalRounds) || 0;
  const cyclesCompleted = Number(params.cyclesCompleted) || 0;
  const totalCycles = Number(params.totalCycles) || 0;

  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -6, duration: 700, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [bounceAnim]);

  return (
    <SafeAreaView
      className="flex-1 items-center"
      style={{ backgroundColor: t.background, paddingHorizontal: 20 }}
      edges={['top', 'bottom']}
    >
      <Animated.View
        className="mb-6"
        style={{ transform: [{ translateY: bounceAnim }], marginTop: 24 }}
      >
        <MaterialCommunityIcons name="trophy" size={80} color={t.primary} />
      </Animated.View>

      <Text
        className="text-4xl font-black text-center mb-10 uppercase"
        style={{ color: t.onSurface, letterSpacing: 4, lineHeight: 46 }}
      >
        {'¡SESIÓN\nCOMPLETA!'}
      </Text>

      <View className="w-full gap-4">
        <View
          className="rounded-xl p-6 items-center"
          style={{
            backgroundColor: t.surfaceContainer,
            borderWidth: 1,
            borderColor: t.outlineVariant,
          }}
        >
          <Text
            className="text-[10px] font-bold uppercase mb-2"
            style={{ color: t.onSurfaceVariant, letterSpacing: 4 }}
          >
            Tiempo total
          </Text>
          <Text className="text-4xl font-bold" style={{ color: t.onSurface }}>
            {formatTotalTime(totalSeconds)}
          </Text>
        </View>

        <View className="flex-row gap-4">
          <Stat label="Rondas" value={roundsCompleted} total={totalRounds} />
          <Stat label="Ciclos" value={cyclesCompleted} total={totalCycles} />
        </View>
      </View>

      <View className="w-full gap-3 mt-auto mb-4">
        <TouchableOpacity
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel="Terminar y volver a la rutina"
          className="w-full rounded-xl items-center justify-center"
          style={{ backgroundColor: t.primaryContainer, minHeight: 56 }}
          activeOpacity={0.85}
        >
          <Text
            className="font-bold text-lg uppercase tracking-wider"
            style={{ color: t.onPrimaryContainer }}
          >
            Terminar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/tabata')}
          accessibilityRole="button"
          accessibilityLabel="Repetir el tabata"
          className="w-full rounded-xl flex-row items-center justify-center gap-2"
          style={{ borderWidth: 1, borderColor: t.outline, minHeight: 48 }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="replay" size={18} color={t.onSurface} />
          <Text className="text-base uppercase tracking-wider" style={{ color: t.onSurface }}>
            Repetir
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
