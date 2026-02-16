-- Migration: Add location fields to tasks table for putaway operations
-- Date: 2024

ALTER TABLE tasks 
ADD COLUMN suggested_bin_id BIGINT,
ADD COLUMN suggested_location VARCHAR(255),
ADD COLUMN suggested_zone_id BIGINT,
ADD COLUMN in_progress BOOLEAN DEFAULT FALSE,
ADD COLUMN allocation_plan TEXT,
ADD COLUMN completed_at DATETIME;

ALTER TABLE tasks
ADD CONSTRAINT fk_task_suggested_bin 
FOREIGN KEY (suggested_bin_id) REFERENCES bins(id);

ALTER TABLE tasks
ADD CONSTRAINT fk_task_suggested_zone 
FOREIGN KEY (suggested_zone_id) REFERENCES zones(id);
