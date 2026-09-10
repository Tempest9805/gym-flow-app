/**
 * Rutinas — pick which routine "Hoy" shows, and shape it.
 *
 * A routine is a name plus 1..N days. Days are added and removed here; the
 * exercises inside them are edited on Hoy, where you can see them.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { dayProgress } from '@/lib/domain/day';
import { pluralize } from '@/lib/domain/plural';
import type { Routine } from '@/lib/domain/types';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRoutineStore } from '@/lib/store/routineStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Focuses offered when adding a day — the ones a sheet actually uses. */
const FOCUS_SUGGESTIONS = ['Espalda', 'Pecho', 'Pierna', 'Brazo', 'Hombro', 'Movilidad y abdomen', 'Cardio'];

export default function RoutinesScreen() {
  const t = useTheme();
  const router = useRouter();

  const routines = useRoutineStore((s) => s.routines);
  const activeRoutineId = useRoutineStore((s) => s.activeRoutineId);
  const setActiveRoutine = useRoutineStore((s) => s.setActiveRoutine);
  const removeRoutine = useRoutineStore((s) => s.removeRoutine);
  const createRoutine = useRoutineStore((s) => s.createRoutine);
  const addDay = useRoutineStore((s) => s.addDay);
  const removeDay = useRoutineStore((s) => s.removeDay);
  const setDayFocus = useRoutineStore((s) => s.setDayFocus);
  const updateRoutineMeta = useRoutineStore((s) => s.updateRoutineMeta);

  const [expandedId, setExpandedId] = useState<string | null>(activeRoutineId);
  const [focusTarget, setFocusTarget] = useState<{ routineId: string; dayId: string | null } | null>(null);
  const [headerTarget, setHeaderTarget] = useState<Routine | null>(null);

  const confirmDeleteRoutine = (id: string, name: string) => {
    Alert.alert('Borrar rutina', `¿Seguro que quieres borrar «${name}»? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => removeRoutine(id) },
    ]);
  };

  const confirmDeleteDay = (routineId: string, dayId: string, label: string, dayCount: number) => {
    if (dayCount <= 1) {
      Alert.alert('No se puede', 'Una rutina necesita al menos un día.');
      return;
    }
    Alert.alert('Quitar día', `¿Quitar ${label} y todos sus ejercicios?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => removeDay(routineId, dayId) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
        <Text className="text-2xl font-extrabold" style={{ color: t.onSurface }}>
          Rutinas
        </Text>
        <View className="flex-row items-center gap-2">
          {/* Pegar va primero porque es el camino corto: la rutina ya existe
              escrita en algun sitio, y teclearla nunca merece la pena. */}
          <Pressable
            onPress={() => router.push('/import')}
            accessibilityRole="button"
            accessibilityLabel="Pegar una rutina escrita"
            className="flex-row items-center gap-1.5 rounded-lg px-3"
            style={{ backgroundColor: t.primaryContainer, minHeight: 40 }}
          >
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={18}
              color={t.onPrimaryContainer}
            />
            <Text className="text-[13px] font-bold" style={{ color: t.onPrimaryContainer }}>
              Pegar
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              const id = createRoutine(`Rutina ${routines.length + 1}`);
              setExpandedId(id);
            }}
            accessibilityRole="button"
            accessibilityLabel="Crear una rutina vacia"
            className="flex-row items-center gap-1.5 rounded-lg border px-3"
            style={{ borderColor: t.outline, minHeight: 40 }}
          >
            <MaterialCommunityIcons name="plus" size={18} color={t.onSurface} />
            <Text className="text-[13px] font-bold" style={{ color: t.onSurface }}>
              Nueva
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}>
        {routines.length === 0 && (
          <Text className="text-center mt-8" style={{ color: t.onSurfaceVariant }}>
            Todavía no hay ninguna rutina. Toca «Pegar» y suelta la tuya tal cual esté escrita.
          </Text>
        )}

        {routines.map((routine) => {
          const isActive = routine.id === activeRoutineId;
          const isOpen = expandedId === routine.id;
          const totalRows = routine.days.reduce((n, day) => n + day.rows.length, 0);
          const doneRows = routine.days.reduce((n, day) => n + dayProgress(day).done, 0);

          return (
            <View
              key={routine.id}
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: isActive ? t.primary : t.outlineVariant,
                backgroundColor: t.surfaceContainerLow,
              }}
            >
              <Pressable
                onPress={() => setExpandedId(isOpen ? null : routine.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${routine.name}, ${pluralize(routine.days.length, 'día', 'días')}`}
                className="px-4 py-3 gap-1"
              >
                <View className="flex-row items-center gap-2">
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
                  <MaterialCommunityIcons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={t.outline}
                  />
                </View>

                {(routine.athleteName || routine.goal || routine.coachName) && (
                  <Text className="text-[12px]" style={{ color: t.onSurfaceVariant }} numberOfLines={1}>
                    {[routine.athleteName, routine.goal && `Objetivo: ${routine.goal}`, routine.coachName]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                )}

                <Text className="text-[12px]" style={{ color: t.outline }}>
                  {pluralize(routine.days.length, 'día', 'días')} ·{' '}
                    {pluralize(totalRows, 'ejercicio', 'ejercicios')} · {doneRows} hechos
                </Text>

                {/* Lo que hace falta para hacerla. Se guarda al elegir plantilla
                    y se ve aqui: saber si hay que salir de casa no deberia
                    obligar a abrir la tabla entera. */}
                {routine.equipment !== null && (
                  <View className="flex-row items-start gap-1.5 pt-0.5">
                    <MaterialCommunityIcons name="wrench-outline" size={13} color={t.outline} />
                    <Text className="flex-1 text-[12px]" style={{ color: t.outline }} numberOfLines={2}>
                      {routine.equipment}
                    </Text>
                  </View>
                )}
              </Pressable>

              {isOpen && (
                <View className="px-4 pb-3 gap-2">
                  {routine.days.map((day) => (
                    <View
                      key={day.id}
                      className="flex-row items-center gap-2 rounded-xl px-3"
                      style={{ backgroundColor: t.surfaceContainerHigh, minHeight: 52 }}
                    >
                      <MaterialCommunityIcons name={day.icon as IconName} size={20} color={t.primary} />

                      <Pressable
                        className="flex-1 justify-center"
                        style={{ minHeight: 48 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Cambiar el enfoque de ${day.label}`}
                        onPress={() => setFocusTarget({ routineId: routine.id, dayId: day.id })}
                      >
                        <Text className="text-[14px] font-semibold" style={{ color: t.onSurface }}>
                          {day.label}
                        </Text>
                        <Text className="text-[12px]" style={{ color: t.onSurfaceVariant }} numberOfLines={1}>
                          {day.focus || 'Sin enfoque · toca para ponerle uno'} ·{' '}
                          {pluralize(day.rows.length, 'ejercicio', 'ejercicios')}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => confirmDeleteDay(routine.id, day.id, day.label, routine.days.length)}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={`Quitar ${day.label}`}
                        className="items-center justify-center"
                        style={{ width: 40, minHeight: 48 }}
                      >
                        <MaterialCommunityIcons name="close" size={20} color={t.outline} />
                      </Pressable>
                    </View>
                  ))}

                  <Pressable
                    onPress={() => setFocusTarget({ routineId: routine.id, dayId: null })}
                    accessibilityRole="button"
                    accessibilityLabel="Añadir un día"
                    className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed"
                    style={{ borderColor: t.outline, minHeight: 48 }}
                  >
                    <MaterialCommunityIcons name="plus" size={18} color={t.onSurfaceVariant} />
                    <Text className="text-[13px] font-semibold" style={{ color: t.onSurfaceVariant }}>
                      Añadir día
                    </Text>
                  </Pressable>

                  <View className="flex-row gap-2 mt-1">
                    <Pressable
                      onPress={() => {
                        setActiveRoutine(routine.id);
                        router.push('/');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Entrenar ${routine.name}`}
                      className="flex-1 rounded-xl items-center justify-center"
                      style={{ backgroundColor: t.primaryContainer, minHeight: 48 }}
                    >
                      <Text className="text-[14px] font-bold" style={{ color: t.onPrimaryContainer }}>
                        Entrenar
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setHeaderTarget(routine)}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar los datos de ${routine.name}`}
                      className="rounded-xl border items-center justify-center px-4"
                      style={{ borderColor: t.outlineVariant, minHeight: 48 }}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={18} color={t.onSurfaceVariant} />
                    </Pressable>

                    <Pressable
                      onPress={() => confirmDeleteRoutine(routine.id, routine.name)}
                      accessibilityRole="button"
                      accessibilityLabel={`Borrar ${routine.name}`}
                      className="rounded-xl border items-center justify-center px-4"
                      style={{ borderColor: t.outlineVariant, minHeight: 48 }}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={18} color={t.error} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <FocusSheet
        target={focusTarget}
        routines={routines}
        onCancel={() => setFocusTarget(null)}
        onSubmit={(focus) => {
          if (!focusTarget) return;
          if (focusTarget.dayId) setDayFocus(focusTarget.routineId, focusTarget.dayId, focus);
          else addDay(focusTarget.routineId, focus);
          setFocusTarget(null);
        }}
      />

      <HeaderSheet
        routine={headerTarget}
        onCancel={() => setHeaderTarget(null)}
        onSubmit={(patch) => {
          if (headerTarget) updateRoutineMeta(headerTarget.id, patch);
          setHeaderTarget(null);
        }}
      />
    </SafeAreaView>
  );
}

