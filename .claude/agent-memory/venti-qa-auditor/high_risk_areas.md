---
name: high-risk-areas
description: Known high-risk files and patterns in Venti that require extra scrutiny in future audits
type: project
---

## ARCA Credential Security (UNRESOLVED)
`app/(app)/[orgSlug]/configuracion/facturacion/page.tsx` — reads `cert_pem` and `key_pem` from `organizations.settings` directly in the browser client. These AFIP private keys travel to the browser on every config page load.
`lib/arca/invoice.ts` — stores ARCA token cache back into `organizations.settings` as plaintext JSONB.
**Required fix (not yet done):** Migrate to Supabase Vault. Store only `vault_secret_id` in settings. Config page must never read the raw key — only show metadata (CUIT, ambiente, cert expiry).

## Financial Calculation Files (track for future audits)
- `app/(app)/[orgSlug]/pos/page.tsx` — `complete_sale` RPC call, change_amount, discount_amount
- `app/(app)/[orgSlug]/cuentas-corrientes/[id]/page.tsx` — manual charge/payment has race condition on `balance_after` (reads stale React state)
- `supabase/migrations/012_complete_sale.sql` — the atomic RPC; verify FOR UPDATE locks are correct
- `supabase/migrations/008_triggers.sql` — price_history, stock_alert, account_balance triggers

## DB Tables Missing Critical Constraints (fixed in 014_qa_fixes.sql)
- `stock_alerts` — was missing UNIQUE INDEX on `(product_id) WHERE is_resolved = FALSE` → duplicate alert rows on every stock update
- `stock_alerts` — was missing UPDATE RLS policy → users couldn't resolve alerts from client

## MP Webhook Security
`app/api/webhooks/mercadopago/route.ts` — was fail-open (no secret = no verification). Fixed to fail-closed in production. Still accepts unauthenticated in dev when secret is absent.

## Push Send Endpoint
`app/api/push/send/route.ts` — was using `SUPABASE_SERVICE_ROLE_KEY` as the internal auth secret, collapsing two blast radii. Fixed to use `INTERNAL_PUSH_SECRET` with service role key as fallback.

**Why:** Leaking the service role key grants full DB access; leaking push secret only allows push sends. Keeping them separate limits blast radius.
