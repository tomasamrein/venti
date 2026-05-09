---
name: multi-rubro-audit-2026-05-07
description: Audit of multi-rubro feature (business_type, CartItem refactor, CopyServicePanel, EmployeeSwitcher) — findings from 2026-05-07
type: project
---

## Multi-Rubro Audit Findings (2026-05-07)

### CRITICAL: pending_sales restore casts service items as ProductRow (as any)
`app/(app)/[orgSlug]/pos/espera/page.tsx:90`
`restoreCart(item as any, item.cart_quantity)` — restoreCart is `addItem` which expects `ProductRow`.
Restored items from a sale that contained service items (is_service: true, product_id: null) will fail at runtime:
`addItem` reads `product.id`, `product.track_stock`, `product.allow_negative`, `product.organization_id` which are absent on the lean `CartItemLike` (which only has id, name, price_sell, cart_quantity, barcode).

### HIGH: hold_sale items serialization missing is_service/product_id for restore
`app/(app)/[orgSlug]/pos/page.tsx:107-115` — saved items include `is_service` and `product_id: i.product_id ?? i.id`.
But `CartItemLike` at espera/page.tsx:34-40 does NOT include `is_service` or `product_id` fields.
So when restored, `addItem(item as any, qty)` will call `product.id` (which will be the product UUID saved as `id` in the JSONB — this happens to work for product items but fails for service items where `id` is a generated UUID and `product_id: null`).

### HIGH: ?rubro= query param not read by registro page
Landing links use `/registro?rubro=kiosco` etc but `app/(auth)/registro/page.tsx` never reads `searchParams`/`useSearchParams`. The business_type selector starts at null — the query param is silently ignored. Users arriving from the landing page have to re-select their rubro.

### HIGH: EmployeeSwitcher queries Supabase directly in a Client Component (two sequential calls)
`components/pos/employee-switcher.tsx:29-50` — violates CLAUDE.md rule "Supabase queries NEVER in Client Components". Also does N+1-style: fetches members, then fetches profiles in a second call. Should be a Server Component or server action.

### HIGH: POS page also queries Supabase directly in a Client Component
`app/(app)/[orgSlug]/pos/page.tsx:64-75` — `useEffect` + `createClient()` to load products. Same violation.

### MEDIUM: business_type typed as `string` in database.ts, not as union
`types/database.ts:650` — `business_type: string` instead of `'kiosco' | 'almacen' | 'drugstore' | 'fotocopiadora' | 'otro'`.
`pos/page.tsx:45` uses `as` cast to paper over this, which is unsafe.

### MEDIUM: change_amount can be negative if cashier enters less than total (no server-side guard)
`pos/page.tsx:165` — `p_change_amount: method === 'cash' ? amountPaid - total : null`.
PaymentModal disables Confirm if `amount < total`, but `amountPaid` is passed directly. No guard in `complete_sale` RPC. If the modal is bypassed, negative change can be stored.

### MEDIUM: CopyServicePanel service items use quantity=1 in addServiceItem despite showing multiplied name
`copy-service-panel.tsx:71` — `addServiceItem({ ..., quantity: 1, ... })` always passes 1 even when user inputs e.g. 5 copies. The label is `"Fotocopia B&N (x5)"` but quantity in cart is 1. Total price will be wrong (price * 1, not price * 5).

### LOW: TypeScript compiles clean (npx tsc --noEmit = no errors)

### LOW: ?rubro= links in landing/precios are self-consistent (all use /registro?rubro=X pattern)

### LOW: business_type does not affect RLS policies — no cross-tenant risk from this feature.

### LOW: complete_sale RPC correctly uses NULLIF for product_id, service items bypass stock decrement safely.

### LOW: migration 016 introduced 'polleria'/'ferreteria' which 017 migrated to 'otro'. Any existing rows with those values are now 'otro'. No data loss risk.
