-- Run this in your Supabase SQL Editor

-- Table: accounts (workspaces)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- Nested categories
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  type TEXT CHECK (type IN ('income', 'expense')) DEFAULT 'expense',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  balance NUMERIC DEFAULT 0.0,
  type TEXT CHECK (type IN ('spending', 'saving', 'debt')) DEFAULT 'spending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  converted_amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')) DEFAULT 'expense',
  date TIMESTAMPTZ DEFAULT now(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount_limit NUMERIC NOT NULL,
  month_year TEXT NOT NULL, -- Format 'YYYY-MM'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Users can only access their own accounts' data)
CREATE POLICY "Users can view own workspace" ON accounts FOR ALL USING (auth.uid() = user_id);
