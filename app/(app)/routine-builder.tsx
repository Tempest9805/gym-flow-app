import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { useExercises, useRoutine } from '@/lib/hooks';
import { upsertRoutine } from '@/lib/api/routines';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { Exercise } from '@/types';

type ExerciseEntry = {
  tempId: string
  exercise_id: string
  name_en: string
  name_es: string
  auto_type: 'reps' | 'time' | 'cardio'
  sets: number
  reps: number
  duration_seconds: number | null
  weight: number | null
  rest_seconds: number
  showWeight: boolean
  showOptions: boolean
}

function MiniStepper({ value, min, max, step = 1, onChange }: { value: number, min: number, max: number, step?: number, onChange: (v: number) => void }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#251C28',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#2a1f2d',
      overflow: 'hidden',
    }}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(min, value - step))}
        style={{ width: 32, height: 36, alignItems: 'center', justifyContent: 'center' }}
        hitSlop={6}>
        <MaterialCommunityIcons name="minus" size={14} color="#9d8ba0" />
      </TouchableOpacity>
      <Text style={{
        width: 36, textAlign: 'center',
        fontSize: 14, fontWeight: '700', color: '#fff',
        fontVariant: ['tabular-nums'],
      }}>
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </Text>
      <TouchableOpacity
        onPress={() => onChange(Math.min(max, value + step))}
        style={{ width: 32, height: 36, alignItems: 'center', justifyContent: 'center' }}
        hitSlop={6}>
        <MaterialCommunityIcons name="plus" size={14} color="#9d8ba0" />
      </TouchableOpacity>
    </View>
  )
}

