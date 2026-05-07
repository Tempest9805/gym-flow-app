/**
 * Tabata Theme Store — Allows choosing neon palette independently from app theme.
 * Persists selected tabata theme via AsyncStorage.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TabataThemeId = 'purple' | 'orange';

interface TabataThemeColors {
  prepare: string;
  work: string;
  rest: string;
  accent: string;
}

export const TABATA_PURPLE: TabataThemeColors = {
  prepare: '#BF00FF',
  work: '#7B2FFF',
  rest: '#FF00FF',
  accent: '#BF00FF',
};

export const TABATA_ORANGE: TabataThemeColors = {
  prepare: '#FF6600',
  work: '#FF9900',
  rest: '#FF3300',
  accent: '#FF6600',
};

export const TABATA_THEMES: Record<TabataThemeId, TabataThemeColors> = {
  purple: TABATA_PURPLE,
  orange: TABATA_ORANGE,
};

const TABATA_THEME_STORAGE_KEY = 'gymflow_tabata_theme';

interface TabataThemeState {
  tabataThemeId: TabataThemeId;
  colors: TabataThemeColors;
  setTabataTheme: (id: TabataThemeId) => Promise<void>;
  loadTabataTheme: () => Promise<void>;
}

export const useTabataThemeStore = create<TabataThemeState>((set) => ({
  tabataThemeId: 'purple',
  colors: TABATA_PURPLE,

  loadTabataTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(TABATA_THEME_STORAGE_KEY);
      if (stored === 'orange' || stored === 'purple') {
        set({ tabataThemeId: stored, colors: TABATA_THEMES[stored] });
      } else {
        set({ tabataThemeId: 'purple', colors: TABATA_PURPLE });
      }
    } catch {
      set({ tabataThemeId: 'purple', colors: TABATA_PURPLE });
    }
  },

  setTabataTheme: async (id: TabataThemeId) => {
    try {
      await AsyncStorage.setItem(TABATA_THEME_STORAGE_KEY, id);
      set({ tabataThemeId: id, colors: TABATA_THEMES[id] });
    } catch {
      set({ tabataThemeId: id, colors: TABATA_THEMES[id] });
    }
  },
}));