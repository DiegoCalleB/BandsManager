-- Migration: Add email_secundario column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_secundario TEXT DEFAULT '';
