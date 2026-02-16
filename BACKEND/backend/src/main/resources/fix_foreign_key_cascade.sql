-- Fix foreign key constraint to add ON DELETE CASCADE
-- This script fixes the shipment_workers foreign key constraint
-- Run this if you want to ensure database-level cascade delete

-- Step 1: Drop the existing foreign key constraint
-- Replace FK6mc9pdb2vi7vo65icsy1yfsou with your actual constraint name if different
-- You can find it by running: SHOW CREATE TABLE shipment_workers;
ALTER TABLE shipment_workers 
DROP FOREIGN KEY FK6mc9pdb2vi7vo65icsy1yfsou;

-- Step 2: Re-add the foreign key with ON DELETE CASCADE
ALTER TABLE shipment_workers
ADD CONSTRAINT FK6mc9pdb2vi7vo65icsy1yfsou
FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE;

-- Verify the change
SHOW CREATE TABLE shipment_workers;







