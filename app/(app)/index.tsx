import { ScrollView, View, Text, TouchableOpacity, Animated, Pressable } from 'react-native'
import { useRef, useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '@/lib/store/authStore'
import { useTheme } from '@/lib/hooks/useTheme'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { getTodaySchedule, getWeekSchedule, getAllRoutines } from '@/lib/api/schedules'
import { getOrCreateStreak, markDayCompleted } from '@/lib/api/streak'
import type { Routine, RoutineExercise } from '@/types'

function GreetingBlock({ userName }: { userName?: string | null }) {
  const name = userName?.split(' ')[0]?.toUpperCase() ?? 'ATHLETE'
  return (
    <View className="px-5 pt-6 pb-2">
      <Text className="text-5xl font-black text-white leading-tight">
        HELLO,
      </Text>
      <Text className="text-5xl font-black text-zinc-600 leading-tight">
        {name}
      </Text>
    </View>
  )
}

function StreakCard({
  streak,
  completedDays,
}: {
  streak: number
  completedDays: number[]
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const completedCount = completedDays.length

  const flameColor =
    completedCount >= 4 ? '#BC13FE' :
    completedCount >= 2 ? '#ef4444' :
    completedCount >= 1 ? '#f97316' :
    '#3b313e'

  const glowColor =
    completedCount >= 4 ? 'rgba(188,19,254,0.25)' :
    completedCount >= 2 ? 'rgba(239,68,68,0.2)' :
    completedCount >= 1 ? 'rgba(249,115,22,0.15)' :
    'transparent'

  const message =
    completedCount >= 4 ? '🔥 ON FIRE! UNSTOPPABLE!' :
    completedCount >= 2 ? `${completedCount} DAY STREAK!\nKEEP IT UP!` :
    completedCount === 1 ? 'GREAT START!\nHIT 1 MORE DAY!' :
    'START YOUR\nSTREAK TODAY!'

  useEffect(() => {
    if (completedCount >= 2) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12, duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1, duration: 900,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }
  }, [completedCount])

  return (
    <View className="mx-5 mb-4 rounded-2xl border border-zinc-800 bg-[#1E1428] overflow-hidden"
      style={{ boxShadow: completedCount >= 2 ? `0 0 20px ${glowColor}` : undefined }}>
      <View className="flex-row items-center p-4 gap-4">
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <MaterialCommunityIcons
            name="fire"
            size={completedCount >= 4 ? 72 : completedCount >= 2 ? 64 : 48}
            color={flameColor}
          />
          {completedCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: flameColor,
              borderRadius: 10,
              paddingHorizontal: 5,
              paddingVertical: 1,
            }}>
              <Text style={{
                color: '#fff',
                fontSize: 10,
                fontWeight: '900',
              }}>
                {completedCount}+
              </Text>
            </View>
          )}
        </Animated.View>

        <View className="flex-1">
          <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Weekly Streak
          </Text>
          <Text style={{
            color: completedCount >= 2 ? '#fff' : '#9d8ba0',
            fontSize: 18,
            fontWeight: '900',
            lineHeight: 22,
          }}>
            {message}
          </Text>
          {streak > 0 && (
            <Text className="text-xs text-zinc-600 mt-1">
              {streak} week{streak !== 1 ? 's' : ''} in a row
            </Text>
          )}
        </View>
      </View>

      <View className="h-1 bg-zinc-800 mx-4 mb-3 rounded-full">
        <View style={{
          height: '100%',
          borderRadius: 999,
          backgroundColor: flameColor,
          width: `${Math.min(100, (completedCount / 7) * 100)}%`,
        }} />
      </View>
    </View>
  )
}

const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function WeeklyDaysTracker({
  weekSchedule,
  completedDays,
  today,
}: {
  weekSchedule: { day_of_week: number }[]
  completedDays: number[]
  today: number
}) {
  return (
    <View className="mx-5 mb-4 bg-[#1E1428] rounded-2xl border border-zinc-800 p-4">
      <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
        Weekly Days Tracker
      </Text>
      <View className="flex-row justify-between">
        {DAY_LABELS.map((label, index) => {
          const hasRoutine = weekSchedule.some(s => s.day_of_week === index)
          const isCompleted = completedDays.includes(index)
          const isToday = index === today

          return (
            <View key={index} style={{
              width: 40,
              height: 56,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: isToday ? 1.5 : 1,
              borderColor:
                isCompleted ? '#22c55e' :
                isToday ? '#BC13FE' :
                hasRoutine ? '#504254' :
                '#2a1f2d',
              backgroundColor:
                isCompleted ? '#22c55e12' :
                isToday ? '#BC13FE12' :
                '#19101C',
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.5,
                color:
                  isCompleted ? '#22c55e' :
                  isToday ? '#BC13FE' :
                  hasRoutine ? '#9d8ba0' :
                  '#3b313e',
                marginBottom: 4,
              }}>
                {label}
              </Text>
              {isCompleted
                ? <MaterialCommunityIcons name="check" size={14} color="#22c55e" />
                : <View style={{
                    width: 5, height: 5, borderRadius: 3,
                    backgroundColor:
                      isToday ? '#BC13FE' :
                      hasRoutine ? '#504254' :
                      '#2a1f2d',
                  }} />
              }
            </View>
          )
        })}
      </View>
    </View>
  )
}

