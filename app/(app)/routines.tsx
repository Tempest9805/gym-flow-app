/**
 * Rutinas — pick which routine "Hoy" shows, and manage them.
 *
 * Creating and editing days lands in F4; this screen already covers the
 * common case: one routine, tap to make it the active one.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { dayProgress } from '@/lib/domain/day';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRoutineStore } from '@/lib/store/routineStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function RoutinesScreen() {
  const t = useTheme();
  const router = useRouter();

  const routines = useRoutineStore((s) => s.routines);
  const activeRoutineId = useRoutineStore((s) => s.activeRoutineId);
  const setActiveRoutine = useRoutineStore((s) => s.setActiveRoutine);
  const removeRoutine = useRoutineStore((s) => s.removeRoutine);

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Borrar rutina', `¿Seguro que quieres borrar «${name}»? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => removeRoutine(id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-2xl font-extrabold" style={{ color: t.onSurface }}>
          Rutinas
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}>
        {routines.length === 0 && (
          <Text className="text-center mt-8" style={{ color: t.onSurfaceVariant }}>
            Todavía no hay ninguna rutina.
          </Text>
        )}

        {routines.map((routine) => {
          const isActive = routine.id === activeRoutineId;
          const totalRows = routine.days.reduce((n, day) => n + day.rows.length, 0);
          const doneRows = routine.days.reduce((n, day) => n + dayProgress(day).done, 0);

          return (
            <View
              key={routine.id}
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: isActive ? t.primaryContainer : t.outlineVariant,
                backgroundColor: t.surfaceContainerLow,
              }}
            >
              <Pressable
                onPress={() => {
                  setActiveRoutine(routine.id);
                  router.push('/');
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Entrenar ${routine.name}`}
                className="px-4 py-3 gap-1"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-[17px] font-bold flex-1" style={{ color: t.onSurface }} numberOfLines={1}>
                    {routine.name}
                  </Text>
                  {isActive && (
                    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: t.primaryContainer }}>
                      <Text className="text-[10px] font-bold uppercase" style={{ color: t.onPrimaryContainer }}>
                        Activa
                      </Text>
                    </View>
                  )}
                </View>

                {(routine.athleteName || routine.coachName) && (
                  <Text className="text-[12px]" style={{ color: t.onSurfaceVariant }}>
                    {[routine.athleteName, routine.coachName].filter(Boolean).join(' · ')}
                  </Text>
                )}

                <Text className="text-[12px]" style={{ color: t.outline }}>
                  {routine.days.length} días · {totalRows} ejercicios · {doneRows} hechos
                </Text>
              </Pressable>

              {/* Day chips */}
              <View className="flex-row flex-wrap gap-2 px-4 pb-3">
                {routine.days.map((day) => (
                  <View
                    key={day.id}
                    className="flex-row items-center gap-1.5 rounded-lg px-2 py-1"
                    style={{ backgroundColor: t.surfaceContainerHigh }}
                  >
                    <MaterialCommunityIcons name={day.icon as IconName} size={13} color={t.onSurfaceVariant} />
                    <Text className="text-[11px]" style={{ color: t.onSurfaceVariant }}>
                      {day.focus}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => confirmDelete(routine.id, routine.name)}
                accessibilityRole="button"
                accessibilityLabel={`Borrar ${routine.name}`}
                className="flex-row items-center justify-center gap-2 border-t"
                style={{ borderTopColor: t.outlineVariant, minHeight: 44 }}
              >
                <MaterialCommunityIcons name="delete-outline" size={18} color={t.error} />
                <Text className="text-[13px] font-semibold" style={{ color: t.error }}>
                  Borrar
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
