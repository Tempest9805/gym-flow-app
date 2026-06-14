import React, { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuthStore } from '@/lib/store/authStore'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useCurrentProfile } from '@/lib/hooks/useProfiles'
import { getPresetRoutines, importPresetRoutine, type PresetRoutine } from '@/lib/api/presets'
import { AppTopBar } from '@/components/ui/AppTopBar'

const GOAL_CONFIG = {
  lose_weight: {
    labelEs: '🔥 Bajar de peso',
    labelEn: '🔥 Lose Weight',
    color: '#ef4444',
  },
  build_resistance: {
    labelEs: '💨 Ganar resistencia',
    labelEn: '💨 Build Resistance',
    color: '#3b82f6',
  },
  build_muscle: {
    labelEs: '💪 Ganar músculo',
    labelEn: '💪 Build Muscle',
    color: '#f97316',
  },
  definition: {
    labelEs: '✂️ Definición',
    labelEn: '✂️ Definition',
    color: '#a855f7',
  },
} as const

type GoalKey = keyof typeof GOAL_CONFIG

const TRAINING_TYPE_LABELS: Record<string, { es: string; en: string }> = {
  home: { es: '🏠 Casa', en: '🏠 Home' },
  gym: { es: '🏋️ Gym', en: '🏋️ Gym' },
  calisthenics: { es: '💪 Calistenia', en: '💪 Calisthenics' },
}

