/**
 * Routine Builder Screen — Stitch `routine_builder_canonical_purple` layout:
 *   1. TopAppBar
 *   2. Routine name input (transparent, display-xl size, UPPERCASE placeholder)
 *   3. Category tags (pills row)
 *   4. Exercise blocks (SET / LBS / REPS grid with copy, add set)
 *   5. ADD EXERCISE dashed button
 *   6. SAVE ROUTINE primary CTA (large, neon glow)
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import {
  useExercises,
  useCreateRoutine,
  useCurrentProfile,
  useSetDayRoutine,
  useRoutine,
} from '@/lib/hooks';
import type { DayOfWeek, Exercise } from '@/types';

type DraftSet = { weight: number; reps: number };
type DraftExercise = {
  exercise_id: string;
  exercise: Exercise;
  sets: DraftSet[];
  rest_seconds: number;
};

const DEFAULT_SETS: DraftSet[] = [
  { weight: 0, reps: 10 },
  { weight: 0, reps: 10 },
  { weight: 0, reps: 10 },
];

export default function RoutineBuilderScreen() {
  const router = useRouter();
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile } = useCurrentProfile();
  const { data: existingRoutine, isLoading: isLoadingRoutine } = useRoutine(id);
  const createRoutine = useCreateRoutine(profile || undefined);
  const setDayRoutine = useSetDayRoutine(profile?.id);

  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek | null>(null);
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExerciseModalVisible, setIsExerciseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allExercises } = useExercises();

  useEffect(() => {
    if (existingRoutine) {
      setName(existingRoutine.name || '');
      setExercises(
        existingRoutine.exercises?.map((e) => ({
          exercise_id: e.exercise_id,
          exercise: e.exercise,
          sets: Array.from({ length: e.sets || 3 }, () => ({
            weight: e.weight || 0,
            reps: e.reps || 10,
          })),
          rest_seconds: e.rest_seconds || 60,
        })) || []
      );
      setIsEditMode(true);
    }
  }, [existingRoutine]);

  const filteredExercises = useMemo(() => {
    if (!allExercises) return [];
    if (!searchQuery) return allExercises;
    const q = searchQuery.toLowerCase();
    return allExercises.filter((e) =>
      (e.name_en || '').toLowerCase().includes(q) ||
      (e.muscle_group || '').toLowerCase().includes(q)
    );
  }, [allExercises, searchQuery]);

  const handleAddExercise = (exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        exercise,
        sets: [...DEFAULT_SETS],
        rest_seconds: 60,
      },
    ]);
    setIsExerciseModalVisible(false);
    setSearchQuery('');
  };

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof DraftSet,
    value: number
  ) => {
    setExercises((prev) => {
      const next = [...prev];
      const sets = [...next[exIndex].sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      next[exIndex] = { ...next[exIndex], sets };
      return next;
    });
  };

  const handleAddSet = (exIndex: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const last = next[exIndex].sets.at(-1) ?? { weight: 0, reps: 10 };
      next[exIndex] = {
        ...next[exIndex],
        sets: [...next[exIndex].sets, { ...last }],
      };
      return next;
    });
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0 || !profile) {
      Alert.alert('Incomplete', 'Please add a name and at least one exercise.');
      return;
    }
    try {
      const newRoutine = await createRoutine.mutateAsync({
        routine: { name, description: '', status: 'active' },
        exercises: exercises.flatMap((ex) =>
          ex.sets.map((set, i) => ({
            exercise_id: ex.exercise_id,
            sets: ex.sets.length,
            reps: set.reps,
            weight: set.weight,
            rest_seconds: ex.rest_seconds,
            day_of_week: null,
            order_index: i,
            duration_seconds: null,
            notes: null,
          }))
        ),
      });
      if (dayOfWeek !== null) {
        await setDayRoutine.mutateAsync({ dayOfWeek, routineId: newRoutine.id });
      }
      router.back();
    } catch (error) {
      console.error('Failed to save routine', error);
      Alert.alert('Error', 'Could not save routine. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <ScrollView
        style={[styles.scroll, { backgroundColor: t.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Routine Name ── */}
        <TextInput
          style={[styles.routineNameInput, { color: t.onBackground }]}
          placeholder="ROUTINE NAME"
          placeholderTextColor={t.surfaceVariant}
          value={name}
          onChangeText={setName}
          autoCapitalize="characters"
        />

        {/* ── Tag Pills ── */}
        <View style={styles.tagRow}>
          <View
            style={[
              styles.tag,
              {
                backgroundColor: `${t.primaryContainer}22`,
                borderColor: `${t.primaryContainer}44`,
              },
            ]}
          >
            <Text style={[styles.tagText, { color: t.primaryContainer }]}>STRENGTH</Text>
          </View>
          <View
            style={[
              styles.tag,
              { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest },
            ]}
          >
            <Text style={[styles.tagText, { color: t.onSurfaceVariant }]}>HYPERTROPHY</Text>
          </View>
        </View>

        {/* ── Exercise Blocks ── */}
        <View style={styles.exercisesContainer}>
          {exercises.map((draft, exIndex) => (
            <View
              key={exIndex}
              style={[
                styles.exerciseBlock,
                {
                  backgroundColor: t.surfaceContainer,
                  borderColor: t.surfaceContainerHighest,
                },
              ]}
            >
              {/* Block header */}
              <View style={styles.blockHeader}>
                <View style={styles.blockHeaderInfo}>
                  <Text style={[styles.blockName, { color: t.onSurface }]}>
                    {(draft.exercise.name_en || 'EXERCISE').toUpperCase()}
                  </Text>
                  <Text style={[styles.blockMeta, { color: t.primaryContainer }]}>
                    Target: {draft.exercise.muscle_group || 'N/A'}
                  </Text>
                </View>
                <View style={styles.blockHeaderActions}>
                  <TouchableOpacity
                    style={styles.blockIconBtn}
                    onPress={() => handleRemoveExercise(exIndex)}
                  >
                    <Text style={[styles.blockIconText, { color: t.outlineVariant }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sets table */}
              <View style={styles.setsContainer}>
                {/* Column headers */}
                <View style={styles.setsHeaderRow}>
                  <Text style={[styles.setColLabel, { color: t.outlineVariant, flex: 0.4 }]}>SET</Text>
                  <Text style={[styles.setColLabel, { color: t.outlineVariant, flex: 1 }]}>LBS</Text>
                  <Text style={[styles.setColLabel, { color: t.outlineVariant, flex: 1 }]}>REPS</Text>
                  <View style={{ width: 48 }} />
                </View>

                {draft.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    <Text
                      style={[
                        styles.setNum,
                        { color: t.surfaceVariant, flex: 0.4 },
                      ]}
                    >
                      {setIndex + 1}
                    </Text>
                    <TextInput
                      style={[
                        styles.setInput,
                        {
                          backgroundColor: t.surfaceContainerHigh,
                          color: t.onSurface,
                          flex: 1,
                        },
                      ]}
                      keyboardType="numeric"
                      value={String(set.weight)}
                      onChangeText={(v) =>
                        handleUpdateSet(exIndex, setIndex, 'weight', parseInt(v) || 0)
                      }
                      textAlign="center"
                    />
                    <TextInput
                      style={[
                        styles.setInput,
                        {
                          backgroundColor: t.surfaceContainerHigh,
                          color: t.onSurface,
                          flex: 1,
                        },
                      ]}
                      keyboardType="numeric"
                      value={String(set.reps)}
                      onChangeText={(v) =>
                        handleUpdateSet(exIndex, setIndex, 'reps', parseInt(v) || 0)
                      }
                      textAlign="center"
                    />
                    <TouchableOpacity
                      style={[
                        styles.copyBtn,
                        { backgroundColor: t.surfaceContainerHighest },
                      ]}
                      onPress={() => {
                        const lastSet = draft.sets.at(-1) ?? set;
                        handleAddSet(exIndex);
                      }}
                    >
                      <Text style={[styles.copyBtnText, { color: t.outline }]}>⧉</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add set */}
                <TouchableOpacity
                  style={[
                    styles.addSetBtn,
                    {
                      borderColor: `${t.primaryContainer}44`,
                    },
                  ]}
                  onPress={() => handleAddSet(exIndex)}
                >
                  <Text style={[styles.addSetBtnText, { color: t.primaryContainer }]}>
                    + ADD SET
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── ADD EXERCISE dashed button ── */}
        <TouchableOpacity
          style={[
            styles.addExerciseBtn,
            {
              borderColor: t.surfaceContainerHighest,
            },
          ]}
          activeOpacity={0.7}
          onPress={() => setIsExerciseModalVisible(true)}
        >
          <Text style={[styles.addExerciseBtnIcon, { color: t.onSurfaceVariant }]}>⊕</Text>
          <Text style={[styles.addExerciseBtnText, { color: t.onSurfaceVariant }]}>
            ADD EXERCISE
          </Text>
        </TouchableOpacity>

        {/* ── SAVE ROUTINE CTA ── */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            {
              backgroundColor: t.primaryContainer,
              shadowColor: t.primaryContainer,
            },
          ]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={createRoutine.isPending}
        >
          <Text style={[styles.saveBtnText, { color: t.onPrimaryContainer }]}>
            {createRoutine.isPending ? 'SAVING...' : 'SAVE ROUTINE'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Exercise Search Modal ── */}
      <Modal
        visible={isExerciseModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsExerciseModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: t.surfaceContainer }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: t.onSurface }]}>Select Exercise</Text>
            <TouchableOpacity onPress={() => setIsExerciseModalVisible(false)}>
              <Text style={[styles.modalClose, { color: t.primaryContainer }]}>Close</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[
              styles.modalSearch,
              {
                backgroundColor: t.surfaceContainerHigh,
                color: t.onSurface,
                borderColor: t.surfaceContainerHighest,
              },
            ]}
            placeholder="Search exercises..."
            placeholderTextColor={t.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={[styles.modalExerciseRow, { backgroundColor: t.surfaceContainerHigh }]}
                onPress={() => handleAddExercise(exercise)}
              >
                <View>
                  <Text style={[styles.modalExerciseName, { color: t.onSurface }]}>
                    {exercise.name_en}
                  </Text>
                  <Text style={[styles.modalExerciseMeta, { color: t.onSurfaceVariant }]}>
                    {exercise.muscle_group}
                  </Text>
                </View>
                <Text style={[styles.modalExerciseAdd, { color: t.primaryContainer }]}>+</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 48,
  },
  // Routine name
  routineNameInput: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1,
    textTransform: 'uppercase',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  // Tags
  tagRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Exercise blocks
  exercisesContainer: { gap: 12 },
  exerciseBlock: {
    borderRadius: 12,
    padding: 24,
    gap: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  blockHeaderInfo: { gap: 4 },
  blockName: {
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  blockMeta: { fontSize: 14, lineHeight: 20 },
  blockHeaderActions: { flexDirection: 'row', gap: 8 },
  blockIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockIconText: { fontSize: 16 },
  // Sets
  setsContainer: { gap: 12 },
  setsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 8,
  },
  setColLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  setNum: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  setInput: {
    height: 48,
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '600',
  },
  copyBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: { fontSize: 18 },
  addSetBtn: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addSetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Add exercise / Save
  addExerciseBtn: {
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
  addExerciseBtnIcon: { fontSize: 20 },
  addExerciseBtnText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  saveBtn: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  saveBtnText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  // Modal
  modalSafeArea: { flex: 1, padding: 24, gap: 16 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  modalTitle: { fontSize: 24, fontWeight: '700' },
  modalClose: { fontSize: 16, fontWeight: '600' },
  modalSearch: {
    height: 64,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    borderWidth: 1,
  },
  modalExerciseRow: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalExerciseName: { fontSize: 18, fontWeight: '700' },
  modalExerciseMeta: { fontSize: 14, marginTop: 2 },
  modalExerciseAdd: { fontSize: 24, fontWeight: '700' },
});
