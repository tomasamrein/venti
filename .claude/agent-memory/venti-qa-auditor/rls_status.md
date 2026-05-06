---
name: rls-status
description: RLS policy coverage status per table — confirmed in audit 2026-05-06
type: project
---

## Tables with RLS enabled (all confirmed in 009_rls.sql)
All tables have RLS enabled. Coverage:

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| organizations | ✅ | ✅ | ✅ | ✅ | |
| subscription_plans | ✅ | ❌ | ❌ | ❌ | public read-only, admin writes via service role |
| subscriptions | ✅ | ❌ | ❌ | ❌ | admin-only writes via service role |
| profiles | ✅ | ❌ | ✅ | ❌ | |
| organization_members | ✅ | ✅ | ✅ | ✅ | |
| branches | ✅ | ✅ | ✅ | ✅ | |
| product_categories | ✅ | ✅ | ✅ | ✅ | |
| products | ✅ | ✅ | ✅ | ✅ | |
| price_history | ✅ | ✅ | ❌ | ❌ | append-only by design |
| suppliers | ✅ | ✅ | ✅ | ✅ | |
| supplier_products | ✅ | ✅ | ✅ | ✅ | |
| customers | ✅ | ✅ | ✅ | ✅ | |
| current_accounts | ✅ | ✅ | ✅ | ❌ | |
| current_account_transactions | ✅ | ✅ | ❌ | ❌ | append-only |
| cash_sessions | ✅ | ✅ | ✅ | ❌ | |
| cash_movements | ✅ | ✅ | ❌ | ❌ | append-only |
| sales | ✅ | ✅ | ✅ | ❌ | |
| sale_items | ✅ | ✅ | ❌ | ❌ | append-only |
| pending_sales | ✅ | ✅ | ✅ | ✅ | |
| invoices | ✅ | ✅ | ✅ | ❌ | |
| expenses | ✅ | ✅ | ✅ | ✅ | |
| stock_alerts | ✅ | ❌ | ✅* | ❌ | *UPDATE added in 014_qa_fixes.sql |
| notifications | ✅ | ❌ | ✅ | ❌ | |
| push_subscriptions | ✅ | ✅ | ✅ | ✅ | ALL policy |
| invitations | ✅* | ✅ | ✅ | ❌ | *read policy was too permissive (anon), fixed in 014_qa_fixes.sql |
