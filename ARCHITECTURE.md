# ARCHITECTURE: TransitOps

> Note before you start: your PRD specifies Next.js 14, but `npx create-next-app@latest` as of July 2026 installs Next.js 16.x (App Router is unchanged in the ways that matter for this build; caching defaults and the `middleware.ts` → `proxy.ts` rename are the parts that could bite a beginner). This doc is written against 16.x. If your hackathon rules require pinning to 14 specifically, run `npm i next@next-14 react@18 react-dom@18` instead, but do that as a conscious choice, not by accident.

## 1. Tech Stack — exact versions

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.x |
| Runtime | Node.js | 20.x LTS or 22.x LTS (16.x requires 20+) |
| Language | TypeScript | 5.x |
| UI library | React | 19.x (bundled with Next 16) |
| Styling | TailwindCSS | 3.4.x |
| Components | shadcn/ui | latest (CLI-installed, not versioned as a package) |
| Backend / DB | Supabase (Postgres + Auth) | hosted, JS client `@supabase/supabase-js` ^2.x |
| Supabase SSR helpers | `@supabase/ssr` | ^0.5.x |
| Validation | Zod | ^3.x |
| Deployment | Vercel | — |

Install command for reference:
```bash
npx create-next-app@latest transitops --typescript --tailwind --app --eslint
cd transitops
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr zod
```

## 2. Folder Structure

```
transitops/
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx              # session check, redirects to /login if none
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── vehicles/
│   │   │   ├── page.tsx
│   │   │   └── vehicle-form-dialog.tsx
│   │   ├── drivers/
│   │   │   ├── page.tsx
│   │   │   └── driver-form-dialog.tsx
│   │   ├── trips/
│   │   │   ├── page.tsx
│   │   │   └── trip-form-dialog.tsx
│   │   └── maintenance/
│   │       └── page.tsx
│   ├── api/
│   │   └── (not used — Server Actions handle all mutations, see §4)
│   ├── layout.tsx                  # root layout
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn-generated primitives (button, table, dialog, etc)
│   ├── nav-sidebar.tsx
│   ├── kpi-card.tsx
│   └── status-badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # browser client
│   │   └── server.ts                # server client (reads cookies)
│   ├── actions/
│   │   ├── vehicles.ts              # Server Actions: create, update
│   │   ├── drivers.ts
│   │   ├── trips.ts                 # createTrip, dispatchTrip, completeTrip, cancelTrip
│   │   └── maintenance.ts
│   ├── validations/
│   │   ├── vehicle.ts               # Zod schemas
│   │   ├── driver.ts
│   │   └── trip.ts
│   └── types.ts                     # shared TS types mirroring DB schema
├── supabase/
│   └── schema.sql                   # everything in §3, run once in Supabase SQL editor
├── middleware.ts                    # or proxy.ts on Next 16, see note in §5
├── .env.local
├── package.json
└── tsconfig.json
```

**Why Server Actions instead of `/api` routes:** fewer files, fewer fetch calls to wire up, and it's the path of least resistance for a beginner in App Router. Every mutation (create vehicle, dispatch trip, etc.) is a function in `lib/actions/*.ts` marked `'use server'`, called directly from a form's `action` prop or an `onClick` handler. No REST layer to hand-roll.

## 3. Database Schema

Run this once in the Supabase SQL editor (or run the migration file `supabase/migrations/20260712000000_backend_rebuild.sql`). We use Postgres Triggers to enforce business rules natively, avoiding complex RPC calls from the frontend.

