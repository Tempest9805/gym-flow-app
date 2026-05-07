/**
 * Exercise Detail Screen — Stitch `exercise_detail_canonical_purple` layout:
 *   1. TopAppBar (sticky)
 *   2. Hero media area (4:3 aspect, image + gradient overlay + DEMO badge)
 *   3. Header content: movement type + EXERCISE NAME (display-xl) + muscle group tags
 *   4. Execution Cues: numbered steps with neon-bordered circles + vertical timeline
 *   5. Sticky CTA: ADD TO ROUTINE button (h-64, neon glow, above bottom nav)
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { LoadingScreen } from '@/components/ui';
import { useTheme } from '@/lib/hooks/useTheme';
import { useExercise } from '@/lib/hooks';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { data: exercise, isLoading } = useExercise(id);

  if (isLoading) return <LoadingScreen />;

  if (!exercise) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
        <AppTopBar />
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: t.onSurfaceVariant }]}>Exercise not found</Text>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous screen"
          >
            <Text style={[styles.backBtnText, { color: t.primaryContainer }]}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Parse execution cues from description
  const cues = exercise.description
    ? exercise.description.split(/\d+\.\s+/).filter(Boolean).slice(0, 5)
    : ['Setup properly with correct form.', 'Control the movement throughout.', 'Exhale on exertion.'];

  const cueLabels = ['SETUP', 'TENSION', 'DRIVE', 'LOCKOUT', 'RESET'];

  // Parse muscle tags
  const muscleTags = [
    exercise.muscle_group,
    exercise.category,
    exercise.equipment,
  ].filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── 1. Hero Media Area ── */}
          <View style={styles.heroArea}>
            {exercise.media_url || exercise.demonstration_url ? (
              <ExpoImage
                source={{ uri: (exercise.media_url || exercise.demonstration_url) ?? undefined }}
                style={styles.heroImage}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View style={[styles.heroPlaceholder, { backgroundColor: t.surfaceContainerHighest }]}>
                <Text style={styles.heroPlaceholderIcon}>◆</Text>
              </View>
            )}
            {/* Gradient overlay */}
            <View style={[styles.heroGradient, { backgroundColor: t.background }]} />
            {/* Demo badge */}
            <View
              style={[
                styles.demoBadge,
                {
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderColor: t.outlineVariant,
                },
              ]}
            >
              <Text style={[styles.demoBadgeIcon, { color: t.primaryContainer }]}>▶</Text>
              <Text style={[styles.demoBadgeText, { color: t.onSurface }]}>DEMO</Text>
            </View>
          </View>

          {/* ── 2. Header Content ── */}
          <View style={[styles.headerContent, { borderBottomColor: t.surfaceContainer }]}>
            <View style={styles.exerciseTypeRow}>
              <Text style={[styles.exerciseType, { color: t.primaryContainer }]}>
                {(exercise.type || 'STRENGTH').toUpperCase()}
              </Text>
              <View style={[styles.typeDot, { backgroundColor: t.outlineVariant }]} />
              <Text style={[styles.exerciseEquip, { color: t.onSurfaceVariant }]}>
                {(exercise.equipment || 'BODYWEIGHT').toUpperCase()}
              </Text>
            </View>

            <Text style={[styles.exerciseName, { color: t.onSurface }]}>
              {(exercise.name_en || exercise.name || 'UNTITLED EXERCISE').toUpperCase()}
            </Text>

            {/* Muscle group tags */}
            <View style={styles.muscleTagsRow}>
              {muscleTags.map((tag, i) => (
                <View
                  key={i}
                  style={[
                    styles.muscleTag,
                    {
                      backgroundColor: `${t.secondary}22`,
                      borderColor: `${t.secondary}33`,
                    },
                  ]}
                >
                  <Text style={[styles.muscleTagText, { color: t.secondary }]}>
                    {tag?.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── 3. Execution Cues ── */}
          <View style={styles.cuesSection}>
            <View style={styles.cuesSectionHeader}>
              <Text style={[styles.cuesSectionIcon, { color: t.primaryContainer }]}>◉</Text>
              <Text style={[styles.cuesSectionTitle, { color: t.onSurface }]}>
                EXECUTION CUES
              </Text>
            </View>

            {/* Vertical timeline */}
            <View style={styles.cuesTimeline}>
              {/* Vertical line */}
              <View
                style={[
                  styles.timelineLine,
                  { backgroundColor: t.surfaceContainerHighest },
                ]}
              />

              {cues.map((cue, index) => (
                <View key={index} style={styles.cueItem}>
                  {/* Step circle */}
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
                      {cueLabels[index] ?? `STEP ${index + 1}`}
                    </Text>
                    <Text style={[styles.cueText, { color: t.onSurfaceVariant }]}>
                      {cue.trim()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Spacer for sticky CTA */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── 4. Sticky CTA ── */}
        <View
          style={[
            styles.ctaArea,
            {
              backgroundColor: t.background,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.ctaButton,
              {
                backgroundColor: t.primaryContainer,
                shadowColor: t.primaryContainer,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push('/routine-builder')}
            accessibilityRole="button"
            accessibilityLabel="Add this exercise to your routine"
          >
            <Text style={[styles.ctaButtonText, { color: '#000' }]}>+ ADD TO ROUTINE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  notFoundText: { fontSize: 18 },
  backBtn: { padding: 12 },
  backBtnText: { fontSize: 16, fontWeight: '600' },
  // Hero
  heroArea: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%', opacity: 0.8 },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderIcon: { fontSize: 64 },
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
  demoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Header content
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    gap: 12,
  },
  exerciseTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseType: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  typeDot: {
    width: 4,
    height: 4,
    borderRadius: 99,
  },
  exerciseEquip: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  exerciseName: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  muscleTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
  },
  muscleTagText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Execution cues
  cuesSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 32,
  },
  cuesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cuesSectionIcon: { fontSize: 20 },
  cuesSectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  cueItem: {
    flexDirection: 'row',
    gap: 16,
  },
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
  cueNum: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  cueContent: { flex: 1, gap: 8 },
  cueLabel: {
    fontSize: 20,
    fontWeight: '600',
  },
  cueText: {
    fontSize: 18,
    lineHeight: 28,
  },
  // CTA
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
    flexDirection: 'row',
    gap: 12,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