/** Set or change a day's focus ("Espalda", "Movilidad y abdomen", …). */
function FocusSheet({
  target,
  routines,
  onCancel,
  onSubmit,
}: {
  target: { routineId: string; dayId: string | null } | null;
  routines: Routine[];
  onCancel: () => void;
  onSubmit: (focus: string) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const current = target?.dayId
    ? routines.find((r) => r.id === target.routineId)?.days.find((d) => d.id === target.dayId)?.focus
    : '';
  const [value, setValue] = useState('');

  return (
    <Modal
      visible={target !== null}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      onShow={() => setValue(current ?? '')}
    >
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onCancel}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            className="rounded-t-3xl border-t px-5 pt-5 gap-4"
            style={{
              backgroundColor: t.surfaceContainerLow,
              borderTopColor: t.outlineVariant,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
            }}
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="text-[20px] font-extrabold" style={{ color: t.onSurface }}>
              {target?.dayId ? 'Enfoque del día' : 'Nuevo día'}
            </Text>

            <TextInput
              value={value}
              onChangeText={setValue}
              autoFocus
              placeholder="Espalda, Pierna, Movilidad…"
              placeholderTextColor={t.outline}
              className="rounded-xl border px-4 text-[18px]"
              style={{
                color: t.onSurface,
                borderColor: t.outlineVariant,
                backgroundColor: t.surfaceContainerHigh,
                minHeight: 56,
              }}
              accessibilityLabel="Enfoque del día"
              returnKeyType="done"
              onSubmitEditing={() => onSubmit(value.trim())}
            />

            <View className="flex-row flex-wrap gap-2">
              {FOCUS_SUGGESTIONS.map((focus) => (
                <Pressable
                  key={focus}
                  onPress={() => setValue(focus)}
                  accessibilityRole="button"
                  accessibilityLabel={`Usar ${focus}`}
                  className="rounded-lg border px-3 justify-center"
                  style={{
                    minHeight: 44,
                    borderColor: value === focus ? t.primary : t.outlineVariant,
                    backgroundColor: value === focus ? `${t.primaryContainer}22` : t.surfaceContainerHigh,
                  }}
                >
                  <Text className="text-[14px]" style={{ color: t.onSurface }}>
                    {focus}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={onCancel}
                accessibilityRole="button"
                className="flex-1 rounded-xl border items-center justify-center"
                style={{ borderColor: t.outlineVariant, minHeight: 52 }}
              >
                <Text className="font-bold" style={{ color: t.onSurfaceVariant }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => onSubmit(value.trim())}
                accessibilityRole="button"
                className="flex-1 rounded-xl items-center justify-center"
                style={{ backgroundColor: t.primaryContainer, minHeight: 52 }}
              >
                <Text className="font-bold" style={{ color: t.onPrimaryContainer }}>Guardar</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

/** The optional header of the printed sheet: athlete, goal, coach. */
function HeaderSheet({
  routine,
  onCancel,
  onSubmit,
}: {
  routine: Routine | null;
  onCancel: () => void;
  onSubmit: (patch: Partial<Pick<Routine, 'name' | 'athleteName' | 'goal' | 'coachName'>>) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [athlete, setAthlete] = useState('');
  const [goal, setGoal] = useState('');
  const [coach, setCoach] = useState('');

  const fields: [string, string, (value: string) => void, string][] = [
    ['Nombre de la rutina', name, setName, 'Rutina Pablo'],
    ['Atleta (opcional)', athlete, setAthlete, 'Pablo'],
    ['Objetivo (opcional)', goal, setGoal, 'brazos'],
    ['Coach (opcional)', coach, setCoach, 'Coaching Nach'],
  ];

  return (
    <Modal
      visible={routine !== null}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      onShow={() => {
        setName(routine?.name ?? '');
        setAthlete(routine?.athleteName ?? '');
        setGoal(routine?.goal ?? '');
        setCoach(routine?.coachName ?? '');
      }}
    >
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onCancel}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            className="rounded-t-3xl border-t px-5 pt-5 gap-3"
            style={{
              backgroundColor: t.surfaceContainerLow,
              borderTopColor: t.outlineVariant,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
            }}
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="text-[20px] font-extrabold" style={{ color: t.onSurface }}>
              Datos de la rutina
            </Text>

            {fields.map(([label, value, setValue, placeholder]) => (
              <View key={label} className="gap-1">
                <Text className="text-[12px] font-semibold" style={{ color: t.onSurfaceVariant }}>
                  {label}
                </Text>
                <TextInput
                  value={value}
                  onChangeText={setValue}
                  placeholder={placeholder}
                  placeholderTextColor={t.outline}
                  className="rounded-xl border px-4 text-[16px]"
                  style={{
                    color: t.onSurface,
                    borderColor: t.outlineVariant,
                    backgroundColor: t.surfaceContainerHigh,
                    minHeight: 52,
                  }}
                  accessibilityLabel={label}
                />
              </View>
            ))}

            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={onCancel}
                accessibilityRole="button"
                className="flex-1 rounded-xl border items-center justify-center"
                style={{ borderColor: t.outlineVariant, minHeight: 52 }}
              >
                <Text className="font-bold" style={{ color: t.onSurfaceVariant }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  onSubmit({
                    name: name.trim() || (routine?.name ?? 'Rutina'),
                    athleteName: athlete.trim() || null,
                    goal: goal.trim() || null,
                    coachName: coach.trim() || null,
                  })
                }
                accessibilityRole="button"
                className="flex-1 rounded-xl items-center justify-center"
                style={{ backgroundColor: t.primaryContainer, minHeight: 52 }}
              >
                <Text className="font-bold" style={{ color: t.onPrimaryContainer }}>Guardar</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
