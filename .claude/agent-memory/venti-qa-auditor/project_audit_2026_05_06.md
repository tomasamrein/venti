---
name: "Full System Audit 2026-05-06"
description: "First comprehensive QA audit findings: high-risk files, confirmed bugs, RLS gaps, financial integrity issues, ARCA notes"
type: project
---

**Audit date**: 2026-05-06

**Why**: First audit before going live. Covers security, financial integrity, ARCA, auth flows, API routes, type safety.

**How to apply**: Use this as the baseline for future audits. Verify each finding was fixed before closing.

---

## Confirmed Critical Issues

### CRITICAL: stock_alerts `ON CONFLICT DO NOTHING` is silent no-op (no unique constraint)
- `check_stock_alert()` trigger uses `ON CONFLICT DO NOTHING` but `stock_alerts` has NO unique constraint on `(organization_id, product_id)` or `(product_id)`.
- Result: every stock update that drops below minimum inserts a DUPLICATE alert row instead of deduplicating. The `ON CONFLICT DO NOTHING` never fires.
- Fix: `CREATE UNIQUE INDEX ON stock_alerts(product_id) WHERE is_resolved = FALSE;`

### HIGH: `complete_sale` RPC — `p_change_amount` always passed as `amountPaid - total` for non-cash methods (sends 0, not null)
- `pos/page.tsx:150`: `p_change_amount: method === 'cash' ? amountPaid - total : 0`
- The DB stores `0` for change_amount on card/transfer sales instead of `NULL`. Minor financial data quality issue.

### HIGH: `current_accounts` balance race condition in client-side manual transactions
- `cuentas-corrientes/[id]/page.tsx`: reads balance from local state (`account?.balance`), computes `newBalance = currentBalance + signedAmount`, then inserts transaction with that computed `balance_after`.
- The DB trigger `trg_account_balance` also updates the balance. But `balance_after` in the transaction row is calculated client-side from potentially stale state — if two browser tabs or concurrent requests submit at the same time, `balance_after` will be wrong (stale read).
- The `complete_sale` RPC also does this: reads `ca.balance` then computes `v_account_balance - p_total` for `balance_after` — but the RPC uses `FOR UPDATE` so it's safe for the RPC path. The manual charge/payment path in the client page is NOT safe.

### HIGH: ARCA cert_pem / key_pem stored in `organizations.settings` JSONB (plaintext in DB)
- CLAUDE.md spec says: "Almacenar credenciales ARCA por organización (CUIT, punto de venta, certificado) en Supabase Vault"
- Actual implementation stores them directly in `organizations.settings` as plaintext JSONB.
- Any super-admin query or RLS bypass exposes all org private keys. Should use Supabase Vault or at minimum encrypt before storing.

### MEDIUM: `/api/push/send` uses `SUPABASE_SERVICE_ROLE_KEY` as a bearer token for internal auth
- `push/send/route.ts:13`: compares `Authorization` header to `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`.
- This is an anti-pattern: a leaked service role key now also serves as the push send secret. Should use a separate `INTERNAL_API_SECRET` env var.

### MEDIUM: `stock_alerts` table has no write RLS policy
- Only `alerts_read` (SELECT) exists. No INSERT/UPDATE policy.
- The `check_stock_alert()` trigger runs as SECURITY DEFINER so it bypasses RLS for inserts — that's fine.
- But there's no way for the app to mark alerts as `is_resolved = TRUE` via the client (no UPDATE policy). Resolving alerts from the UI would silently fail.

### MEDIUM: Webhook signature bypass when `MP_WEBHOOK_SECRET` is not set
- `webhooks/mercadopago/route.ts:24`: signature check only runs `if (process.env.MP_WEBHOOK_SECRET)`.
- In production without this env var set, ALL webhook calls are accepted without verification.
- This is documented as "allows local testing" but is a dangerous default for production.

### MEDIUM: `check_stock_alert` is SECURITY DEFINER but `record_price_history` is INVOKER
- `record_price_history` runs as the invoking user (typically `authenticated` role with limited perms).
- When `complete_sale` RPC (INVOKER) triggers a price change, `auth.uid()` in `record_price_history` is correct.
- But when called from a bulk update via `admin` client (service role), `auth.uid()` returns NULL — `changed_by` will be NULL in price_history rows.

### LOW: `invitations` table `invite_read_by_token` policy has `qual = true` (public read)
- Anyone (even unauthenticated) can SELECT from `invitations` if they know any token.
- The token is 64-char hex (256 bits), so practically secure by obscurity, but the policy is broader than needed.

### LOW: `register/route.ts` calls `listUsers()` without pagination limit when email exists
- Line 77: `await supabase.auth.admin.listUsers()` — fetches ALL users to find one by email.
- Will be slow and expensive at scale. Should use `getUserByEmail` or a targeted query.

---

## Confirmed Clean

- All 25 public tables have `rowsecurity = true` (RLS enabled on every table)
- All tables have sensible org-scoped policies; no tenant data leaks found
- `createAdminClient` is NOT imported in any component (only in API routes) — service_role key is server-only
- `complete_sale` RPC uses `FOR UPDATE` on products — stock decrement is race-condition safe
- `UNIQUE INDEX idx_cash_sessions_one_open` exists per CLAUDE.md spec — enforces one open session per branch
- `formatARS` using `Intl.NumberFormat` is used consistently across ~40 files — no raw `.toFixed(2)` on currency display (only in ARCA SOAP XML generation which is correct)
- `handle_new_user` trigger on `auth.users` is confirmed deployed
- `trg_account_balance` trigger confirmed on `current_account_transactions`
- MP webhook signature validation uses `crypto.timingSafeEqual` correctly
- ARCA invoice numbering collision retry loop (up to 3 attempts) implemented
- ARCA `FECAESolicitar` happens before marking invoice `issued` — CAE is always present before status change
- QR data uses standard base64 (not base64url) per ARCA spec — correct
- `invitations` table has proper schema with 64-char hex token, 7-day expiry default
- Factura A correctly validates CUIT receptor (11 digits) before calling ARCA
- `complete_sale` validates open cash session, validates current_account exists before processing

---

## High-Risk Files for Future Audits

- `app/(app)/[orgSlug]/pos/page.tsx` — POS flow, `complete_sale` RPC call, stock optimistic update
- `app/(app)/[orgSlug]/cuentas-corrientes/[id]/page.tsx` — balance_after race condition
- `lib/arca/invoice.ts` — IVA calculation, invoice numbering
- `lib/arca/auth.ts` — WSAA token lifecycle, TRA signing
- `app/api/arca/invoice/route.ts` — draft→issued flow, idempotency
- `app/api/webhooks/mercadopago/route.ts` — subscription status sync
- `lib/mercadopago/webhooks.ts` — payment event handling
- `app/api/register/route.ts` — orphan user cleanup (listUsers without limit)
- `app/(app)/[orgSlug]/configuracion/facturacion/page.tsx` — cert/key stored in JSONB settings client-side

---

## ARCA Integration Status (as of 2026-05-06)

- Token caching: implemented in `organizations.settings.arca.token_cache` (persisted to DB)
- TRA signing: implemented with `node-forge` CMS PKCS7
- WSAA call: implemented, parses XML response
- WSFEV1: implemented, `FECompUltimoAutorizado` + `FECAESolicitar`
- Cert storage: IN JSONB (not Vault — security gap)
- Environment switching: controlled by `settings.arca.environment` per org
- QR: base64 standard, correct ARCA URL format
- Requires browser testing: actual homologation roundtrip with real AFIP test certificate
