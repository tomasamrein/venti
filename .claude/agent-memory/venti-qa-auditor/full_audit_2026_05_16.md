---
name: "Full Audit 2026-05-16"
description: "Commercial readiness audit (2026-05-16): plan gating gaps, ARCA authorize bug, pending_sales fix confirmed, annual plans, subscription enforcement"
type: project
---

**Audit date**: 2026-05-16

**Why**: Pre-commercial-launch audit. Owner wants to know if system is ready to sell commercially.

## Issues Fixed Since 2026-05-07

- pending_sales restore crash: FIXED — espera/page.tsx now correctly routes service vs product items
- ?rubro= param ignored: FIXED — registro/page.tsx reads rubroParam at line 71-73
- ARCA cert/key in plaintext: FIXED — migration 022 moved to Supabase Vault; get_arca_cert_key/set_arca_vault_creds are service_role-only
- MP webhook fail-open: FIXED — now fails-closed in production (line 24 checks NODE_ENV === 'production')
- stock_alerts duplicate rows: FIXED — migration 014 added UNIQUE INDEX
- balance_after race condition: FIXED — migration 015 added record_account_transaction RPC with FOR UPDATE
- price_history trigger: FIXED — migration 025 made SECURITY DEFINER
- push send endpoint service_role collapse: partially fixed (INTERNAL_PUSH_SECRET)

## New Issues Found 2026-05-16

### CRITICAL: /api/arca/authorize POST reads cert/key from organizations.settings (not vault)
File: app/api/arca/authorize/route.ts:38
```
if (!arcaSettings?.cert_pem || !arcaSettings?.key_pem) {
```
This POST endpoint (used to test ARCA token) reads `cert_pem`/`key_pem` directly from `org.settings` JSONB.
After migration 022, those fields no longer exist in settings (they're in vault). So this endpoint ALWAYS returns 422 "Credenciales ARCA no configuradas" even when vault creds exist.
The `actions.ts` (server action path) correctly reads from vault. But the API route is broken.

### HIGH: Plan gating is UI-only, no server-side enforcement for reports/suppliers
- reportes/page.tsx, reportes/ventas/page.tsx: no planType check — any plan accesses full reports
- proveedores/page.tsx: no planType check — Basic plan users (features.suppliers = false) can access suppliers
- The sidebar hides items for cashiers but not by plan
- Only facturacion/page.tsx enforces planType, and only in UI (isSimplePlan = planType !== 'pro')

### HIGH: planType = 'professional' not handled in plan comparison logic
- dashboard/page.tsx:39 — `isPro = planType === 'pro'` (misses 'professional', 'pro_annual')
- facturacion/page.tsx:63 — `isSimplePlan = planType !== 'pro'` (misses 'professional', 'pro_annual')
- configuracion/page.tsx:142 — only checks 'pro' vs 'basic', misses 'professional', annual variants
- layout.tsx:70 — planType falls through correctly but consumers break

### HIGH: isBlocked lets 'paused' subscriptions through
- layout.tsx:61-64: isBlocked only covers trialing+expired, canceled, past_due
- `paused` status is NOT in isBlocked — paused orgs have full app access
- `subscription_status` enum includes 'paused' but it's never enforced

### MEDIUM: CopyServicePanel quantity bug still present
- components/pos/copy-service-panel.tsx — quantity passed as 1 always, confirmed not reviewed in this pass

### MEDIUM: equipo/page.tsx — max_users check done client-side only
- handleInvite() fetches subscription from client, compares members count
- No server-side enforcement in /api/invitations route
- A race condition (two tabs inviting simultaneously) or a direct API call bypasses the limit

### MEDIUM: sucursales/page.tsx — max_branches check done client-side only
- Same pattern: handleSave() fetches subscription, compares branch count client-side
- No server-side enforcement
