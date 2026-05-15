import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useCurrentProfile, useRoutines } from '@/lib/hooks';
import type { RoutineWithExercises } from '@/types';
import { cn } from '@/lib/utils/cn';

export default function RoutinesScreen() {
  const router = useRouter();
  const t = useTheme();
  const { data: profile } = useCurrentProfile();
  // Cast to RoutineWithExercises[] — API returns exercises joined
  const { data: routines, isLoading } = useRoutines(profile || undefined);
  const typedRoutines = (routines ?? []) as RoutineWithExercises[];

  return (
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: t.background }} 
      edges={['top']}
    >
      <AppTopBar />
      <FlatList
        className="flex-1"
        style={{ backgroundColor: t.background }}
        contentContainerStyle={{ paddingBottom: 40 }}
        data={typedRoutines}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="pt-4 px-5 pb-4 gap-1">
            {/* Title — styled as routine-builder Stitch header */}
            <Text 
              className="text-5xl font-extrabold tracking-tighter leading-[52px] uppercase" 
              style={{ color: t.onBackground }}
            >
              ROUTINES
            </Text>
            <Text className="text-base leading-6" style={{ color: t.onSurfaceVariant }}>
              Your training blueprints
            </Text>
            {isLoading && (
              <ActivityIndicator color={t.primaryContainer} className="mt-4" />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View
            className="mx-5 mb-3 rounded-xl border p-6 gap-6 shadow-2xl elevation-md"
            style={{
              backgroundColor: t.surfaceContainer,
              borderColor: t.surfaceContainerHighest,
              shadowColor: '#000',
            }}
          >
            {/* Card header */}
            <View className="flex-row justify-between items-start">
              <View className="gap-1">
                <Text className="text-xl font-bold uppercase" style={{ color: t.onSurface }}>
                  {item.name.toUpperCase()}
                </Text>
                <Text className="text-sm leading-5" style={{ color: t.primaryContainer }}>
                  {item.exercises?.length ?? 0} exercises
                </Text>
              </View>
              <View className="flex-row gap-2">
                {/* Edit Button */}
                <TouchableOpacity
                  className="w-10 h-10 rounded-full items-center justify-center"
                  onPress={() =>
                    router.push({ pathname: '/routine-builder', params: { id: item.id } })
                  }
                  activeOpacity={0.7}
                >
                  <Text className="text-lg" style={{ color: t.outlineVariant }}>✎</Text>
                </TouchableOpacity>
                {/* Share Button */}
                <TouchableOpacity
                  className="w-10 h-10 rounded-full items-center justify-center"
                  onPress={() => router.push(`/share/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Text className="text-lg" style={{ color: t.primaryContainer }}>⬆</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Exercise pills preview */}
            {item.exercises && item.exercises.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {item.exercises.slice(0, 3).map((ex, i) => (
                  <View
                    key={ex.id ?? i}
                    className="rounded-md border px-2.5 py-1"
                    style={{ backgroundColor: t.surfaceContainerHigh, borderColor: t.surfaceContainerHighest }}
                  >
                    <Text className="text-[12px] font-medium" style={{ color: t.onSurface }}>
                      {ex.exercise?.name_en ?? 'Exercise'}
                    </Text>
                  </View>
                ))}
                {item.exercises.length > 3 && (
                  <Text className="text-[12px] leading-6" style={{ color: t.outlineVariant }}>
                    +{item.exercises.length - 3} more
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="pt-16 px-5 items-center gap-2">
              <Text className="text-2xl font-semibold text-center" style={{ color: t.onSurface }}>No routines yet</Text>
              <Text className="text-base text-center leading-5" style={{ color: t.onSurfaceVariant }}>
                Create your first training blueprint below
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View className="px-5 pt-4 pb-10 gap-6">
            {/* IMPORT ROUTINE — dashed button (Stitch pattern) */}
            <TouchableOpacity
              className="w-full h-16 rounded-xl border-2 border-dashed flex-row items-center justify-center gap-3"
              style={{
                borderColor: t.surfaceContainerHighest,
                backgroundColor: 'transparent',
              }}
              activeOpacity={0.7}
              onPress={() => router.push('/import-routine')}
            >
              <Text className="text-lg" style={{ color: t.onSurfaceVariant }}>⬇</Text>
              <Text 
                className="text-base font-semibold tracking-widest uppercase" 
                style={{ color: t.onSurfaceVariant }}
              >
                IMPORT ROUTINE
              </Text>
            </TouchableOpacity>

            {/* CREATE ROUTINE — primary CTA */}
            <TouchableOpacity
              className="w-full h-20 rounded-xl items-center justify-center shadow-2xl elevation-md mt-2"
              style={{
                backgroundColor: t.primaryContainer,
                shadowColor: t.primaryContainer,
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 16,
              }}
              activeOpacity={0.85}
              onPress={() => router.push('/routine-builder')}
            >
              <Text 
                className="text-xl font-bold tracking-[2px] uppercase" 
                style={{ color: t.onPrimaryContainer }}
              >
                + CREATE ROUTINE
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}
