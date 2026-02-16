-- Fix script for shipment_workers table if needed
-- Only run this if the table structure doesn't match

-- First, check the current structure
DESCRIBE shipment_workers;

-- If the table exists but has wrong structure, you can drop and recreate it
-- WARNING: This will delete all existing worker assignments!
-- DROP TABLE IF EXISTS shipment_workers;

-- Recreate with correct structure
CREATE TABLE IF NOT EXISTS shipment_workers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    shipment_id BIGINT NOT NULL,
    worker_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_shipment_worker (shipment_id, worker_id)
);







