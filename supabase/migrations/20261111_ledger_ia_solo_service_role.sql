-- Las funciones del ledger de IA (SECURITY DEFINER) eran ejecutables por anon y authenticated vía /rest/v1/rpc:
-- cualquiera con la clave pública podía liquidar donaciones o leer la deuda de una banda. La migración 20260915 solo
-- revocó PUBLIC, pero Supabase concede EXECUTE a anon/authenticated por privilegios por defecto.
-- Solo las llama el servidor (server/db/aiLedger.ts) con service_role, que conserva EXECUTE. Idempotente.
DO $$
BEGIN
  IF to_regprocedure('public.get_ai_debt_cents(text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.get_ai_debt_cents(TEXT) FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.settle_ai_donation(text,integer,text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.settle_ai_donation(TEXT, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
