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
  insertRow: (dayId: string, row: RoutineRow, index: number) => void;
  removeRow: (dayId: string, rowId: string) => void;
  moveRow: (dayId: string, rowId: string, delta: number) => void;
  resetDay: (dayId: string) => void;

  createRoutine: (name: string) => string;
  saveRoutine: (routine: Routine) => void;
  removeRoutine: (routineId: string) => void;
  addDay: (routineId: string, focus: string) => void;
  removeDay: (routineId: string, dayId: string) => void;
  setDayFocus: (routineId: string, dayId: string, focus: string) => void;
  updateRoutineMeta: (
    routineId: string,
    patch: Partial<Pick<Routine, 'name' | 'athleteName' | 'goal' | 'coachName'>>,
  ) => void;
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

  /** Apply a pure routine transform by id and persist. */
  const editRoutine = (routineId: string, transform: (routine: Routine) => Routine) => {
    const { routines } = get();
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;

    const next = transform(routine);
    if (next === routine) return;

    const nextRoutines = routines.map((r) => (r.id === routineId ? next : r));
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

    insertRow: (dayId, row, index) =>
      editDay(dayId, (day) => domainRoutine.insertRow(day, row, index)),

    removeRow: (dayId, rowId) => editDay(dayId, (day) => domainRoutine.removeRow(day, rowId)),

    moveRow: (dayId, rowId, delta) =>
      editDay(dayId, (day) => domainRoutine.moveRow(day, rowId, delta)),

    resetDay: (dayId) => editDay(dayId, (day) => domainDay.resetDay(day, todayIso())),

    createRoutine: (name) => {
      const routine = domainRoutine.blankRoutine(name, new Date().toISOString());
      const next = [...get().routines, routine];

      set({
        routines: next,
        activeRoutineId: routine.id,
        activeDayId: routine.days[0]?.id ?? null,
      });
      persistRoutines(next);
      return routine.id;
    },

    addDay: (routineId, focus) =>
      editRoutine(routineId, (r) => domainRoutine.addDay(r, focus, new Date().toISOString())),

    removeDay: (routineId, dayId) => {
      editRoutine(routineId, (r) => domainRoutine.removeDay(r, dayId, new Date().toISOString()));
      // The selected day may have just disappeared.
      const routine = get().routines.find((r) => r.id === routineId);
      if (routine && !routine.days.some((d) => d.id === get().activeDayId)) {
        set({ activeDayId: routine.days[0]?.id ?? null });
      }
    },

    setDayFocus: (routineId, dayId, focus) =>
      editRoutine(routineId, (r) =>
        domainRoutine.setDayFocus(r, dayId, focus, new Date().toISOString()),
      ),

    updateRoutineMeta: (routineId, patch) =>
      editRoutine(routineId, (r) =>
        domainRoutine.updateRoutineMeta(r, patch, new Date().toISOString()),
      ),

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

      // Deleting the routine on screen moves us to whatever is left, if
      // anything. Deleting any other routine leaves the selection alone.
      if (get().activeRoutineId === routineId) {
        const fallback = next[0] ?? null;
        set({
          routines: next,
          activeRoutineId: fallback?.id ?? null,
          activeDayId: fallback?.days[0]?.id ?? null,
        });
      } else {
        set({ routines: next });
      }

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
      // Deliberately not flipping isLoaded: the root layout swaps the whole
      // navigator for a loading screen while it is false, which would tear
      // down the tabs and drop the user back on Hoy. `load()` replaces the
      // data in one `set` at the end, so the screen simply refreshes.
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