function TodayRoutineCard({
  routine,
  exercises,
  completedIds,
  onToggle,
  language,
}: {
  routine: { id: string; name: string }
  exercises: any[]
  completedIds: string[]
  onToggle: (id: string) => void
  language: string
}) {
  const completedCount = exercises.filter(e => completedIds.includes(e.id)).length

  return (
    <View className="mx-5 mb-4 bg-[#1E1428] rounded-2xl border border-zinc-800 overflow-hidden">
      <View className="p-4 pb-2">
        <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
          Today's Routine
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-black text-white flex-1 mr-2">
            {routine.name.toUpperCase()}
          </Text>
          <Text className="text-xs text-zinc-600">
            {completedCount}/{exercises.length}
          </Text>
        </View>
        <View className="h-1 bg-zinc-800 rounded-full mt-2">
          <View style={{
            height: '100%',
            borderRadius: 999,
            backgroundColor: '#BC13FE',
            width: exercises.length > 0
              ? `${(completedCount / exercises.length) * 100}%`
              : '0%',
          }} />
        </View>
      </View>

      <View className="px-3 pb-3 gap-2 mt-2">
        {exercises.map((re, index) => {
          const isCompleted = completedIds.includes(re.id)
          const exName = language === 'es' ? re.exercise.name_es : re.exercise.name_en
          const isTimeBased = re.exercise.type === 'time' ||
            (re.notes?.toLowerCase().includes('seg') || re.notes?.toLowerCase().includes('min'))
          const isCardio = re.exercise.category === 'cardio'

          return (
            <TouchableOpacity
              key={re.id}
              onPress={() => onToggle(re.id)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isCompleted ? '#BC13FE12' : '#251C28',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: isCompleted ? '#BC13FE30' : '#2a1f2d',
                gap: 10,
              }}>
              <Text style={{ fontSize: 11, color: '#504254', width: 16, fontWeight: '700' }}>
                {index + 1}
              </Text>
              <TouchableOpacity
                onPress={() => router.push(`/exercise/${re.exercise.id}`)}
                className="flex-1">
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: isCompleted ? '#9d8ba0' : '#eeddee',
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                }}>
                  {exName}
                </Text>
              </TouchableOpacity>
              <View className="flex-row items-center gap-2">
                {isTimeBased && (
                  <TouchableOpacity onPress={() => router.push('/timer')} hitSlop={8}>
                    <MaterialCommunityIcons name="timer-outline" size={14} color="#9d8ba0" />
                  </TouchableOpacity>
                )}
                {isCardio && !isTimeBased && (
                  <TouchableOpacity onPress={() => router.push('/tabata')} hitSlop={8}>
                    <MaterialCommunityIcons name="lightning-bolt" size={14} color="#9d8ba0" />
                  </TouchableOpacity>
                )}
                <Text style={{ fontSize: 13, color: '#9d8ba0', fontWeight: '600' }}>
                  {re.sets}×{re.reps}
                </Text>
                <View style={{
                  width: 28, height: 28, borderRadius: 8, borderWidth: 1.5,
                  borderColor: isCompleted ? '#BC13FE' : '#504254',
                  backgroundColor: isCompleted ? '#BC13FE' : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isCompleted && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

function EmptyRoutineCard() {
  return (
    <View className="mx-5 mb-4 bg-[#1E1428] rounded-2xl border border-zinc-800 p-6 items-center">
      <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
        TODAY'S ROUTINE
      </Text>
      <MaterialCommunityIcons name="dumbbell" size={48} color="#3b313e" />
      <Text className="text-sm text-zinc-600 text-center mt-3 mb-4">
        No routine scheduled for today
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/routines/create')}
        className="w-full h-14 bg-[#BC13FE] rounded-xl items-center justify-center"
        style={{ boxShadow: '0 0 16px rgba(188,19,254,0.3)' }}>
        <Text className="text-white font-bold uppercase tracking-wider">
          CREATE ROUTINE
        </Text>
      </TouchableOpacity>
    </View>
  )
}

function SavedRoutinesSection({
  routines,
  language,
}: {
  routines: any[]
  language: string
}) {
  return (
    <View className="mb-4">
      <Text className="text-lg font-black text-white uppercase px-5 mb-3">
        SAVED ROUTINES
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
        {routines.map(routine => (
          <TouchableOpacity
            key={routine.id}
            onPress={() => router.push(`/routine/${routine.id}`)}
            style={{
              width: 160, backgroundColor: '#1E1428', borderRadius: 16,
              borderWidth: 1, borderColor: '#2a1f2d', padding: 16,
            }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#eeddee', marginBottom: 6 }}>
              {routine.name}
            </Text>
            <Text style={{ fontSize: 12, color: '#9d8ba0' }}>
              {routine.routine_exercises?.length ?? 0} movements
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

function QuickActionsBar() {
  return (
    <View className="flex-row mx-5 gap-3 mb-4">
      {[
        { label: 'Browse Exercises', route: '/exercises', icon: 'dumbbell' },
        { label: 'Timer', route: '/timer', icon: 'timer-outline' },
        { label: 'Tabata', route: '/tabata', icon: 'lightning-bolt' },
      ].map(action => (
        <TouchableOpacity
          key={action.route}
          onPress={() => router.push(action.route as any)}
          className="flex-1 bg-[#1E1428] border border-zinc-800 rounded-xl py-3 items-center gap-1.5">
          <MaterialCommunityIcons name={action.icon as any} size={18} color="#9d8ba0" />
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#9d8ba0', textAlign: 'center' }}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default function HomeScreen() {
  const { user } = useAuthStore()
  const { language } = useTranslation()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const today = new Date().getDay()

  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([])

  const { data: todaySchedule } = useQuery({
    queryKey: ['today-schedule', user?.id],
    queryFn: () => getTodaySchedule(user!.id),
    enabled: !!user?.id,
  })

  const { data: weekSchedule = [] } = useQuery({
    queryKey: ['week-schedule', user?.id],
    queryFn: () => getWeekSchedule(user!.id),
    enabled: !!user?.id,
  })

  const { data: allRoutines = [] } = useQuery({
    queryKey: ['all-routines', user?.id],
    queryFn: () => getAllRoutines(user!.id),
    enabled: !!user?.id,
  })

  const { data: streak } = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: () => getOrCreateStreak(user!.id),
    enabled: !!user?.id,
  })

  const markDayMutation = useMutation({
    mutationFn: ({ dayOfWeek }: { dayOfWeek: number }) =>
      markDayCompleted(user!.id, dayOfWeek),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak', user?.id] })
    },
  })

  // Marcar día al completar todos los ejercicios
  const todayExercises = (todaySchedule?.routine as any)?.routine_exercises
    ?.filter((re: any) => re.day_of_week === today)
    ?.sort((a: any, b: any) => a.order_index - b.order_index) ?? []

  const handleToggleExercise = useCallback((exerciseId: string) => {
    setCompletedExerciseIds(prev => {
      const next = prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]

      // Si se completan todos → marcar día
      if (next.length === todayExercises.length && todayExercises.length > 0) {
        markDayMutation.mutate({ dayOfWeek: today })
      }
      return next
    })
  }, [todayExercises, today])

  return (
    <ScrollView
      className="flex-1 bg-[#19101C]"
      contentContainerStyle={{
        paddingBottom: insets.bottom + 100,
        paddingTop: insets.top,
      }}
      showsVerticalScrollIndicator={false}>

      <GreetingBlock userName={user?.user_metadata?.full_name} />

      <StreakCard
        streak={streak?.current_streak ?? 0}
        completedDays={streak?.completed_days_this_week ?? []}
      />

      <WeeklyDaysTracker
        weekSchedule={weekSchedule}
        completedDays={streak?.completed_days_this_week ?? []}
        today={today}
      />

      {todaySchedule ? (
        <TodayRoutineCard
          routine={todaySchedule.routine as any}
          exercises={todayExercises}
          completedIds={completedExerciseIds}
          onToggle={handleToggleExercise}
          language={language}
        />
      ) : (
        <EmptyRoutineCard />
      )}

      {allRoutines.length > 0 && (
        <SavedRoutinesSection routines={allRoutines as any} language={language} />
      )}

      <QuickActionsBar />

    </ScrollView>
  )
}