# DESIGN DOCUMENT: TransitOps

## 1. Visual Direction

**Style.** Clean, data-dense fleet-operations dashboard. White surfaces, black text, one green accent used sparingly for active/positive states, hairline gray borders instead of shadows to separate cards. Sidebar nav on the left, KPI cards up top, tables below. This mirrors the Fleetio reference directly: it's enterprise software a Fleet Manager stares at all shift, not a marketing page. Boring is correct here. Legibility and scanability beat personality.

**What to avoid.**
- No dark-mode-by-default, no gradients, no glassmorphism, no card shadows heavier than a 1px border.
- No decorative illustrations or hero imagery, this is a tool, not a landing page.
- No color-cycling KPI cards (rainbow dashboard syndrome), stick to black/gray for neutral numbers and reserve the accent color for one meaning only: "good/active state."
- Do not build the social layer visible in the Fleetio screenshot (Recent Comments, avatars, attachments). Not in your spec, cut entirely.

## 2. Color Palette (Tailwind classes)

| Role | Tailwind class | Hex | Usage |
|---|---|---|---|
| Background | `bg-gray-50` | `#F9FAFB` | page background behind cards |
| Surface | `bg-white` | `#FFFFFF` | cards, sidebar, table rows |
| Primary (CTA / active nav) | `bg-gray-900` | `#111827` | primary buttons, active sidebar item |
| Text main | `text-gray-900` | `#111827` | headings, KPI numbers |
| Text muted | `text-gray-500` | `#6B7280` | labels, subtext, table secondary columns |
| Border | `border-gray-200` | `#E5E7EB` | card borders, table dividers, input borders |
| Accent | `text-emerald-600` / `bg-emerald-600` | `#059669` | "Available" status, positive KPI deltas, active nav highlight background at `bg-emerald-50` |
| Danger | `text-red-600` / `bg-red-50` | `#DC2626` / `#FEF2F2` | "Suspended", "Retired", expired license, overloaded cargo error |
| Warning | `text-amber-600` / `bg-amber-50` | `#D97706` / `#FFFBEB` | "In Shop", "On Trip" (transitional, not bad, not idle) |

Status badge color mapping (used everywhere a vehicle/driver/trip status appears):
- Available → emerald
- On Trip → amber
- In Shop / Suspended / Cancelled → red
- Completed / Retired → gray

## 3. Typography

- **Heading font:** Inter (Google Fonts), weights 500/600. Same as body, differentiated by size/weight only, matches the Fleetio reference which doesn't use a separate display face.
- **Body font:** Inter, weights 400/500.
- **Load:** `next/font/google` — `import { Inter } from 'next/font/google'`, apply to `<html>` via className, no `<link>` tag needed.

**Type scale (Tailwind classes):**

| Use | Class |
|---|---|
| Page title ("Dashboard") | `text-2xl font-semibold text-gray-900` |
| Card title ("Service Reminders") | `text-sm font-medium text-gray-900` |
| KPI big number | `text-3xl font-semibold text-gray-900` |
| KPI sub-label (link-style, e.g. "Due Soon") | `text-xs text-gray-500 underline-offset-2` |
| Table header | `text-xs font-medium text-gray-500 uppercase tracking-wide` |
| Table cell | `text-sm text-gray-900` |
| Body / form label | `text-sm font-medium text-gray-700` |
| Muted helper text | `text-xs text-gray-500` |

## 4. Component Style Rules

**Buttons**
```
Primary:   bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 text-sm font-medium
Secondary: bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-md px-4 py-2 text-sm font-medium
Danger:    bg-red-600 text-white hover:bg-red-700 rounded-md px-4 py-2 text-sm font-medium
Disabled:  opacity-50 cursor-not-allowed (apply alongside the above)
```

**Cards** (KPI cards, form containers)
```
bg-white border border-gray-200 rounded-lg p-5 shadow-none
```

**Inputs** (shadcn `Input`, `Select`)
```
border border-gray-200 rounded-md px-3 py-2 text-sm
focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
```

**Sidebar nav**
```
Container:    bg-white border-r border-gray-200 w-56 h-screen flex flex-col
Nav item:     flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50
Active item:  bg-gray-900 text-white  (matches Fleetio's black active-pill on "Dashboard")
```

**Badges** (status pills — shadcn `Badge`, customized)
```
Available:  bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium
On Trip:    bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium
In Shop:    bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5 text-xs font-medium
Retired:    bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5 text-xs font-medium
```

**Tables** (shadcn `Table`)
```
Wrapper: border border-gray-200 rounded-lg overflow-hidden
Header row: bg-gray-50 border-b border-gray-200
Body row: border-b border-gray-100 last:border-0 hover:bg-gray-50
Cell padding: px-4 py-3
```

## 5. Layout Rules

