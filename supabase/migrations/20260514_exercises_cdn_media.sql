-- 20260514_exercises_cdn_media.sql

-- Add new columns for the updated media optimization pipeline
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS hires_url text,
ADD COLUMN IF NOT EXISTS media_storage_path text,
ADD COLUMN IF NOT EXISTS media_status text DEFAULT 'pending';

-- For reference: demonstration_url is already present on the table, 
-- and will now be populated with the 'normalized' tier CDN URL.

-- Ensure exercise-media bucket exists (if using Supabase storage)
-- (Bucket creation and RLS policies were moved/consolidated to 20260504_add_exercise_media.sql)
