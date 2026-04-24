/**
 * Auth store — Connects to Supabase auth.
 * Provides session management and auth state for navigation guards.
 */
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    // Only initialize once
    const { session: currentSession } = useAuthStore.getState();
    if (currentSession) return;

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      set({ 
        session, 
        user: session?.user ?? null, 
        isAuthenticated: !!session,
        isLoading: false 
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        set({ 
          session, 
          user: session?.user ?? null, 
          isAuthenticated: !!session,
          isLoading: false 
        });
      });

      // Optional: store subscription if needed for cleanup
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await authApi.signOut();
    set({ session: null, user: null, isAuthenticated: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
