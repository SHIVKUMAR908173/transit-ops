# TransitOps

TransitOps is a centralized fleet operations web platform designed to digitize the full transport operations lifecycle: vehicle registry, driver management, trip dispatch, and maintenance tracking. Unlike static spreadsheets or paper logbooks, TransitOps automatically enforces business rules to prevent operational failures and safety incidents before they happen.

## Core Value Proposition

The core value of TransitOps lies in **automatic business rule enforcement**. The system acts as a digital guardrail, ensuring that:
- **No Double-Booking:** Vehicles and drivers already assigned to an active trip are excluded from dispatch options.
- **Safety Compliance:** Drivers with expired licenses or suspended statuses are blocked from being assigned to any trip.
- **Operational Safety:** Trips with cargo weight exceeding the selected vehicle's maximum load capacity cannot be dispatched.
- **Automated State Transitions:** Transitions (e.g., `Available` ↔ `On Trip` ↔ `In Shop`) occur atomically via database transactions to guarantee database integrity.

---

## Tech Stack & Architecture

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database & Authentication:** [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Row Level Security)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Validation:** [Zod](https://zod.dev/)
- **Deployment:** [Vercel](https://vercel.com/)

### Project Architecture & Folder Structure

TransitOps utilizes **Next.js Server Components** for reading data directly from Supabase and **Server Actions** for all mutation operations. This eliminates the need for a separate REST API layer.

```
transitops/
├── app/
│   ├── login/page.tsx              # Public login screen
│   ├── (protected)/                # Protected layout checking session state
│   │   ├── layout.tsx              # Global layout with session gate
│   │   ├── dashboard/page.tsx      # Real-time operational KPI counters
│   │   ├── vehicles/               # Vehicle Registry grid and form
│   │   ├── drivers/                # Driver Directory and form
│   │   ├── trips/                  # Trip Manager and Dispatch panel
│   │   └── maintenance/            # Vehicle maintenance logs
│   ├── layout.tsx                  # Root HTML shell
│   └── globals.css                 # Base styles and Tailwind configuration
├── components/
│   ├── ui/                         # shadcn-generated primitive UI components
│   ├── nav-sidebar.tsx             # Main navigation layout
│   ├── kpi-card.tsx                # Reusable dashboard metric card
│   └── status-badge.tsx            # Pill component matching design constraints
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client for real-time features
│   │   └── server.ts               # Cookie-based Server client
│   ├── actions/                    # Server Actions for mutations
│   │   ├── vehicles.ts
│   │   ├── drivers.ts
│   │   ├── trips.ts
│   │   ├── maintenance.ts
│   │   └── auth.ts
│   ├── validations/                # Shared Zod validation schemas
│   └── types.ts                    # TypeScript types reflecting the schema
└── supabase/
    └── schema.sql                  # Database table definitions and RPC functions
```

---

## Database Design & SQL Engine

The application states are managed using five key PostgreSQL tables and five RPC functions which execute state changes atomically (avoiding partial/corrupted states if a network error occurs).

### Core Tables
1. **`vehicles`**: Tracks registration numbers, model details, odometer, load capacity, and status (`available`, `on_trip`, `in_shop`, `retired`).
2. **`drivers`**: Stores names, license numbers, category, expiry dates, safety scores, and status (`available`, `on_trip`, `off_duty`, `suspended`).
3. **`trips`**: Manages dispatch logs, source, destination, weights, distances, and status (`draft`, `dispatched`, `completed`, `cancelled`).
4. **`maintenance_logs`**: Tracks vehicle service dates, costs, descriptions, and status (`active`, `closed`).
5. **`fuel_logs`**: Logs fuel purchases and miscellaneous operational costs per vehicle.

### Atomic RPC Functions (State Transitions)
- `dispatch_trip(trip_id)`: Transitions trip to `dispatched` and sets both associated driver and vehicle to `on_trip` inside a single transaction.
- `complete_trip(trip_id, actual_distance, fuel_consumed)`: Marks trip `completed`, records distance/fuel, and resets driver and vehicle to `available`.
- `cancel_trip(trip_id)`: Marks trip `cancelled` and resets driver and vehicle to `available`.
- `open_maintenance(vehicle_id, description)`: Logs a service event and locks the vehicle status to `in_shop`.
- `close_maintenance(log_id, final_cost)`: Closes the log and returns the vehicle to `available`.

---

## Design System & UX Rules

TransitOps prioritizes usability and clean, zero-distraction visual design inspired by professional telematics systems:
- **Theme:** High-contrast minimalist theme. Neutral white backgrounds, pure dark gray (`gray-900`) text, and thin hairline borders (`gray-200`). No complex shadows, gradients, or glassmorphism.
- **Single Accent Color (Emerald):** Emerald green is reserved strictly for positive/active/safe states (e.g., `available`, `completed`).
- **Semantic Indicators:** Amber/Orange indicates in-transit or transitional states (e.g., `on_trip`, `draft`). Red indicates blocked or warning states (e.g., `suspended`, `in_shop`, `cancelled`, expired licenses).
- **Layout:** Fixed width sidebar (`w-56`) with simple active navigation states.

---

## Getting Started

### Prerequisites
- Node.js 20.x or 22.x LTS
- A Supabase Project (Postgres Database + Auth enabled)

### Local Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Manthan-Darji/TransitOps.git
   cd TransitOps
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

4. **Initialize Database Schema:**
   Copy the contents of `supabase/schema.sql` and run them within the **SQL Editor** of your Supabase dashboard.

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## License

This project is prepared and developed during a hackathon cycle.
