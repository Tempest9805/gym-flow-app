/**
 * Settings store — app-level preferences that aren't theme/language.
 * Currently: which tab the app opens on (Entrenar by default, or Árbol).
 * Persists via AsyncStorage, mirroring themeStore.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveStartRoute, type StartTab } from '@/lib/utils/startTab';

const START_TAB_STORAGE_KEY = 'gymflow_start_tab';

interface SettingsState {
  startTab: StartTab;
  isLoaded: boolean;
  loadStartTab: () => Promise<void>;
  setStartTab: (tab: StartTab) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  startTab: 'index',
  isLoaded: false,

  loadStartTab: async () => {
    try {
      const stored = await AsyncStorage.getItem(START_TAB_STORAGE_KEY);
      set({ startTab: resolveStartRoute(stored), isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  setStartTab: async (tab: StartTab) => {
    try {
      await AsyncStorage.setItem(START_TAB_STORAGE_KEY, tab);
      set({ startTab: tab });
    } catch {
      // Keep the in-memory choice even if persistence fails.
      set({ startTab: tab });
    }
  },
}));