export default function RoutineStartScreen() {
  const { user } = useAuthStore()
  const { language } = useTranslation()
  const { data: profile } = useCurrentProfile()
  const router = useRouter()
  const queryClient = useQueryClient()

  const userGoal = profile?.goal as GoalKey | undefined

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['preset-routines'],
    queryFn: getPresetRoutines,
  })

  const importMutation = useMutation({
    mutationFn: (preset: PresetRoutine) =>
      importPresetRoutine(user!.id, preset, language),
    onSuccess: (routineId) => {
      queryClient.invalidateQueries({ queryKey: ['all-routines'] })
      queryClient.invalidateQueries({ queryKey: ['today-schedule'] })
      queryClient.invalidateQueries({ queryKey: ['week-schedule'] })
      router.replace(`/routine-detail?id=${routineId}`)
    },
  })

  // Group presets by goal, pin user's goal first, sort by goal_rank within
  const goalSections = useMemo(() => {
    const grouped: Partial<Record<GoalKey, PresetRoutine[]>> = {}

    for (const preset of presets) {
      const goal = (preset.goal as GoalKey) ?? 'build_muscle'
      if (!grouped[goal]) grouped[goal] = []
      grouped[goal]!.push(preset)
    }

    // Sort each group by goal_rank ascending
    for (const key of Object.keys(grouped) as GoalKey[]) {
      grouped[key]!.sort(
        (a, b) => (a.goal_rank ?? 999) - (b.goal_rank ?? 999)
      )
    }

    // Build ordered list: user's goal first, then the rest in config order
    const goalOrder: GoalKey[] = Object.keys(GOAL_CONFIG) as GoalKey[]
    const ordered: { goal: GoalKey; routines: PresetRoutine[] }[] = []

    if (userGoal && grouped[userGoal]) {
      ordered.push({ goal: userGoal, routines: grouped[userGoal]! })
    }

    for (const g of goalOrder) {
      if (g === userGoal) continue
      if (grouped[g] && grouped[g]!.length > 0) {
        ordered.push({ goal: g, routines: grouped[g]! })
      }
    }

    return ordered
  }, [presets, userGoal])

  return (
    <SafeAreaView className="flex-1 bg-[#19101C]" edges={['top']}>
      <AppTopBar />
      <ScrollView className="flex-1 bg-[#19101C]"
        contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-4 gap-3">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <MaterialCommunityIcons
              name="chevron-left" size={28} color="#9d8ba0" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-black text-white mb-1 leading-8 tracking-tight">
              {language === 'es' ? '¿Cómo quieres entrenar?' : 'How do you want to train?'}
            </Text>
            <Text className="text-sm text-zinc-500">
              {language === 'es' ? 'Elige una rutina o crea la tuya' : 'Choose a routine or create your own'}
            </Text>
          </View>
        </View>

        {isLoading && (
          <ActivityIndicator color="#BC13FE" className="mt-8" />
        )}

        {/* Sections by goal */}
        {goalSections.map(({ goal, routines }) => {
          const config = GOAL_CONFIG[goal]
          if (!config) return null
          const isUserGoal = goal === userGoal

          return (
            <View key={goal} className="mb-6">

              {/* Category label */}
              <View className="flex-row items-center gap-2 px-5 mb-1">
                <Text style={{ color: config.color }}
                  className="text-xs font-bold uppercase tracking-widest">
                  {language === 'es' ? config.labelEs : config.labelEn}
                </Text>
              </View>

              {/* Recommended badge */}
              {isUserGoal && (
                <View className="px-5 mb-2">
                  <View style={{
                    backgroundColor: `${config.color}15`,
                    borderColor: `${config.color}40`,
                    borderWidth: 1,
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    alignSelf: 'flex-start',
                  }}>
                    <Text style={{ color: config.color, fontSize: 10, fontWeight: '700' }}>
                      {language === 'es' ? '⭐ Recomendado para ti' : '⭐ Recommended for you'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Preset cards */}
              {routines.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => importMutation.mutate(preset)}
                  disabled={importMutation.isPending}
                  className="mx-5 mb-3 bg-[#1E1428] rounded-2xl
                    border border-zinc-800 p-4 active:opacity-70">

                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-base font-black text-white">
                          {language === 'es'
                            ? preset.name_es : preset.name_en}
                        </Text>
                        {/* Badge nivel */}
                        <View style={{
                          backgroundColor: preset.level === 'beginner'
                            ? '#22c55e20' : '#f9731620',
                          borderColor: preset.level === 'beginner'
                            ? '#22c55e40' : '#f9731640',
                          borderWidth: 1,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                        }}>
                          <Text style={{
                            fontSize: 9,
                            fontWeight: '700',
                            color: preset.level === 'beginner'
                              ? '#22c55e' : '#f97316',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}>
                            {preset.level === 'beginner'
                              ? (language === 'es' ? 'Principiante' : 'Beginner') 
                              : (language === 'es' ? 'Intermedio' : 'Intermediate')}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-zinc-500 mb-2">
                        {language === 'es'
                          ? preset.description_es
                          : preset.description_en}
                      </Text>

                      {/* Training type pill + meta row */}
                      <View className="flex-row items-center gap-2">
                        <View style={{
                          backgroundColor: '#ffffff10',
                          borderRadius: 999,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: '#a1a1aa' }}>
                            {language === 'es'
                              ? (TRAINING_TYPE_LABELS[preset.training_type]?.es ?? preset.training_type)
                              : (TRAINING_TYPE_LABELS[preset.training_type]?.en ?? preset.training_type)}
                          </Text>
                        </View>
                        <Text className="text-xs text-zinc-600 font-medium">
                          {preset.days_per_week} {language === 'es' ? 'días/semana' : 'days/week'} ·{' '}
                          {preset.exercises.length} {language === 'es' ? 'ejercicios' : 'exercises'}
                        </Text>
                      </View>
                    </View>

                    {importMutation.isPending ? (
                      <ActivityIndicator color="#BC13FE" />
                    ) : (
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#BC13FE20',
                        borderWidth: 1,
                        borderColor: '#BC13FE40',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <MaterialCommunityIcons
                          name="plus" size={20} color="#BC13FE" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        })}

        {/* Divider */}
        <View className="flex-row items-center px-5 mb-4 gap-3">
          <View className="flex-1 h-px bg-zinc-800" />
          <Text className="text-xs text-zinc-600 uppercase font-bold tracking-widest">
            {language === 'es' ? 'O' : 'OR'}
          </Text>
          <View className="flex-1 h-px bg-zinc-800" />
        </View>

        {/* Crear desde cero */}
        <TouchableOpacity
          onPress={() => router.push('/routine-builder')}
          className="mx-5 h-14 rounded-2xl border-2 border-dashed
            border-zinc-700 flex-row items-center justify-center gap-2">
          <MaterialCommunityIcons
            name="plus-circle-outline" size={20} color="#9d8ba0" />
          <Text className="text-sm font-bold text-zinc-500
            uppercase tracking-wider">
            {language === 'es' ? 'Crear mi propia rutina' : 'Create my own routine'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}
