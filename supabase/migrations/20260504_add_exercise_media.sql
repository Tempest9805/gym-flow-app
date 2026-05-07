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
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'exercise-media' );

-- Allow authenticated users to upload (or anyone for local admin scripts if needed)
-- Assuming admin script uses ANON key for now, we'll allow anon inserts for the migration,
-- but usually you'd restrict this to authenticated or service_role. 
-- For the sake of the pipeline script working without auth:
CREATE POLICY "Anon Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'exercise-media' );

CREATE POLICY "Anon Update Access" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'exercise-media' );
