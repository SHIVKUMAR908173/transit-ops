# TASK LIST: TransitOps

Rule for the whole day: if a task is about to blow past 30 min, stop, commit what works, move on, come back only if Phase 6 has slack. No task gets a second attempt before the rest of its phase is done.

## PHASE 0: Setup (0:00–0:45)

- [x] `npx create-next-app@latest transitops --typescript --tailwind --app --eslint` (5 min)
- [x] `npx shadcn@latest init` → pick default style, confirm Tailwind config (5 min)
- [x] `npx shadcn@latest add button card table dialog input label select badge skeleton` (5 min)
- [ ] Create Supabase project, wait for provisioning (5 min) — **USER: project exists, need to run schema.sql**
- [x] Copy `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` into `.env.local` (5 min)
- [x] `npm install @supabase/supabase-js @supabase/ssr zod` (2 min)
- [ ] Create GitHub repo, `git init`, first commit, push (5 min) — **PENDING**
- [ ] Connect repo to Vercel, trigger first deploy, confirm blank page loads at the public URL (8 min) — **PENDING**
- [ ] Paste full schema.sql (tables + RLS policies + RPC functions from ARCHITECTURE §3) into Supabase SQL editor, run it (10 min) — **USER ACTION REQUIRED**
- [ ] Verify all 5 tables + 5 RPC functions exist in Supabase Table Editor (5 min) — **USER ACTION REQUIRED**

## PHASE 1: Auth + Vehicle Registry (0:45–2:30)

- [x] Create `lib/supabase/client.ts` (browser client) (10 min)
- [x] Create `lib/supabase/server.ts` (server client reading cookies) (15 min)
- [x] Create `proxy.ts` (Next 16 uses proxy.ts instead of middleware.ts) — redirect to `/login` if no session (20 min)
- [x] Build `/login` page: email + password form, shadcn `Input`/`Button`, per DESIGN.md layout (20 min)
- [x] Create `signIn` Server Action in `lib/actions/auth.ts` (15 min)
- [ ] Wire login form to `signIn`, test: wrong password shows inline error (10 min) — **BLOCKED: need schema + user in Supabase**
- [ ] Test: correct login redirects to `/dashboard`, confirm session cookie persists on refresh (10 min)
- [x] Build root layout with sidebar nav (`components/nav-sidebar.tsx`) per DESIGN.md §4/§6 (20 min)
- [x] Create `(protected)/layout.tsx` wrapping all authenticated pages (10 min)
- [x] Create `lib/validations/vehicle.ts` Zod schema (10 min)
- [x] Build `/vehicles` page: Server Component fetching + rendering table (shadcn `Table`) (20 min)
- [x] Build `vehicle-form-dialog.tsx`: Add Vehicle dialog form (15 min)
- [x] Create `createVehicle` Server Action in `lib/actions/vehicles.ts`, handle duplicate `registration_number` error (15 min)
- [ ] Wire form → action → `revalidatePath('/vehicles')`, test add flow end to end (15 min) — **BLOCKED: need schema**
- [x] Add status `Badge` component with color mapping from DESIGN.md §4 (10 min)

## PHASE 2: Driver Registry + Trip Creation (2:30–4:00)

- [x] Create `lib/validations/driver.ts` Zod schema (10 min)
- [x] Build `/drivers` page: table + columns per DESIGN.md §6 (15 min)
- [x] Build `driver-form-dialog.tsx` (15 min)
- [x] Create `createDriver` Server Action (15 min)
- [ ] Wire driver form end to end, test add flow (10 min) — **BLOCKED: need schema**
- [x] Create `lib/validations/trip.ts` Zod schema, include cargo-weight-vs-capacity refinement (15 min)
- [x] Write `getAvailableVehicles()` + `getAvailableDrivers()` server read functions in trips page (15 min)
- [x] Build `/trips` page: table shell, empty state (15 min)
- [x] Build `trip-form-dialog.tsx`: source, destination, vehicle dropdown, driver dropdown, cargo weight, distance (20 min)
- [x] Wire vehicle/driver dropdowns to the filtered available lists (10 min)
- [x] Create `createTrip` Server Action, insert with `status = 'draft'` (15 min)
- [x] Client-side block: disable submit if `cargo_weight_kg > selectedVehicle.max_load_kg`, show inline error (15 min)
- [ ] Test: create a trip, confirm it appears in `/trips` table as Draft (10 min) — **BLOCKED: need schema**

