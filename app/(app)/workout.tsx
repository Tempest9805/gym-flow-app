/**
 * Workout Detail Screen — Stitch-faithful "Ready to Train" layout:
 *   1. TopAppBar (sticky)
 *   2. Hero Section: Routine Name (display-xl) + Stats row
 *   3. Exercise List: Vertical cards with order index + name + set/rep meta
 *   4. Sticky CTA: START SESSION button (h-80, neon glow, at bottom)
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { LoadingScreen } from '@/components/ui';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRoutine, useTranslation } from '@/lib/hooks';
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

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { language } = useTranslation();
  const { data: routine, isLoading } = useRoutine(id);

  if (isLoading) return <LoadingScreen />;

  if (!routine) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
        <AppTopBar />
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-lg" style={{ color: t.onSurfaceVariant }}>Routine not found</Text>
          <TouchableOpacity onPress={() => router.back()} className="p-3">
            <Text className="text-base font-semibold" style={{ color: t.primaryContainer }}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typedRoutine = routine as RoutineWithExercises;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <View className="flex-1" style={{ backgroundColor: t.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ── 1. Hero Section ── */}
          <View className="px-5 pt-8 pb-6 gap-4">
            <View
              className="px-3 py-1 rounded-full border self-start"
              style={{
                backgroundColor: `${t.primaryContainer}22`,
                borderColor: `${t.primaryContainer}44`,
              }}
            >
              <Text className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: t.primaryContainer }}>
                READY TO TRAIN
              </Text>
            </View>
            <Text className="text-[48px] font-extrabold leading-[52px] tracking-tighter" style={{ color: t.onSurface }}>
              {typedRoutine.name.toUpperCase()}
            </Text>
            
            {/* Stats Bento */}
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1 p-4 rounded-xl border gap-1" style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}>
                <Text className="text-[10px] font-bold tracking-widest" style={{ color: t.outline }}>MOVEMENTS</Text>
                <Text className="text-xl font-extrabold" style={{ color: t.onSurface }}>{typedRoutine.exercises?.length ?? 0}</Text>
              </View>
              <View className="flex-1 p-4 rounded-xl border gap-1" style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}>
                <Text className="text-[10px] font-bold tracking-widest" style={{ color: t.outline }}>EST. TIME</Text>
                <Text className="text-xl font-extrabold" style={{ color: t.onSurface }}>45m</Text>
              </View>
              <View className="flex-1 p-4 rounded-xl border gap-1" style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}>
                <Text className="text-[10px] font-bold tracking-widest" style={{ color: t.outline }}>DIFFICULTY</Text>
                <Text className="text-xl font-extrabold" style={{ color: t.onSurface }}>HARD</Text>
              </View>
            </View>
          </View>

          {/* ── 2. Exercise List ── */}
          <View className="px-5 mt-6">
            <Text className="text-[12px] font-bold tracking-[3px] uppercase mb-3" style={{ color: t.onSurfaceVariant }}>EXERCISE PROTOCOL</Text>
            <View className="gap-3">
              {typedRoutine.exercises
                ?.sort((a: any, b: any) => a.order_index - b.order_index)
                .map((item, index) => {
                  const exName = language === 'es' && item.exercise.name_es ? item.exercise.name_es : item.exercise.name_en;
                  const normalizedSlug = item.exercise.slug
                    ?.toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                  const localHires = normalizedSlug ? HIRES_MAP[normalizedSlug] : null;
                  const localNormalized = normalizedSlug ? NORMALIZED_MAP[normalizedSlug] : null;
                  const imageSource = localHires || localNormalized || (item.exercise.demonstration_url ? { uri: item.exercise.demonstration_url } : null);
                  const steps = parseInstructions(item.exercise.instructions);
                  const isTimeBased = item.exercise_type === 'time' ||
                    (item.notes?.toLowerCase().includes('seg') || item.notes?.toLowerCase().includes('min'));

                  return (
                    <View
                      key={item.id}
                      className="bg-[#1E1428] rounded-2xl border border-zinc-800 p-4 relative overflow-hidden"
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.push(`/exercise/${item.exercise_id}`)}
                        className="flex-row items-start gap-4"
                      >
                        {/* Exercise Image */}
                        {imageSource ? (
                          <Image
                            source={imageSource}
                            className="w-16 h-16 rounded-xl bg-zinc-950"
                            contentFit="cover"
                          />
                        ) : (
                          <View className="w-16 h-16 rounded-xl bg-zinc-950 items-center justify-center">
                            <MaterialCommunityIcons name="dumbbell" size={24} color="#504254" />
                          </View>
                        )}

                        {/* Content Area */}
                        <View className="flex-1 pr-6">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-base font-black text-white leading-tight uppercase flex-1 mr-2">
                              {exName}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={16} color="#504254" />
                          </View>
                          
                          <Text className="text-xs font-bold text-[#BC13FE] mt-0.5 uppercase tracking-wide">
                            {item.exercise_type === 'reps'
                              ? `${item.sets}×${item.reps ?? 10} reps`
                              : item.duration_seconds
                                ? item.exercise_type === 'cardio'
                                  ? `${item.sets} sets · ${Math.round(item.duration_seconds / 60)} min`
                                  : `${item.sets} sets · ${item.duration_seconds}s`
                                : `${item.sets} sets`}
                          </Text>

                          {item.exercise.muscle_group && (
                            <View className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 self-start mt-2">
                              <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {item.exercise.muscle_group}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Inline Timer Button for Time-based exercises */}
                      {isTimeBased && (
                        <TouchableOpacity
                          onPress={() => router.push({
                            pathname: '/timer-active',
                            params: {
                              work: item.duration_seconds || 60,
                              rest: item.rest_seconds || 30,
                              rounds: item.sets || 3,
                              sound: '1'
                            }
                          })}
                          className="absolute right-4 bottom-4 flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#BC13FE]/10 border border-[#BC13FE]/30"
                        >
                          <MaterialCommunityIcons name="play" size={12} color="#BC13FE" />
                          <Text className="text-[10px] font-bold text-[#BC13FE] uppercase tracking-widest">
                            {language === 'es' ? 'Iniciar' : 'Start'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Description & Cues */}
                      {(item.exercise.description || steps.length > 0) && (
                        <View className="mt-4 pt-3 border-t border-zinc-800">
                          {item.exercise.description && (
                            <Text className="text-[12px] text-zinc-400 leading-relaxed italic mb-2">
                              {item.exercise.description}
                            </Text>
                          )}
                          
                          {steps.slice(0, 2).map((step, idx) => (
                            <View key={idx} className="flex-row gap-2 mt-1 items-start">
                              <View className="w-4 h-4 rounded-full border border-[#BC13FE]/30 items-center justify-center shrink-0 mt-0.5">
                                <Text className="text-[9px] font-bold text-[#BC13FE]">{idx + 1}</Text>
                              </View>
                              <Text className="text-[11px] text-zinc-500 leading-4 flex-1" numberOfLines={2}>
                                {step}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
            </View>
          </View>

          {/* Spacer for sticky CTA */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── 3. Sticky CTA ── */}
        <View 
          className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-10 border-t" 
          style={{ backgroundColor: t.background, borderTopColor: 'rgba(255,255,255,0.05)' }}
        >
          <TouchableOpacity
            className="h-20 rounded-xl items-center justify-center shadow-2xl elevation-md"
            style={{
              backgroundColor: t.primaryContainer,
              shadowColor: t.primaryContainer,
              shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 20,
            }}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/workout-session', params: { id: typedRoutine.id } })}
          >
            <Text className="text-xl font-extrabold tracking-[3px] uppercase" style={{ color: '#000' }}>START SESSION  ▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
