import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export const profilesApi = {
  /** Get profile by user ID */
  getById: async (id: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  /** Update profile data */
  update: async (id: string, updates: Partial<Profile>): Promise<Profile> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Self-update is always allowed
    if (user.id !== id) {
        throw new Error('Unauthorized: You can only update your own profile.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Get current authenticated user's profile */
  getCurrent: async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Try to get existing profile
    const { data: existingProfile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // If profile exists, return it
    if (!getError && existingProfile) {
      return existingProfile;
    }

    // If profile doesn't exist, create it (handle race condition)
    if (getError?.code === 'PGRST116' || getError?.code === 'PGRST204') {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
        })
        .select()
        .single();

      if (!insertError && newProfile) {
        return newProfile;
      }
    }

    // If all else fails and it's "no data" error, return null gracefully
    if (getError?.code === 'PGRST116') {
      return null;
    }

    // For other errors, throw
    if (getError) {
      throw getError;
    }

    return null;
  },
};
