import { supabase } from '@/lib/supabase';
import { profilesApi } from './profiles';
import type { Profile } from '@/types';

/**
 * Ensures a user is authenticated and returns their profile.
 * Useful for server-side validation logic in API functions.
 */
export async function ensureAuthenticated(): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  // We should ideally fetch the profile to check roles, even if it adds a query.
  // This is the "Hardening" pass.
  const profile = await profilesApi.getById(user.id);
  if (!profile) throw new Error('Profile not found');
  
  return profile;
}

