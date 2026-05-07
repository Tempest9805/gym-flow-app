/**
 * Theme store — Neon Purple (default) and Neon Orange.
 * Persists selected theme across app launches via AsyncStorage.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeId = 'purple' | 'orange';

export interface ThemeTokens {
  // Backgrounds
  background: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceContainerLow: string;
  surfaceContainerLowest: string;
  surfaceBright: string;
  surfaceDim: string;
  surfaceVariant: string;
  // Primary accent
  primary: string;
  primaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  inversePrimary: string;
  onPrimary: string;
  onPrimaryContainer: string;
  onPrimaryFixed: string;
  // Secondary
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  // Text
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  // Borders
  outline: string;
  outlineVariant: string;
  // Status
  error: string;
  errorContainer: string;
  onError: string;
  // Glow shadow (rgba string for box-shadow-like effects)
  glowPrimary: string;
  glowPrimaryStrong: string;
  // Tabata phase colors
  tabataPrepare: string;
  tabataWork: string;
  tabataRest: string;
}

export interface Theme {
  id: ThemeId;
  label: string;
  tokens: ThemeTokens;
}

export const PURPLE_THEME: Theme = {
  id: 'purple',
  label: 'Neon Purple',
  tokens: {
    background: '#19101c',
    surface: '#19101c',
    surfaceContainer: '#251c28',
    surfaceContainerHigh: '#302733',
    surfaceContainerHighest: '#3b313e',
    surfaceContainerLow: '#211824',
    surfaceContainerLowest: '#130b16',
    surfaceBright: '#403643',
    surfaceDim: '#19101c',
    surfaceVariant: '#3b313e',
    primary: '#ebb2ff',
    primaryContainer: '#bc13fe',
    primaryFixed: '#f8d8ff',
    primaryFixedDim: '#ebb2ff',
    inversePrimary: '#9800d0',
    onPrimary: '#520072',
    onPrimaryContainer: '#ffffff',
    onPrimaryFixed: '#320047',
    secondary: '#d0bcff',
    secondaryContainer: '#571bc1',
    onSecondary: '#3c0091',
    onSecondaryContainer: '#c4abff',
    onBackground: '#eeddee',
    onSurface: '#eeddee',
    onSurfaceVariant: '#d4c0d7',
    outline: '#9d8ba0',
    outlineVariant: '#504254',
    error: '#ffb4ab',
    errorContainer: '#93000a',
    onError: '#690005',
    glowPrimary: 'rgba(188, 19, 254, 0.3)',
    glowPrimaryStrong: 'rgba(188, 19, 254, 0.5)',
    tabataPrepare: '#BF00FF',
    tabataWork: '#7B2FFF',
    tabataRest: '#FF00FF',
  },
};

export const ORANGE_THEME: Theme = {
  id: 'orange',
  label: 'Neon Orange',
  tokens: {
    background: '#1e100b',
    surface: '#1e100b',
    surfaceContainer: '#2b1c17',
    surfaceContainerHigh: '#372621',
    surfaceContainerHighest: '#42312b',
    surfaceContainerLow: '#271813',
    surfaceContainerLowest: '#180b07',
    surfaceBright: '#47352f',
    surfaceDim: '#1e100b',
    surfaceVariant: '#42312b',
    primary: '#ffb59c',
    primaryContainer: '#ff5f1f',
    primaryFixed: '#ffdbcf',
    primaryFixedDim: '#ffb59c',
    inversePrimary: '#ab3600',
    onPrimary: '#5c1900',
    onPrimaryContainer: '#561700',
    onPrimaryFixed: '#390c00',
    secondary: '#ffb68e',
    secondaryContainer: '#ab4c00',
    onSecondary: '#532200',
    onSecondaryContainer: '#ffe2d5',
    onBackground: '#f9dcd4',
    onSurface: '#f9dcd4',
    onSurfaceVariant: '#e3bfb3',
    outline: '#aa897f',
    outlineVariant: '#5b4138',
    error: '#ffb4ab',
    errorContainer: '#93000a',
    onError: '#690005',
    glowPrimary: 'rgba(255, 95, 31, 0.3)',
    glowPrimaryStrong: 'rgba(255, 95, 31, 0.5)',
    tabataPrepare: '#FF6600',
    tabataWork: '#FF9900',
    tabataRest: '#FF3300',
  },
};

export const THEMES: Record<ThemeId, Theme> = {
  purple: PURPLE_THEME,
  orange: ORANGE_THEME,
};

const THEME_STORAGE_KEY = 'gymflow_theme';

interface ThemeState {
  themeId: ThemeId;
  theme: Theme;
  isLoaded: boolean;
  setTheme: (id: ThemeId) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: 'purple',
  theme: PURPLE_THEME,
  isLoaded: false,

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'orange' || stored === 'purple') {
        set({ themeId: stored, theme: THEMES[stored], isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  setTheme: async (id: ThemeId) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, id);
      set({ themeId: id, theme: THEMES[id] });
    } catch {
      // Store in memory even if persistence fails
      set({ themeId: id, theme: THEMES[id] });
    }
  },
}));