function ExerciseCard({ entry, index, total, language, onUpdate, onDelete, onMoveUp, onMoveDown }: any) {
  const name = language === 'es' ? entry.name_es : entry.name_en

  return (
    <View className="mx-5 mt-3 bg-[#1E1428] rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Nombre + controles */}
      <View className="flex-row items-center px-4 pt-4 pb-2 gap-2">
        <Text className="flex-1 text-sm font-bold text-white" numberOfLines={1}>
          {name.toUpperCase()}
        </Text>
        <View className="flex-row gap-1">
          {index > 0 && (
            <TouchableOpacity onPress={onMoveUp} hitSlop={8} className="p-1">
              <MaterialCommunityIcons name="arrow-up" size={18} color="#504254" />
            </TouchableOpacity>
          )}
          {index < total - 1 && (
            <TouchableOpacity onPress={onMoveDown} hitSlop={8} className="p-1">
              <MaterialCommunityIcons name="arrow-down" size={18} color="#504254" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onDelete(entry.tempId)} hitSlop={8} className="p-1">
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Fila principal: Sets × Reps (o Duración) */}
      <View className="flex-row items-center px-4 pb-3 gap-3">
        {/* Sets — siempre visible */}
        <View className="items-center gap-1">
          <Text className="text-xs text-zinc-600">Sets</Text>
          <MiniStepper
            value={entry.sets}
            min={1} max={20}
            onChange={v => onUpdate(entry.tempId, { sets: v })}
          />
        </View>

        <Text className="text-zinc-600 text-lg pb-1">×</Text>

        {/* Reps o Duración */}
        {entry.auto_type === 'reps' ? (
          <View className="items-center gap-1 flex-1">
            <Text className="text-xs text-zinc-600">Reps</Text>
            <MiniStepper
              value={entry.reps}
              min={1} max={100}
              onChange={v => onUpdate(entry.tempId, { reps: v })}
            />
          </View>
        ) : (
          <View className="items-center gap-1 flex-1">
            <Text className="text-xs text-zinc-600">
              {entry.auto_type === 'cardio' ? 'Minutos' : 'Segundos'}
            </Text>
            <MiniStepper
              value={entry.auto_type === 'cardio'
                ? Math.round((entry.duration_seconds ?? 600) / 60)
                : (entry.duration_seconds ?? 30)}
              min={entry.auto_type === 'cardio' ? 1 : 5}
              max={entry.auto_type === 'cardio' ? 120 : 300}
              step={entry.auto_type === 'cardio' ? 1 : 5}
              onChange={v => onUpdate(entry.tempId, {
                duration_seconds: entry.auto_type === 'cardio' ? v * 60 : v
              })}
            />
          </View>
        )}

        {/* Peso — solo si showWeight */}
        {entry.showWeight && (
          <View className="items-center gap-1">
            <Text className="text-xs text-zinc-600">Lbs</Text>
            <MiniStepper
              value={entry.weight ?? 0}
              min={0} max={500} step={2.5}
              onChange={v => onUpdate(entry.tempId, {
                weight: v === 0 ? null : v
              })}
            />
          </View>
        )}
      </View>

      {/* Peso opcional — oculto por defecto */}
      {!entry.showWeight && (
        <TouchableOpacity
          onPress={() => onUpdate(entry.tempId, { showWeight: true })}
          className="flex-row items-center justify-center py-2 border-t border-zinc-800 gap-1">
          <MaterialCommunityIcons name="weight" size={12} color="#504254" />
          <Text className="text-xs text-zinc-600">
            {language === 'es' ? '+ Añadir peso (opcional)' : '+ Add weight (optional)'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Opciones expandibles */}
      <TouchableOpacity
        onPress={() => onUpdate(entry.tempId, { showOptions: !entry.showOptions })}
        className="flex-row items-center justify-center py-2 border-t border-zinc-800 gap-1">
        <MaterialCommunityIcons name={entry.showOptions ? 'chevron-up' : 'chevron-down'} size={13} color="#504254" />
        <Text className="text-xs text-zinc-600">
          {entry.showOptions 
            ? (language === 'es' ? 'Menos' : 'Less') 
            : (language === 'es' ? 'Descanso y notas' : 'Rest and notes')}
        </Text>
      </TouchableOpacity>

      {entry.showOptions && (
        <View className="px-4 pb-4 pt-2 border-t border-zinc-800">
          <Text className="text-xs text-zinc-600 mb-2">
            {language === 'es' ? 'Descanso entre series' : 'Rest between sets'}
          </Text>
          <View className="flex-row gap-2 flex-wrap">
            {[30, 45, 60, 90, 120].map(secs => (
              <TouchableOpacity
                key={secs}
                onPress={() => onUpdate(entry.tempId, { rest_seconds: secs })}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: entry.rest_seconds === secs ? '#BC13FE' : '#504254',
                  backgroundColor: entry.rest_seconds === secs ? '#BC13FE20' : 'transparent',
                }}>
                <Text style={{
                  fontSize: 11, fontWeight: '600',
                  color: entry.rest_seconds === secs ? '#BC13FE' : '#9d8ba0',
                }}>
                  {secs}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

export default function RoutineBuilderScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [routineId, setRoutineId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [isExerciseModalVisible, setIsExerciseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: existingRoutine } = useRoutine(id);
  const { data: allExercises } = useExercises();

  useEffect(() => {
    if (existingRoutine && id) {
      setRoutineId(existingRoutine.id);
      setName(existingRoutine.name || '');
      setExercises(
        existingRoutine.exercises?.map((e: any) => ({
          tempId: Math.random().toString(),
          exercise_id: e.exercise_id,
          name_en: e.exercise?.name_en || 'Unknown',
          name_es: e.exercise?.name_es || e.exercise?.name_en || 'Unknown',
          auto_type: e.exercise_type || 'reps',
          sets: e.sets || 3,
          reps: e.reps || 10,
          duration_seconds: e.duration_seconds || null,
          weight: e.weight || null,
          rest_seconds: e.rest_seconds || 60,
          showWeight: e.weight != null,
          showOptions: false,
        })) || []
      );
    }
  }, [existingRoutine, id]);

  const saveMutation = useMutation({
    mutationFn: () => {
      // Map back to the API format
      const apiExercises = exercises.map((e, index) => ({
        id: e.tempId,
        exercise_id: e.exercise_id,
        exercise_name_en: e.name_en,
        exercise_name_es: e.name_es,
        exercise_type: e.auto_type,
        day_of_week: 0, // Not assigned here anymore
        order_index: index,
        sets: e.sets,
        reps: e.auto_type === 'reps' ? e.reps : null,
        duration_seconds: e.auto_type !== 'reps' ? e.duration_seconds : null,
        weight: e.showWeight ? e.weight : null,
        rest_seconds: e.rest_seconds,
        notes: null,
      }));

      return upsertRoutine(user!.id, routineId, name, apiExercises as any);
    },
    onSuccess: (newRoutineId) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['all-routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine', newRoutineId] });
      router.replace(`/routine-detail?id=${newRoutineId}`);
    },
    onError: (error: any) => {
      Alert.alert('Error', 'Could not save routine.');
      console.error(error);
    },
  });

  const handleUpdate = (tempId: string, updates: Partial<ExerciseEntry>) => {
    setExercises(prev => prev.map(ex => ex.tempId === tempId ? { ...ex, ...updates } : ex));
  };

  const handleDelete = (tempId: string) => {
    setExercises(prev => prev.filter(ex => ex.tempId !== tempId));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    setExercises(prev => {
      const next = [...prev];
      if (direction === 'up' && index > 0) {
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
      } else if (direction === 'down' && index < next.length - 1) {
        [next[index + 1], next[index]] = [next[index], next[index + 1]];
      }
      return next;
    });
  };

  const handleAddExercise = (exercise: Exercise) => {
    const isCardio = exercise.category === 'cardio';
    const isTime = exercise.type === 'time';
    const type = isCardio ? 'cardio' : (isTime ? 'time' : 'reps');

    setExercises(prev => [
      ...prev,
      {
        tempId: Math.random().toString(),
        exercise_id: exercise.id,
        name_en: exercise.name_en,
        name_es: exercise.name_es || exercise.name_en,
        auto_type: type,
        sets: 3,
        reps: type === 'reps' ? 10 : 1,
        duration_seconds: type !== 'reps' ? (type === 'cardio' ? 600 : 30) : null,
        weight: null,
        rest_seconds: 60,
        showWeight: false,
        showOptions: false,
      }
    ]);
    setIsExerciseModalVisible(false);
    setSearchQuery('');
  };

  const filteredExercises = useMemo(() => {
    if (!allExercises) return [];
    if (!searchQuery) return allExercises;
    const q = searchQuery.toLowerCase();
    return allExercises.filter((e) =>
      (e.name_en || '').toLowerCase().includes(q) ||
      (e.name_es || '').toLowerCase().includes(q) ||
      (e.muscle_group || '').toLowerCase().includes(q)
    );
  }, [allExercises, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-[#19101C]" edges={['top']}>
      <KeyboardAvoidingView className="flex-1 bg-[#19101C]" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header: nombre + guardar */}
        <View className="flex-row items-center px-5 pt-4 pb-3 border-b border-zinc-800 gap-3">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#9d8ba0" />
          </TouchableOpacity>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={language === 'es' ? 'Nombre de la rutina' : 'Routine Name'}
            placeholderTextColor="#504254"
            style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#fff' }}
            autoFocus={!routineId}
          />
          <TouchableOpacity
            onPress={() => saveMutation.mutate()}
            disabled={!name.trim() || saveMutation.isPending}
            style={{
              backgroundColor: name.trim() ? '#BC13FE' : '#2a1f2d',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}>
            <Text style={{ color: name.trim() ? '#fff' : '#504254', fontSize: 13, fontWeight: '700' }}>
              {saveMutation.isPending ? '...' : (language === 'es' ? 'GUARDAR' : 'SAVE')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {exercises.map((entry, index) => (
            <ExerciseCard
              key={entry.tempId}
              entry={entry}
              index={index}
              total={exercises.length}
              language={language}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onMoveUp={() => moveExercise(index, 'up')}
              onMoveDown={() => moveExercise(index, 'down')}
            />
          ))}

          {/* Añadir ejercicio */}
          <TouchableOpacity
            onPress={() => setIsExerciseModalVisible(true)}
            className="mx-5 mt-4 h-14 rounded-2xl border-2 border-dashed border-zinc-700 flex-row items-center justify-center gap-2">
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#9d8ba0" />
            <Text className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
              {language === 'es' ? 'AÑADIR EJERCICIO' : 'ADD EXERCISE'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isExerciseModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsExerciseModalVisible(false)}
      >
        <SafeAreaView className="flex-1 p-6 gap-4 bg-[#1E1428]">
          <View className="flex-row justify-between items-center mt-4 mb-2">
            <Text className="text-2xl font-bold text-white">
              {language === 'es' ? 'Seleccionar Ejercicio' : 'Select Exercise'}
            </Text>
            <TouchableOpacity onPress={() => setIsExerciseModalVisible(false)}>
              <Text className="text-base font-semibold text-[#BC13FE]">{language === 'es' ? 'Cerrar' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="h-14 rounded-xl px-4 text-lg border border-[#2a1f2d] bg-[#19101C] text-white"
            placeholder={language === 'es' ? 'Buscar ejercicios...' : 'Search exercises...'}
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
