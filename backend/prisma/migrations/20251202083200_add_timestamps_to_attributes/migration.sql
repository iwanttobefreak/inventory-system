-- Fix: Add missing timestamp columns to category_attributes table
-- These columns were accidentally omitted in the original migration

ALTER TABLE "category_attributes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "category_attributes" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
