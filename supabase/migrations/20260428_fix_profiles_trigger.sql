-- ============================================================
-- MIGRATION: Fix profiles trigger and RLS for MVP
-- ============================================================

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ensure trigger function exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: Allow users to read their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile"
    ON profiles FOR ALL
    USING (auth.uid() = id);

-- Allow service role to manage profiles (for migrations)
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
CREATE POLICY "Service role can manage all profiles"
    ON profiles FOR ALL
    USING (auth.role() = 'service_role');