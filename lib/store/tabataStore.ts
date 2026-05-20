/**
 * tabataStore — Persists TabataConfig between setup and active screens.
 * Separate from tabataThemeStore (which handles color themes).
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TabataConfig = {
  prepSeconds: number;
  workSeconds: number;
  restSeconds: number;
  cooldownSeconds: number;
  cycleRestSeconds: number;
  rounds: number;
  cycles: number;
  soundEnabled: boolean;
};

export const DEFAULT_TABATA_CONFIG: TabataConfig = {
  prepSeconds: 5,
  workSeconds: 40,
  restSeconds: 20,
  cooldownSeconds: 30,
  cycleRestSeconds: 15,
  rounds: 3,
  cycles: 5,
  soundEnabled: true,
};

const TABATA_CONFIG_KEY = 'gymflow_tabata_config';

interface TabataStoreState {
  config: TabataConfig;
  setConfig: (config: TabataConfig) => Promise<void>;
  loadConfig: () => Promise<void>;
}

export const useTabataStore = create<TabataStoreState>((set) => ({
  config: DEFAULT_TABATA_CONFIG,

  loadConfig: async () => {
    try {
      const stored = await AsyncStorage.getItem(TABATA_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<TabataConfig>;
        set({ config: { ...DEFAULT_TABATA_CONFIG, ...parsed } });
      }
    } catch {
      // Use defaults on parse error
    }
  },

  setConfig: async (config: TabataConfig) => {
    set({ config });
    try {
      await AsyncStorage.setItem(TABATA_CONFIG_KEY, JSON.stringify(config));
    } catch {
      // Persist failure is non-fatal
    }
  },
}));
