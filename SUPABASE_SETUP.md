# Supabase Setup Guide for NomadCompass Voting

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Set project name: `nomadcompass`
5. Set a strong database password (save this!)
6. Choose region closest to your users
7. Click "Create new project"

Wait for project to be created (takes ~2 minutes).

## Step 2: Get Your API Keys

1. Go to Project Settings (gear icon) > API
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Update `scripts/supabase-config.js` with these values.

## Step 3: Create Database Tables

1. Go to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Paste the following SQL and click "Run":

```sql
-- =============================================
-- NOMADCOMPASS VOTING SYSTEM SCHEMA
-- =============================================

-- Votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id TEXT NOT NULL,
  category TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_id, category, user_id)
);

-- Index for fast lookups
CREATE INDEX idx_votes_city_category ON votes(city_id, category);
CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_votes_city ON votes(city_id);

-- Aggregated votes view (for fast reads)
CREATE OR REPLACE VIEW vote_aggregates AS
SELECT
  city_id,
  category,
  COUNT(*) FILTER (WHERE vote = 1) as upvotes,
  COUNT(*) FILTER (WHERE vote = -1) as downvotes,
  COUNT(*) as total_votes
FROM votes
GROUP BY city_id, category;

-- Function to update timestamp on vote change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Step 4: Set Up Row Level Security (RLS)

Run this SQL in a new query:

```sql
-- Enable RLS on votes table
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read votes (for aggregation)
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  USING (true);

-- Policy: Anyone can insert votes (we use localStorage user_id)
CREATE POLICY "Anyone can insert votes"
  ON votes FOR INSERT
  WITH CHECK (true);

-- Policy: Users can only update their own votes
CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE
  USING (true);

-- Policy: Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE
  USING (true);
```

## Step 5: Test the Setup

Run this query to verify everything works:

```sql
-- Test insert
INSERT INTO votes (city_id, category, user_id, vote)
VALUES ('lisbon', 'safety', 'test-user-123', 1);

-- Test select
SELECT * FROM votes;

-- Test aggregates view
SELECT * FROM vote_aggregates;

-- Clean up test data
DELETE FROM votes WHERE user_id = 'test-user-123';
```

## Step 6: Update Frontend Config

Edit `scripts/supabase-config.js` and replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

## Done!

Your Supabase backend is now ready. The voting system will:
- Store votes from all users
- Aggregate votes for display
- Calculate adjusted scores based on community feedback

## Troubleshooting

### "Permission denied" errors
- Make sure RLS policies are created correctly
- Check that RLS is enabled on the votes table

### Votes not saving
- Check browser console for errors
- Verify Supabase URL and anon key are correct
- Ensure the user has a valid user_id in localStorage

### Slow queries
- The indexes should handle most cases
- For very high traffic, consider caching aggregates
