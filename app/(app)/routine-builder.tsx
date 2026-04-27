import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Modal, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer, BaseButton, CardBase, LoadingScreen } from '@/components/ui';
import { useExercises, useCreateRoutine, useCurrentProfile, useSetDayRoutine, useRoutine } from '@/lib/hooks';
import type { DayOfWeek, Exercise, RoutineWithExercises } from '@/types';

// Omit id and routine_id for creating
type DraftExercise = {
  exercise_id: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight: number;
  rest_seconds: number;
};

export default function RoutineBuilderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile } = useCurrentProfile();
  const { data: existingRoutine, isLoading: isLoadingRoutine } = useRoutine(id);
  const createRoutine = useCreateRoutine(profile || undefined);
  const setDayRoutine = useSetDayRoutine(profile?.id);

  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek | null>(null);
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (existingRoutine) {
      setName(existingRoutine.name || '');
      setExercises(
        existingRoutine.exercises?.map((e) => ({
          exercise_id: e.exercise_id,
          exercise: e.exercise,
          sets: e.sets || 3,
          reps: e.reps || 10,
          weight: e.weight || 0,
          rest_seconds: e.rest_seconds || 60,
        })) || []
      );
      setIsEditMode(true);
    }
  }, [existingRoutine]);

  const isLoading = isEditMode && isLoadingRoutine;

  if (isEditMode && isLoading) {
    return <LoadingScreen />;
  }

  // Modal State
  const [isExerciseModalVisible, setIsExerciseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allExercises } = useExercises();

  const filteredExercises = useMemo(() => {
    if (!allExercises) return [];
    if (!searchQuery) return allExercises;
    return allExercises.filter((e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allExercises, searchQuery]);

  const handleAddExercise = (exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        exercise,
        sets: 3,
        reps: 10,
        weight: 0,
        rest_seconds: 60,
      },
    ]);
    setIsExerciseModalVisible(false);
    setSearchQuery('');
  };

  const handleUpdateExercise = (index: number, field: keyof DraftExercise, value: number) => {
    setExercises((prev) => {
      const newEx = [...prev];
      newEx[index] = { ...newEx[index], [field]: value };
      return newEx;
    });
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0 || !profile) return;

    try {
      const newRoutine = await createRoutine.mutateAsync({
        routine: {
          name,
          description: '',
          status: 'active',
        },
        exercises: exercises.map((e) => ({
          exercise_id: e.exercise_id,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          rest_seconds: e.rest_seconds,
          day_of_week: null,
          order_index: null,
          duration_seconds: null,
          notes: null,
        })),
      });

      if (dayOfWeek !== null) {
        await setDayRoutine.mutateAsync({
          dayOfWeek,
          routineId: newRoutine.id,
        });
      }

      router.back();
    } catch (error) {
      console.error('Failed to create routine', error);
    }
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-primary">
            {isEditMode ? 'Edit Routine' : 'Routine Builder'}
          </Text>
          <Text className="text-lg text-text-secondary mt-1">
            {isEditMode ? 'Modify your workout' : 'Create your custom workout'}
          </Text>
        </View>

        {/* Name Input */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-text-secondary uppercase mb-2">Routine Name</Text>
          <TextInput
            className="bg-surface-secondary text-text-primary text-lg p-4 rounded-xl border border-surface-tertiary"
            placeholder="e.g. Upper Body Power"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Day of Week Selection */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-text-secondary uppercase mb-2">Assign to Day (Optional)</Text>
          <View className="flex-row justify-between">
            {DAYS.map((day, index) => (
              <Pressable
                key={day}
                onPress={() => setDayOfWeek(index as DayOfWeek)}
                className={`flex-1 mx-1 py-3 items-center rounded-lg ${
                  dayOfWeek === index ? 'bg-primary-600' : 'bg-surface-secondary'
                }`}
              >
                <Text
                  className={`text-xs font-bold uppercase ${
                    dayOfWeek === index ? 'text-white' : 'text-text-secondary'
                  }`}
                >
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Exercises List */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-text-secondary uppercase mb-2">Exercises</Text>
          {exercises.map((draft, index) => (
            <CardBase key={index} className="mb-4 p-4 border border-surface-tertiary">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-text-primary flex-1">
                  {draft.exercise.name}
                </Text>
                <Pressable onPress={() => handleRemoveExercise(index)}>
                  <Text className="text-error font-bold">Remove</Text>
                </Pressable>
              </View>

              <View className="flex-row justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-xs text-text-secondary mb-1 uppercase">Sets</Text>
                  <TextInput
                    className="bg-surface-secondary text-text-primary p-3 rounded-lg text-center font-bold"
                    keyboardType="numeric"
                    value={String(draft.sets)}
                    onChangeText={(v) => handleUpdateExercise(index, 'sets', parseInt(v) || 0)}
                  />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-xs text-text-secondary mb-1 uppercase">Reps</Text>
                  <TextInput
                    className="bg-surface-secondary text-text-primary p-3 rounded-lg text-center font-bold"
                    keyboardType="numeric"
                    value={String(draft.reps)}
                    onChangeText={(v) => handleUpdateExercise(index, 'reps', parseInt(v) || 0)}
                  />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-xs text-text-secondary mb-1 uppercase">Lbs</Text>
                  <TextInput
                    className="bg-surface-secondary text-text-primary p-3 rounded-lg text-center font-bold"
                    keyboardType="numeric"
                    value={String(draft.weight)}
                    onChangeText={(v) => handleUpdateExercise(index, 'weight', parseInt(v) || 0)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-text-secondary mb-1 uppercase">Rest(s)</Text>
                  <TextInput
                    className="bg-surface-secondary text-text-primary p-3 rounded-lg text-center font-bold"
                    keyboardType="numeric"
                    value={String(draft.rest_seconds)}
                    onChangeText={(v) => handleUpdateExercise(index, 'rest_seconds', parseInt(v) || 0)}
                  />
                </View>
              </View>
            </CardBase>
          ))}

          <BaseButton
            title="+ Add Exercise"
            variant="outline"
            onPress={() => setIsExerciseModalVisible(true)}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="absolute bottom-6 left-6 right-6">
        <BaseButton
          title={createRoutine.isPending ? 'Saving...' : 'Save Routine'}
          onPress={handleSave}
          disabled={!name.trim() || exercises.length === 0 || createRoutine.isPending}
        />
      </View>

      {/* Exercise Search Modal */}
      <Modal visible={isExerciseModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-surface-primary p-6">
          <View className="flex-row justify-between items-center mb-6 mt-10">
            <Text className="text-2xl font-bold text-text-primary">Select Exercise</Text>
            <Pressable onPress={() => setIsExerciseModalVisible(false)}>
              <Text className="text-primary-600 font-bold text-lg">Close</Text>
            </Pressable>
          </View>

          <TextInput
            className="bg-surface-secondary text-text-primary text-lg p-4 rounded-xl border border-surface-tertiary mb-6"
            placeholder="Search exercises..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredExercises.map((exercise) => (
              <Pressable
                key={exercise.id}
                onPress={() => handleAddExercise(exercise)}
                className="bg-surface-secondary p-4 rounded-xl mb-3 flex-row justify-between items-center"
              >
                <View>
                  <Text className="text-lg font-bold text-text-primary">{exercise.name}</Text>
                  <Text className="text-sm text-text-secondary">{exercise.muscle_group}</Text>
                </View>
                <Text className="text-primary-600 font-bold text-2xl">+</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
