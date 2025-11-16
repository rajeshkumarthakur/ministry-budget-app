-- Add missing fields to events table
-- This migration adds expected_attendance and ensures budget_amount compatibility

-- Add expected_attendance column if it doesn't exist
ALTER TABLE events 
    ADD COLUMN IF NOT EXISTS expected_attendance INTEGER;

-- Add budget_amount as an alias/computed column (or we can use estimated_expenses)
-- For now, we'll just ensure the column exists and update queries handle both
-- The server code will map budget_amount to estimated_expenses

-- Create a view that provides budget_amount as an alias for backward compatibility
CREATE OR REPLACE VIEW events_with_budget AS
SELECT 
    id,
    form_id,
    event_date,
    event_name,
    event_type,
    purpose,
    description,
    estimated_expenses,
    estimated_expenses as budget_amount,  -- Alias for client compatibility
    expected_attendance,
    notes,
    created_at
FROM events;

