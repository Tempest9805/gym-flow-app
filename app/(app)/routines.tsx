import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useCurrentProfile, useRoutines } from '@/lib/hooks';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import { getAssignedDays } from '@/lib/api/schedules';
import type { RoutineWithExercises } from '@/types';

const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const GOAL_LABELS: Record<string, { es: string; en: string }> = {
  lose_weight: { es: '🔥 Bajar de peso', en: '🔥 Lose Weight' },
  build_resistance: { es: '💨 Ganar resistencia', en: '💨 Build Resistance' },
  build_muscle: { es: '💪 Ganar músculo', en: '💪 Build Muscle' },
  definition: { es: '✂️ Definición', en: '✂️ Definition' },
};

function RoutineCard({
  routine,
  userId,
  onPress,
}: {
  routine: RoutineWithExercises
  userId: string
  onPress: () => void
}) {
  const { data: assignedDays = [] } = useQuery({
    queryKey: ['assigned-days', routine.id, userId],
    queryFn: () => getAssignedDays(routine.id, userId),
    enabled: !!userId,
  })

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="mx-5 mb-3 bg-[#1E1428] rounded-2xl border border-zinc-800 p-4 active:opacity-70">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-lg font-black text-white">
            {routine.name}
          </Text>
          <Text className="text-sm text-[#BC13FE] mt-0.5 font-bold tracking-wide">
            {routine.exercises?.length ?? 0} exercises
          </Text>
          <Text className="text-xs text-zinc-500 mt-2 font-medium">
            {assignedDays.length > 0
              ? assignedDays.sort().map((d: number) => DAY_LABELS[d]).join(' · ')
              : 'No days assigned'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#504254" />
      </View>
    </TouchableOpacity>
  )
}

export default function RoutinesScreen() {
  const router = useRouter();
  const { data: profile } = useCurrentProfile();
  const { data: routines, isLoading } = useRoutines(profile || undefined);
  const typedRoutines = (routines ?? []) as RoutineWithExercises[];
  const [showGoalModal, setShowGoalModal] = useState(false);
  const { language } = useTranslation();
  const updateProfile = useUpdateProfile();

  const currentGoalLabel =
    profile?.goal && GOAL_LABELS[profile.goal]
      ? GOAL_LABELS[profile.goal][language] || GOAL_LABELS[profile.goal].en
      : null;

  const handleGoalChange = async (goalId: string) => {
    if (!profile?.id) return;
    try {
      await updateProfile.mutateAsync({ id: profile.id, updates: { goal: goalId } });
    } catch {
      Alert.alert('Error', language === 'es' ? 'No se pudo actualizar el objetivo' : 'Could not update the goal');
    } finally {
      setShowGoalModal(false);
    }
  };

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
          <View>
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

            {currentGoalLabel && (
              <View className="mx-5 mt-2 mb-2 bg-[#1E1428] rounded-xl p-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2 flex-1">
                  <Text className="text-sm font-bold text-zinc-400">
                    {language === 'es' ? 'Objetivo:' : 'Objective:'}
                  </Text>
                  <Text className="text-sm font-black text-white">
                    {currentGoalLabel}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowGoalModal(true)}
                  className="bg-[#BC13FE]/20 px-3 py-1.5 rounded-lg"
                >
                  <Text className="text-xs font-bold text-[#BC13FE]">
                    {language === 'es' ? 'Cambiar' : 'Change'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <RoutineCard
            routine={item}
            userId={profile?.id || ''}
            onPress={() => router.push(`/routine-detail?id=${item.id}`)}
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
              className="w-full h-16 rounded-xl items-center justify-center shadow-2xl mt-2 bg-[#BC13FE]"
              style={{ shadowColor: '#BC13FE', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 0 }, shadowRadius: 16 }}
              activeOpacity={0.85}
              onPress={() => router.push('/routine-start')}
            >
              <Text className="text-lg font-bold tracking-widest uppercase text-white">
                + CREATE ROUTINE
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Goal Change Modal */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowGoalModal(false)}
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="bg-[#1E1428] rounded-2xl p-5 mx-6 w-[90%] max-w-[360px]"
          >
            <Text className="text-xl font-black text-white text-center mb-4">
              {language === 'es' ? 'Cambiar objetivo' : 'Change objective'}
            </Text>

            <View className="gap-3">
              {Object.entries(GOAL_LABELS).map(([goalId, labels]) => {
                const isActive = profile?.goal === goalId;
                return (
                  <TouchableOpacity
                    key={goalId}
                    onPress={() => handleGoalChange(goalId)}
                    className={`p-4 rounded-xl border ${
                      isActive
                        ? 'border-[#BC13FE] bg-[#BC13FE]/15'
                        : 'border-zinc-800 bg-[#19101C]'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className={`text-base font-bold ${
                      isActive ? 'text-[#BC13FE]' : 'text-white'
                    }`}>
                      {labels[language] || labels.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setShowGoalModal(false)}
              className="mt-4 py-3 rounded-xl items-center"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-bold text-zinc-500">
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
