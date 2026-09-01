/**
 * Hoy — the training sheet for the selected day.
 *
 * This is the whole point of the app: open it, see the table, tick rows off.
 * Everything else is support.
 *
 * Two modes. Normally the table is for training: tap ▶ for the video, tap the
 * checkbox when a set is done. "Editar" turns the last column into reorder and
 * delete controls and reveals the add button — so the training path stays
 * uncluttered and nothing is ever deleted by a mis-tap mid-workout.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CellEditor } from '@/components/routine/CellEditor';
import { DayTabs } from '@/components/routine/DayTabs';
import { ExercisePicker } from '@/components/routine/ExercisePicker';
import { RoutineTable, type EditableField } from '@/components/routine/RoutineTable';
import { ShareSheet } from '@/components/routine/ShareSheet';
import { TipsStrip } from '@/components/routine/TipsStrip';
import { dayProgress } from '@/lib/domain/day';
import { blankRow } from '@/lib/domain/routine';
import { formatDuration, parseDuration } from '@/lib/domain/time';
import type { Exercise, RoutineRow } from '@/lib/domain/types';
import { videoUrlFor, youtubeSearchUrl } from '@/lib/domain/video';
import { useRestTimer } from '@/lib/hooks/useRestTimer';
import { useTheme } from '@/lib/hooks/useTheme';
import { useActiveDay, useActiveRoutine, useRoutineStore } from '@/lib/store/routineStore';

/** A row that was just deleted, kept around so it can be put back. */
interface RemovedRow {
  row: RoutineRow;
  index: number;
}

