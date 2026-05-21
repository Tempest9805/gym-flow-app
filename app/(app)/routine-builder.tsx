import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useAuthStore } from '@/lib/store/authStore';
import { useExercises, useRoutine } from '@/lib/hooks';
import { upsertRoutine } from '@/lib/api/routines';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { BuilderState, ExerciseEntry, Exercise } from '@/types';

function StepperInput({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  const decrement = () => onChange(Math.max(min, value - step))
  const increment = () => onChange(Math.min(max, value + step))

  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        onPress={decrement}
        className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
        hitSlop={8}>
        <MaterialCommunityIcons name="minus" size={16} color="#9d8ba0" />
      </TouchableOpacity>
      <Text className="text-base font-bold text-white w-10 text-center"
        style={{ fontVariant: ['tabular-nums'] }}>
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </Text>
      <TouchableOpacity
        onPress={increment}
        className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
        hitSlop={8}>
        <MaterialCommunityIcons name="plus" size={16} color="#9d8ba0" />
      </TouchableOpacity>
    </View>
  )
}

const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
function DaySelector({
  activeDay,
  onSelect,
}: {
  activeDay: number
  onSelect: (day: number) => void
}) {
  return (
    <View className="flex-row justify-between px-5 py-3 border-b border-zinc-800">
      {DAY_LABELS.map((label, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelect(index)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: activeDay === index ? '#BC13FE' : '#1E1428',
            borderWidth: 1,
            borderColor: activeDay === index ? '#BC13FE' : '#2a1f2d',
          }}>
          <Text style={{
            fontSize: 11,
            fontWeight: '700',
            color: activeDay === index ? '#fff' : '#9d8ba0',
          }}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function ExerciseRow({
  entry,
  index,
  total,
  language,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  entry: ExerciseEntry
  index: number
  total: number
  language: string
  onUpdate: (id: string, updates: Partial<ExerciseEntry>) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}) {
  const name = language === 'es' ? entry.exercise_name_es : entry.exercise_name_en

  return (
    <View className="mx-5 mb-3 bg-[#1E1428] rounded-2xl border border-zinc-800 p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-white flex-1 mr-2" numberOfLines={1}>
          {name.toUpperCase()}
        </Text>
        <View className="flex-row gap-2">
          {index > 0 && (
            <TouchableOpacity onPress={() => onMoveUp(entry.id)} hitSlop={8}>
              <MaterialCommunityIcons name="arrow-up" size={18} color="#9d8ba0" />
            </TouchableOpacity>
          )}
          {index < total - 1 && (
            <TouchableOpacity onPress={() => onMoveDown(entry.id)} hitSlop={8}>
              <MaterialCommunityIcons name="arrow-down" size={18} color="#9d8ba0" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onDelete(entry.id)} hitSlop={8}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row gap-2 mb-3">
        {(['reps', 'time', 'cardio'] as const).map(type => (
          <TouchableOpacity
            key={type}
            onPress={() => onUpdate(entry.id, {
              exercise_type: type,
              reps: type === 'reps' ? (entry.reps ?? 10) : null,
              duration_seconds: type !== 'reps' ? (entry.duration_seconds ?? 30) : null,
            })}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: entry.exercise_type === type ? '#BC13FE' : '#504254',
              backgroundColor: entry.exercise_type === type ? '#BC13FE20' : 'transparent',
            }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: entry.exercise_type === type ? '#BC13FE' : '#9d8ba0',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {type === 'reps' ? 'Reps' : type === 'time' ? 'Time' : 'Cardio'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="gap-2">
        <View className="flex-row items-center gap-3">
          <Text className="text-xs text-zinc-500 w-16 uppercase tracking-wider">Sets</Text>
          <StepperInput
            value={entry.sets}
            min={1}
            max={20}
            onChange={v => onUpdate(entry.id, { sets: v })}
          />
        </View>

        {entry.exercise_type === 'reps' && (
          <View className="flex-row items-center gap-3">
            <Text className="text-xs text-zinc-500 w-16 uppercase tracking-wider">Reps</Text>
            <StepperInput
              value={entry.reps ?? 10}
              min={1}
              max={100}
              onChange={v => onUpdate(entry.id, { reps: v })}
            />
          </View>
        )}

        {(entry.exercise_type === 'time' || entry.exercise_type === 'cardio') && (
          <View className="flex-row items-center gap-3">
            <Text className="text-xs text-zinc-500 w-16 uppercase tracking-wider">
              {entry.exercise_type === 'cardio' ? 'Minutes' : 'Seconds'}
            </Text>
            <StepperInput
              value={entry.exercise_type === 'cardio'
                ? Math.round((entry.duration_seconds ?? 600) / 60)
                : (entry.duration_seconds ?? 30)}
              min={entry.exercise_type === 'cardio' ? 1 : 5}
              max={entry.exercise_type === 'cardio' ? 60 : 300}
              step={entry.exercise_type === 'cardio' ? 1 : 5}
              onChange={v => onUpdate(entry.id, {
                duration_seconds: entry.exercise_type === 'cardio' ? v * 60 : v
              })}
            />
          </View>
        )}

        <View className="flex-row items-center gap-3">
          <Text className="text-xs text-zinc-500 w-16 uppercase tracking-wider">Weight</Text>
          <View className="flex-row items-center gap-2">
            <StepperInput
              value={entry.weight ?? 0}
              min={0}
              max={500}
              step={2.5}
              onChange={v => onUpdate(entry.id, { weight: v === 0 ? null : v })}
            />
            <Text className="text-xs text-zinc-600">lbs (optional)</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Text className="text-xs text-zinc-500 w-16 uppercase tracking-wider">Rest</Text>
          <View className="flex-row gap-2 flex-wrap">
            {[30, 45, 60, 90, 120].map(secs => (
              <TouchableOpacity
                key={secs}
                onPress={() => onUpdate(entry.id, { rest_seconds: secs })}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: entry.rest_seconds === secs ? '#BC13FE' : '#504254',
                  backgroundColor: entry.rest_seconds === secs ? '#BC13FE20' : 'transparent',
                }}>
                <Text style={{
                  fontSize: 11,
                  color: entry.rest_seconds === secs ? '#BC13FE' : '#9d8ba0',
                  fontWeight: '600',
                }}>
                  {secs}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}

export default function RoutineBuilderScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const today = new Date().getDay();

  const [state, setState] = useState<BuilderState>({
    routineId: null,
    name: '',
    exercises: [],
    activeDay: today,
  });

  const { data: existingRoutine, isLoading: isLoadingRoutine } = useRoutine(id);
  const { data: allExercises } = useExercises();

  const [isExerciseModalVisible, setIsExerciseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (existingRoutine && id) {
      setState({
        routineId: existingRoutine.id,
        name: existingRoutine.name || '',
        activeDay: existingRoutine.exercises?.[0]?.day_of_week ?? today,
        exercises: existingRoutine.exercises?.map((e: any, index: number) => ({
          id: e.id || Math.random().toString(),
          exercise_id: e.exercise_id,
          exercise_name_en: e.exercise?.name_en || 'Unknown',
          exercise_name_es: e.exercise?.name_es || 'Desconocido',
          exercise_type: e.exercise_type || 'reps',
          day_of_week: e.day_of_week ?? today,
          order_index: e.order_index ?? index,
          sets: e.sets || 3,
          reps: e.reps || null,
          duration_seconds: e.duration_seconds || null,
          weight: e.weight || null,
          rest_seconds: e.rest_seconds || 60,
          notes: e.notes || null,
        })) || [],
      });
    }
  }, [existingRoutine, id]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!state.name.trim()) {
        Alert.alert('Incomplete', 'Please add a routine name.');
        return Promise.reject(new Error('No name'));
      }
      return upsertRoutine(
        user!.id,
        state.routineId,
        state.name,
        state.exercises
      );
    },
    onSuccess: (routineId) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['all-routines'] });
      queryClient.invalidateQueries({ queryKey: ['today-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['week-schedule'] });
      router.back();
    },
    onError: (error: any) => {
      if (error.message !== 'No name') {
        Alert.alert('Error', 'Could not save routine. Please try again.');
        console.error(error);
      }
    },
  });

  const handleUpdateExercise = (exId: string, updates: Partial<ExerciseEntry>) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => ex.id === exId ? { ...ex, ...updates } : ex)
    }));
  };

  const handleDeleteExercise = (exId: string) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setState(prev => ({
              ...prev,
              exercises: prev.exercises.filter(ex => ex.id !== exId)
            }));
          }
        }
      ]
    );
  };

  const handleMoveUp = (exId: string) => {
    setState(prev => {
      const idx = prev.exercises.findIndex(e => e.id === exId);
      if (idx <= 0) return prev;
      const next = [...prev.exercises];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return { ...prev, exercises: next };
    });
  };

  const handleMoveDown = (exId: string) => {
    setState(prev => {
      const idx = prev.exercises.findIndex(e => e.id === exId);
      if (idx === -1 || idx >= prev.exercises.length - 1) return prev;
      const next = [...prev.exercises];
      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      return { ...prev, exercises: next };
    });
  };

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
    const isCardio = exercise.category === 'cardio';
    const isTime = exercise.type === 'time';
    const type = isCardio ? 'cardio' : (isTime ? 'time' : 'reps');

    setState(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: Math.random().toString(),
          exercise_id: exercise.id,
          exercise_name_en: exercise.name_en,
          exercise_name_es: exercise.name_es || exercise.name_en,
          exercise_type: type,
          day_of_week: prev.activeDay,
          order_index: prev.exercises.length,
          sets: 3,
          reps: type === 'reps' ? 10 : null,
          duration_seconds: type !== 'reps' ? (type === 'cardio' ? 600 : 30) : null,
          weight: null,
          rest_seconds: 60,
          notes: null,
        }
      ]
    }));
    setIsExerciseModalVisible(false);
    setSearchQuery('');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#19101C]" edges={['top']}>
      <AppTopBar />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center px-5 py-4 gap-4">
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 text-xl font-black text-white p-0"
            placeholder="ROUTINE NAME"
            placeholderTextColor="#504254"
            value={state.name}
            onChangeText={v => setState(s => ({ ...s, name: v }))}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-4 py-2 rounded-xl bg-[#BC13FE]"
          >
            <Text className="text-white font-bold text-xs uppercase tracking-widest">
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <DaySelector
          activeDay={state.activeDay}
          onSelect={d => {
            setState(prev => {
              const updatedExercises = prev.exercises.map(ex => ({ ...ex, day_of_week: d }));
              return { ...prev, activeDay: d, exercises: updatedExercises };
            });
          }}
        />

        <View className="pt-4">
          {state.exercises.map((entry, index) => (
            <ExerciseRow
              key={entry.id}
              entry={entry}
              index={index}
              total={state.exercises.length}
              language={language}
              onUpdate={handleUpdateExercise}
              onDelete={handleDeleteExercise}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}

          <TouchableOpacity
            className="mx-5 mt-2 mb-8 h-16 rounded-xl border-2 border-dashed flex-row items-center justify-center gap-3 border-[#504254]"
            activeOpacity={0.7}
            onPress={() => setIsExerciseModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#9d8ba0" />
            <Text className="text-sm font-bold uppercase tracking-widest text-[#9d8ba0]">
              ADD EXERCISE
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={isExerciseModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsExerciseModalVisible(false)}
      >
        <SafeAreaView className="flex-1 p-6 gap-4 bg-[#1E1428]">
          <View className="flex-row justify-between items-center mt-4 mb-2">
            <Text className="text-2xl font-bold text-white">Select Exercise</Text>
            <TouchableOpacity onPress={() => setIsExerciseModalVisible(false)}>
              <Text className="text-base font-semibold text-[#BC13FE]">Close</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="h-14 rounded-xl px-4 text-lg border border-[#2a1f2d] bg-[#19101C] text-white"
            placeholder="Search exercises..."
            placeholderTextColor="#504254"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                className="p-4 rounded-xl mb-3 flex-row justify-between items-center bg-[#251C28]"
                onPress={() => handleAddExercise(exercise)}
              >
                <View>
                  <Text className="text-base font-bold text-white">
                    {language === 'es' ? (exercise.name_es || exercise.name_en) : exercise.name_en}
                  </Text>
                  <Text className="text-sm mt-0.5 text-[#9d8ba0]">
                    {exercise.muscle_group}
                  </Text>
                </View>
                <MaterialCommunityIcons name="plus" size={24} color="#BC13FE" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}
