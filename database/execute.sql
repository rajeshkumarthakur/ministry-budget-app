-- ============================================================================
-- The Voice Church - Ministry Budget & Planning System
-- COMPLETE DATABASE SETUP FOR SUPABASE DEPLOYMENT
-- ============================================================================
-- This file combines all database migrations in chronological order
-- Execute this file once on a fresh Supabase database
-- ============================================================================

-- ============================================================================
-- PHASE 1: INITIAL SCHEMA SETUP
-- ============================================================================

-- The Voice Church - Ministry Budget & Planning System
-- Database Schema

-- Drop existing tables (use with caution in production)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS form_data CASCADE;
DROP TABLE IF EXISTS ministry_forms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    pin VARCHAR(6) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ministry_leader', 'pillar', 'pastor', 'admin')),
    name VARCHAR(255) NOT NULL,
    ministry VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forms Table
CREATE TABLE IF NOT EXISTS ministry_forms (
    id SERIAL PRIMARY KEY,
    form_number VARCHAR(50) UNIQUE NOT NULL,
    ministry_name VARCHAR(255) NOT NULL,
    ministry_leader_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_pillar', 'pending_pastor', 'approved', 'rejected')),
    current_approver_role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    pillar_approved_at TIMESTAMP,
    pastor_approved_at TIMESTAMP,
    rejection_reason TEXT
);

-- Form Data Table (stores JSON for each section)
CREATE TABLE IF NOT EXISTS form_data (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES ministry_forms(id) ON DELETE CASCADE,
    section VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'form_data_form_id_section_key' 
        AND table_name = 'form_data'
    ) THEN
        ALTER TABLE form_data ADD CONSTRAINT form_data_form_id_section_key UNIQUE(form_id, section);
    END IF;
END $$;

