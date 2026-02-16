-- Migration script to add deadline column to shipments table
-- and create shipment_workers table
-- Run this script on your MySQL database: visera_db

-- Step 1: Add deadline column to shipments table (nullable first)
ALTER TABLE shipments 
ADD COLUMN deadline DATE NULL;

-- Step 2: Update any existing rows with a default deadline (30 days from now)
-- Using id > 0 to satisfy safe update mode
UPDATE shipments 
SET deadline = DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
WHERE deadline IS NULL AND id > 0;

-- Step 3: Make deadline NOT NULL
ALTER TABLE shipments 
MODIFY COLUMN deadline DATE NOT NULL;

-- Step 4: Create shipment_workers table for many-to-many relationship
CREATE TABLE IF NOT EXISTS shipment_workers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    shipment_id BIGINT NOT NULL,
    worker_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_shipment_worker (shipment_id, worker_id)
);

