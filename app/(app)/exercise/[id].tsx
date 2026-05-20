/**
 * Exercise Detail Screen
 *
 * Layout (top → bottom):
 *   1. TopAppBar (sticky)
 *   2. Hero: demonstration_url GIF/image  OR  rich placeholder
 *   3. Meta row: TYPE · EQUIPMENT · DIFFICULTY badge
 *   4. Exercise name (display-xl) + muscle group tags
 *   5. Description card (short summary)
 *   6. Instructions: numbered steps timeline (from `instructions` field)
 *   7. Optional: movement_pattern · compound indicator
 *   8. Sticky CTA: ADD TO ROUTINE
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { LoadingScreen } from '@/components/ui';
import { ZoomableImage } from '@/components/ui/ZoomableImage';
import { useTheme } from '@/lib/hooks/useTheme';
import { useExercise, useTranslation } from '@/lib/hooks';
import { HIRES_MAP, NORMALIZED_MAP } from '@/lib/utils/mediaMap';

// ── Helpers ────────────────────────────────────────────────────────────────

function difficultyColor(difficulty: string | null, primary: string) {
  switch (difficulty?.toLowerCase()) {
    case 'beginner':     return '#4ade80'; // green
    case 'intermediate': return '#facc15'; // amber
    case 'advanced':     return '#f87171'; // red
    default:             return primary;
  }
}

/**
 * Parse the instructions field into an array of step strings.
 * Handles:
 *   • Newline-separated paragraphs
 *   • Numbered list ("1. Step one\n2. Step two")
 *   • Single block of text (returned as [text])
 * Returns a non-empty array or falls back to generic cues.
 */
function parseInstructions(raw: string | null): string[] {
  if (!raw) return []

  // Intenta separar por números con punto: "1. ", "2. " etc
  const byNumber = raw
    .split(/\d+\.\s+/)
    .map(s => s.trim())
    .filter(Boolean)

  if (byNumber.length > 1) return byNumber

  // Fallback: separar por punto seguido de mayúscula
  const bySentence = raw
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(Boolean)

  if (bySentence.length > 1) return bySentence

  // Fallback final: retornar como un solo paso
  return [raw]
}

const STEP_LABELS = ['SETUP', 'POSITION', 'DRIVE', 'LOCKOUT', 'CONTROL', 'BREATHE', 'RESET', 'REPEAT'];

