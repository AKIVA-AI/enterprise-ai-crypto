-- Add missing book_status enum values for Trading Gate
-- This ensures all system states are properly supported

-- Add 'halted' and 'reduce_only' to book_status enum
ALTER TYPE book_status ADD VALUE IF NOT EXISTS 'halted';
ALTER TYPE book_status ADD VALUE IF NOT EXISTS 'reduce_only';