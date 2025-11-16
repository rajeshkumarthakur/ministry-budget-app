-- Add SMART goal fields to goals table
-- This migration adds columns for SMART goal structure

-- Add SMART goal columns if they don't exist
ALTER TABLE goals 
    ADD COLUMN IF NOT EXISTS goal_description TEXT,
    ADD COLUMN IF NOT EXISTS specific TEXT,
    ADD COLUMN IF NOT EXISTS measurable TEXT,
    ADD COLUMN IF NOT EXISTS achievable TEXT,
    ADD COLUMN IF NOT EXISTS relevant TEXT,
    ADD COLUMN IF NOT EXISTS time_bound TEXT;

-- Migrate existing data: copy 'goal' to 'goal_description' for existing records
UPDATE goals 
SET goal_description = goal 
WHERE goal_description IS NULL AND goal IS NOT NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=================================';
    RAISE NOTICE '✓ SMART Goals Migration Complete!';
    RAISE NOTICE '✓ Added SMART goal columns to goals table';
    RAISE NOTICE '✓ Migrated existing goal data';
    RAISE NOTICE '=================================';
END $$;

