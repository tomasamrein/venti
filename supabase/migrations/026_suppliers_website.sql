-- Add missing website column to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website TEXT;
