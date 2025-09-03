-- Fix the tokens_status_check constraint issue
-- This script will:
-- 1. Update all existing invalid statuses to 'fresh'
-- 2. Drop the old constraint
-- 3. Recreate the constraint with only 'fresh' and 'active' allowed

BEGIN;

-- First, let's see what statuses currently exist
SELECT DISTINCT status, COUNT(*) as count FROM tokens GROUP BY status;

-- Update all invalid statuses to 'fresh'
UPDATE tokens 
SET status = 'fresh' 
WHERE status NOT IN ('fresh', 'active') OR status IS NULL;

-- Drop the existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'tokens' AND c.conname = 'tokens_status_check'
    ) THEN
        EXECUTE 'ALTER TABLE tokens DROP CONSTRAINT tokens_status_check';
    END IF;
END $$;

-- Set default and NOT NULL
ALTER TABLE tokens 
    ALTER COLUMN status SET DEFAULT 'fresh',
    ALTER COLUMN status SET NOT NULL;

-- Now create the new constraint
ALTER TABLE tokens
    ADD CONSTRAINT tokens_status_check
    CHECK (status IN ('fresh', 'active'));

-- Verify the fix
SELECT DISTINCT status, COUNT(*) as count FROM tokens GROUP BY status;

COMMIT;
