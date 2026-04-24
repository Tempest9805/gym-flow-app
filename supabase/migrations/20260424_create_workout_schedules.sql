-- ============================================================
-- MIGRATION: Create workout_schedules table
-- Purpose: Weekly agenda feature for USER role
-- ============================================================

CREATE TABLE IF NOT EXISTS workout_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- A user can only have ONE routine per day
    UNIQUE(user_id, day_of_week)
);

-- Index for fast lookups by user
CREATE INDEX idx_workout_schedules_user_id ON workout_schedules(user_id);

-- ============================================================
-- RLS POLICIES (Critical: matches client-side ABAC logic)
-- ============================================================
ALTER TABLE workout_schedules ENABLE ROW LEVEL SECURITY;

-- Users can only see their own schedules
CREATE POLICY "Users can view own schedules"
    ON workout_schedules FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own schedules
CREATE POLICY "Users can create own schedules"
    ON workout_schedules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own schedules
CREATE POLICY "Users can delete own schedules"
    ON workout_schedules FOR DELETE
    USING (auth.uid() = user_id);

-- Trainers/coaches can view schedules of their coached athletes
CREATE POLICY "Coaches can view athlete schedules"
    ON workout_schedules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM coaching_relations
            WHERE coaching_relations.coach_profile_id = auth.uid()
            AND coaching_relations.user_profile_id = workout_schedules.user_id
            AND coaching_relations.status = 'active'
        )
    );
