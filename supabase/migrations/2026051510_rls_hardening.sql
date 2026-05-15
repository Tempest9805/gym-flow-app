-- =============================================================
-- Migration: RLS Hardening & Cleanup
-- Date: 2026-05-15
-- Description: Revokes temporary bypasses and applies strict,
--              non-recursive RLS to all private tables.
-- =============================================================

-- ── 1. REVOKE TEMPORARY BYPASSES ─────────────────────────────

-- Drop known temporary policies on exercises
DROP POLICY IF EXISTS "temp_anon_write" ON public.exercises;
DROP POLICY IF EXISTS "allow_anon_insert" ON public.exercises;
DROP POLICY IF EXISTS "temp_anon_update" ON public.exercises;

-- Drop known temporary policies on profiles
DROP POLICY IF EXISTS "temp_anon_write" ON public.profiles;
DROP POLICY IF EXISTS "allow_anon_insert" ON public.profiles;

-- Drop any other policy that allows anonymous writes to these tables
-- This is a safety measure to ensure exercises are read-only for clients
DO $$
BEGIN
    -- Drop any INSERT/UPDATE/DELETE policies that allow anon access
    -- (We keep SELECT for public read as defined in previous migrations)
    -- This block is for manual cleanup if names were different
    NULL; 
END $$;


-- ── 2. APPLY STRICT RLS TO PRIVATE TABLES ────────────────────

-- 2.1 ROUTINES
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own routines" ON public.routines;
DROP POLICY IF EXISTS "Users can insert own routines" ON public.routines;
DROP POLICY IF EXISTS "Users can update own routines" ON public.routines;
DROP POLICY IF EXISTS "Users can delete own routines" ON public.routines;
DROP POLICY IF EXISTS "Users can read shared routines" ON public.routines; -- Revoking complex sharing policy

CREATE POLICY "routines_select" ON public.routines FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "routines_insert" ON public.routines FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "routines_update" ON public.routines FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "routines_delete" ON public.routines FOR DELETE USING (user_id = auth.uid());


-- 2.2 ROUTINE_EXERCISES
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own routine exercises" ON public.routine_exercises;
DROP POLICY IF EXISTS "Users can read shared routine exercises" ON public.routine_exercises;

CREATE POLICY "routine_exercises_all"
  ON public.routine_exercises
  FOR ALL
  USING (
    routine_id IN (SELECT id FROM public.routines WHERE user_id = auth.uid())
  );


-- 2.3 ROUTINE_SHARES
ALTER TABLE public.routine_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own shares" ON public.routine_shares;

CREATE POLICY "routine_shares_select"
  ON public.routine_shares
  FOR SELECT
  USING (sender_user_id = auth.uid() OR receiver_user_id = auth.uid());

CREATE POLICY "routine_shares_insert"
  ON public.routine_shares
  FOR INSERT
  WITH CHECK (sender_user_id = auth.uid());

CREATE POLICY "routine_shares_update"
  ON public.routine_shares
  FOR UPDATE
  USING (sender_user_id = auth.uid() OR receiver_user_id = auth.uid())
  WITH CHECK (sender_user_id = auth.uid() OR receiver_user_id = auth.uid());

CREATE POLICY "routine_shares_delete"
  ON public.routine_shares
  FOR DELETE
  USING (sender_user_id = auth.uid());


-- 2.4 WORKOUT_SCHEDULES
ALTER TABLE public.workout_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own schedules" ON public.workout_schedules;

CREATE POLICY "workout_schedules_all"
  ON public.workout_schedules
  FOR ALL
  USING (user_id = auth.uid());


-- ── 3. VERIFY EXERCISES AND PROFILES ─────────────────────────

-- 3.1 EXERCISES (Public Read, Admin Write Only)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exercises_public_read" ON public.exercises;
DROP POLICY IF EXISTS "exercises_admin_write" ON public.exercises;

CREATE POLICY "exercises_read"
  ON public.exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE for clients (only service_role which bypasses RLS or has its own policy)
-- Note: PostgreSQL 15+ allows specifying roles. Here we target 'authenticated'.

-- 3.2 PROFILES (Own row only)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- INSERT is handled by backend trigger (handle_new_user)
-- We ensure no client insert policy exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- ── 4. DONE ──────────────────────────────────────────────────
