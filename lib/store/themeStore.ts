/**
 * Que tema esta puesto, y recordarlo entre arranques.
 *
 * La paleta no vive aqui: es un dato puro y vive en `lib/domain/theme.ts`,
 * donde tiene tests de contraste. Este store solo elige y persiste.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  DEFAULT_THEME_ID,
  THEMES,
  themeIdFromStored,
  type Theme,
  type ThemeId,
} from '@/lib/domain/theme';

export {
  DARK_THEME,
  DEFAULT_THEME_ID,
  LIGHT_THEME,
  THEMES,
  themeIdFromStored,
  type Theme,
  type ThemeId,
  type ThemeTokens,
} from '@/lib/domain/theme';

const THEME_STORAGE_KEY = 'gymflow_theme';

interface ThemeState {
  themeId: ThemeId;
  theme: Theme;
  isLoaded: boolean;
  setTheme: (id: ThemeId) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: DEFAULT_THEME_ID,
  theme: THEMES[DEFAULT_THEME_ID],
  isLoaded: false,

  loadTheme: async () => {
    try {
      const id = themeIdFromStored(await AsyncStorage.getItem(THEME_STORAGE_KEY));
      set({ themeId: id, theme: THEMES[id], isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  setTheme: async (id: ThemeId) => {
    // Primero memoria: la interfaz no espera al disco.
    set({ themeId: id, theme: THEMES[id] });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // Un fallo de almacenamiento no debe interrumpir a quien esta entrenando.
    }
  },
}));
