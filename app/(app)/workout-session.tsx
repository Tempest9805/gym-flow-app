/**
 * Workout Session Screen — Stitch "Active Training" layout:
 *   1. Sticky Header: Progress bar (thin, neon) + Exit button
 *   2. Hero Area: LARGE EXERCISE NAME (display-xl) + Focus Cue
 *   3. Data Display: LARGE SET/REP digits with accent color
 *   4. Control Bar: NEXT EXERCISE (primary CTA) + FINISH (secondary)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LoadingScreen } from '@/components/ui';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRoutine, useTranslation } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import type { RoutineWithExercises } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { HIRES_MAP, NORMALIZED_MAP } from '@/lib/utils/mediaMap';

function parseInstructions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(s => String(s).trim()).filter(Boolean);
    }
  } catch (e) {}

  const byNumber = raw.split(/\d+\.\s+/).map(s => s.trim()).filter(Boolean);
  if (byNumber.length > 1) return byNumber;

  const bySentence = raw.split(/(?<=\.)\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean);
  if (bySentence.length > 1) return bySentence;

  return [raw];
}

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { data: routine, isLoading } = useRoutine(id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [successes, setSuccesses] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  // ── Helpers ──
  const saveProgression = async (exerciseItemId: string, value: number) => {
    try {
      await supabase
        .from('routine_exercises')
        .update({ consecutive_completions: value })
        .eq('id', exerciseItemId);
    } catch (e) {
      console.warn('Progression save failed', e);
    }
  };

  const handleNailedIt = () => {
    const exId = currentItem?.exercise_id || currentItem?.id;
    if (!exId) return;
    const current = (successes[exId] || 0) + 1;

    if (current >= 2) {
      setToast('🎯 Progression unlocked! Target increased.');
      setSuccesses(prev => ({ ...prev, [exId]: 0 }));
      saveProgression(currentItem.id, 0);
      setTimeout(() => setToast(null), 2500);
    } else {
      setSuccesses(prev => ({ ...prev, [exId]: current }));
      saveProgression(currentItem.id, current);
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleStruggled = () => {
    const exId = currentItem?.exercise_id || currentItem?.id;
    if (!exId) return;
    setSuccesses(prev => ({ ...prev, [exId]: 0 }));
    saveProgression(currentItem.id, 0);
    setCurrentIndex(prev => prev + 1);
  };

  if (isLoading) return <LoadingScreen />;

  const typedRoutine = routine as RoutineWithExercises;

  if (!typedRoutine || !typedRoutine.exercises[currentIndex]) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }}>
        <View className="flex-1 items-center justify-center p-8 gap-4">
          <Text className="text-[80px] mb-4 text-white">★</Text>
          <Text className="text-[32px] font-black text-center tracking-tighter" style={{ color: t.onSurface }}>PROTOCOL COMPLETE</Text>
          <Text className="text-lg text-center leading-7 mb-8" style={{ color: t.onSurfaceVariant }}>
            All objectives achieved. Performance data synced.
          </Text>
          <TouchableOpacity
            className="h-[72px] w-full rounded-xl items-center justify-center shadow-2xl elevation-md"
            style={{ backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }}
            onPress={() => router.replace('/(app)')}
          >
            <Text className="text-lg font-extrabold tracking-widest text-black">CLOSE SESSION</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentItem = typedRoutine.exercises[currentIndex];
  const isLast = currentIndex === typedRoutine.exercises.length - 1;
  const progress = ((currentIndex + 1) / typedRoutine.exercises.length) * 100;
  const currentExId = currentItem.exercise_id || currentItem.id;
  const streakCount = successes[currentExId] || 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      {/* ── Toast Notification ── */}
      {toast && (
        <View
          className="absolute top-14 left-5 right-5 z-50 px-5 py-4 rounded-xl items-center"
          style={{ backgroundColor: '#22c55e' }}
        >
          <Text className="text-sm font-extrabold tracking-wide text-black">{toast}</Text>
        </View>
      )}
      {/* ── 1. Progress Header ── */}
      <View className="px-5 pt-3 pb-5 border-b gap-4" style={{ borderBottomColor: t.surfaceContainer }}>
        <View className="flex-row justify-between items-center">
          <Text className="text-[12px] font-extrabold tracking-[2px]" style={{ color: t.primaryContainer }}>ACTIVE SESSION</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-[12px] font-bold tracking-widest" style={{ color: t.outlineVariant }}>EXIT</Text>
          </TouchableOpacity>
        </View>
        <View className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: t.surfaceContainerHigh }}>
          <View 
            className="h-full shadow-2xl" 
            style={{ backgroundColor: t.primaryContainer, width: `${progress}%`, shadowColor: t.primaryContainer }} 
          />
        </View>
        <Text className="text-[10px] font-bold tracking-widest text-center" style={{ color: t.onSurfaceVariant }}>
          MOVEMENT {currentIndex + 1} OF {typedRoutine.exercises.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* ── 2. Focus Area ── */}
        <View className="px-5 pt-12 items-center gap-3">
          <Text className="text-[11px] font-bold tracking-[3px]" style={{ color: t.outline }}>CURRENT OBJECTIVE</Text>
          <Text className="text-[42px] font-black text-center leading-[48px] tracking-tighter mb-8" style={{ color: t.onSurface }}>
            {currentItem.exercise?.name_en?.toUpperCase()}
          </Text>
          
          <View className="flex-row w-full py-8 border-y items-center" style={{ borderTopColor: t.surfaceContainer, borderBottomColor: t.surfaceContainer }}>
            <View className="flex-1 items-center gap-1">
              <Text className="text-[64px] font-black tracking-[-2px]" style={{ color: t.primaryContainer }}>{currentItem.sets}</Text>
              <Text className="text-[10px] font-bold tracking-[1.5px]" style={{ color: t.onSurfaceVariant }}>TARGET SETS</Text>
            </View>
            <View className="w-[1px] h-16" style={{ backgroundColor: t.surfaceContainer }} />
            <View className="flex-1 items-center gap-1">
              <Text className="text-[64px] font-black tracking-[-2px]" style={{ color: t.primaryContainer }}>
                {currentItem.reps || currentItem.duration_seconds}
              </Text>
              <Text className="text-[10px] font-bold tracking-[1.5px]" style={{ color: t.onSurfaceVariant }}>
                {currentItem.reps ? 'REPS / SET' : 'SECONDS'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Performance Notes ── */}
        <View 
          className="m-5 p-6 rounded-2xl border gap-3" 
          style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
        >
          <Text className="text-[11px] font-extrabold tracking-[2px]" style={{ color: t.primaryContainer }}>SYSTEM GUIDANCE</Text>
          <Text className="text-base leading-6 italic" style={{ color: t.onSurfaceVariant }}>
            {currentItem.notes || 'Focus on peak contraction and explosive movement. Maintain mechanical tension throughout the set.'}
          </Text>
        </View>
      </ScrollView>

      {/* ── 4. Control Area ── */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-10" style={{ backgroundColor: t.background }}>
        {/* Streak indicator */}
        <View className="items-center mb-3">
          <Text className="text-sm font-bold tracking-wide" style={{ color: t.onSurfaceVariant }}>
            🔥 {streakCount}/2
          </Text>
        </View>

        {/* Dual feedback buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 h-16 rounded-xl items-center justify-center shadow-2xl elevation-md"
            style={{
              backgroundColor: '#22c55e',
              shadowColor: '#22c55e',
              shadowOpacity: 0.35,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 12,
            }}
            activeOpacity={0.85}
            onPress={handleNailedIt}
          >
            <Text className="text-base font-extrabold tracking-[2px] text-black">
              {isLast ? 'FINISH ✓' : 'NAILED IT ✓'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 h-16 rounded-xl items-center justify-center border-2"
            style={{ borderColor: '#ef4444' }}
            activeOpacity={0.85}
            onPress={handleStruggled}
          >
            <Text className="text-base font-extrabold tracking-[2px]" style={{ color: '#ef4444' }}>
              STRUGGLED ✗
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
