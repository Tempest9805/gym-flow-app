import { supabase } from '@/lib/supabase';
import type { AuthResponse, SignInWithPasswordCredentials } from '@supabase/supabase-js';

export const authApi = {
  /**
   * Signs in a user using email and password.
   */
  signIn: async (credentials: SignInWithPasswordCredentials): Promise<AuthResponse> => {
    return await supabase.auth.signInWithPassword(credentials);
  },

  /**
   * Signs out the current user.
   */
  signOut: async (): Promise<{ error: Error | null }> => {
    return await supabase.auth.signOut();
  },

  /**
   * Get the current session.
   */
  getSession: async () => {
    return await supabase.auth.getSession();
  },

  /**
   * Get the current user.
   */
  getUser: async () => {
    return await supabase.auth.getUser();
  }
};
