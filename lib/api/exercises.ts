import { supabase } from '@/lib/supabase';
import type { Exercise } from '@/types';

export const exercisesApi = {
  /** List all exercises with optional muscle group filter */
  list: async (muscleGroup?: string): Promise<Exercise[]> => {
    let query = supabase.from('exercises').select('*').order('name');
    
    if (muscleGroup) {
      query = query.eq('muscle_group', muscleGroup);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /** Get basic stats about exercise categories/muscle groups */
  getFilterOptions: async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('muscle_group, category');
    
    if (error) throw error;
    
    const muscleGroups = Array.from(new Set(data.map(d => d.muscle_group).filter(Boolean)));
    const categories = Array.from(new Set(data.map(d => d.category).filter(Boolean)));
    
    return { muscleGroups, categories };
  },

  /** Get single exercise by ID */
  getById: async (id: string): Promise<Exercise | null> => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }
};
