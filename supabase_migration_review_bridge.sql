-- ============================================
-- REVIEW BRIDGE MODULE: Database Schema
-- ============================================
-- Execute this SQL in your Supabase SQL Editor
-- This creates the review_queue table and updates snippets table

-- 0. Ensure profiles table has role column (if it doesn't exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'author' CHECK (role IN ('author', 'editor'));

-- 1. Add new columns to snippets table
ALTER TABLE snippets 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'draft' CHECK (verification_status IN ('draft', 'pending_review', 'in_review', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_by_editor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create review_queue table
CREATE TABLE IF NOT EXISTS review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  editor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  editor_notes TEXT,
  edited_content TEXT, -- Student's edited version (optional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_editor ON review_queue(editor_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_author ON review_queue(author_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_snippet ON review_queue(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippets_verification_status ON snippets(verification_status);
CREATE INDEX IF NOT EXISTS idx_snippets_verified ON snippets(verified);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Students can view pending reviews" ON review_queue;
DROP POLICY IF EXISTS "Authors can view their own submissions" ON review_queue;
DROP POLICY IF EXISTS "Authors can create review submissions" ON review_queue;
DROP POLICY IF EXISTS "Students can update assigned reviews" ON review_queue;

-- Students can view pending reviews
CREATE POLICY "Students can view pending reviews"
ON review_queue FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  AND status = 'pending'
);

-- Authors can view their own submissions
CREATE POLICY "Authors can view their own submissions"
ON review_queue FOR SELECT
USING (auth.uid() = author_id);

-- Authors can create review submissions
CREATE POLICY "Authors can create review submissions"
ON review_queue FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Students can update reviews they're assigned to
CREATE POLICY "Students can update assigned reviews"
ON review_queue FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  AND (editor_id IS NULL OR editor_id = auth.uid())
);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_review_queue_updated_at BEFORE UPDATE ON review_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Create function to award credits on approval
CREATE OR REPLACE FUNCTION award_editor_credit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Award 1 credit to the editor
    UPDATE profiles 
    SET credits = COALESCE(credits, 0) + 1
    WHERE id = NEW.editor_id;
    
    -- Mark snippet as verified and track which editor verified it
    UPDATE snippets 
    SET verified = true, 
        verification_status = 'verified',
        status = 'public',
        verified_by_editor_id = NEW.editor_id
    WHERE id = NEW.snippet_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER award_credit_on_approval 
AFTER UPDATE ON review_queue
FOR EACH ROW 
WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
EXECUTE FUNCTION award_editor_credit();

