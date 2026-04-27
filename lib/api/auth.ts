import { supabase } from '@/lib/supabase';
import type { AuthResponse, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';

const EMAIL_REDIRECT_TO = 'gymflow://(auth)/email-confirmed';

export const authApi = {
  /**
   * Signs in a user using email and password.
   */
  signIn: async (credentials: SignInWithPasswordCredentials): Promise<AuthResponse> => {
    return await supabase.auth.signInWithPassword(credentials);
  },

  /**
   * Signs up a new user with email and password.
   */
  signUp: async (credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> => {
    return await supabase.auth.signUp({
      ...credentials,
      options: {
        emailRedirectTo: EMAIL_REDIRECT_TO,
      },
    });
  },

  /**
   * Sends a password reset email.
   */
  resetPassword: async (email: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'gymflow://(auth)/reset-password',
    });
    return { error };
  },

  /**
   * Updates the user's password.
   */
  updatePassword: async (newPassword: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
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
