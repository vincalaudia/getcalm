-- =============================================================================
-- ThinkTok — Add image URL columns to videos table
-- Run this in the Supabase SQL Editor AFTER 001_initial_schema.sql.
--
-- Adds two nullable image URL columns, one for each CEK explanation panel.
-- Images should be uploaded to Supabase Storage and stored as 3:4 portrait
-- (e.g., 900×1200 px). The app will display them in a 3:4 aspect-ratio
-- container inside the CEK explanation modal.
-- =============================================================================

ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS ai_clue_image_url   text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS real_fact_image_url text DEFAULT NULL;

-- Optional: allow public reads of images from Supabase Storage bucket.
-- Create a bucket named "cek-images" in Supabase Storage and set it to public,
-- then upload images and paste the public URL into these columns.
