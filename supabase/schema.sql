-- Run this in your Supabase SQL Editor

-- 1. Enable Realtime for the public schema
-- go to Database -> Replication -> Tables and enable for these tables

-- 2. Create Tables

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  budget_limit NUMERIC DEFAULT 0,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
 );

-- Portfolios (Capitals)
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Folders (inside Portfolios)
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Wallets (Accounts)
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  balance NUMERIC DEFAULT 0,
  target_amount NUMERIC DEFAULT 0,
  icon TEXT,
  color TEXT,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions (Expenses)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  converted_amount NUMERIC NOT NULL,
  wallet_amount NUMERIC NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  saved_colors TEXT[], -- Array of hex strings
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Users can manage their own categories" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own folders" ON folders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own wallets" ON wallets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- 5. Enable Realtime explicitly (if needed via SQL instead of UI)
-- ALTER PUBLICATION supabase_realtime ADD TABLE categories, portfolios, folders, wallets, transactions, user_preferences;

-- 6. Incremental columns used by the app that aren't in the original CREATE TABLE above.
-- Safe to re-run: only adds a column if it's missing.
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS work_budget_limit NUMERIC DEFAULT 0;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS large_budget_limit NUMERIC DEFAULT 0;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS capital_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS savings_goal JSONB; -- deprecated, superseded by savings_goals below
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS savings_goals JSONB; -- { work: {month,target,saved}, savings: {...}, invest: {...} }
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subscription_next_charge_date DATE;

-- 7. Passive Income (Мои Капиталы -> Пассивный доход tab)
CREATE TABLE IF NOT EXISTS passive_income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE passive_income_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own passive income sources" ON passive_income_sources;
CREATE POLICY "Users can manage their own passive income sources" ON passive_income_sources FOR ALL USING (auth.uid() = user_id);

-- 8. Assets (Капиталы -> Активы section: real estate, valuables, etc.)
-- Purely informational — never counted into portfolio/capital totals.
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  color TEXT,
  image_url TEXT, -- base64 data URL, resized client-side before upload
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own assets" ON assets;
CREATE POLICY "Users can manage their own assets" ON assets FOR ALL USING (auth.uid() = user_id);

-- 9. Subscriptions (Траты -> Подписки section)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  kind TEXT NOT NULL DEFAULT 'personal', -- 'personal' | 'work' | 'yearly'
  color TEXT,
  billing_day NUMERIC NOT NULL DEFAULT 1, -- 1-31
  billing_month NUMERIC, -- 1-12, only used when kind = 'yearly'
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  auto_charge BOOLEAN NOT NULL DEFAULT false,
  last_charged_period TEXT, -- 'yyyy-MM' for personal/work, 'yyyy' for yearly
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Incremental fix: the table may already exist from an earlier version of
-- this app that used a "period" column instead of "kind", and predates
-- "color". Safe to re-run.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS group_type TEXT NOT NULL DEFAULT 'subscription';

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON subscriptions;
CREATE POLICY "Users can manage their own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
