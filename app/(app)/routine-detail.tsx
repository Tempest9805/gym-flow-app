import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuthStore } from '@/lib/store/authStore'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { getAssignedDays, toggleDayAssignment } from '@/lib/api/schedules'
import { useRoutine } from '@/lib/hooks'
import { deleteRoutine } from '@/lib/api/routines'
import { Image } from 'expo-image'
import { HIRES_MAP, NORMALIZED_MAP } from '@/lib/utils/mediaMap'

const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const DAY_LABELS_ES = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA']

function parseInstructions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(s => String(s).trim()).filter(Boolean);
    }
  } catch (e) {}

  const byNumber = raw.split(/\d+\.\s+/).map(s => s.trim()).filter(Boolean);
  if (byNumber.length > 1) return byNumber;

  const bySentence = raw.split(/(?<=\.)\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean);
  if (bySentence.length > 1) return bySentence;

  return [raw];
}

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const { language } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: routine, isLoading: isLoadingRoutine } = useRoutine(id)

  const { data: assignedDays = [], isLoading: isLoadingDays } = useQuery({
    queryKey: ['assigned-days', id, user?.id],
    queryFn: () => getAssignedDays(id, user!.id),
    enabled: !!user?.id && !!id,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ day, assigned }: { day: number; assigned: boolean }) =>
      toggleDayAssignment(id, user!.id, day, assigned),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['assigned-days', id, user?.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['today-schedule', user?.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['week-schedule', user?.id]
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['all-routines', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['today-schedule', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['week-schedule', user?.id] })
      router.replace('/(app)/routines')
    },
    onError: (err: any) => {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'No se pudo eliminar la rutina.' : 'Could not delete routine.'
      )
      console.error(err)
    }
  })

  const handleDelete = () => {
    Alert.alert(
      language === 'es' ? 'Eliminar Rutina' : 'Delete Routine',
      language === 'es' 
        ? '¿Estás seguro de que quieres eliminar esta rutina de forma permanente?'
        : 'Are you sure you want to delete this routine permanently?',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        { text: language === 'es' ? 'Eliminar' : 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() }
      ]
    )
  }

  const labels = language === 'es' ? DAY_LABELS_ES : DAY_LABELS

  if (isLoadingRoutine) {
    return (
      <SafeAreaView className="flex-1 bg-[#19101C] items-center justify-center">
        <ActivityIndicator color="#BC13FE" size="large" />
      </SafeAreaView>
    )
  }

  if (!routine) {
    return (
      <SafeAreaView className="flex-1 bg-[#19101C] items-center justify-center">
        <Text className="text-white">Routine not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-[#BC13FE]">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-[#19101C]" edges={['top']}>
      <ScrollView className="flex-1 bg-[#19101C]"
        contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-5 gap-3">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <MaterialCommunityIcons
              name="chevron-left" size={28} color="#9d8ba0" />
          </TouchableOpacity>
          <Text className="flex-1 text-2xl font-black text-white uppercase tracking-tight"
            numberOfLines={1}>
            {routine?.name}
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/routine-builder?id=${id}`)}
            hitSlop={8}
            className="w-10 h-10 rounded-xl bg-zinc-800 items-center justify-center">
            <MaterialCommunityIcons
              name="pencil-outline" size={20} color="#9d8ba0" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
            hitSlop={8}
            className="w-10 h-10 rounded-xl bg-red-950/20 border border-red-900/30 items-center justify-center">
            <MaterialCommunityIcons
              name="trash-can-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* ── ASIGNACIÓN DE DÍAS ─────────────────── */}
        <View className="mx-5 mb-4 bg-[#1E1428] rounded-2xl
          border border-zinc-800 p-4">
          <Text className="text-xs font-bold text-zinc-500
            uppercase tracking-widest mb-1">
            {language === 'es' ? 'Días de entrenamiento' : 'Training days'}
          </Text>
          <Text className="text-xs text-zinc-600 mb-3">
            {language === 'es' ? 'Toca los días en que harás esta rutina' : 'Tap the days you will do this routine'}
          </Text>

          <View className="flex-row justify-between">
            {labels.map((label, index) => {
              const isAssigned = assignedDays.includes(index)
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleMutation.mutate({
                    day: index,
                    assigned: isAssigned,
                  })}
                  disabled={toggleMutation.isPending || isLoadingDays}
                  style={{
                    width: 40, height: 52,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: isAssigned ? '#BC13FE' : '#2a1f2d',
                    backgroundColor: isAssigned ? '#BC13FE20' : '#19101C',
                  }}>
                  <Text style={{
                    fontSize: 10, fontWeight: '700',
                    color: isAssigned ? '#BC13FE' : '#504254',
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}>
                    {label}
                  </Text>
                  {isAssigned
                    ? <MaterialCommunityIcons
                        name="check" size={12} color="#BC13FE" />
                    : <View style={{
                        width: 4, height: 4, borderRadius: 2,
                        backgroundColor: '#2a1f2d',
                      }} />
                  }
                </TouchableOpacity>
              )
            })}
          </View>

          {assignedDays.length > 0 && (
            <Text className="text-xs text-zinc-600 mt-3 text-center">
              {language === 'es' ? 'Asignada: ' : 'Assigned: '} 
              {assignedDays
                .sort()
                .map(d => labels[d])
                .join(' · ')}
            </Text>
          )}
        </View>

        {/* ── LISTA DE EJERCICIOS ────────────────── */}
        <View className="px-5 mb-3 mt-2">
          <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {language === 'es' ? 'Ejercicios de la rutina' : 'Routine exercises'}
          </Text>
        </View>

        {routine?.exercises
          ?.sort((a: any, b: any) => a.order_index - b.order_index)
          .map((re: any, i: number) => {
            const exName = language === 'es' && re.exercise.name_es ? re.exercise.name_es : re.exercise.name_en;
            const normalizedSlug = re.exercise.slug
              ?.toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');
            const localHires = normalizedSlug ? HIRES_MAP[normalizedSlug] : null;
            const localNormalized = normalizedSlug ? NORMALIZED_MAP[normalizedSlug] : null;
            const imageSource = localHires || localNormalized || (re.exercise.demonstration_url ? { uri: re.exercise.demonstration_url } : null);
            const steps = parseInstructions(re.exercise.instructions);
            const isTimeBased = re.exercise_type === 'time' ||
              (re.notes?.toLowerCase().includes('seg') || re.notes?.toLowerCase().includes('min'));

            return (
              <View
                key={re.id}
                className="mx-5 mb-3 bg-[#1E1428] rounded-2xl border border-zinc-800 p-4 relative overflow-hidden"
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push(`/exercise/${re.exercise.id}`)}
                  className="flex-row items-start gap-4"
                >
                  {/* Exercise Image */}
                  {imageSource ? (
                    <Image
                      source={imageSource}
                      className="w-16 h-16 rounded-xl bg-zinc-950"
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-16 h-16 rounded-xl bg-zinc-950 items-center justify-center">
                      <MaterialCommunityIcons name="dumbbell" size={24} color="#504254" />
                    </View>
                  )}

                  {/* Content Area */}
                  <View className="flex-1 pr-6">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-black text-white leading-tight uppercase flex-1 mr-2">
                        {exName}
                      </Text>
                      <MaterialCommunityIcons name="chevron-right" size={16} color="#504254" />
                    </View>
                    
                    <Text className="text-xs font-bold text-[#BC13FE] mt-0.5 uppercase tracking-wide">
                      {re.exercise_type === 'reps'
                        ? `${re.sets}×${re.reps ?? 10} reps`
                        : re.duration_seconds
                          ? re.exercise_type === 'cardio'
                            ? `${re.sets} sets · ${Math.round(re.duration_seconds / 60)} min`
                            : `${re.sets} sets · ${re.duration_seconds}s`
                          : `${re.sets} sets`}
                    </Text>

                    {re.exercise.muscle_group && (
                      <View className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 self-start mt-2">
                        <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          {re.exercise.muscle_group}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Inline Timer Button for Time-based exercises */}
                {isTimeBased && (
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '/timer-active',
                      params: {
                        work: re.duration_seconds || 60,
                        rest: re.rest_seconds || 30,
                        rounds: re.sets || 3,
                        sound: '1'
                      }
                    })}
                    className="absolute right-4 bottom-4 flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#BC13FE]/10 border border-[#BC13FE]/30"
                  >
                    <MaterialCommunityIcons name="play" size={12} color="#BC13FE" />
                    <Text className="text-[10px] font-bold text-[#BC13FE] uppercase tracking-widest">
                      {language === 'es' ? 'Iniciar' : 'Start'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Description & Cues */}
                {(re.exercise.description || steps.length > 0) && (
                  <View className="mt-4 pt-3 border-t border-zinc-800">
                    {re.exercise.description && (
                      <Text className="text-[12px] text-zinc-400 leading-relaxed italic mb-2">
                        {re.exercise.description}
                      </Text>
                    )}
                    
                    {steps.slice(0, 2).map((step, idx) => (
                      <View key={idx} className="flex-row gap-2 mt-1 items-start">
                        <View className="w-4 h-4 rounded-full border border-[#BC13FE]/30 items-center justify-center shrink-0 mt-0.5">
                          <Text className="text-[9px] font-bold text-[#BC13FE]">{idx + 1}</Text>
                        </View>
                        <Text className="text-[11px] text-zinc-500 leading-4 flex-1" numberOfLines={2}>
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

        {(!routine?.exercises || routine.exercises.length === 0) && (
          <View className="mx-5 mb-4 bg-[#1E1428] rounded-2xl border border-zinc-800 p-6 items-center">
            <Text className="text-sm text-zinc-500">
              {language === 'es' ? 'No hay ejercicios' : 'No exercises'}
            </Text>
          </View>
        )}

        {/* ── BOTÓN INICIAR ──────────────────────── */}
        {routine?.exercises && routine.exercises.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/workout', params: { id: routine.id } })}
            className="mx-5 h-16 bg-[#BC13FE] rounded-2xl
              items-center justify-center mt-2"
            style={{ shadowColor: '#BC13FE', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 0 }, shadowRadius: 16 }}>
            <Text className="text-white font-black text-lg
              uppercase tracking-wider">
              {language === 'es' ? 'INICIAR RUTINA' : 'START ROUTINE'}
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}
