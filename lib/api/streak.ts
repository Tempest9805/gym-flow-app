import { supabase } from '@/lib/supabase';
import { UserStreakSchema, type UserStreak } from './schemas';

function getCurrentWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() + 1) / 7
  );
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

export async function getOrCreateStreak(
  userId: string
): Promise<UserStreak> {
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: created, error: ce } = await supabase
      .from('user_streaks')
      .insert({ user_id: userId })
      .select()
      .single();
    if (ce) throw ce;
    return UserStreakSchema.parse(created);
  }
  return UserStreakSchema.parse(data);
}

export async function markDayCompleted(
  userId: string,
  dayOfWeek: number
): Promise<UserStreak> {
  const weekKey = getCurrentWeekKey();
  const streak = await getOrCreateStreak(userId);
  const isNewWeek = streak.last_active_week !== weekKey;
  const currentDays = isNewWeek ? [] : streak.completed_days_this_week;

  if (currentDays.includes(dayOfWeek)) return streak;

  const updatedDays = [...currentDays, dayOfWeek];
  const count = updatedDays.length;

  // Racha: mínimo 2 días para activarse
  let newStreak = streak.current_streak;
  if (count === 2) newStreak = Math.max(1, streak.current_streak);
  if (count >= 2 && isNewWeek) newStreak = streak.current_streak + 1;

  const { data, error } = await supabase
    .from('user_streaks')
    .update({
      completed_days_this_week: updatedDays,
      last_active_week: weekKey,
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak.longest_streak),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return UserStreakSchema.parse(data);
}
