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
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { LoadingScreen } from '@/components/ui';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRoutine } from '@/lib/hooks';
import type { RoutineWithExercises } from '@/types';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { data: routine, isLoading } = useRoutine(id);

  if (isLoading) return <LoadingScreen />;

  if (!routine) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
        <AppTopBar />
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: t.onSurfaceVariant }]}>Routine not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: t.primaryContainer }]}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typedRoutine = routine as RoutineWithExercises;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── 1. Hero Section ── */}
          <View style={styles.heroSection}>
            <View
              style={[
                styles.heroBadge,
                {
                  backgroundColor: `${t.primaryContainer}22`,
                  borderColor: `${t.primaryContainer}44`,
                },
              ]}
            >
              <Text style={[styles.heroBadgeText, { color: t.primaryContainer }]}>
                READY TO TRAIN
              </Text>
            </View>
            <Text style={[styles.routineName, { color: t.onSurface }]}>
              {typedRoutine.name.toUpperCase()}
            </Text>
            
            {/* Stats Bento */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
                <Text style={[styles.statLabel, { color: t.outline }]}>MOVEMENTS</Text>
                <Text style={[styles.statValue, { color: t.onSurface }]}>{typedRoutine.exercises?.length ?? 0}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
                <Text style={[styles.statLabel, { color: t.outline }]}>EST. TIME</Text>
                <Text style={[styles.statValue, { color: t.onSurface }]}>45m</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
                <Text style={[styles.statLabel, { color: t.outline }]}>DIFFICULTY</Text>
                <Text style={[styles.statValue, { color: t.onSurface }]}>HARD</Text>
              </View>
            </View>
          </View>

          {/* ── 2. Exercise List ── */}
          <View style={styles.exerciseSection}>
            <Text style={[styles.sectionTitle, { color: t.onSurfaceVariant }]}>EXERCISE PROTOCOL</Text>
            <View style={styles.exerciseList}>
              {typedRoutine.exercises?.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: t.surfaceContainer,
                      borderColor: t.surfaceContainerHighest,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/exercise/${item.exercise_id}`)}
                >
                  <View style={[styles.exerciseIndex, { backgroundColor: t.surfaceContainerHigh }]}>
                    <Text style={[styles.exerciseIndexText, { color: t.primaryContainer }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: t.onSurface }]}>
                      {item.exercise?.name_en?.toUpperCase()}
                    </Text>
                    <Text style={[styles.exerciseMeta, { color: t.onSurfaceVariant }]}>
                      {item.sets} SETS • {item.reps ? `${item.reps} REPS` : `${item.duration_seconds}s`}
                    </Text>
                  </View>
                  <Text style={[styles.chevron, { color: t.outlineVariant }]}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Spacer for sticky CTA */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── 3. Sticky CTA ── */}
        <View style={[styles.ctaArea, { backgroundColor: t.background }]}>
          <TouchableOpacity
            style={[
              styles.ctaButton,
              {
                backgroundColor: t.primaryContainer,
                shadowColor: t.primaryContainer,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/workout-session', params: { id: typedRoutine.id } })}
          >
            <Text style={[styles.ctaButtonText, { color: '#000' }]}>START SESSION  ▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundText: { fontSize: 18 },
  backBtn: { padding: 12 },
  backBtnText: { fontSize: 16, fontWeight: '600' },
  // Hero
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 16,
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  routineName: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  // Exercises
  exerciseSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  exerciseList: { gap: 12 },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  exerciseIndex: {
    width: 40,
    height: 40,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIndexText: {
    fontSize: 18,
    fontWeight: '800',
  },
  exerciseInfo: { flex: 1, gap: 4 },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
  },
  exerciseMeta: {
    fontSize: 13,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  // CTA
  ctaArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  ctaButton: {
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  ctaButtonText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
