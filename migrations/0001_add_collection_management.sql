-- Migration: Add Collection Management Features
-- Date: 2026-01-11
-- Description: Adds wishlist, status, quantity, and purchase tracking fields to whiskeys table

-- Create the bottle_status enum type
DO $$ BEGIN
    CREATE TYPE bottle_status AS ENUM ('sealed', 'open', 'finished', 'gifted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to whiskeys table
ALTER TABLE whiskeys
ADD COLUMN IF NOT EXISTS is_wishlist BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status bottle_status DEFAULT 'sealed',
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS purchase_location TEXT;

-- Update existing records to have default values
UPDATE whiskeys
SET
    is_wishlist = COALESCE(is_wishlist, false),
    status = COALESCE(status, 'sealed'),
    quantity = COALESCE(quantity, 1)
WHERE is_wishlist IS NULL OR status IS NULL OR quantity IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN whiskeys.is_wishlist IS 'Whether this bottle is on the wishlist (not yet owned)';
COMMENT ON COLUMN whiskeys.status IS 'Current status of the bottle: sealed, open, finished, or gifted';
COMMENT ON COLUMN whiskeys.quantity IS 'Number of bottles owned (for collectors with multiples)';
COMMENT ON COLUMN whiskeys.purchase_date IS 'Date when the bottle was purchased';
COMMENT ON COLUMN whiskeys.purchase_location IS 'Store or location where the bottle was purchased';
