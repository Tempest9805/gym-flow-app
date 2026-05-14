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
  StyleSheet,
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
        <AppTopBar />
        <View style={styles.notFound}>
          <Text style={[styles.notFoundEmoji]}>🏋️</Text>
          <Text style={[styles.notFoundText, { color: t.onSurfaceVariant }]}>
            Exercise not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: t.surfaceContainer }]}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous screen"
          >
            <Text style={[styles.backBtnText, { color: t.primaryContainer }]}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasMedia = !!detailUrl;
  const displayName = exercise.name_en ?? 'Untitled Exercise';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />

      <View style={[styles.container, { backgroundColor: t.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* ── 1. Hero Media ── */}
          <View style={styles.heroArea}>
            {detailUrl ? (
              <ZoomableImage
                source={{ uri: detailUrl }}
                zoomSource={zoomUrl ? { uri: zoomUrl } : undefined}
                style={styles.heroImage}
                contentFit="cover"
                accessibilityLabel={`Demonstration of ${displayName}`}
                showZoomHint
              />
            ) : (
              <View style={[styles.heroPlaceholder, { backgroundColor: t.surfaceContainerHighest }]}>
                <Text style={styles.heroPlaceholderEmoji}>🏋️</Text>
                <Text style={[styles.heroPlaceholderLabel, { color: t.onSurfaceVariant }]}>
                  No demo available
                </Text>
              </View>
            )}

            {/* Bottom fade */}
            <View style={[styles.heroGradient, { backgroundColor: t.background }]} />

            {/* DEMO badge — only when media exists */}
            {hasMedia && (
              <View
                style={[
                  styles.demoBadge,
                  { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: t.outlineVariant },
                ]}
              >
                <Text style={[styles.demoBadgeIcon, { color: t.primaryContainer }]}>▶</Text>
                <Text style={[styles.demoBadgeText, { color: t.onSurface }]}>DEMO</Text>
              </View>
            )}
          </View>

          {/* ── 2. Meta row: TYPE · EQUIPMENT · DIFFICULTY ── */}
          <View style={[styles.metaRow, { borderBottomColor: t.surfaceContainer }]}>
            {/* Type */}
            {exercise.type && (
              <View
                style={[
                  styles.metaChip,
                  { backgroundColor: `${t.primaryContainer}20`, borderColor: `${t.primaryContainer}40` },
                ]}
              >
                <Text style={[styles.metaChipText, { color: t.primaryContainer }]}>
                  {exercise.type.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Equipment */}
            {exercise.equipment && (
              <View
                style={[
                  styles.metaChip,
                  { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest },
                ]}
              >
                <Text style={[styles.metaChipText, { color: t.onSurfaceVariant }]}>
                  {exercise.equipment.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Difficulty badge */}
            {exercise.difficulty && (
              <View
                style={[
                  styles.metaChip,
                  { backgroundColor: `${diffColor}20`, borderColor: `${diffColor}50` },
                ]}
              >
                <Text style={[styles.metaChipText, { color: diffColor }]}>
                  {exercise.difficulty.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* ── 3. Exercise name + muscle tags ── */}
          <View style={[styles.headerContent, { borderBottomColor: t.surfaceContainer }]}>
            {/* Exercise name */}
            <Text style={[styles.exerciseName, { color: t.onSurface }]} numberOfLines={3}>
              {displayName.toUpperCase()}
            </Text>

            {/* Muscle group tags */}
            <View style={styles.muscleTagsRow}>
              {muscleTags.map((tag, i) => (
                <View
                  key={i}
                  style={[
                    styles.muscleTag,
                    { backgroundColor: `${t.secondary}20`, borderColor: `${t.secondary}33` },
                  ]}
                >
                  <Text style={[styles.muscleTagText, { color: t.secondary }]}>
                    {tag.toUpperCase()}
                  </Text>
                </View>
              ))}

              {/* Compound indicator */}
              {exercise.is_compound === true && (
                <View
                  style={[
                    styles.muscleTag,
                    { backgroundColor: `${t.secondary}20`, borderColor: `${t.secondary}33` },
                  ]}
                >
                  <Text style={[styles.muscleTagText, { color: t.secondary }]}>
                    COMPOUND
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── 4. Description (short summary) ── */}
          {!!exercise.description && (
            <View
              style={[
                styles.descCard,
                { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest },
              ]}
            >
              <Text style={[styles.descCardLabel, { color: t.primaryContainer }]}>OVERVIEW</Text>
              <Text style={[styles.descCardText, { color: t.onSurface }]}>
                {exercise.description}
              </Text>
            </View>
          )}

          {/* ── 5. Instructions — numbered steps ── */}
          <View style={styles.cuesSection}>
            <View style={styles.cuesSectionHeader}>
              <Text style={[styles.cuesSectionIcon, { color: t.primaryContainer }]}>◉</Text>
              <Text style={[styles.cuesSectionTitle, { color: t.onSurface }]}>
                EXECUTION
              </Text>
            </View>

            <View style={styles.cuesTimeline}>
              {/* Vertical connector line */}
              <View
                style={[styles.timelineLine, { backgroundColor: t.surfaceContainerHighest }]}
              />

              {steps.map((step, index) => (
                <View key={index} style={styles.cueItem}>
                  {/* Numbered circle */}
                  <View
                    style={[
                      styles.cueCircle,
                      {
                        backgroundColor: t.surfaceContainer,
                        borderColor: t.primaryContainer,
                        shadowColor: t.primaryContainer,
                      },
                    ]}
                  >
                    <Text style={[styles.cueNum, { color: t.primaryContainer }]}>
                      {index + 1}
                    </Text>
                  </View>

                  {/* Step content */}
                  <View style={styles.cueContent}>
                    <Text style={[styles.cueLabel, { color: t.onSurface }]}>
                      {STEP_LABELS[index] ?? `STEP ${index + 1}`}
                    </Text>
                    <Text style={[styles.cueText, { color: t.onSurfaceVariant }]}>
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
              style={[
                styles.extrasCard,
                { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest },
              ]}
            >
              {!!exercise.movement_pattern && (
                <View style={styles.extrasRow}>
                  <Text style={[styles.extrasLabel, { color: t.onSurfaceVariant }]}>
                    Pattern
                  </Text>
                  <Text style={[styles.extrasValue, { color: t.onSurface }]}>
                    {exercise.movement_pattern.replace(/_/g, ' ')}
                  </Text>
                </View>
              )}
              {!!exercise.notes && (
                <View style={styles.extrasRow}>
                  <Text style={[styles.extrasLabel, { color: t.onSurfaceVariant }]}>
                    Notes
                  </Text>
                  <Text style={[styles.extrasValue, { color: t.onSurface }]}>
                    {exercise.notes}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Spacer for sticky CTA */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── 7. Sticky CTA ── */}
        <View style={[styles.ctaArea, { backgroundColor: t.background }]}>
          <TouchableOpacity
            style={[
              styles.ctaButton,
              { backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push('/routine-builder')}
            accessibilityRole="button"
            accessibilityLabel={`Add ${displayName} to your routine`}
          >
            <Text style={[styles.ctaButtonText, { color: '#000' }]}>+ ADD TO ROUTINE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Not-found
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  notFoundEmoji: { fontSize: 64 },
  notFoundText: { fontSize: 18 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 },
  backBtnText: { fontSize: 16, fontWeight: '600' },

  // Hero
  heroArea: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%', opacity: 0.85 },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  heroPlaceholderEmoji: { fontSize: 72 },
  heroPlaceholderLabel: { fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    opacity: 0.9,
  },
  demoBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  demoBadgeIcon: { fontSize: 12 },
  demoBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Header
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    gap: 16,
  },
  exerciseName: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: -1,
  },
  muscleTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleTag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  muscleTagText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  // Description card
  descCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  descCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  descCardText: {
    fontSize: 16,
    lineHeight: 26,
  },

  // Execution steps
  cuesSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 28,
  },
  cuesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cuesSectionIcon: { fontSize: 20 },
  cuesSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  cuesTimeline: {
    position: 'relative',
    gap: 32,
    paddingLeft: 48,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 8,
    bottom: 8,
    width: 2,
  },
  cueItem: { flexDirection: 'row', gap: 16 },
  cueCircle: {
    position: 'absolute',
    left: -48,
    width: 32,
    height: 32,
    borderRadius: 99,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  cueNum: { fontSize: 14, fontWeight: '700', lineHeight: 16 },
  cueContent: { flex: 1, gap: 6 },
  cueLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  cueText: { fontSize: 16, lineHeight: 26 },

  // Extras card (movement pattern + notes)
  extrasCard: {
    marginHorizontal: 20,
    marginTop: 28,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  extrasRow: { gap: 4 },
  extrasLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  extrasValue: { fontSize: 15, lineHeight: 24, textTransform: 'capitalize' },

  // Sticky CTA
  ctaArea: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  ctaButton: {
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
