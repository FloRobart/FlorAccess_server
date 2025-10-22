-- ============================================
-- File: 001-update_updated_at.sql
-- Description: Update the updated_at field
-- Author: Floris Robart
-- ============================================



-- Function to update the updated_at field
-- This function will be called by a trigger before each update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;