```sql
-- ENUMs
CREATE TYPE user_role AS ENUM ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst');
CREATE TYPE vehicle_status AS ENUM ('available', 'on_trip', 'in_shop', 'retired');
CREATE TYPE driver_status AS ENUM ('available', 'on_trip', 'off_duty', 'suspended');
CREATE TYPE trip_status AS ENUM ('draft', 'dispatched', 'completed', 'cancelled');
CREATE TYPE maintenance_status AS ENUM ('active', 'closed');
CREATE TYPE fuel_log_type AS ENUM ('fuel', 'toll', 'misc');

-- TABLES (simplified list, see migration for full schema)
-- vehicles: registration_number, name, type, max_load_kg, odometer, acquisition_cost, status, region
-- drivers: name, license_number, license_category, license_expiry, contact_number, safety_score, status
-- trips: source, destination, vehicle_id, driver_id, cargo_weight_kg, planned/actual distance, fuel_consumed_l, revenue, status
-- maintenance_logs: vehicle_id, description, cost, status
-- fuel_logs: vehicle_id, trip_id, type, liters, cost, log_date
-- user_profiles: email, full_name, role

-- ROW LEVEL SECURITY (RBAC)
-- RLS is enabled and enforces rules based on `user_profiles.role`:
-- Fleet Manager: ALL access to all tables.
-- Driver: SELECT on vehicles/drivers, INSERT on trips, UPDATE on own trips.
-- Safety Officer: ALL on drivers, SELECT on operational tables.
-- Financial Analyst: SELECT only on all tables.

-- DATABASE TRIGGERS (Enforcing Business Rules)
-- 1. check_trip_dispatch (BEFORE UPDATE on trips): 
--    - Ensures cargo_weight_kg <= vehicle.max_load_kg
--    - Ensures vehicle and driver status = 'available'
--    - Ensures driver license has not expired
-- 2. sync_trip_status (AFTER UPDATE on trips):
--    - Auto-sets vehicle and driver to 'on_trip' when dispatched.
--    - Auto-sets vehicle and driver to 'available' when completed/cancelled.
-- 3. sync_maintenance_status (AFTER INSERT/UPDATE on maintenance_logs):
--    - Auto-sets vehicle to 'in_shop' when active, and 'available' when closed.

-- COMPUTED VIEWS
-- v_vehicle_operational_costs: Sums maintenance, fuel, and misc expenses per vehicle.
-- v_fleet_fuel_efficiency: Total distance / total fuel across completed trips.
-- v_fleet_utilization: (on_trip vehicles / total active vehicles) * 100.
-- get_vehicle_roi(v_id): RPC to calculate ((revenue - operational_costs) / acquisition_cost) * 100.
```

**Why Triggers instead of RPCs from React:** By enforcing these rules at the database level via triggers, any API call to simply `UPDATE trips SET status = 'dispatched'` will safely execute all state transitions and block invalid requests (e.g. overloaded vehicles). This creates an impenetrable backend that holds up even if called directly via API.

## 4. API Routes

No REST API routes are used. All reads happen via the Supabase JS client directly in Server Components; all writes happen via Server Actions. This table documents them as if they were routes, since that's the mental model either way.

| Action | Type | Input | Output |
|---|---|---|---|
| `signIn(email, password)` | Server Action | `{ email: string, password: string }` | redirects to `/dashboard` or returns `{ error: string }` |
| `getDashboardStats()` | Server read (in `dashboard/page.tsx`) | none | `{ activeVehicles, availableVehicles, inShop, activeTrips, pendingTrips, driversOnDuty, utilizationPct }` |
| `createVehicle(data)` | Server Action | Zod-validated vehicle fields | `{ success: true }` or `{ error: string }` (e.g. duplicate registration_number) |
| `updateVehicle(id, data)` | Server Action | vehicle id + partial fields | `{ success: true }` or `{ error: string }` |
| `createDriver(data)` | Server Action | Zod-validated driver fields | `{ success: true }` or `{ error: string }` |
| `updateDriver(id, data)` | Server Action | driver id + partial fields | `{ success: true }` or `{ error: string }` |
| `getAvailableVehicles()` | Server read | none | `Vehicle[]` where `status = 'available'` |
| `getAvailableDrivers()` | Server read | none | `Driver[]` where `status = 'available' AND license_expiry > today` |
| `createTrip(data)` | Server Action | source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km | `{ success: true, tripId }` or `{ error: string }` if cargo exceeds capacity |
| `dispatchTrip(tripId)` | Server Action → direct UPDATE on trips (trigger handles state transition) | `{ tripId: string }` | `{ success: true }` |
| `completeTrip(tripId, actualDistance, fuelConsumed)` | Server Action → direct UPDATE on trips (trigger handles state transition) | trip id + numbers | `{ success: true }` |
| `cancelTrip(tripId)` | Server Action → direct UPDATE on trips (trigger handles state transition) | `{ tripId: string }` | `{ success: true }` |
| `openMaintenance(vehicleId, description, cost)` | Server Action → direct INSERT on maintenance_logs (trigger updates vehicle) | fields | `{ success: true }` |
| `closeMaintenance(logId)` | Server Action → direct UPDATE on maintenance_logs (trigger updates vehicle) | `{ logId: string }` | `{ success: true }` |

