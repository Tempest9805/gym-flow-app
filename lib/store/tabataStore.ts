/**
 * tabataStore — guarda la configuracion del tabata entre la pantalla de
 * ajustes y la que corre.
 *
 * Solo elige y persiste. La forma de `TabataConfig` y sus valores por defecto
 * viven en `lib/domain/types.ts`, porque los necesita la maquina de estados; se
 * reexportan desde aqui para que ningun consumidor tenga que cambiar de sitio.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_TABATA_CONFIG, type TabataConfig } from '@/lib/domain/types';

export { DEFAULT_TABATA_CONFIG };
export type { TabataConfig };

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
