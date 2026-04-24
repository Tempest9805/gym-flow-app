import { supabase } from '@/lib/supabase';
import type { Assignment, AssignmentWithDetails, Status } from '@/types';

export const assignmentsApi = {
  /** List active assignments for a user */
  getUserAssignments: async (userId: string): Promise<AssignmentWithDetails[]> => {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        routine:routines(
          *,
          exercises:routine_exercises(
            *,
            exercise:exercises(*)
          )
        ),
        assigned_by:profiles!assigned_by_profile_id(*)
      `)
      .eq('user_profile_id', userId)
      .neq('status', 'completed')
      .neq('status', 'archived')
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data as unknown as AssignmentWithDetails[];
  },

  /** Mark assignment as completed */
  complete: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Ownership check via fetch
    const { data: existing } = await supabase
      .from('assignments')
      .select('user_profile_id')
      .eq('id', id)
      .single();

    if (existing?.user_profile_id !== user.id) {
      throw new Error('Unauthorized: You can only complete your own assignments.');
    }

    const { data, error } = await supabase
      .from('assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Create a new assignment */
  create: async (assignment: Omit<Assignment, 'id' | 'created_at' | 'assigned_at' | 'completed_at' | 'assigned_by_profile_id'>): Promise<Assignment> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch caller's profile for role check
    const caller = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (caller.data?.role === 'user') {
      throw new Error('Unauthorized: Athletes cannot create assignments.');
    }

    // Context validation: if gym assignment, must be in the same gym
    if (assignment.gym_id && caller.data?.gym_id !== assignment.gym_id) {
      throw new Error('Unauthorized: You cannot assign routines for a different gym.');
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        ...assignment,
        assigned_by_profile_id: user.id, // Explicitly set from auth state
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
