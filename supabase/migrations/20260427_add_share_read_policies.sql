-- ============================================================
-- MIGRATION: Add Shared Read Policies
-- Adds ability to read routines/exercises when shared via code/QR
-- ============================================================

-- Add share read policy to routines if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can read shared routines' 
        AND tablename = 'routines'
    ) THEN
        CREATE POLICY "Users can read shared routines"
            ON routines FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM routine_shares 
                    WHERE routine_shares.routine_id = routines.id 
                    AND (routine_shares.status = 'pending' OR routine_shares.receiver_user_id = auth.uid())
                )
            );
    END IF;
END $$;

-- Add share read policy to routine_exercises if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can read shared routine exercises' 
        AND tablename = 'routine_exercises'
    ) THEN
        CREATE POLICY "Users can read shared routine exercises"
            ON routine_exercises FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM routine_shares 
                    WHERE routine_shares.routine_id = routine_exercises.routine_id 
                    AND (routine_shares.status = 'pending' OR routine_shares.receiver_user_id = auth.uid())
                )
            );
    END IF;
END $$;