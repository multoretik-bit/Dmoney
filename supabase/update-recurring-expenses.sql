-- Safe update for an existing DMoney database.
-- Run this file in Supabase SQL Editor instead of re-running the full schema.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS group_type TEXT NOT NULL DEFAULT 'subscription';

UPDATE public.subscriptions
SET group_type = 'subscription'
WHERE group_type IS NULL;

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS long_term_goals JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS goal_rewards JSONB DEFAULT '[]'::jsonb;
