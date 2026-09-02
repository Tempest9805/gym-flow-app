/**
 * The rest countdown that runs when you tick an exercise off.
 *
 * Ticks once a second while the app is in front, and recomputes from the
 * stored end instant whenever the app comes back — so nothing drifts and a
 * rest that ran out in your pocket is already finished when you look.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import {
  isFinished,
  startRest,
  toRemainingMap,
  type RestTimer,
} from '@/lib/domain/restTimer';
import {
  cancelScheduled,
  ensureNotificationPermission,
  scheduleRestFinished,
} from '@/lib/notifications';

const KEEP_AWAKE_TAG = 'rest-timer';

export interface UseRestTimer {
  /** Seconds left, keyed by row id. Empty when nothing is resting. */
  remaining: Record<string, number>;
  /** The row currently resting, or null. */
  restingRowId: string | null;
  start: (rowId: string, seconds: number, exerciseName: string) => void;
  cancel: () => void;
}

export function useRestTimer(): UseRestTimer {
  const [timer, setTimer] = useState<RestTimer | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const notificationId = useRef<string | null>(null);

  /**
   * Bumped by every start and every clear.
   *
   * Asking for notification permission is async, so between starting a rest
   * and actually scheduling its alert the user may have stopped it or started
   * a different one. Without this token the stale alert would still be
   * scheduled — and would fire minutes later on a rest nobody is taking.
   */
  const generation = useRef(0);

  /** Stop the countdown and release everything it holds. */
  const clear = useCallback(() => {
    generation.current += 1;
    setTimer(null);
    void cancelScheduled(notificationId.current);
    notificationId.current = null;
    deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
  }, []);

  /** Announce the end: a strong haptic, plus a vibration people feel through a pocket. */
  const announce = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    Vibration.vibrate([0, 250, 150, 400]);
  }, []);

  const start = useCallback(
    (rowId: string, seconds: number, exerciseName: string) => {
      void cancelScheduled(notificationId.current);
      notificationId.current = null;

      const mine = ++generation.current;
      if (seconds <= 0) return;

      const next = startRest(rowId, seconds, Date.now());
      setTimer(next);
      setNow(Date.now());

      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);

      void (async () => {
        const allowed = await ensureNotificationPermission();
        // This rest may have been stopped, or replaced by another, while the
        // permission prompt was up.
        if (!allowed || generation.current !== mine) return;

        const id = await scheduleRestFinished(exerciseName, seconds);
        if (generation.current !== mine) {
          void cancelScheduled(id);
          return;
        }
        notificationId.current = id;
      })();
    },
    [],
  );

  // Tick once a second while something is resting.
  useEffect(() => {
    if (timer === null) return;

    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Recompute immediately on returning to the app, so nothing looks stale.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => subscription.remove();
  }, []);

  // Finish exactly once, when the end instant passes.
  useEffect(() => {
    if (timer === null) return;
    if (!isFinished(timer, now)) return;

    announce();
    clear();
  }, [timer, now, announce, clear]);

  // Never leave the screen pinned awake or a notification queued.
  useEffect(() => clear, [clear]);

  return {
    remaining: toRemainingMap(timer, now),
    restingRowId: timer?.rowId ?? null,
    start,
    cancel: clear,
  };
}