-- Events Table (normalized from Section 4)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES ministry_forms(id) ON DELETE CASCADE,
    event_date DATE,
    event_name VARCHAR(255),
    event_type VARCHAR(100),
    purpose TEXT,
    description TEXT,
    estimated_expenses DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals Table (normalized from Section 3)
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES ministry_forms(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    measure_target TEXT,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approvals/Signatures Table
CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES ministry_forms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected')),
    signature VARCHAR(255),
    comments TEXT,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES ministry_forms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_forms_status ON ministry_forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_leader ON ministry_forms(ministry_leader_id);
CREATE INDEX IF NOT EXISTS idx_forms_ministry ON ministry_forms(ministry_name);
CREATE INDEX IF NOT EXISTS idx_events_form ON events(form_id);
CREATE INDEX IF NOT EXISTS idx_goals_form ON goals(form_id);
CREATE INDEX IF NOT EXISTS idx_approvals_form ON approvals(form_id);
CREATE INDEX IF NOT EXISTS idx_audit_form ON audit_log(form_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forms_updated_at ON ministry_forms;
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON ministry_forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_data_updated_at ON form_data;
CREATE TRIGGER update_form_data_updated_at BEFORE UPDATE ON form_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default users (PIN: 1234 for all)
INSERT INTO users (email, pin, role, name, ministry, active) VALUES
    ('admin@thevoicechurch.org', '1234', 'admin', 'System Admin', NULL, true),
    ('pastor@thevoicechurch.org', '1234', 'pastor', 'Senior Pastor', NULL, true),
    ('pillar1@thevoicechurch.org', '1234', 'pillar', 'Pillar Leader 1', NULL, true),
    ('pillar2@thevoicechurch.org', '1234', 'pillar', 'Pillar Leader 2', NULL, true),
    ('worship.leader@thevoicechurch.org', '1234', 'ministry_leader', 'Worship Ministry Leader', 'Music Ministry', true),
    ('youth.leader@thevoicechurch.org', '1234', 'ministry_leader', 'Youth Ministry Leader', 'Youth Ministry', true),
    ('outreach.leader@thevoicechurch.org', '1234', 'ministry_leader', 'Outreach Leader', 'Missions and Outreach', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- PHASE 2.5: MINISTRIES AND EVENT TYPES
-- ============================================================================

-- Phase 2.5 Database Migration
-- Adds ministries table, event_types table, and updates routing logic

-- 1. Create Ministries Table
CREATE TABLE IF NOT EXISTS ministries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Event Types Table
CREATE TABLE IF NOT EXISTS event_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seed Ministries (from PDF)
DO $$
DECLARE
    pillar1_id INTEGER;
    pillar2_id INTEGER;
BEGIN
    -- Get pillar user IDs
    SELECT id INTO pillar1_id FROM users WHERE email = 'pillar1@thevoicechurch.org';
    SELECT id INTO pillar2_id FROM users WHERE email = 'pillar2@thevoicechurch.org';

    -- Insert ministries (distribute between two pillars)
    INSERT INTO ministries (name, description) VALUES
        ('Music Ministry', 'Worship and music services'),
        ('Women on the Rise', 'Women''s ministry and empowerment'),
        ('Audio Visual Production', 'Technical and media services'),
        ('Missions and Outreach', 'Community outreach and missions'),
        ('Pastoral Aide', 'Support for pastoral care'),
        ('TVC Events', 'Church events coordination'),
        ('Ushers', 'Greeting and seating ministry'),
        ('Nursing Home', 'Senior care ministry'),
        ('Prison Ministry', 'Prison outreach and support'),
        ('Stewards', 'Church stewardship'),
        ('Virtual Ministry Aid', 'Online and virtual services')
    ON CONFLICT (name) DO NOTHING;

END $$;

-- 4. Seed Event Types (from PDF)
INSERT INTO event_types (name, description) VALUES
    ('Worship Service', 'Regular or special worship services'),
    ('Conference', 'Multi-day conferences and seminars'),
    ('Workshop', 'Training and educational workshops'),
    ('Fellowship Event', 'Community fellowship and social events'),
    ('Outreach Event', 'Community outreach activities'),
    ('Training Session', 'Ministry training sessions'),
    ('Leadership Meeting', 'Leadership and planning meetings'),
    ('Fundraiser', 'Fundraising events'),
    ('Prayer Service', 'Prayer meetings and services'),
    ('Community Service', 'Community service projects')
ON CONFLICT (name) DO NOTHING;

-- 5. Add ministry_id to ministry_forms table
ALTER TABLE ministry_forms 
    ADD COLUMN IF NOT EXISTS ministry_id INTEGER REFERENCES ministries(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_forms_ministry_id ON ministry_forms(ministry_id);

-- 6. Migrate existing data
DO $$
DECLARE
    form_record RECORD;
    ministry_record RECORD;
BEGIN
    -- Loop through all forms
    FOR form_record IN SELECT id, ministry_name FROM ministry_forms WHERE ministry_id IS NULL LOOP
        -- Try to find matching ministry
        SELECT id INTO ministry_record FROM ministries WHERE LOWER(name) = LOWER(form_record.ministry_name) LIMIT 1;
        
        IF FOUND THEN
            -- Update form with ministry_id
            UPDATE ministry_forms SET ministry_id = ministry_record.id WHERE id = form_record.id;
        ELSE
            -- If no match, assign to first ministry (fallback)
            UPDATE ministry_forms SET ministry_id = (SELECT id FROM ministries ORDER BY id LIMIT 1) WHERE id = form_record.id;
        END IF;
    END LOOP;
END $$;

-- 7. Update triggers for ministries
DROP TRIGGER IF EXISTS update_ministries_updated_at ON ministries;
CREATE TRIGGER update_ministries_updated_at 
    BEFORE UPDATE ON ministries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 3: ADD EXPECTED ATTENDANCE TO EVENTS
-- ============================================================================

-- Add expected_attendance column to events table
ALTER TABLE events 
    ADD COLUMN IF NOT EXISTS expected_attendance INTEGER;

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
    estimated_expenses as budget_amount,
    expected_attendance,
    notes,
    created_at
FROM events;

-- ============================================================================
-- PHASE 4: ADD SMART GOALS
-- ============================================================================

-- Add SMART goal fields to goals table
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

-- ============================================================================
-- PHASE 5: ADD NOTIFICATIONS SYSTEM
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    form_id INTEGER NOT NULL REFERENCES ministry_forms(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'form_submitted',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_user_form_unique' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications ADD CONSTRAINT notifications_user_form_unique UNIQUE(user_id, form_id, type);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_form_id ON notifications(form_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add comments
COMMENT ON TABLE notifications IS 'Stores notifications for users, primarily for pillar approval alerts';
COMMENT ON COLUMN notifications.type IS 'Type of notification: form_submitted, form_approved, form_rejected, etc.';
COMMENT ON COLUMN notifications.is_read IS 'Whether the user has read this notification';

-- Function to auto-delete old read notifications (optional, for cleanup)
CREATE OR REPLACE FUNCTION delete_old_read_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE is_read = TRUE 
    AND read_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 6: ADD MINISTRY LEADER TO MINISTRIES
-- ============================================================================

-- Add ministry_leader_id column to ministries table
ALTER TABLE ministries 
    ADD COLUMN IF NOT EXISTS ministry_leader_id INTEGER REFERENCES users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ministries_leader ON ministries(ministry_leader_id);

-- ============================================================================
-- PHASE 7: ADD AFFILIATED MINISTRY TO USERS (fix_ministry.sql equivalent)
-- ============================================================================

-- Add affiliated_ministry_id column to users table
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS affiliated_ministry_id INTEGER;

-- Add foreign key constraint to ministries table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_affiliated_ministry' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_affiliated_ministry 
        FOREIGN KEY (affiliated_ministry_id) 
        REFERENCES ministries(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add comment to column for documentation
COMMENT ON COLUMN users.affiliated_ministry_id IS 'For pillar users: the ministry they are affiliated with';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_affiliated_ministry 
    ON users(affiliated_ministry_id) 
    WHERE affiliated_ministry_id IS NOT NULL;

-- ============================================================================
-- PHASE 8: REMOVE PILLAR_ID FROM MINISTRIES
-- ============================================================================

-- Drop the dependent view if exists
DROP VIEW IF EXISTS form_routing_view CASCADE;

-- Drop the index on pillar_id if exists
DROP INDEX IF EXISTS idx_ministries_pillar;

-- Remove the pillar_id column from ministries table (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ministries' AND column_name = 'pillar_id'
    ) THEN
        ALTER TABLE ministries DROP COLUMN pillar_id CASCADE;
        RAISE NOTICE '✓ Removed pillar_id column from ministries table';
    END IF;
END $$;

-- ============================================================================
-- PHASE 9: ADD ASSIGNED PILLARS ARRAY
-- ============================================================================

-- Add the new assigned_pillars column (array of user IDs)
ALTER TABLE ministries 
    ADD COLUMN IF NOT EXISTS assigned_pillars INTEGER[] DEFAULT '{}';

-- Add check constraint - validate in application code as arrays can't have FK constraints
-- Create index for array queries
CREATE INDEX IF NOT EXISTS idx_ministries_assigned_pillars 
    ON ministries USING GIN (assigned_pillars);

-- Add comment for documentation
COMMENT ON COLUMN ministries.assigned_pillars IS 'Array of user IDs (pillars) assigned to this ministry. Multiple pillars can be assigned.';

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ DATABASE DEPLOYMENT COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '  - users (with %s users)', (SELECT COUNT(*) FROM users);
    RAISE NOTICE '  - ministries (with %s ministries)', (SELECT COUNT(*) FROM ministries);
    RAISE NOTICE '  - event_types (with %s types)', (SELECT COUNT(*) FROM event_types);
    RAISE NOTICE '  - ministry_forms';
    RAISE NOTICE '  - form_data';
    RAISE NOTICE '  - events';
    RAISE NOTICE '  - goals';
    RAISE NOTICE '  - approvals';
    RAISE NOTICE '  - audit_log';
    RAISE NOTICE '  - notifications';
    RAISE NOTICE '';
    RAISE NOTICE 'Default Login Credentials (PIN: 1234 for all):';
    RAISE NOTICE '  Admin: admin@thevoicechurch.org';
    RAISE NOTICE '  Pastor: pastor@thevoicechurch.org';
    RAISE NOTICE '  Pillar: pillar1@thevoicechurch.org';
    RAISE NOTICE '  Ministry Leader: worship.leader@thevoicechurch.org';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for Supabase deployment!';
    RAISE NOTICE '============================================';
END $$;

