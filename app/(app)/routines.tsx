import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useCurrentProfile, useRoutines } from '@/lib/hooks';
import { deleteRoutine } from '@/lib/api/routines';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { RoutineWithExercises } from '@/types';

function RoutineCard({
  routine,
  onEdit,
  onDelete,
}: {
  routine: RoutineWithExercises
  onEdit: () => void
  onDelete: () => void
}) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    )
  }

  return (
    <View className="mx-5 mb-3 bg-[#1E1428] rounded-2xl border border-zinc-800 p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-lg font-black text-white">
            {routine.name}
          </Text>
          <Text className="text-sm text-[#BC13FE] mt-0.5">
            {routine.exercises?.length ?? 0} exercises
          </Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onEdit}
            className="w-10 h-10 rounded-xl bg-zinc-800 items-center justify-center">
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#9d8ba0" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            className="w-10 h-10 rounded-xl bg-red-950 items-center justify-center">
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function RoutinesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  const { data: routines, isLoading } = useRoutines(profile || undefined);
  const typedRoutines = (routines ?? []) as RoutineWithExercises[];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['all-routines'] });
      queryClient.invalidateQueries({ queryKey: ['today-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['week-schedule'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Could not delete routine.');
      console.error(error);
    }
  });

  return (
    <SafeAreaView 
      className="flex-1 bg-[#19101C]" 
      edges={['top']}
    >
      <AppTopBar />
      <FlatList
        className="flex-1 bg-[#19101C]"
        contentContainerStyle={{ paddingBottom: 40 }}
        data={typedRoutines}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="pt-4 px-5 pb-4 gap-1">
            <Text className="text-5xl font-extrabold tracking-tighter leading-[52px] uppercase text-white">
              ROUTINES
            </Text>
            <Text className="text-base leading-6 text-zinc-400">
              Your training blueprints
            </Text>
            {isLoading && (
              <ActivityIndicator color="#BC13FE" className="mt-4" />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <RoutineCard
            routine={item}
            onEdit={() => router.push({ pathname: '/routine-builder', params: { id: item.id } })}
            onDelete={() => deleteMutation.mutate(item.id)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="pt-16 px-5 items-center gap-2">
              <Text className="text-2xl font-semibold text-center text-white">No routines yet</Text>
              <Text className="text-base text-center leading-5 text-zinc-400">
                Create your first training blueprint below
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View className="px-5 pt-4 pb-10 gap-6">
            <TouchableOpacity
              className="w-full h-20 rounded-xl items-center justify-center shadow-2xl mt-2 bg-[#BC13FE]"
              style={{ shadowColor: '#BC13FE', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 0 }, shadowRadius: 16 }}
              activeOpacity={0.85}
              onPress={() => router.push('/routine-builder')}
            >
              <Text className="text-xl font-bold tracking-[2px] uppercase text-white">
                + CREATE ROUTINE
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}
