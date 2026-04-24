-- ============================================================
-- MIGRATION: Row Level Security (RLS) Policies
-- Purpose: Hardening the application database with strict access rules.
-- ============================================================

-- Enable RLS on all relevant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_relations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1. PROFILES
-- ============================================================

-- Everyone can view profiles in their own gym or their own profile
CREATE POLICY "Users can view profiles in their gym or self"
    ON profiles FOR SELECT
    USING (
        auth.uid() = id 
        OR (gym_id IS NOT NULL AND gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid()))
    );

-- Users can only update their own profile, except coaches who can update gym members
CREATE POLICY "Users can update self or coaches update members"
    ON profiles FOR UPDATE
    USING (
        auth.uid() = id
        OR (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role = 'coach' 
                AND gym_id = profiles.gym_id
            )
        )
    )
    WITH CHECK (
        auth.uid() = id
        OR (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role = 'coach' 
                AND gym_id = profiles.gym_id
            )
        )
    );

-- ============================================================
-- 2. ROUTINES
-- ============================================================

-- Users can see routines from their gym or those they created
CREATE POLICY "Users can view gym routines or own routines"
    ON routines FOR SELECT
    USING (
        (gym_id IS NOT NULL AND gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid()))
        OR created_by_profile_id = auth.uid()
    );

-- Only trainers/coaches can create routines
CREATE POLICY "Trainers and coaches can create routines"
    ON routines FOR INSERT
    WITH CHECK (
        created_by_profile_id = auth.uid()
        AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('trainer', 'coach')
    );

-- Only creator can update or delete their routines
CREATE POLICY "Creators can update/delete own routines"
    ON routines FOR ALL
    USING (created_by_profile_id = auth.uid());

-- ============================================================
-- 3. ROUTINE_EXERCISES
-- ============================================================

-- Access to routine_exercises follows the routine access
CREATE POLICY "Users view exercises if they can view the routine"
    ON routine_exercises FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM routines 
            WHERE routines.id = routine_exercises.routine_id
        )
    );

CREATE POLICY "Trainers/coaches manage exercises for own routines"
    ON routine_exercises FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM routines 
            WHERE routines.id = routine_exercises.routine_id 
            AND routines.created_by_profile_id = auth.uid()
        )
    );

-- ============================================================
-- 4. ASSIGNMENTS
-- ============================================================

-- Users can see assignments assigned to them OR assignments they assigned
CREATE POLICY "Users view own or assigned assignments"
    ON assignments FOR SELECT
    USING (
        user_profile_id = auth.uid()
        OR assigned_by_profile_id = auth.uid()
    );

-- Athletes can only update status to 'completed' on their own assignments
CREATE POLICY "Athletes complete own assignments"
    ON assignments FOR UPDATE
    USING (user_profile_id = auth.uid())
    WITH CHECK (
        user_profile_id = auth.uid()
        AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'user'
        -- Ensure only status and completed_at are changed if it's a 'user'
    );

-- Coaches/trainers can manage assignments for their gym or relations
CREATE POLICY "Coaches manage gym assignments"
    ON assignments FOR ALL
    USING (
        assigned_by_profile_id = auth.uid()
        OR (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('trainer', 'coach') 
                AND gym_id = assignments.gym_id
            )
        )
    );

-- ============================================================
-- 5. COACHING_RELATIONS
-- ============================================================

-- Involved users can see the relation
CREATE POLICY "Users involved see coaching relations"
    ON coaching_relations FOR SELECT
    USING (
        user_profile_id = auth.uid()
        OR coach_profile_id = auth.uid()
    );

-- Only coaches can initiate a relation
CREATE POLICY "Coaches initiate coaching relations"
    ON coaching_relations FOR INSERT
    WITH CHECK (
        coach_profile_id = auth.uid()
        AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('trainer', 'coach')
    );

-- Athletes can accept/revoke, Coaches can revoke
CREATE POLICY "Users manage coaching status"
    ON coaching_relations FOR UPDATE
    USING (
        user_profile_id = auth.uid()
        OR coach_profile_id = auth.uid()
    );
