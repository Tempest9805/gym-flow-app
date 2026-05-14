/**
 * Routines Screen — Stitch `routine_builder_canonical_purple` listing view:
 *   1. TopAppBar
 *   2. Routines list with exercise blocks
 *   3. Import routine + Create new CTAs
 *
 * The share / import Distribution Hub matches stitch `share_import_canonical_purple`.
 */
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useCurrentProfile, useRoutines } from '@/lib/hooks';
import type { RoutineWithExercises } from '@/types';

export default function RoutinesScreen() {
  const router = useRouter();
  const t = useTheme();
  const { data: profile } = useCurrentProfile();
  // Cast to RoutineWithExercises[] — API returns exercises joined
  const { data: routines, isLoading } = useRoutines(profile || undefined);
  const typedRoutines = (routines ?? []) as RoutineWithExercises[];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <FlatList
        style={[styles.list, { backgroundColor: t.background }]}
        contentContainerStyle={styles.content}
        data={typedRoutines}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Title — styled as routine-builder Stitch header */}
            <Text style={[styles.pageTitle, { color: t.onBackground }]}>ROUTINES</Text>
            <Text style={[styles.pageSubtitle, { color: t.onSurfaceVariant }]}>
              Your training blueprints
            </Text>
            {isLoading && (
              <ActivityIndicator color={t.primaryContainer} style={{ marginTop: 16 }} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.routineCard,
              {
                backgroundColor: t.surfaceContainer,
                borderColor: t.surfaceContainerHighest,
              },
            ]}
          >
            {/* Card header */}
            <View style={styles.routineCardHeader}>
              <View style={styles.routineCardMeta}>
                <Text style={[styles.routineName, { color: t.onSurface }]}>
                  {item.name.toUpperCase()}
                </Text>
                <Text style={[styles.routineExerciseCount, { color: t.primaryContainer }]}>
                  {item.exercises?.length ?? 0} exercises
                </Text>
              </View>
              <View style={styles.routineCardActions}>
                {/* Drag indicator placeholder */}
                <TouchableOpacity
                  style={styles.routineIconButton}
                  onPress={() =>
                    router.push({ pathname: '/routine-builder', params: { id: item.id } })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={[styles.routineIconText, { color: t.outlineVariant }]}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.routineIconButton}
                  onPress={() => router.push(`/share/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.routineIconText, { color: t.primaryContainer }]}>⬆</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Exercise pills preview */}
            {item.exercises && item.exercises.length > 0 && (
              <View style={styles.exercisePills}>
                {item.exercises.slice(0, 3).map((ex, i) => (
                  <View
                    key={ex.id ?? i}
                    style={[
                      styles.exercisePill,
                      { backgroundColor: t.surfaceContainerHigh, borderColor: t.surfaceContainerHighest },
                    ]}
                  >
                    <Text style={[styles.exercisePillText, { color: t.onSurface }]}>
                      {ex.exercise?.name_en ?? 'Exercise'}
                    </Text>
                  </View>
                ))}
                {item.exercises.length > 3 && (
                  <Text style={[styles.exercisePillMore, { color: t.outlineVariant }]}>
                    +{item.exercises.length - 3} more
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: t.onSurface }]}>No routines yet</Text>
              <Text style={[styles.emptySubtitle, { color: t.onSurfaceVariant }]}>
                Create your first training blueprint below
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {/* ADD EXERCISE — dashed button (Stitch pattern) */}
            <TouchableOpacity
              style={[
                styles.addExerciseButton,
                {
                  borderColor: t.surfaceContainerHighest,
                  backgroundColor: 'transparent',
                },
              ]}
              activeOpacity={0.7}
              onPress={() => router.push('/import-routine')}
            >
              <Text style={[styles.addExerciseIcon, { color: t.onSurfaceVariant }]}>⬇</Text>
              <Text style={[styles.addExerciseText, { color: t.onSurfaceVariant }]}>
                IMPORT ROUTINE
              </Text>
            </TouchableOpacity>

            {/* SAVE ROUTINE — primary CTA */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: t.primaryContainer,
                  shadowColor: t.primaryContainer,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => router.push('/routine-builder')}
            >
              <Text style={[styles.saveButtonText, { color: t.onPrimaryContainer }]}>
                + CREATE ROUTINE
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { flex: 1 },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  pageTitle: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 52,
    textTransform: 'uppercase',
  },
  pageSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Routine card
  routineCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    gap: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  routineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routineCardMeta: { gap: 4 },
  routineName: {
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  routineExerciseCount: {
    fontSize: 14,
    lineHeight: 20,
  },
  routineCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  routineIconButton: {
    width: 40,
    height: 40,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineIconText: { fontSize: 18 },
  exercisePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exercisePill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  exercisePillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exercisePillMore: {
    fontSize: 12,
    lineHeight: 24,
  },
  emptyState: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Footer CTAs
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  addExerciseButton: {
    width: '100%',
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addExerciseIcon: { fontSize: 18 },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  saveButton: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
