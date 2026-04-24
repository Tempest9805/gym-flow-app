import { supabase } from '@/lib/supabase';
import type { CoachingRelation, Profile } from '@/types';

export const coachingApi = {
  /** List users assigned to a trainer/coach */
  getCoachedUsers: async (coachId: string): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('coaching_relations')
      .select('user:profiles!user_profile_id(*)')
      .eq('coach_profile_id', coachId)
      .eq('status', 'active');

    if (error) throw error;
    return (data as any[]).map(d => d.user) as Profile[];
  },

  /** Send coaching invitation */
  inviteUser: async (relation: Omit<CoachingRelation, 'id' | 'created_at' | 'status'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Role check
    const caller = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (caller.data?.role === 'user') {
      throw new Error('Unauthorized: Athletes cannot send coaching invitations.');
    }

    const { data, error } = await supabase
      .from('coaching_relations')
      .insert({
        ...relation,
        coach_profile_id: user.id, // Enforce current user as coach
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Accept or reject invitation */
  respondToInvite: async (relationId: string, accept: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Ownership check: only the invited user can respond
    const { data: existing } = await supabase
      .from('coaching_relations')
      .select('user_profile_id')
      .eq('id', relationId)
      .single();

    if (existing?.user_profile_id !== user.id) {
      throw new Error('Unauthorized: You can only respond to your own invitations.');
    }

    const { data, error } = await supabase
      .from('coaching_relations')
      .update({ status: accept ? 'active' : 'revoked' })
      .eq('id', relationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
