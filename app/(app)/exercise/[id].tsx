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
import { useExercise } from '@/lib/hooks';

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
  if (!raw || raw.trim() === '') {
    return [
      'Position yourself correctly and engage your core.',
      'Control the movement — avoid jerking or using momentum.',
      'Exhale on the exertion phase of the movement.',
      'Return to the starting position under control.',
    ];
  }

  // Numbered list format: "1. …\n2. …"
  const numbered = raw.split(/\n?\d+\.\s+/).filter(Boolean).map((s) => s.trim());
  if (numbered.length > 1) return numbered.slice(0, 8);

  // Newline-separated paragraphs
  const lines = raw.split(/\n+/).filter((l) => l.trim().length > 0);
  if (lines.length > 1) return lines.slice(0, 8);

  // Single block → wrap in array
  return [raw.trim()];
}

const STEP_LABELS = ['SETUP', 'POSITION', 'DRIVE', 'LOCKOUT', 'CONTROL', 'BREATHE', 'RESET', 'REPEAT'];

// ── Component ──────────────────────────────────────────────────────────────

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
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

  // Resolve best available image source from CDN
  const detailUrl = exercise?.demonstration_url;
  const zoomUrl = exercise?.hires_url || exercise?.demonstration_url;

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
            Exercise not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-6 py-3 rounded-full"
            style={{ backgroundColor: t.surfaceContainer }}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous screen"
          >
            <Text className="text-base font-semibold" style={{ color: t.primaryContainer }}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasMedia = !!detailUrl;
  const displayName = exercise.name_en ?? 'Untitled Exercise';

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
            {detailUrl ? (
              <ZoomableImage
                source={{ uri: detailUrl }}
                zoomSource={zoomUrl ? { uri: zoomUrl } : undefined}
                className="w-full h-full opacity-[0.85]"
                contentFit="cover"
                accessibilityLabel={`Demonstration of ${displayName}`}
                showZoomHint
              />
            ) : (
              <View 
                className="flex-1 items-center justify-center gap-3" 
                style={{ backgroundColor: t.surfaceContainerHighest }}
              >
                <Text className="text-[72px]">🏋️</Text>
                <Text 
                  className="text-sm font-semibold tracking-widest" 
                  style={{ color: t.onSurfaceVariant }}
                >
                  No demo available
                </Text>
              </View>
            )}

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
                <Text className="text-[11px] font-bold tracking-[1.5px]" style={{ color: t.onSurface }}>DEMO</Text>
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
                style={{ backgroundColor: `${t.primaryContainer}20`, borderColor: `${t.primaryContainer}40` }}
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
            <View className="flex-row flex-wrap gap-2">
              {muscleTags.map((tag, i) => (
                <View
                  key={i}
                  className="px-3.5 py-1.5 rounded-full border"
                  style={{ backgroundColor: `${t.secondary}20`, borderColor: `${t.secondary}33` }}
                >
                  <Text className="text-[12px] font-bold tracking-widest" style={{ color: t.secondary }}>
                    {tag.toUpperCase()}
                  </Text>
                </View>
              ))}

              {/* Compound indicator */}
              {exercise.is_compound === true && (
                <View
                  className="px-3.5 py-1.5 rounded-full border"
                  style={{ backgroundColor: `${t.secondary}20`, borderColor: `${t.secondary}33` }}
                >
                  <Text className="text-[12px] font-bold tracking-widest" style={{ color: t.secondary }}>
                    COMPOUND
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── 4. Description (short summary) ── */}
          {!!exercise.description && (
            <View
              className="mx-5 mt-6 p-5 rounded-xl border gap-2.5"
              style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
            >
              <Text className="text-[11px] font-bold tracking-[2px]" style={{ color: t.primaryContainer }}>OVERVIEW</Text>
              <Text className="text-base leading-6" style={{ color: t.onSurface }}>
                {exercise.description}
              </Text>
            </View>
          )}

          {/* ── 5. Instructions — numbered steps ── */}
          <View className="px-5 pt-8 gap-7">
            <View className="flex-row items-center gap-3">
              <Text className="text-xl" style={{ color: t.primaryContainer }}>◉</Text>
              <Text className="text-[22px] font-bold tracking-widest" style={{ color: t.onSurface }}>
                EXECUTION
              </Text>
            </View>

            <View className="relative gap-8 pl-12">
              {/* Vertical connector line */}
              <View
                className="absolute left-4 top-2 bottom-2 w-0.5"
                style={{ backgroundColor: t.surfaceContainerHighest }}
              />

              {steps.map((step, index) => (
                <View key={index} className="flex-row gap-4">
                  {/* Numbered circle */}
                  <View
                    className="absolute -left-12 w-8 h-8 rounded-full border items-center justify-center"
                    style={{
                      backgroundColor: t.surfaceContainer,
                      borderColor: t.primaryContainer,
                      shadowColor: t.primaryContainer,
                      shadowOpacity: 0.3,
                      shadowOffset: { width: 0, height: 0 },
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text className="text-sm font-bold leading-4" style={{ color: t.primaryContainer }}>
                      {index + 1}
                    </Text>
                  </View>

                  {/* Step content */}
                  <View className="flex-1 gap-1.5">
                    <Text className="text-[13px] font-bold tracking-widest" style={{ color: t.onSurface }}>
                      {STEP_LABELS[index] ?? `STEP ${index + 1}`}
                    </Text>
                    <Text className="text-base leading-6" style={{ color: t.onSurfaceVariant }}>
                      {step.trim()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── 6. Optional extras: movement_pattern · notes ── */}
          {(!!exercise.movement_pattern || !!exercise.notes) && (
            <View
              className="mx-5 mt-7 p-5 rounded-xl border gap-3.5"
              style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
            >
              {!!exercise.movement_pattern && (
                <View className="gap-1">
                  <Text className="text-[11px] font-bold tracking-widest" style={{ color: t.onSurfaceVariant }}>
                    Pattern
                  </Text>
                  <Text className="text-[15px] leading-6 capitalize" style={{ color: t.onSurface }}>
                    {exercise.movement_pattern.replace(/_/g, ' ')}
                  </Text>
                </View>
              )}
              {!!exercise.notes && (
                <View className="gap-1">
                  <Text className="text-[11px] font-bold tracking-widest" style={{ color: t.onSurfaceVariant }}>
                    Notes
                  </Text>
                  <Text className="text-[15px] leading-6" style={{ color: t.onSurface }}>
                    {exercise.notes}
                  </Text>
                </View>
              )}
            </View>
          )}

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
            <Text className="text-lg font-bold tracking-widest" style={{ color: '#000' }}>+ ADD TO ROUTINE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
