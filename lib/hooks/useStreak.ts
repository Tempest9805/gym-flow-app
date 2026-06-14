import { useQuery } from '@tanstack/react-query';
import { getOrCreateStreak } from '@/lib/api/streak';

/** Current user's streak (creates a zero row on first read). */
export const useStreak = (userId?: string) =>
  useQuery({
    queryKey: ['streak', userId],
    queryFn: () => (userId ? getOrCreateStreak(userId) : null),
    enabled: !!userId,
  });