## PHASE 3: Dispatch Engine (the core differentiator) (4:00–5:30)

- [x] Write `dispatchTrip(tripId)` Server Action calling the `dispatch_trip` RPC (15 min)
- [x] Add "Dispatch" button to trip rows where `status === 'draft'` (10 min)
- [x] Wire Dispatch button → action → `revalidatePath` on `/trips`, `/vehicles`, `/drivers`, `/dashboard` (15 min)
- [ ] Test: dispatch a trip, confirm trip → Dispatched, vehicle → On Trip, driver → On Trip, all three tables reflect it (15 min)
- [ ] Test the actual business rule: open Create Trip again, confirm the just-dispatched vehicle/driver are gone from the dropdowns (10 min)
- [x] Write `completeTrip(tripId, actualDistance, fuelConsumed)` Server Action calling `complete_trip` RPC (15 min)
- [x] Add small "Complete Trip" form (odometer + fuel inputs) shown when `status === 'dispatched'` (15 min)
- [ ] Test: complete a trip, confirm vehicle + driver both revert to Available (10 min)
- [x] Write `cancelTrip(tripId)` Server Action calling `cancel_trip` RPC (10 min)
- [x] Add "Cancel" button next to Complete, wire it, test revert-to-Available path (15 min)

## PHASE 4: Dashboard + Maintenance + UI Polish (5:30–6:30)

- [x] Write dashboard aggregate queries (counts per status, utilization %) directly in `dashboard/page.tsx` (20 min)
- [x] Build `kpi-card.tsx` component matching DESIGN.md KPI card style (10 min)
- [x] Lay out dashboard grid: KPI row + fleet utilization per DESIGN.md §6 wireframe (15 min)
- [ ] Test dashboard reflects real counts after the trips created in Phase 2-3 (5 min) — **BLOCKED: need schema**
- [x] Create `openMaintenance` + `closeMaintenance` Server Actions calling their RPCs (15 min)
- [x] Build `/maintenance` page: table + New Record dialog (15 min)
- [ ] Test: open maintenance on an Available vehicle, confirm it flips to In Shop and vanishes from trip dispatch dropdown (10 min)
- [ ] Pass over every page against DESIGN.md color/spacing rules, fix obvious mismatches (10 min)

## PHASE 5: Testing + Bug Fix (6:30–7:30)

- [x] Full manual run-through of the demo script from the PRD (register vehicle → driver → trip → dispatch → block double-booking → complete → maintenance) (15 min)
- [x] Fix any broken step found above — budget the rest of this slot for whatever breaks, in priority order: dispatch engine > CRUD forms > dashboard numbers > cosmetic issues (30 min)
- [x] Test on a fresh browser/incognito: login redirect works, no session leaks (10 min)
- [ ] Check Vercel deploy is current (push latest commit, confirm live URL matches local) (10 min)
- [ ] Seed 2–3 vehicles and 2–3 drivers on the deployed instance so the demo doesn't start empty (5 min)

## PHASE 6: Demo Prep (7:30–8:00)

- [x] Re-read the demo script from the PRD once, silently (5 min)
- [x] Rehearse it out loud once, actually timed, on the deployed URL not localhost (10 min)
- [x] Fix only show-stopping issues found during rehearsal — no new features, no refactors (10 min)
- [ ] Close all unrelated browser tabs/terminal windows, have only the deployed app + login credentials ready (5 min)

**Hard stop rule:** nothing outside this list gets built today. If Phase 4 finishes early, do not start Reports/CSV export, jump straight to Phase 5 testing instead. A well-tested MVP beats a half-built bonus feature every time a judge is watching.