- **Max width:** content area `max-w-[1400px] mx-auto`, matches a dashboard meant to fill a laptop/desktop screen, not a centered marketing column.
- **Sidebar:** fixed `w-56`, content area is `flex-1` with `px-8 py-6`.
- **Spacing rhythm:** base unit 4px (Tailwind default). Cards use `gap-6` between them, `p-5` internal padding. Sections stack with `space-y-6`.
- **Grid:**
  - Dashboard KPI row: `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6`
  - Two-column detail sections (e.g. Equipment Status + All Faults style pairing): `grid grid-cols-1 md:grid-cols-2 gap-6`
  - Tables: full width within content area, no grid needed.

## 6. Pages & Layout Wireframe

**`/login`**
```
┌─────────────────────────────────┐
│         (centered, max-w-sm)     │
│   TransitOps                     │
│   [ Email input          ]       │
│   [ Password input       ]       │
│   [ Sign in — primary btn]       │
│   error text if any, text-red-600│
└─────────────────────────────────┘
```

**`/dashboard`**
```
┌ Sidebar ┬───────────────────────────────────────────┐
│ Logo    │ Welcome back, [Name]                       │
│ Nav:    │ Fleet operations at a glance.               │
│ Dashboard (active, black pill)                        │
│ Vehicles│ ┌─KPI─┐ ┌─KPI─┐ ┌─KPI─┐ ┌─KPI─┐             │
│ Drivers │ │Active│ │Avail │ │In   │ │Active│           │
│ Trips   │ │206  │ │13   │ │Shop 6│ │Trips 4│           │
│ Maint.  │ └─────┘ └─────┘ └─────┘ └─────┘             │
│         │ ┌────────────┐ ┌────────────┐               │
│ Settings│ │Pending Trips│ │Drivers On  │               │
│ (bottom)│ │    9        │ │Duty   11   │               │
│         │ └────────────┘ └────────────┘               │
│         │ Fleet Utilization: 62%  (progress bar)       │
└─────────┴───────────────────────────────────────────┘
```
No chart in MVP (bonus feature). No "Recent Comments" panel, no attachments, not in spec.

**`/vehicles`**
```
┌ Sidebar ┬───────────────────────────────────────────┐
│         │ Vehicles                    [+ Add Vehicle]│
│         │ ┌───────────────────────────────────────┐ │
│         │ │ Reg No | Name | Type | Capacity | Status│ │
│         │ ├───────────────────────────────────────┤ │
│         │ │ GJ-05..| Van-05|Van  | 500kg   |[Avail] │ │
│         │ │ ...rows...                             │ │
│         │ └───────────────────────────────────────┘ │
└─────────┴───────────────────────────────────────────┘
```
"Add Vehicle" opens a shadcn `Dialog` with the form, not a separate page.

**`/drivers`** — identical structure to `/vehicles`, columns: Name, License No, Expiry, Safety Score, Status.

**`/trips`**
```
┌ Sidebar ┬───────────────────────────────────────────┐
│         │ Trips                       [+ Create Trip]│
│         │ ┌───────────────────────────────────────┐ │
│         │ │ Route | Vehicle | Driver | Cargo | Status││
│         │ ├───────────────────────────────────────┤ │
│         │ │ A→B  | Van-05  | Alex   | 450kg |[Draft]│ │
│         │ │        [Dispatch] [Complete] [Cancel]   │ │
│         │ └───────────────────────────────────────┘ │
└─────────┴───────────────────────────────────────────┘
```
Action buttons shown conditionally per row based on trip.status (Draft → show Dispatch; Dispatched → show Complete/Cancel; Completed/Cancelled → none).

**`/maintenance`**
```
┌ Sidebar ┬───────────────────────────────────────────┐
│         │ Maintenance              [+ New Record]    │
│         │ ┌───────────────────────────────────────┐ │
│         │ │ Vehicle | Description | Cost | Status   │ │
│         │ │ Van-05  | Oil Change  | ₹800 |[Active]  │ │
│         │ │                         [Close Record]  │ │
│         │ └───────────────────────────────────────┘ │
└─────────┴───────────────────────────────────────────┘
```

## 7. Motion & Animation

Keep this close to zero. This is operational software, not a portfolio piece.
- Dialog open/close: shadcn's default fade + scale (already built in, don't customize).
- Button hover: background color transition only, `transition-colors duration-150`.
- Table row hover: `transition-colors duration-100`.
- Status badge changes (e.g. after dispatch): no animation, just re-render with the new color. A flicker-free instant update reads as "the system is reliable," which matters more here than a nice transition.
- No page-transition animation between routes, no skeleton shimmer, use simple text "Loading…" or shadcn `Skeleton` blocks at most.

## 8. Do Not Do

1. **Do not add the comments/attachments/activity-feed panel from the Fleetio reference.** It's visually appealing but it's not in the PRD's feature list, adding it burns hours 6-8 you don't have.
2. **Do not use more than one accent color for "good" states.** Emerald means available/good, everywhere, consistently. Introducing blue or purple as a second "positive" color anywhere in the UI breaks the scanability that's the entire point of a status-driven dashboard.
3. **Do not reach for shadows, gradients, or rounded-2xl cards to make it "look more premium."** The reference achieves its professional feel through whitespace discipline and a 1px border system, not decoration. Matching that restraint is the actual design work here, adding polish effects on top will make it look like a template, not like Fleetio.
