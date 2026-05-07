import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SessionState {
  completedExercises: Record<string, boolean>; // key: routine_exercise.id
  completedDays: Record<number, boolean>; // key: day of week (0-6)
  weekStartDate: string | null;
  toggleExercise: (id: string) => void;
  toggleDay: (dayIndex: number, currentWeekStart: string) => void;
  resetSession: () => void;
  checkAndResetWeekly: (currentWeekStart: string) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      completedExercises: {},
      completedDays: {},
      weekStartDate: null,
      
      toggleExercise: (id) =>
        set((state) => ({
          completedExercises: {
            ...state.completedExercises,
            [id]: !state.completedExercises[id],
          },
        })),

      toggleDay: (dayIndex, currentWeekStart) => {
        const state = get();
        // If week changed, reset first
        if (state.weekStartDate !== currentWeekStart) {
          set({
            weekStartDate: currentWeekStart,
            completedDays: { [dayIndex]: true },
            completedExercises: {},
          });
        } else {
          set({
            completedDays: {
              ...state.completedDays,
              [dayIndex]: !state.completedDays[dayIndex],
            },
          });
        }
      },

      resetSession: () => set({ completedExercises: {} }),

      checkAndResetWeekly: (currentWeekStart) => {
        const state = get();
        if (state.weekStartDate !== currentWeekStart) {
          set({
            weekStartDate: currentWeekStart,
            completedDays: {},
            completedExercises: {},
          });
        }
      },
    }),
    {
      name: 'gym-flow-session-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
