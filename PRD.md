# PRD: TransitOps

## 1. Overview

**Problem.** Transport and logistics companies still run vehicle, driver, and trip operations on spreadsheets and paper logbooks. This causes double-booked vehicles, drivers dispatched with expired licenses, cargo overloads, missed maintenance windows, and zero real-time visibility into fleet status. Nobody catches these issues until they've already become operational failures or safety incidents.

**Solution.** TransitOps is a centralized web platform that digitizes the full transport operations lifecycle: vehicle registry, driver management, trip dispatch, and maintenance tracking. The core value is not just data entry, it's that the system enforces business rules automatically. A vehicle in the shop cannot be dispatched. A driver with an expired license cannot be assigned. Cargo exceeding capacity cannot be dispatched. Status transitions (Available → On Trip → Available, or → In Shop) happen automatically instead of relying on a human to remember and update them.

**Success criteria.** By end of the 8-hour build:
- A user can register a vehicle and a driver, create a trip, dispatch it, and complete it, with all status transitions happening automatically and correctly.
- At least one hard business rule (double-booking prevention) is demonstrably enforced live, not just described.
- The dashboard reflects real-time counts pulled from the database, not hardcoded values.
- The app is deployed and reachable at a public URL for judges to test.

## 2. User Personas

**Primary user: Fleet Manager**
- **Role:** Oversees a fleet of 10-50 vehicles and their drivers at a logistics company.
- **Pain:** Currently tracks vehicle status, driver availability, and trip assignments across spreadsheets. Finds out about conflicts (double-booked truck, expired license used anyway) after the fact, not before dispatch.
- **Goal:** Wants one screen showing what's happening right now, and wants the system to physically prevent an invalid dispatch rather than trust someone to catch it manually.

*Secondary personas (Driver, Safety Officer, Financial Analyst) exist in the problem statement but are represented only as a role label in this build, not as separate permission systems or dashboards. See Out of Scope.*

## 3. Features

### MVP Features

**F1. Authentication**
- Behavior: Email/password login via Supabase Auth. Unauthenticated users are redirected to `/login`. A role field (Fleet Manager, Driver, Safety Officer, Financial Analyst) is stored and displayed as a badge but does not gate access to pages or data.
- Acceptance criteria:
  - Cannot reach any app page without a valid session.
  - Login with valid credentials redirects to `/dashboard`.
  - Login with invalid credentials shows an inline error, no crash.

**F2. Vehicle Registry**
- Behavior: CRUD for vehicles with registration number (unique), name/model, type, max load capacity, odometer, acquisition cost, and status.
- Acceptance criteria:
  - Attempting to save a duplicate registration number is rejected with a visible error.
  - New vehicle defaults to status Available.
  - Vehicle list updates immediately after add/edit without a manual page refresh.

**F3. Driver Management**
- Behavior: CRUD for drivers with name, license number, license category, license expiry date, contact number, safety score, and status.
- Acceptance criteria:
  - New driver defaults to status Available.
  - License expiry date is stored and used by the trip dispatch validation (F4).
  - Driver list updates immediately after add/edit.

**F4. Trip Management and Dispatch Engine**
- Behavior: Create a trip by selecting source, destination, an available vehicle, an available driver, cargo weight, and planned distance. Trip lifecycle: Draft → Dispatched → Completed → Cancelled. Dispatching a trip sets both vehicle and driver status to On Trip; completing or cancelling a dispatched trip reverts both to Available.
- Acceptance criteria:
  - Vehicle dropdown only lists vehicles with status = Available.
  - Driver dropdown only lists drivers with status = Available and license_expiry in the future and status ≠ Suspended.
  - A trip with cargo_weight > vehicle.max_load_kg cannot be dispatched; the UI blocks it and shows why.
  - On dispatch, vehicle.status and driver.status flip to On Trip in the same transaction (no partial state possible).
  - On complete or cancel, vehicle.status and driver.status revert to Available in the same transaction.
  - A vehicle or driver already On Trip never appears as selectable for a second trip.

**F5. Dashboard**
- Behavior: Displays KPIs, Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %, computed live from the database.
- Acceptance criteria:
  - All KPI numbers are queried, not hardcoded.
  - Numbers change immediately after a dispatch, completion, or maintenance action elsewhere in the app.

### Bonus Features
*(build only if MVP is fully working and demoed before attempting)*

- **Maintenance workflow:** Create a maintenance record for a vehicle, which auto-sets vehicle status to In Shop and removes it from the dispatch pool; closing the record restores it to Available (unless retired).
- **Fuel & expense logging:** Record fuel logs (liters, cost, date) and misc expenses, with a computed total operational cost (fuel + maintenance) per vehicle.

### Out of Scope
*(explicitly not built in this 8-hour cycle, stated here so nobody re-litigates it mid-build)*

- **True role-based access control.** Four roles exist as a display label/badge only. No page or query is actually restricted by role. Real RBAC (route guards, row-level permission checks per role) is a multi-hour investment this build doesn't have.
- **Reports & analytics module.** Fuel efficiency, Vehicle ROI, CSV/PDF export, and charts are explicitly marked optional in the source problem statement and are cut entirely.
- **Everything under "bonus features" in the original spec beyond what's listed above:** email reminders for expiring licenses, vehicle document management, search/filter/sort polish, dark mode. None of these affect whether the core dispatch loop works, so none of them get build time.

## 4. Non-Functional Requirements

- **Performance:** Dashboard and list pages should load in under 2 seconds on a typical connection. No requirement is placed on handling large-scale data volumes since seed data is a handful of vehicles/drivers/trips for demo purposes.
- **Security:** Supabase Auth handles credential storage; no passwords touch application code. Row Level Security is enabled on all tables with a permissive policy (`USING (true)`) for this build cycle, documented in the README as a known simplification, not a production posture.
- **Responsive:** Layout must be usable on a laptop screen (primary demo device). Mobile responsiveness is a nice-to-have, not a blocker, given the 8-hour window.
- **Reliability of state transitions:** Vehicle/driver status changes tied to trip dispatch, completion, and cancellation must happen atomically (single Postgres RPC/transaction), so a network blip never leaves a vehicle marked On Trip while its driver reverts to Available, or vice versa.

## 5. Constraints

- **Time:** 8-hour hackathon window, hard stop. No feature work after hour 7; hour 7-8 is polish and demo rehearsal only.
- **Stack:** Next.js 14 (App Router), TailwindCSS, shadcn/ui, Supabase (Auth + Postgres), deployed on Vercel.
- **Team size / experience:** Built by a solo beginner using Claude Code as the primary implementation tool. Scope decisions above (fake RBAC, permissive RLS, cut reporting module) are set specifically to keep the build achievable at this experience level within the time box, not because the excluded features are unimportant.
