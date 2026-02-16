-- Migration: Change weight column from DOUBLE to VARCHAR
-- This allows storing weight exactly as entered (e.g., "100" instead of "100.0")
-- Run this script on your MySQL database: visera_db

ALTER TABLE skus 
MODIFY COLUMN weight VARCHAR(50) NULL;

-- Verify the change
DESCRIBE skus;
