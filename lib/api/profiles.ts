import { supabase } from '@/lib/supabase';
import { ProfileSchema } from './schemas';
import type { Profile } from './schemas';

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
    return ProfileSchema.parse(data);
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
    return ProfileSchema.parse(data);
  },

  /** Get current authenticated user's profile */
  getCurrent: async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Try to get existing profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST204') {
        return null;
      }
      throw error;
    }

    return ProfileSchema.parse(data);
  },
};
