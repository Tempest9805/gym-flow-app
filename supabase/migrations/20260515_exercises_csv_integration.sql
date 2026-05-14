-- =============================================================
-- Migration: exercises_final.csv integration
-- Date: 2026-05-14
-- Safe: uses ADD COLUMN IF NOT EXISTS, does NOT drop columns
-- =============================================================

-- ── 1. Add missing columns (safe, idempotent) ─────────────────

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS slug            TEXT,
  ADD COLUMN IF NOT EXISTS name_en         TEXT,
  ADD COLUMN IF NOT EXISTS name_es         TEXT,
  ADD COLUMN IF NOT EXISTS type            TEXT,
  ADD COLUMN IF NOT EXISTS is_compound     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS movement_pattern TEXT,
  ADD COLUMN IF NOT EXISTS instructions    TEXT,
  ADD COLUMN IF NOT EXISTS notes           TEXT;

-- ── 2. Ensure core columns exist and have correct types ───────
-- (These were already added by a previous migration, kept here
--  as documentation of the canonical shape.)
-- id               UUID PRIMARY KEY
-- category         TEXT
-- muscle_group     TEXT
-- difficulty       TEXT
-- demonstration_url TEXT
-- description      TEXT
-- created_at       TIMESTAMPTZ
-- equipment        TEXT

-- ── 3. Unique constraint on slug ─────────────────────────────
-- Only create if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'exercises_slug_key'
  ) THEN
    ALTER TABLE public.exercises ADD CONSTRAINT exercises_slug_key UNIQUE (slug);
  END IF;
END $$;

-- ── 4. Performance indexes ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exercises_slug          ON public.exercises (slug);
CREATE INDEX IF NOT EXISTS idx_exercises_category      ON public.exercises (category);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group  ON public.exercises (muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty    ON public.exercises (difficulty);

-- ── 5. RLS: exercises are public read, no auth required ───────
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Drop old policy if it exists, then recreate cleanly
DROP POLICY IF EXISTS "exercises_public_read" ON public.exercises;

CREATE POLICY "exercises_public_read"
  ON public.exercises
  FOR SELECT
  USING (true);

-- Only authenticated users (or service role) can mutate
DROP POLICY IF EXISTS "exercises_admin_write" ON public.exercises;

CREATE POLICY "exercises_admin_write"
  ON public.exercises
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── 6. (Removed legacy name fallback as public.exercises.name does not exist) ──

-- ── 7. Done ──────────────────────────────────────────────────
-- After running this migration, execute the import script:
--   node scripts/import_exercises_csv.mjs
