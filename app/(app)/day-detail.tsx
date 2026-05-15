/**
 * Day Detail Screen — Stitch-faithful "Daily Protocol" layout:
 *   1. TopAppBar (sticky)
 *   2. Hero: DAY NAME (display-xl) + Date meta
 *   3. Assignment Area: 
 *      - If routine: Protocol Card with stats + START/CLEAR CTAs
 *      - If rest: Subdued "Rest & Recovery" hero + ASSIGN primary CTA
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { LoadingScreen } from '@/components/ui';
import { useTheme } from '@/lib/hooks/useTheme';
import { useWeekSchedule, useCurrentProfile, useClearScheduleDay } from '@/lib/hooks';
import type { DayOfWeek, RoutineWithExercises } from '@/types';

const DAY_LABELS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function DayDetailScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const router = useRouter();
  const t = useTheme();
  const { data: profile } = useCurrentProfile();
  const { data: schedule, isLoading } = useWeekSchedule(profile?.id);
  const clearDay = useClearScheduleDay(profile?.id);

  if (isLoading || !profile) return <LoadingScreen />;

  const dayIndex = parseInt(day ?? '0', 10) as DayOfWeek;
  const dayName = DAY_LABELS[dayIndex];
  const routineForDay = schedule?.find((s) => s.day_of_week === dayIndex)?.routine as RoutineWithExercises | undefined;

  const handleClearDay = async () => {
    Alert.alert(
      'Clear Protocol',
      `Remove ${routineForDay?.name} from ${dayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearDay.mutateAsync(dayIndex);
              router.back();
            } catch (e) {
              console.error(e);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <View className="flex-1" style={{ backgroundColor: t.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* ── 1. Hero Area ── */}
          <View className="px-6 pt-8 gap-3">
            <View 
              className="px-3 py-1 rounded-full border self-start" 
              style={{ backgroundColor: `${t.primaryContainer}22`, borderColor: `${t.primaryContainer}44` }}
            >
              <Text className="text-[11px] font-bold tracking-[2px]" style={{ color: t.primaryContainer }}>DAILY PROTOCOL</Text>
            </View>
            <Text className="text-[48px] font-black tracking-tighter" style={{ color: t.onSurface }}>{dayName}</Text>
          </View>

          {/* ── 2. Protocol Assignment ── */}
          {routineForDay ? (
            <View className="p-5 mt-6">
              <View 
                className="rounded-3xl border p-6 gap-5" 
                style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
              >
                <Text className="text-[10px] font-extrabold tracking-[2px]" style={{ color: t.outline }}>ASSIGNED ROUTINE</Text>
                <Text className="text-[32px] font-extrabold leading-[38px]" style={{ color: t.onSurface }}>{routineForDay.name.toUpperCase()}</Text>
                
                <View className="flex-row items-center py-3">
                  <View className="flex-1 items-center gap-1">
                    <Text className="text-2xl font-extrabold" style={{ color: t.onSurface }}>{routineForDay.exercises?.length ?? 0}</Text>
                    <Text className="text-[10px] font-bold tracking-widest" style={{ color: t.onSurfaceVariant }}>MOVEMENTS</Text>
                  </View>
                  <View className="w-[1px] h-10" style={{ backgroundColor: t.surfaceContainerHighest }} />
                  <View className="flex-1 items-center gap-1">
                    <Text className="text-2xl font-extrabold" style={{ color: t.onSurface }}>45m</Text>
                    <Text className="text-[10px] font-bold tracking-widest" style={{ color: t.onSurfaceVariant }}>EST. TIME</Text>
                  </View>
                </View>

                <View className="gap-3 mt-3">
                  <TouchableOpacity
                    className="h-16 rounded-xl items-center justify-center shadow-2xl elevation-md"
                    style={{ backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }}
                    onPress={() => router.push({ pathname: '/workout', params: { id: routineForDay.id } })}
                  >
                    <Text className="text-base font-extrabold tracking-[2px] text-black">VIEW & START</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="h-14 rounded-xl border items-center justify-center"
                    style={{ borderColor: t.surfaceContainerHighest }}
                    onPress={handleClearDay}
                  >
                    <Text className="text-[13px] font-bold tracking-widest" style={{ color: t.error || '#ff4444' }}>CLEAR FROM SCHEDULE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-1 p-8 items-center gap-4 mt-10">
              <View 
                className="w-[100px] h-[100px] rounded-full items-center justify-center mb-4" 
                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <Text className="text-[48px]">💤</Text>
              </View>
              <Text className="text-[28px] font-extrabold tracking-[-0.5px]" style={{ color: t.onSurface }}>REST & RECOVERY</Text>
              <Text className="text-base text-center leading-6 mb-8" style={{ color: t.onSurfaceVariant }}>
                No training protocol assigned for this period. Rest is essential for peak performance.
              </Text>

              <View className="w-full gap-3">
                <TouchableOpacity
                  className="h-16 rounded-xl items-center justify-center shadow-2xl elevation-md"
                  style={{ backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }}
                  onPress={() => router.push('/routines')}
                >
                  <Text className="text-base font-extrabold tracking-[2px] text-black">ASSIGN ROUTINE</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="h-14 rounded-xl border items-center justify-center"
                  style={{ borderColor: t.surfaceContainerHighest }}
                  onPress={() => router.push('/routine-builder')}
                >
                  <Text className="text-sm font-semibold tracking-widest" style={{ color: t.onSurface }}>BUILD NEW PROTOCOL</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
