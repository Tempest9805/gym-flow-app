import { supabase } from '@/lib/supabase';
import { ExerciseSchema } from './schemas';
import type { Exercise } from './schemas';

/** Columns we always select — avoids pulling media_* legacy columns if they still exist */
const EXERCISE_COLUMNS = [
  'id',
  'created_at',
  'slug',
  'name_en',
  'name_es',
  'category',
  'muscle_group',
  'equipment',
  'difficulty',
  'type',
  'is_compound',
  'movement_pattern',
  'description',
  'instructions',
  'demonstration_url',
  'thumbnail_url',
  'hires_url',
  'media_storage_path',
  'media_status',
  'notes',
].join(',');

export const exercisesApi = {
  /** List all exercises, optionally filtered by category or muscle_group */
  list: async (opts?: { category?: string; muscleGroup?: string }): Promise<Exercise[]> => {
    let query = supabase.from('exercises').select(EXERCISE_COLUMNS);

    if (opts?.category) {
      query = query.eq('category', opts.category);
    }
    if (opts?.muscleGroup) {
      query = query.eq('muscle_group', opts.muscleGroup);
    }

    const { data, error } = await query.order('name_en', { ascending: true });
    if (error) throw error;

    return ExerciseSchema.array().parse(data || []);
  },

  /** Return unique filter option values for the library UI */
  getFilterOptions: async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('muscle_group, category, difficulty, equipment');

    if (error) throw error;

    return {
      muscleGroups: Array.from(new Set(data.map((d) => d.muscle_group).filter(Boolean))).sort() as string[],
      categories:   Array.from(new Set(data.map((d) => d.category).filter(Boolean))).sort() as string[],
      difficulties: Array.from(new Set(data.map((d) => d.difficulty).filter(Boolean))).sort() as string[],
      equipment:    Array.from(new Set(data.map((d) => d.equipment).filter(Boolean))).sort() as string[],
    };
  },

  /** Get a single exercise by UUID */
  getById: async (id: string): Promise<Exercise | null> => {
    const { data, error } = await supabase
      .from('exercises')
      .select(EXERCISE_COLUMNS)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return ExerciseSchema.parse(data);
  },

  /** Get a single exercise by slug */
  getBySlug: async (slug: string): Promise<Exercise | null> => {
    const { data, error } = await supabase
      .from('exercises')
      .select(EXERCISE_COLUMNS)
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return ExerciseSchema.parse(data);
  },
};
