-- Durable wallet writes.
-- Old cached app versions used to upsert every wallet in one request. An old
-- device could therefore restore stale balances after a newer device saved.
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp();

CREATE OR REPLACE FUNCTION public.upsert_wallets(p_wallets JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_wallets) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'p_wallets must be a JSON array' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.wallets AS existing (
    id,
    user_id,
    portfolio_id,
    folder_id,
    name,
    currency,
    balance,
    icon,
    color,
    target_amount,
    sort_order,
    updated_at
  )
  SELECT
    input.id,
    v_user_id,
    input.portfolio_id,
    input.folder_id,
    input.name,
    COALESCE(input.currency, 'USD'),
    COALESCE(input.balance, 0),
    input.icon,
    input.color,
    COALESCE(input.target_amount, 0),
    COALESCE(input.sort_order, 0),
    clock_timestamp()
  FROM jsonb_to_recordset(p_wallets) AS input (
    id UUID,
    portfolio_id UUID,
    folder_id UUID,
    name TEXT,
    currency TEXT,
    balance NUMERIC,
    icon TEXT,
    color TEXT,
    target_amount NUMERIC,
    sort_order NUMERIC
  )
  WHERE EXISTS (
    SELECT 1
    FROM public.portfolios portfolio
    WHERE portfolio.id = input.portfolio_id
      AND portfolio.user_id = v_user_id
  )
    AND (
      input.folder_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.folders folder
        WHERE folder.id = input.folder_id
          AND folder.user_id = v_user_id
      )
    )
  ON CONFLICT (id) DO UPDATE
  SET
    portfolio_id = EXCLUDED.portfolio_id,
    folder_id = EXCLUDED.folder_id,
    name = EXCLUDED.name,
    currency = EXCLUDED.currency,
    balance = EXCLUDED.balance,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    target_amount = EXCLUDED.target_amount,
    sort_order = EXCLUDED.sort_order,
    updated_at = clock_timestamp()
  WHERE existing.user_id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_wallets(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_wallets(JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_unversioned_wallet_balance_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.balance IS DISTINCT FROM OLD.balance
     AND NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    RAISE EXCEPTION 'Stale wallet client cannot overwrite balance'
      USING ERRCODE = '40001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_wallet_balance_from_stale_clients ON public.wallets;
CREATE TRIGGER protect_wallet_balance_from_stale_clients
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.reject_unversioned_wallet_balance_update();
