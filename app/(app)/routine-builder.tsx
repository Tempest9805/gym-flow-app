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
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: t.background }} 
      edges={['top']}
    >
      <AppTopBar />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: t.background }}
        contentContainerStyle={{ 
          paddingTop: 24, 
          paddingHorizontal: 20, 
          paddingBottom: 120, 
          gap: 48 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Routine Name ── */}
        <TextInput
          className="text-5xl font-extrabold leading-[52px] tracking-tighter uppercase p-0 bg-transparent"
          style={{ color: t.onBackground }}
          placeholder="ROUTINE NAME"
          placeholderTextColor={t.surfaceVariant}
          value={name}
          onChangeText={setName}
          autoCapitalize="characters"
        />

        {/* ── Tag Pills ── */}
        <View className="flex-row gap-3 flex-wrap">
          <View
            className="px-3 py-1 rounded-full border"
            style={{
              backgroundColor: `${t.primaryContainer}22`,
              borderColor: `${t.primaryContainer}44`,
            }}
          >
            <Text className="text-[11px] font-bold tracking-widest uppercase" style={{ color: t.primaryContainer }}>STRENGTH</Text>
          </View>
          <View
            className="px-3 py-1 rounded-full border"
            style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
          >
            <Text className="text-[11px] font-bold tracking-widest uppercase" style={{ color: t.onSurfaceVariant }}>HYPERTROPHY</Text>
          </View>
        </View>

        {/* ── Exercise Blocks ── */}
        <View className="gap-3">
          {exercises.map((draft, exIndex) => (
            <View
              key={exIndex}
              className="rounded-xl p-6 gap-6 border shadow-2xl elevation-md"
              style={{
                backgroundColor: t.surfaceContainer,
                borderColor: t.surfaceContainerHighest,
                shadowColor: '#000',
              }}
            >
              {/* Block header */}
              <View className="flex-row justify-between items-start">
                <View className="gap-1">
                  <Text className="text-xl font-bold uppercase" style={{ color: t.onSurface }}>
                    {(draft.exercise.name_en || 'EXERCISE').toUpperCase()}
                  </Text>
                  <Text className="text-sm leading-5" style={{ color: t.primaryContainer }}>
                    Target: {draft.exercise.muscle_group || 'N/A'}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="w-9 h-9 rounded-full items-center justify-center"
                    onPress={() => handleRemoveExercise(exIndex)}
                  >
                    <Text className="text-base" style={{ color: t.outlineVariant }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sets table */}
              <View className="gap-3">
                {/* Column headers */}
                <View className="flex-row items-center gap-4 px-2">
                  <Text className="text-[11px] font-bold tracking-widest uppercase text-center flex-[0.4]" style={{ color: t.outlineVariant }}>SET</Text>
                  <Text className="text-[11px] font-bold tracking-widest uppercase text-center flex-1" style={{ color: t.outlineVariant }}>LBS</Text>
                  <Text className="text-[11px] font-bold tracking-widest uppercase text-center flex-1" style={{ color: t.outlineVariant }}>REPS</Text>
                  <View className="w-12" />
                </View>

                {draft.sets.map((set, setIndex) => (
                  <View key={setIndex} className="flex-row items-center gap-4">
                    <Text
                      className="text-xl font-semibold text-center flex-[0.4]"
                      style={{ color: t.surfaceVariant }}
                    >
                      {setIndex + 1}
                    </Text>
                    <TextInput
                      className="h-12 rounded-lg text-xl font-semibold text-center flex-1"
                      style={{
                        backgroundColor: t.surfaceContainerHigh,
                        color: t.onSurface,
                      }}
                      keyboardType="numeric"
                      value={String(set.weight)}
                      onChangeText={(v) =>
                        handleUpdateSet(exIndex, setIndex, 'weight', parseInt(v) || 0)
                      }
                    />
                    <TextInput
                      className="h-12 rounded-lg text-xl font-semibold text-center flex-1"
                      style={{
                        backgroundColor: t.surfaceContainerHigh,
                        color: t.onSurface,
                      }}
                      keyboardType="numeric"
                      value={String(set.reps)}
                      onChangeText={(v) =>
                        handleUpdateSet(exIndex, setIndex, 'reps', parseInt(v) || 0)
                      }
                    />
                    <TouchableOpacity
                      className="w-12 h-12 rounded-lg items-center justify-center"
                      style={{ backgroundColor: t.surfaceContainerHighest }}
                      onPress={() => {
                        const lastSet = draft.sets.at(-1) ?? set;
                        handleAddSet(exIndex);
                      }}
                    >
                      <Text className="text-lg" style={{ color: t.outline }}>⧉</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add set */}
                <TouchableOpacity
                  className="h-12 rounded-lg border border-dashed items-center justify-center mt-2"
                  style={{
                    borderColor: `${t.primaryContainer}44`,
                  }}
                  onPress={() => handleAddSet(exIndex)}
                >
                  <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.primaryContainer }}>
                    + ADD SET
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── ADD EXERCISE dashed button ── */}
        <TouchableOpacity
          className="w-full h-16 rounded-xl border-2 border-dashed flex-row items-center justify-center gap-3"
          style={{ borderColor: t.surfaceContainerHighest }}
          activeOpacity={0.7}
          onPress={() => setIsExerciseModalVisible(true)}
        >
          <Text className="text-xl" style={{ color: t.onSurfaceVariant }}>⊕</Text>
          <Text className="text-base font-semibold uppercase tracking-widest" style={{ color: t.onSurfaceVariant }}>
            ADD EXERCISE
          </Text>
        </TouchableOpacity>

        {/* ── SAVE ROUTINE CTA ── */}
        <TouchableOpacity
          className="w-full h-20 rounded-xl items-center justify-center shadow-2xl elevation-md"
          style={{
            backgroundColor: t.primaryContainer,
            shadowColor: t.primaryContainer,
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 16,
          }}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={createRoutine.isPending}
        >
          <Text className="text-xl font-bold tracking-[3px] uppercase" style={{ color: t.onPrimaryContainer }}>
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
        <SafeAreaView 
          className="flex-1 p-6 gap-4" 
          style={{ backgroundColor: t.surfaceContainer }}
        >
          <View className="flex-row justify-between items-center mt-4 mb-2">
            <Text className="text-2xl font-bold" style={{ color: t.onSurface }}>Select Exercise</Text>
            <TouchableOpacity onPress={() => setIsExerciseModalVisible(false)}>
              <Text className="text-base font-semibold" style={{ color: t.primaryContainer }}>Close</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="h-16 rounded-xl px-4 text-lg border"
            style={{
              backgroundColor: t.surfaceContainerHigh,
              color: t.onSurface,
              borderColor: t.surfaceContainerHighest,
            }}
            placeholder="Search exercises..."
            placeholderTextColor={t.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                className="p-4 rounded-xl mb-3 flex-row justify-between items-center"
                style={{ backgroundColor: t.surfaceContainerHigh }}
                onPress={() => handleAddExercise(exercise)}
              >
                <View>
                  <Text className="text-lg font-bold" style={{ color: t.onSurface }}>
                    {exercise.name_en}
                  </Text>
                  <Text className="text-sm mt-0.5" style={{ color: t.onSurfaceVariant }}>
                    {exercise.muscle_group}
                  </Text>
                </View>
                <Text className="text-2xl font-bold" style={{ color: t.primaryContainer }}>+</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
