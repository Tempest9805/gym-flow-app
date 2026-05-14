-- 1. Add media fields to exercises table
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS media_source TEXT,
ADD COLUMN IF NOT EXISTS media_storage_path TEXT,
ADD COLUMN IF NOT EXISTS media_status TEXT;

-- 2. Create the exercise-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exercise-media', 'exercise-media', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage RLS policies for the new bucket
-- Allow public read access to the exercise-media bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'exercise-media' );

-- Removed insecure Anon Upload and Update policies to prevent unauthorized public writes.
-- The sync script must use the SUPABASE_SERVICE_ROLE_KEY to upload media, which bypasses RLS.
DROP POLICY IF EXISTS "Anon Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Anon Update Access" ON storage.objects;
