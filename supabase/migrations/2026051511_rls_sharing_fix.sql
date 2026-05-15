-- =============================================================
-- Migration: Routine Sharing RLS Fix
-- Date: 2026-05-15
-- Description: Allows recipients to select routines and exercises
--              via a valid pending share code.
-- =============================================================

-- 1. ROUTINE_SHARES: Allow anyone to read a pending public share by code
-- This is necessary for the lib/api `getByCode` function to find the share record.
DROP POLICY IF EXISTS "routine_shares_select_public_pending" ON public.routine_shares;
CREATE POLICY "routine_shares_select_public_pending"
ON public.routine_shares
FOR SELECT
TO authenticated
USING (
  status = 'pending' 
  AND receiver_user_id IS NULL
);

-- 2. ROUTINES: Allow recipients to read shared routines
DROP POLICY IF EXISTS "routines_select_via_valid_share" ON public.routines;
CREATE POLICY "routines_select_via_valid_share"
ON public.routines
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT routine_id
    FROM public.routine_shares
    WHERE
      (receiver_user_id = auth.uid() OR receiver_user_id IS NULL)
      AND status = 'pending'
  )
);

-- 3. ROUTINE_EXERCISES: Allow recipients to read shared routine exercises
DROP POLICY IF EXISTS "routine_exercises_select_via_valid_share" ON public.routine_exercises;
CREATE POLICY "routine_exercises_select_via_valid_share"
ON public.routine_exercises
FOR SELECT
TO authenticated
USING (
  routine_id IN (
    SELECT routine_id
    FROM public.routine_shares
    WHERE
      (receiver_user_id = auth.uid() OR receiver_user_id IS NULL)
      AND status = 'pending'
  )
);
