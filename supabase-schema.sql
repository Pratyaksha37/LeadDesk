-- LeadDesk Mini Database Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/kbcregtnmfmtleegwlnf/sql/new)

-- 1. Create the leads table
CREATE TABLE IF NOT EXISTS leads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
-- Anyone can insert a lead (public form submission)
CREATE POLICY "Anyone can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view leads
CREATE POLICY "Authenticated users can view leads"
  ON leads FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can update leads
CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Only authenticated users can delete leads
CREATE POLICY "Authenticated users can delete leads"
  ON leads FOR DELETE
  USING (auth.role() = 'authenticated');

-- 4. Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);

-- 5. Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