## 5. Auth Flow

1. User visits any protected route (e.g. `/dashboard`) without a session.
2. `middleware.ts` (Next 16 note: file may need to be named `proxy.ts` depending on the exact 16.x minor you land on, check `npx create-next-app` output) runs on every request, uses `@supabase/ssr` to check for a valid session cookie.
3. No session found → redirect to `/login`.
4. On `/login`, user submits email + password via a form calling the `signIn` Server Action.
5. `signIn` calls `supabase.auth.signInWithPassword()`. Supabase validates credentials against its own `auth.users` table (managed entirely by Supabase, not a table you create).
6. On success, Supabase sets a session cookie via the SSR helper. Server Action redirects to `/dashboard`.
7. On failure, Server Action returns `{ error: 'Invalid credentials' }`, form displays it inline, no redirect.
8. Every subsequent request to a protected route: middleware reads the cookie, refreshes the session if needed, allows the request through.
9. Logout: a button calls `supabase.auth.signOut()`, clears the cookie, redirects to `/login`.
10. Role (Fleet Manager / Driver / Safety Officer / Financial Analyst) is stored as a custom column on a `profiles` table (or as `user_metadata` on the Supabase auth user, simpler for 8 hours) and is read once after login to display a badge. It is not checked anywhere else, per the PRD's Out of Scope.

## 6. Data Flow

**Vehicle registration:**
Input: Fleet Manager fills the "Add Vehicle" dialog form → Zod validates client-side on submit → `createVehicle` Server Action runs, Zod-validates again server-side → Supabase insert into `vehicles`, unique constraint on `registration_number` catches duplicates → Output: success returns to the client, `revalidatePath('/vehicles')` refreshes the Server Component → Display: table row appears immediately, status badge shows "Available".

**Driver registration:**
Same shape as vehicle registration, targeting `drivers` table, no unique constraint besides the primary key (license_number isn't enforced unique in schema; add if your hackathon judges care, cut for time otherwise).

**Trip creation and dispatch (the core loop):**
Input: user opens "Create Trip" dialog, vehicle dropdown is populated by `getAvailableVehicles()`, driver dropdown by `getAvailableDrivers()` → user fills source, destination, cargo weight, selects vehicle and driver → Processing: client-side check `cargo_weight_kg <= selectedVehicle.max_load_kg` disables the Dispatch button if violated, `createTrip` Server Action re-validates the same constraint server-side before insert → trip row created with `status = 'draft'` → user clicks Dispatch → `dispatchTrip(tripId)` Server Action calls the `dispatch_trip` RPC → Output: RPC atomically sets trip to `dispatched`, vehicle to `on_trip`, driver to `on_trip` → Display: `revalidatePath` on `/trips`, `/vehicles`, `/drivers`, `/dashboard` refreshes all four, dropdowns on any new trip form immediately exclude the now-busy vehicle and driver.

**Trip completion:**
Input: Fleet Manager clicks "Complete" on a dispatched trip, enters final odometer/fuel in a small form → Processing: `completeTrip` Server Action calls `complete_trip` RPC → Output: trip status → `completed`, vehicle and driver both → `available` → Display: dashboard KPIs (Active Trips, Available Vehicles, Drivers On Duty) update on next render.

**Maintenance:**
Input: Fleet Manager selects a vehicle, enters a description and cost in "New Maintenance Record" → Processing: `openMaintenance` Server Action calls `open_maintenance` RPC → Output: log row inserted, vehicle status → `in_shop` → Display: vehicle disappears from the "available" dropdown on the trip form immediately, dashboard "Vehicles in Maintenance" KPI increments. Closing it reverses the same path through `close_maintenance`.

**Dashboard:**
Input: none (page load) → Processing: Server Component runs several `count()` / `select()` queries against Supabase directly (no Server Action needed for reads) — count vehicles by status, count trips by status, count drivers by status, compute `utilization = on_trip_vehicles / total_active_vehicles` → Output: plain numbers → Display: KPI cards render server-side, so the dashboard is correct on first paint with no client-side loading spinner needed.
