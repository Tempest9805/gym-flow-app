/**
 * The app's data store.
 *
 * Replaces the old React Query layer: with no network there is no server
 * state to cache, so this is a plain Zustand store backed by AsyncStorage.
 * Reads are synchronous from memory after `load()`; writes update memory
 * first and persist in the background, so the UI never waits on storage.
 *
 * All the reasoning lives in lib/domain — this store only holds state and
 * persists it.
 */
import { create } from 'zustand';

import * as domainDay from '@/lib/domain/day';
import { todayIso } from '@/lib/domain/day';
import * as domainRoutine from '@/lib/domain/routine';
import type { Exercise, Routine, RoutineDay, RoutineRow } from '@/lib/domain/types';
import {
  loadExercises,
  loadRoutines,
  resetToSeed,
  saveExercises,
  saveRoutines,
} from '@/lib/storage/repository';

interface RoutineState {
  routines: Routine[];
  exercises: Exercise[];
  /** Which routine "Hoy" shows. */
  activeRoutineId: string | null;
  /** Which day of that routine is selected. */
  activeDayId: string | null;
  isLoaded: boolean;

  load: () => Promise<void>;
  setActiveRoutine: (routineId: string) => void;
  setActiveDay: (dayId: string) => void;

  toggleRow: (dayId: string, rowId: string) => void;
  updateRow: (dayId: string, rowId: string, patch: Partial<Omit<RoutineRow, 'id'>>) => void;
  addRow: (dayId: string, row: RoutineRow) => void;
  removeRow: (dayId: string, rowId: string) => void;
  moveRow: (dayId: string, rowId: string, delta: number) => void;
  resetDay: (dayId: string) => void;

  saveRoutine: (routine: Routine) => void;
  removeRoutine: (routineId: string) => void;
  upsertExercise: (exercise: Exercise) => void;
  resetEverything: () => Promise<void>;
}

export const useRoutineStore = create<RoutineState>((set, get) => {
  /** Persist in the background; storage failures must not break the session. */
  const persistRoutines = (routines: Routine[]) => {
    void saveRoutines(routines).catch(() => undefined);
  };

  /**
   * Apply a pure day transform to the active routine and persist.
   * A transform that returns the same day is treated as a no-op.
   */
  const editDay = (dayId: string, transform: (day: RoutineDay) => RoutineDay) => {
    const { routines, activeRoutineId } = get();
    const routine = routines.find((r) => r.id === activeRoutineId);
    if (!routine) return;

    const day = routine.days.find((d) => d.id === dayId);
    if (!day) return;

    const nextDay = transform(day);
    if (nextDay === day) return;

    const nextRoutine = domainRoutine.replaceDay(routine, nextDay, new Date().toISOString());
    const nextRoutines = routines.map((r) => (r.id === nextRoutine.id ? nextRoutine : r));

    set({ routines: nextRoutines });
    persistRoutines(nextRoutines);
  };

  return {
    routines: [],
    exercises: [],
    activeRoutineId: null,
    activeDayId: null,
    isLoaded: false,

    load: async () => {
      const [routines, exercises] = await Promise.all([loadRoutines(), loadExercises()]);

      // Clear yesterday's checkmarks before anything renders.
      const today = todayIso();
      const freshened = routines.map((routine) => ({
        ...routine,
        days: routine.days.map((day) =>
          domainDay.needsReset(day, today) ? domainDay.resetDay(day, today) : day,
        ),
      }));
      if (JSON.stringify(freshened) !== JSON.stringify(routines)) persistRoutines(freshened);

      const first = freshened[0] ?? null;
      set({
        routines: freshened,
        exercises,
        activeRoutineId: first?.id ?? null,
        activeDayId: first?.days[0]?.id ?? null,
        isLoaded: true,
      });
    },

    setActiveRoutine: (routineId) => {
      const routine = get().routines.find((r) => r.id === routineId);
      if (!routine) return;
      set({ activeRoutineId: routineId, activeDayId: routine.days[0]?.id ?? null });
    },

    setActiveDay: (dayId) => set({ activeDayId: dayId }),

    toggleRow: (dayId, rowId) =>
      editDay(dayId, (day) => domainDay.toggleRow(day, rowId, todayIso())),

    updateRow: (dayId, rowId, patch) =>
      editDay(dayId, (day) => domainRoutine.updateRow(day, rowId, patch)),

    addRow: (dayId, row) => editDay(dayId, (day) => domainRoutine.addRow(day, row)),

    removeRow: (dayId, rowId) => editDay(dayId, (day) => domainRoutine.removeRow(day, rowId)),

    moveRow: (dayId, rowId, delta) =>
      editDay(dayId, (day) => domainRoutine.moveRow(day, rowId, delta)),

    resetDay: (dayId) => editDay(dayId, (day) => domainDay.resetDay(day, todayIso())),

    saveRoutine: (routine) => {
      const { routines } = get();
      const exists = routines.some((r) => r.id === routine.id);
      const next = exists
        ? routines.map((r) => (r.id === routine.id ? routine : r))
        : [...routines, routine];

      set({ routines: next });
      persistRoutines(next);
    },

    removeRoutine: (routineId) => {
      const next = get().routines.filter((r) => r.id !== routineId);
      const active = get().activeRoutineId === routineId ? (next[0] ?? null) : null;

      set({
        routines: next,
        ...(active !== null || get().activeRoutineId === routineId
          ? { activeRoutineId: active?.id ?? null, activeDayId: active?.days[0]?.id ?? null }
          : {}),
      });
      persistRoutines(next);
    },

    upsertExercise: (exercise) => {
      const { exercises } = get();
      const exists = exercises.some((e) => e.id === exercise.id);
      const next = exists
        ? exercises.map((e) => (e.id === exercise.id ? exercise : e))
        : [...exercises, exercise];

      set({ exercises: next });
      void saveExercises(next).catch(() => undefined);
    },

    resetEverything: async () => {
      await resetToSeed();
      set({ isLoaded: false });
      await get().load();
    },
  };
});

/** The routine "Hoy" is showing, or null when there are none. */
export function useActiveRoutine(): Routine | null {
  return useRoutineStore(
    (state) => state.routines.find((r) => r.id === state.activeRoutineId) ?? null,
  );
}

/** The selected day of the active routine, or null. */
export function useActiveDay(): RoutineDay | null {
  return useRoutineStore((state) => {
    const routine = state.routines.find((r) => r.id === state.activeRoutineId);
    if (!routine) return null;
    return routine.days.find((d) => d.id === state.activeDayId) ?? routine.days[0] ?? null;
  });
}
