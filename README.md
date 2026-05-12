# Ventix — POS y CRM para negocios argentinos

Sistema de punto de venta y gestión comercial pensado para kioscos, almacenes, drugstores y comercios minoristas de Argentina. Multi-tenant, multi-sucursal, con facturación electrónica ARCA (ex-AFIP) integrada y modo offline.

## ¿Qué hace Ventix?

- **Punto de venta (POS)** con escáner USB, cámara y escáner remoto desde el celular
- **Gestión de stock** con alertas automáticas, historial de precios y actualización masiva
- **Caja** con apertura, cierre y conciliación de turnos
- **Clientes** con cuentas corrientes (fiado) y registro de pagos
- **Proveedores** con vinculación a productos y compras sugeridas
- **Facturación electrónica ARCA** (A, B y C) con CAE y QR fiscal
- **Reportes** de ventas, stock, caja y gastos con export CSV/Excel
- **Multi-sucursal** con stock independiente
- **Multi-usuario** con roles (owner, admin, cashier)
- **Modo offline (PWA)** que sigue vendiendo sin internet y sincroniza al volver
- **Chatbot IA** de soporte con conocimiento completo del sistema
- **Suscripciones** vía Mercado Pago con trial gratuito de 14 días

## Stack

- **Frontend**: Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui
- **Backend**: Supabase (PostgreSQL 17, Auth, Storage, Realtime, RLS)
- **Estado**: Zustand (POS) · TanStack Query (server cache)
- **Offline**: Dexie.js (IndexedDB) · Service Worker
- **Pagos**: Mercado Pago SDK (preapproval / suscripciones)
- **Facturación**: ARCA WSAA + WSFEv1 (Argentina)
- **IA**: Groq API (llama-3.1-8b-instant)
- **PDF**: @react-pdf/renderer · jsbarcode

## Planes

| Plan | Promo (3 meses) | Después | Funcionalidades |
|---|---|---|---|
| **Simple** | $30.000 / mes | $60.000 / mes | POS, stock, clientes, cuentas corrientes, offline, IA |
| **Con Facturación** | $50.000 / mes | $100.000 / mes | Todo Simple + ARCA, reportes, proveedores, masiva de precios |
| **Trial** | Gratis 14 días | — | Acceso completo al plan Simple, sin tarjeta |

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Variables requeridas en `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
NEXT_PUBLIC_MP_PUBLIC_KEY=
ARCA_ENVIRONMENT=homologation
GROQ_API_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Estructura

```
app/
  (landing)/       — Marketing público
  (auth)/          — Login, registro, recuperación
  (app)/[orgSlug]/ — App autenticada (POS, productos, ventas, etc.)
  (admin)/         — Panel super-admin
  api/             — Endpoints (webhooks MP, ARCA, push, chat IA)
components/        — UI compartida + features
lib/               — Clientes (Supabase, MP, ARCA), utilidades, offline
hooks/             — React hooks (useOrg, useCashSession, useOffline...)
types/             — Tipos generados de Supabase
docs/              — Documentación de uso
```

## Documentación

Guía de uso del sistema en [`docs/USO.md`](docs/USO.md).

## Licencia

Propietario — Tomás Amrein, 2026.
