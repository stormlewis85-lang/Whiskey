-- WhiskeyPedia Database Reset Script
-- This script clears all user data while keeping:
-- 1. The admin account (ID 5)
-- 2. The distilleries table (reference data)

-- Start transaction
BEGIN;

-- Step 1: Clear Rick House tables (no FK dependencies on other data tables)
TRUNCATE TABLE generated_scripts CASCADE;
TRUNCATE TABLE tasting_sessions CASCADE;

-- Step 2: Clear AI usage logs
TRUNCATE TABLE ai_usage_logs CASCADE;

-- Step 3: Clear blind tasting tables
TRUNCATE TABLE blind_tasting_whiskeys CASCADE;
TRUNCATE TABLE blind_tastings CASCADE;

-- Step 4: Clear flight tables
TRUNCATE TABLE flight_whiskeys CASCADE;
TRUNCATE TABLE flights CASCADE;

-- Step 5: Clear review social features
TRUNCATE TABLE review_likes CASCADE;
TRUNCATE TABLE review_comments CASCADE;

-- Step 6: Clear price tracking
TRUNCATE TABLE market_values CASCADE;
TRUNCATE TABLE price_tracks CASCADE;

-- Step 7: Clear all whiskeys (this removes all bottles from all users)
TRUNCATE TABLE whiskeys CASCADE;

-- Step 8: Clear follows
TRUNCATE TABLE follows CASCADE;

-- Step 9: Delete all users EXCEPT admin (ID 5)
DELETE FROM users WHERE id != 5;

-- Step 10: Reset admin's profile to clean state (optional)
UPDATE users
SET
  display_name = 'Admin',
  profile_image = NULL,
  bio = NULL,
  is_public = false,
  show_wishlist_on_profile = false
WHERE id = 5;

-- Step 11: Reset sequences to start fresh (optional, keeps admin at ID 5)
-- This is commented out since we want to preserve admin ID
-- ALTER SEQUENCE users_id_seq RESTART WITH 6;

-- Verify the reset
SELECT 'Users remaining:' as info, COUNT(*) as count FROM users;
SELECT 'Whiskeys remaining:' as info, COUNT(*) as count FROM whiskeys;
SELECT 'Distilleries remaining:' as info, COUNT(*) as count FROM distilleries;

COMMIT;

-- Output success message
SELECT 'Database reset complete. Admin account (ID 5) preserved.' as status;
