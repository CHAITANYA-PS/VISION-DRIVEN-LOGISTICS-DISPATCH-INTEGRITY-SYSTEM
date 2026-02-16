-- Verification script to check table structures
-- Run these queries to verify your tables are set up correctly

-- 1. Check shipments table structure
DESCRIBE shipments;

-- 2. Check if deadline column exists in shipments
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'visera_db' 
AND TABLE_NAME = 'shipments' 
AND COLUMN_NAME = 'deadline';

-- 3. Check shipment_workers table structure
DESCRIBE shipment_workers;

-- 4. Check if shipment_workers table has correct columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'visera_db' 
AND TABLE_NAME = 'shipment_workers';

-- 5. Check foreign keys on shipment_workers
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'visera_db'
AND TABLE_NAME = 'shipment_workers'
AND REFERENCED_TABLE_NAME IS NOT NULL;