export default function TodayScreen() {
  const t = useTheme();
  const router = useRouter();

  const routine = useActiveRoutine();
  const day = useActiveDay();
  const exercises = useRoutineStore((s) => s.exercises);
  const setActiveDay = useRoutineStore((s) => s.setActiveDay);
  const toggleRow = useRoutineStore((s) => s.toggleRow);
  const updateRow = useRoutineStore((s) => s.updateRow);
  const addRow = useRoutineStore((s) => s.addRow);
  const insertRow = useRoutineStore((s) => s.insertRow);
  const removeRow = useRoutineStore((s) => s.removeRow);
  const moveRow = useRoutineStore((s) => s.moveRow);
  const resetDay = useRoutineStore((s) => s.resetDay);

  const rest = useRestTimer();
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<{ rowId: string; field: EditableField } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [removed, setRemoved] = useState<RemovedRow | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const openVideo = useCallback(
    (row: RoutineRow) => {
      const exercise = exercises.find((e) => e.id === row.exerciseId);
      const url = exercise ? videoUrlFor(exercise) : youtubeSearchUrl(row.name);
      Linking.openURL(url).catch(() => {
        Alert.alert('No se pudo abrir el video', 'Revisa que tengas un navegador instalado.');
      });
    },
    [exercises],
  );

  if (!routine || !day) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <MaterialCommunityIcons name="clipboard-text-outline" size={56} color={t.outline} />
          <Text className="text-lg font-semibold text-center" style={{ color: t.onSurface }}>
            No hay ninguna rutina
          </Text>
          <Text className="text-sm text-center" style={{ color: t.onSurfaceVariant }}>
            Crea una en la pestaña Rutinas para empezar a entrenar.
          </Text>
          <Pressable
            onPress={() => router.push('/routines')}
            className="rounded-xl px-6 items-center justify-center mt-2"
            style={{ backgroundColor: t.primaryContainer, minHeight: 48 }}
          >
            <Text className="font-bold" style={{ color: t.onPrimaryContainer }}>
              Ir a Rutinas
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { done, total } = dayProgress(day);
  const editedRow = editTarget ? day.rows.find((r) => r.id === editTarget.rowId) : undefined;

  /** The cell's current value, formatted the way the table shows it. */
  const editorValue = (): string => {
    if (!editedRow || !editTarget) return '';
    switch (editTarget.field) {
      case 'name': return editedRow.name;
      case 'sets': return String(editedRow.sets);
      case 'reps': return editedRow.reps;
      case 'rest': return formatDuration(editedRow.restSeconds);
    }
  };

  const saveCell = (value: string) => {
    if (!editTarget) return;
    const { rowId, field } = editTarget;

    if (field === 'name') updateRow(day.id, rowId, { name: value });
    else if (field === 'sets') updateRow(day.id, rowId, { sets: Number(value) });
    else if (field === 'reps') updateRow(day.id, rowId, { reps: value });
    else if (field === 'rest') {
      const seconds = parseDuration(value);
      if (seconds !== null) updateRow(day.id, rowId, { restSeconds: seconds });
    }
    setEditTarget(null);
  };

  /**
   * Ticking a row off starts its rest; unticking it stops the countdown.
   * The rest is the number in that row's own Rest cell, so the sheet stays
   * the single source of truth for how long to wait.
   */
  const handleToggle = (rowId: string) => {
    const row = day.rows.find((r) => r.id === rowId);
    if (!row) return;

    if (row.done) {
      if (rest.restingRowId === rowId) rest.cancel();
    } else {
      rest.start(rowId, row.restSeconds, row.name);
    }
    toggleRow(day.id, rowId);
  };

  const handleRemove = (rowId: string) => {
    const index = day.rows.findIndex((r) => r.id === rowId);
    const row = day.rows[index];
    if (!row) return;

    setRemoved({ row, index });
    removeRow(day.id, rowId);
  };

  const handlePick = (exercise: Exercise | null, name: string) => {
    const row = blankRow(name);
    addRow(day.id, exercise ? { ...row, exerciseId: exercise.id } : row);
    setPickerOpen(false);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      {/* Header — mirrors the printed sheet */}
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1">
            <Text
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: t.primary }}
              numberOfLines={1}
            >
              {routine.name}
            </Text>
            <Text className="text-2xl font-extrabold" style={{ color: t.onSurface }} numberOfLines={1}>
              {day.focus || day.label}
            </Text>
            {(routine.goal || routine.coachName) && (
              <Text className="text-[12px] mt-0.5" style={{ color: t.onSurfaceVariant }} numberOfLines={1}>
                {[routine.goal && `Objetivo: ${routine.goal}`, routine.coachName]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => setShareOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Copiar o compartir la rutina"
              hitSlop={6}
              className="items-center justify-center rounded-xl border"
              style={{ width: 44, minHeight: 44, borderColor: t.outlineVariant }}
            >
              <MaterialCommunityIcons name="content-copy" size={18} color={t.onSurfaceVariant} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/stopwatch')}
              accessibilityRole="button"
              accessibilityLabel="Abrir el cronómetro"
              hitSlop={6}
              className="items-center justify-center rounded-xl border"
              style={{ width: 44, minHeight: 44, borderColor: t.outlineVariant }}
            >
              <MaterialCommunityIcons name="timer-sand" size={20} color={t.onSurfaceVariant} />
            </Pressable>

            <View className="items-end">
              <Text className="text-2xl font-extrabold" style={{ color: t.primaryContainer }}>
                {done}/{total}
              </Text>
              <Text className="text-[11px] uppercase tracking-wider" style={{ color: t.outline }}>
                hechos
              </Text>
            </View>
          </View>
        </View>
      </View>

      <DayTabs days={routine.days} activeDayId={day.id} onSelect={setActiveDay} />

      {/* Actions */}
      <View className="flex-row items-center justify-between px-4 pt-3">
        <Pressable
          onPress={() => setEditing((value) => !value)}
          accessibilityRole="button"
          accessibilityState={{ selected: editing }}
          accessibilityLabel={editing ? 'Terminar de editar' : 'Editar la tabla'}
          className="flex-row items-center gap-1.5 rounded-lg border px-3"
          style={{
            minHeight: 40,
            borderColor: editing ? t.primaryContainer : t.outlineVariant,
            backgroundColor: editing ? `${t.primaryContainer}22` : 'transparent',
          }}
        >
          <MaterialCommunityIcons
            name={editing ? 'check' : 'pencil-outline'}
            size={16}
            color={editing ? t.primaryContainer : t.onSurfaceVariant}
          />
          <Text
            className="text-[13px] font-semibold"
            style={{ color: editing ? t.primaryContainer : t.onSurfaceVariant }}
          >
            {editing ? 'Listo' : 'Editar'}
          </Text>
        </Pressable>

        {done > 0 && !editing && (
          <Pressable
            onPress={() => resetDay(day.id)}
            accessibilityRole="button"
            accessibilityLabel="Desmarcar todos los ejercicios del día"
            className="flex-row items-center gap-1.5 px-3"
            style={{ minHeight: 40 }}
          >
            <MaterialCommunityIcons name="restore" size={16} color={t.onSurfaceVariant} />
            <Text className="text-[13px] font-semibold" style={{ color: t.onSurfaceVariant }}>
              Reiniciar día
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        className="flex-1 mt-3"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 16 }}
      >
        <RoutineTable
          rows={day.rows}
          editing={editing}
          restRemaining={rest.remaining}
          onToggle={handleToggle}
          onCancelRest={rest.cancel}
          onOpenVideo={openVideo}
          onOpenTimer={() => router.push('/tabata')}
          onEdit={(rowId, field) => setEditTarget({ rowId, field })}
          onRemove={handleRemove}
          onMove={(rowId, delta) => moveRow(day.id, rowId, delta)}
        />

        {editing && (
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Añadir ejercicio a este día"
            className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed"
            style={{ borderColor: t.primaryContainer, minHeight: 56 }}
          >
            <MaterialCommunityIcons name="plus" size={22} color={t.primaryContainer} />
            <Text className="text-[15px] font-bold" style={{ color: t.primaryContainer }}>
              Añadir ejercicio
            </Text>
          </Pressable>
        )}

        <TipsStrip />
      </ScrollView>

      {/* Undo bar for the last delete */}
      {removed && (
        <View
          className="absolute left-4 right-4 bottom-4 flex-row items-center justify-between rounded-xl px-4 py-3"
          style={{ backgroundColor: t.surfaceContainerHighest }}
        >
          <Text className="flex-1 text-[14px]" style={{ color: t.onSurface }} numberOfLines={1}>
            Quitado «{removed.row.name}»
          </Text>
          <Pressable
            onPress={() => {
              insertRow(day.id, removed.row, removed.index);
              setRemoved(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Deshacer"
            className="px-3 justify-center"
            style={{ minHeight: 44 }}
          >
            <Text className="text-[14px] font-bold" style={{ color: t.primaryContainer }}>
              DESHACER
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRemoved(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar aviso"
            className="justify-center"
            style={{ minHeight: 44, width: 32 }}
          >
            <MaterialCommunityIcons name="close" size={20} color={t.onSurfaceVariant} />
          </Pressable>
        </View>
      )}

      <CellEditor
        visible={editTarget !== null}
        field={editTarget?.field ?? null}
        initialValue={editorValue()}
        onCancel={() => setEditTarget(null)}
        onSave={saveCell}
      />

      <ExercisePicker
        visible={pickerOpen}
        exercises={exercises}
        onCancel={() => setPickerOpen(false)}
        onPick={handlePick}
      />

      <ShareSheet
        visible={shareOpen}
        routine={routine}
        day={day}
        onClose={() => setShareOpen(false)}
      />
    </SafeAreaView>
  );
}
