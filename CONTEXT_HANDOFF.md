# PROJECT CONTEXT: TransitOps

## What We're Building
TransitOps is a fleet operations platform, vehicle/driver registry, trip dispatch, and maintenance tracking, that enforces business rules automatically (no double-booked vehicles, no expired-license dispatches, no cargo over capacity) instead of relying on a human to catch mistakes. Built in an 8-hour hackathon window, MVP scope only, see Out of Scope below before suggesting anything new.

## Stack (exact)
- Next.js 16.2.10 App Router, TypeScript
- TailwindCSS v4 + shadcn/ui (Base library, Nova preset)
- Zod v4.4.3 (note: NOT Zod 3, API differs — use `.issues` not `.errors`, no `invalid_type_error` param)
- Supabase (URL: `https://jjvnnewoiupnrvupmugd.supabase.co`, anon key in `.env.local`)
- Next 16 uses `proxy.ts` instead of `middleware.ts` — function must be named `proxy` not `middleware`
- Deployed on Vercel at: `https://transit-ops-sigma.vercel.app`

## Folder Structure
```
transitops/
├── app/
│   ├── login/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx              # session check, redirects to /login
│   │   ├── dashboard/page.tsx
│   │   ├── vehicles/{page.tsx, vehicle-form-dialog.tsx}
│   │   ├── drivers/{page.tsx, driver-form-dialog.tsx}
│   │   ├── trips/{page.tsx, trip-form-dialog.tsx, trip-actions.tsx}
│   │   └── maintenance/{page.tsx, maintenance-form-dialog.tsx, maintenance-actions.tsx}
│   ├── layout.tsx
│   ├── page.tsx                    # redirects to /dashboard
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn primitives (button, card, table, dialog, input, label, select, badge, skeleton, separator, dropdown-menu)
│   ├── nav-sidebar.tsx
│   ├── kpi-card.tsx
│   └── status-badge.tsx
├── lib/
│   ├── supabase/{client.ts, server.ts}
│   ├── actions/{vehicles.ts, drivers.ts, trips.ts, maintenance.ts, auth.ts}
│   ├── validations/{vehicle.ts, driver.ts, trip.ts}
│   └── types.ts
├── supabase/schema.sql
└── proxy.ts                        # Next 16 proxy (was middleware.ts)
```
No `/api` routes. All mutations go through Server Actions in `lib/actions/*.ts`, all reads happen directly in Server Components via the Supabase client.

## Database Tables
Schema exists in `supabase/migrations/20260712000000_backend_rebuild.sql`. Needs to be run in Supabase SQL editor or via Supabase CLI. 
Tables: `vehicles`, `drivers`, `trips`, `maintenance_logs`, `fuel_logs`, `user_profiles`.
Business rules are enforced via **Postgres Triggers** (no RPC functions for state transitions). RLS is fully enabled and respects `user_profiles.role` (Fleet Manager, Driver, Safety Officer, Financial Analyst). Computed metrics are handled via Views (e.g., `v_vehicle_operational_costs`, `v_fleet_fuel_efficiency`, `v_fleet_utilization`).

Key ENUMs to remember (strictly lowercase):
- `vehicles.status`: available / on_trip / in_shop / retired
- `drivers.status`: available / on_trip / off_duty / suspended
- `trips.status`: draft / dispatched / completed / cancelled

## PRD Audit Status
| Requirement | Status | Notes |
|---|---|---|
| **Auth & RBAC** | Partial | Email/password login and Google Auth built. **RBAC (Roles) is missing** from DB schema and UI. |
| **Dashboard KPIs** | Partial | Core KPIs (Active Vehicles, etc.) are built. **Filters** (by vehicle type/status/region) are missing. |
| **Vehicle Registry** | Done | CRUD built. Unique Reg Enforced. Status tracking works. |
| **Driver Management** | Done | CRUD built. Safety scores and license expiry tracked. |
| **Trip Management** | Done | CRUD built. Atomic lifecycle state changes via RPC work. |
| **Maintenance** | Done | Auto-sets vehicles to "In Shop" and removes from pool. |
| **Fuel & Expense** | Partial | `fuel_logs` table exists in DB. **UI is completely missing**. |
| **Reports & Analytics** | Not Started | No analytics views or CSV export feature built. |
| **Business Rules** | Done | Dispatch engine blocks double booking and enforces statuses accurately. |

## Active Task
Waiting for user approval to begin implementing the missing high-priority PRD features (RBAC, Fuel UI, Dashboard Filters, Analytics).

## Do Not Touch
- `lib/supabase/client.ts` / `server.ts` — auth wiring follows Supabase SSR docs exactly.
- `proxy.ts` — redirect logic matches Next 16 conventions, function named `proxy`.
- `supabase/migrations/20260712000000_backend_rebuild.sql` — Run as-is in Supabase SQL editor.

## Design Rules (non-negotiable)
- White surfaces, gray-900 text, gray-200 hairline borders, no shadows heavier than a 1px border. No gradients, no glassmorphism.
- Exactly one accent color, emerald, and it means one thing only: "available / good." Amber = in-transit/transitional state. Red = blocked/bad state (suspended, in shop, expired). Never introduce a second "positive" color.
- Status badges are pill-shaped (`rounded-full`), color-mapped per DESIGN.md §4, used consistently everywhere a status appears.
- Sidebar nav stays fixed `w-56`, active item is a solid black (`bg-gray-900 text-white`) pill.
- No animation beyond shadcn's default dialog fade and simple `transition-colors` on hover.

## Key Gotchas for Next Session
1. **Zod v4 not v3**: `.safeParse()` returns `{ success, data, error }` where error has `.issues` (not `.errors`). No `invalid_type_error` param on `z.number()`.
2. **Next.js 16 proxy**: File must be `proxy.ts`, exported function must be named `proxy`, not `middleware`.
3. **Tailwind v4**: Uses `@import "tailwindcss"` syntax, CSS vars use `oklch()`.
4. **shadcn Base library**: Uses `@base-ui/react` instead of Radix — component APIs may differ slightly.

## Definition of Done for This Session
Schema runs in Supabase, test user created, full end-to-end test of: login → dashboard → add vehicle → add driver → create trip → dispatch → verify double-booking blocked → complete trip → open maintenance → close maintenance → dashboard KPIs update.
