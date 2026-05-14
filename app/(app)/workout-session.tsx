/**
 * Workout Session Screen — Stitch "Active Training" layout:
 *   1. Sticky Header: Progress bar (thin, neon) + Exit button
 *   2. Hero Area: LARGE EXERCISE NAME (display-xl) + Focus Cue
 *   3. Data Display: LARGE SET/REP digits with accent color
 *   4. Control Bar: NEXT EXERCISE (primary CTA) + FINISH (secondary)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LoadingScreen } from '@/components/ui';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRoutine } from '@/lib/hooks';
import type { RoutineWithExercises } from '@/types';

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { data: routine, isLoading } = useRoutine(id);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) return <LoadingScreen />;

  const typedRoutine = routine as RoutineWithExercises;

  if (!typedRoutine || !typedRoutine.exercises[currentIndex]) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]}>
        <View style={styles.completeView}>
          <Text style={[styles.completeEmoji]}>★</Text>
          <Text style={[styles.completeTitle, { color: t.onSurface }]}>PROTOCOL COMPLETE</Text>
          <Text style={[styles.completeSubtitle, { color: t.onSurfaceVariant }]}>
            All objectives achieved. Performance data synced.
          </Text>
          <TouchableOpacity
            style={[styles.finishBtn, { backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }]}
            onPress={() => router.replace('/(app)')}
          >
            <Text style={[styles.finishBtnText, { color: '#000' }]}>CLOSE SESSION</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentItem = typedRoutine.exercises[currentIndex];
  const isLast = currentIndex === typedRoutine.exercises.length - 1;
  const progress = ((currentIndex + 1) / typedRoutine.exercises.length) * 100;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      {/* ── 1. Progress Header ── */}
      <View style={[styles.header, { borderBottomColor: t.surfaceContainer }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.sessionStatus, { color: t.primaryContainer }]}>ACTIVE SESSION</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.exitBtn, { color: t.outlineVariant }]}>EXIT</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: t.surfaceContainerHigh }]}>
          <View 
            style={[styles.progressFill, { backgroundColor: t.primaryContainer, width: `${progress}%`, shadowColor: t.primaryContainer }]} 
          />
        </View>
        <Text style={[styles.progressLabel, { color: t.onSurfaceVariant }]}>
          MOVEMENT {currentIndex + 1} OF {typedRoutine.exercises.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 2. Focus Area ── */}
        <View style={styles.focusArea}>
          <Text style={[styles.movementLabel, { color: t.outline }]}>CURRENT OBJECTIVE</Text>
          <Text style={[styles.exerciseName, { color: t.onSurface }]}>
            {currentItem.exercise?.name_en?.toUpperCase()}
          </Text>
          
          <View style={[styles.targetRow, { borderTopColor: t.surfaceContainer, borderBottomColor: t.surfaceContainer }]}>
            <View style={styles.targetItem}>
              <Text style={[styles.targetValue, { color: t.primaryContainer }]}>{currentItem.sets}</Text>
              <Text style={[styles.targetLabel, { color: t.onSurfaceVariant }]}>TARGET SETS</Text>
            </View>
            <View style={[styles.targetDivider, { backgroundColor: t.surfaceContainer }]} />
            <View style={styles.targetItem}>
              <Text style={[styles.targetValue, { color: t.primaryContainer }]}>
                {currentItem.reps || currentItem.duration_seconds}
              </Text>
              <Text style={[styles.targetLabel, { color: t.onSurfaceVariant }]}>
                {currentItem.reps ? 'REPS / SET' : 'SECONDS'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Performance Notes ── */}
        <View style={[styles.notesCard, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
          <Text style={[styles.notesTitle, { color: t.primaryContainer }]}>SYSTEM GUIDANCE</Text>
          <Text style={[styles.notesText, { color: t.onSurfaceVariant }]}>
            {currentItem.notes || 'Focus on peak contraction and explosive movement. Maintain mechanical tension throughout the set.'}
          </Text>
        </View>
      </ScrollView>

      {/* ── 4. Control Area ── */}
      <View style={[styles.controls, { backgroundColor: t.background }]}>
        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: t.primaryContainer,
              shadowColor: t.primaryContainer,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => setCurrentIndex(prev => prev + 1)}
        >
          <Text style={[styles.nextBtnText, { color: '#000' }]}>
            {isLast ? 'FINISH WORKOUT  ✓' : 'NEXT MOVEMENT  ▶'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionStatus: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  exitBtn: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  focusArea: {
    paddingHorizontal: 20,
    paddingTop: 48,
    alignItems: 'center',
    gap: 12,
  },
  movementLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
  },
  exerciseName: {
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 32,
  },
  targetRow: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  targetItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  targetValue: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
  },
  targetLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  targetDivider: {
    width: 1,
    height: 64,
  },
  notesCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  nextBtn: {
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 8,
  },
  nextBtnText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  // Complete View
  completeView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  completeEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  completeSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  finishBtn: {
    height: 72,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  finishBtnText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
