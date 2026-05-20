/**
 * Language store — English (default) and Spanish.
 * Persists selected language across app launches via AsyncStorage.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'es';

interface LanguageState {
  language: Language;
  isLoaded: boolean;
  setLanguage: (lang: Language) => void;
  loadLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  isLoaded: false,
  setLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('gymflow_language', language);
    } catch (e) {
      console.error('Failed to save language', e);
    }
    set({ language });
  },
  loadLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem('gymflow_language');
      if (stored === 'en' || stored === 'es') {
        set({ language: stored, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (e) {
      console.error('Failed to load language', e);
      set({ isLoaded: true });
    }
  },
}));