// ── Component ──────────────────────────────────────────────────────────────

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { t: translate, language } = useTranslation();
  const { data: exercise, isLoading } = useExercise(id);

  const steps = useMemo(
    () => parseInstructions(exercise?.instructions ?? null),
    [exercise?.instructions],
  );

  const muscleTags = useMemo(() => {
    if (!exercise) return [];
    return [exercise.muscle_group, exercise.category]
      .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
  }, [exercise]);

  const diffColor = useMemo(
    () => difficultyColor(exercise?.difficulty ?? null, t.primaryContainer),
    [exercise?.difficulty, t.primaryContainer],
  );

  // Resolve best available local WebP or Supabase CDN URL
  const normalizedSlug = exercise?.slug
    ?.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const localHires = normalizedSlug ? HIRES_MAP[normalizedSlug] : null;
  const localNormalized = normalizedSlug ? NORMALIZED_MAP[normalizedSlug] : null;
  const remoteDemo = exercise?.demonstration_url;

  const imageSource = localHires 
    ? localHires 
    : (localNormalized 
        ? localNormalized 
        : (remoteDemo ? { uri: remoteDemo } : null));

  // Fullscreen zoom source matches local high-res or falls back to remote high-res
  const zoomSource = localHires
    ? localHires
    : (exercise?.hires_url 
        ? { uri: exercise.hires_url } 
        : (remoteDemo ? { uri: remoteDemo } : null));

  const displayName = language === 'es' && exercise?.name_es ? exercise.name_es : (exercise?.name_en ?? 'Untitled Exercise');

  // ── Loading / not-found ──────────────────────────────────────────────────

  if (isLoading) return <LoadingScreen />;

  if (!exercise) {
    return (
      <SafeAreaView 
        className="flex-1" 
        style={{ backgroundColor: t.background }} 
        edges={['top']}
      >
        <AppTopBar />
        <View className="flex-1 items-center justify-center p-6 gap-4">
          <Text className="text-6xl">🏋️</Text>
          <Text className="text-lg" style={{ color: t.onSurfaceVariant }}>
            {translate('exercises.noExercise')}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-6 py-3 rounded-full"
            style={{ backgroundColor: t.surfaceContainer }}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous screen"
          >
            <Text className="text-base font-semibold" style={{ color: t.primaryContainer }}>{translate('exercises.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasMedia = !!imageSource;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: t.background }} 
      edges={['top']}
    >
      <AppTopBar />

      <View className="flex-1" style={{ backgroundColor: t.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >

          {/* ── 1. Hero Media ── */}
          <View className="w-full aspect-[4/3] relative overflow-hidden">
            <ZoomableImage
              source={imageSource ?? undefined}
              zoomSource={zoomSource ?? undefined}
              className="w-full h-full opacity-[0.85]"
              contentFit="cover"
              accessibilityLabel={`Demonstration of ${displayName}`}
              showZoomHint={!!imageSource}
            />

            {/* Bottom fade */}
            <View 
              className="absolute bottom-0 left-0 right-0 h-20 opacity-90" 
              style={{ backgroundColor: t.background }} 
            />

            {/* DEMO badge — only when media exists */}
            {hasMedia && (
              <View
                className="absolute bottom-4 right-4 flex-row items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderColor: t.outlineVariant }}
              >
                <Text className="text-[12px]" style={{ color: t.primaryContainer }}>▶</Text>
                <Text className="text-[11px] font-bold tracking-[1.5px]" style={{ color: t.onSurface }}>{translate('exercises.demo')}</Text>
              </View>
            )}
          </View>

          {/* ── 2. Meta row: TYPE · EQUIPMENT · DIFFICULTY ── */}
          <View 
            className="flex-row flex-wrap gap-2 px-5 py-4 border-b"
            style={{ borderBottomColor: t.surfaceContainer }}
          >
            {/* Type */}
            {exercise.type && (
              <View
                className="px-3 py-1 rounded-full border"
                style={{ backgroundColor: `${t.primaryContainer}20`, borderColor: `${t.primaryContainer}44` }}
              >
                <Text className="text-[11px] font-bold tracking-[1.5px]" style={{ color: t.primaryContainer }}>
                  {exercise.type.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Equipment */}
            {exercise.equipment && (
              <View
                className="px-3 py-1 rounded-full border"
                style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
              >
                <Text className="text-[11px] font-bold tracking-[1.5px]" style={{ color: t.onSurfaceVariant }}>
                  {exercise.equipment.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Difficulty badge */}
            {exercise.difficulty && (
              <View
                className="px-3 py-1 rounded-full border"
                style={{ backgroundColor: `${diffColor}20`, borderColor: `${diffColor}50` }}
              >
                <Text className="text-[11px] font-bold tracking-[1.5px]" style={{ color: diffColor }}>
                  {exercise.difficulty.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* ── 3. Exercise name + muscle tags ── */}
          <View 
            className="px-5 pt-6 pb-6 border-b gap-4"
            style={{ borderBottomColor: t.surfaceContainer }}
          >
            {/* Exercise name */}
            <Text 
              className="text-[42px] font-extrabold leading-[46px] tracking-tighter" 
              style={{ color: t.onSurface }} 
              numberOfLines={3}
            >
              {displayName.toUpperCase()}
            </Text>

            {/* Muscle group tags */}
            <View className="flex-row flex-wrap gap-2 mb-6">
              {/* Muscle group */}
              <View className="px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-900">
                <Text className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  {exercise.muscle_group}
                </Text>
              </View>

              {/* Category */}
              <View className="px-3 py-1.5 rounded-full border border-[#BC13FE]/30 bg-[#BC13FE]/10">
                <Text className="text-xs font-bold text-[#BC13FE] uppercase tracking-wider">
                  {exercise.category}
                </Text>
              </View>

              {/* Compound / Isolation */}
              <View className="px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-900">
                <Text className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  {exercise.is_compound
                    ? translate('exercises.compound')
                    : translate('exercises.isolation')}
                </Text>
              </View>
            </View>
          </View>

          <View className="px-5">
            {/* Descripción */}
            {exercise.description && (
              <View className="mb-6">
                <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  {translate('exercises.about')}
                </Text>
                <Text className="text-sm text-zinc-300 leading-relaxed">
                  {exercise.description}
                </Text>
              </View>
            )}

            {/* Movement Pattern */}
            {exercise.movement_pattern && (
              <View className="bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800">
                <Text className="text-xs text-zinc-500 mb-1">
                  {translate('exercises.movement')}
                </Text>
                <Text className="text-base text-white font-medium capitalize">
                  {exercise.movement_pattern.replace(/_/g, ' ')}
                </Text>
              </View>
            )}

            {/* Sección de instrucciones */}
            {exercise.instructions && (
              <View className="mb-6">
                {/* Header de sección */}
                <View className="flex-row items-center gap-2 mb-4">
                  <View className="w-3 h-3 rounded-full bg-[#BC13FE] border-2 border-[#BC13FE]/40" />
                  <Text className="text-sm font-bold text-white uppercase tracking-widest">
                    {translate('exercises.howTo')}
                  </Text>
                </View>

                {/* Pasos numerados */}
                {steps.map((step, index) => (
                  <View key={index} className="flex-row gap-3 mb-4">
                    {/* Número del paso */}
                    <View className="w-7 h-7 rounded-full border border-[#BC13FE]/50 items-center justify-center shrink-0 mt-0.5">
                      <Text className="text-xs font-bold text-[#BC13FE]">
                        {index + 1}
                      </Text>
                    </View>
                    {/* Texto del paso */}
                    <Text className="text-sm text-zinc-300 leading-relaxed flex-1">
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Spacer for sticky CTA */}
          <View className="h-[120px]" />
        </ScrollView>

        {/* ── 7. Sticky CTA ── */}
        <View 
          className="absolute bottom-20 left-0 right-0 px-5 py-4"
          style={{ backgroundColor: t.background }}
        >
          <TouchableOpacity
            className="h-16 rounded-lg items-center justify-center shadow-2xl elevation-md"
            style={{ 
              backgroundColor: t.primaryContainer, 
              shadowColor: t.primaryContainer,
              shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 16,
            }}
            activeOpacity={0.85}
            onPress={() => router.push('/routine-builder')}
            accessibilityRole="button"
            accessibilityLabel={`Add ${displayName} to your routine`}
          >
            <Text className="text-lg font-bold tracking-widest" style={{ color: '#000' }}>
              {translate('exercises.addToRoutine').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
