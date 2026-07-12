-- Drop old functions & triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS close_maintenance(uuid);
DROP FUNCTION IF EXISTS open_maintenance(uuid, text, numeric);
DROP FUNCTION IF EXISTS cancel_trip(uuid);
DROP FUNCTION IF EXISTS complete_trip(uuid, numeric, numeric);
DROP FUNCTION IF EXISTS dispatch_trip(uuid);
DROP FUNCTION IF EXISTS auth_role();

-- Drop old tables (starting fresh for MVP rebuild)
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS fuel_logs CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Drop old types
DROP TYPE IF EXISTS maintenance_status CASCADE;
DROP TYPE IF EXISTS trip_status CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;
DROP TYPE IF EXISTS vehicle_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS fuel_log_type CASCADE;

-- Create ENUMs (Lowercase to match frontend types exactly)
CREATE TYPE user_role AS ENUM ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst');
CREATE TYPE vehicle_status AS ENUM ('available', 'on_trip', 'in_shop', 'retired');
CREATE TYPE driver_status AS ENUM ('available', 'on_trip', 'off_duty', 'suspended');
CREATE TYPE trip_status AS ENUM ('draft', 'dispatched', 'completed', 'cancelled');
CREATE TYPE maintenance_status AS ENUM ('active', 'closed');
CREATE TYPE fuel_log_type AS ENUM ('fuel', 'toll', 'misc');

-- 1. VEHICLES
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  max_load_kg numeric NOT NULL,
  odometer numeric DEFAULT 0,
  acquisition_cost numeric,
  status vehicle_status NOT NULL DEFAULT 'available',
  region text,
  created_at timestamptz DEFAULT now()
);

-- 2. DRIVERS
CREATE TABLE drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text UNIQUE NOT NULL,
  license_category text,
  license_expiry date NOT NULL,
  contact_number text,
  safety_score numeric DEFAULT 100,
  status driver_status NOT NULL DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);

-- 3. TRIPS
CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  destination text NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) NOT NULL,
  driver_id uuid REFERENCES drivers(id) NOT NULL,
  cargo_weight_kg numeric NOT NULL,
  planned_distance_km numeric,
  actual_distance_km numeric,
  fuel_consumed_l numeric,
  revenue numeric,
  status trip_status NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 4. MAINTENANCE LOGS
CREATE TABLE maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) NOT NULL,
  description text NOT NULL,
  cost numeric,
  status maintenance_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- 5. FUEL & EXPENSES (Unified as per existing frontend types)
CREATE TABLE fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) NOT NULL,
  trip_id uuid REFERENCES trips(id),
  type fuel_log_type NOT NULL DEFAULT 'fuel',
  liters numeric,
  cost numeric NOT NULL,
  log_date date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- 6. USER PROFILES
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  contact_number text,
  role user_role NOT NULL DEFAULT 'fleet_manager',
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- DATABASE TRIGGERS (BUSINESS RULES)
-- ==========================================

-- A. Dispatch validation (Weight, Availability, License)
CREATE OR REPLACE FUNCTION check_trip_dispatch()
RETURNS trigger AS $$
DECLARE
  v_max_load numeric;
  v_vehicle_status vehicle_status;
  v_driver_status driver_status;
  d_expiry date;
BEGIN
  IF NEW.status = 'dispatched' AND OLD.status != 'dispatched' THEN
    
    -- Cargo Weight limit
    SELECT max_load_kg, status INTO v_max_load, v_vehicle_status
    FROM vehicles WHERE id = NEW.vehicle_id;
    
    IF NEW.cargo_weight_kg > v_max_load THEN
      RAISE EXCEPTION 'Cargo weight (%) exceeds vehicle maximum capacity (%)', NEW.cargo_weight_kg, v_max_load;
    END IF;

    -- Vehicle availability
    IF v_vehicle_status != 'available' THEN
      RAISE EXCEPTION 'Cannot dispatch. Vehicle is currently %', v_vehicle_status;
    END IF;

    -- Driver availability and license
    SELECT status, license_expiry INTO v_driver_status, d_expiry
    FROM drivers WHERE id = NEW.driver_id;

    IF v_driver_status != 'available' THEN
      RAISE EXCEPTION 'Cannot dispatch. Driver is currently %', v_driver_status;
    END IF;

    IF d_expiry < CURRENT_DATE THEN
      RAISE EXCEPTION 'Cannot dispatch. Driver license has expired on %', d_expiry;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_trip_dispatch
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE PROCEDURE check_trip_dispatch();

-- B. Auto-state transitions (Trip Dispatch/Complete/Cancel)
CREATE OR REPLACE FUNCTION sync_trip_status()
RETURNS trigger AS $$
BEGIN
  -- When dispatched
  IF NEW.status = 'dispatched' AND OLD.status != 'dispatched' THEN
    UPDATE vehicles SET status = 'on_trip' WHERE id = NEW.vehicle_id;
    UPDATE drivers SET status = 'on_trip' WHERE id = NEW.driver_id;
  END IF;

  -- When completed or cancelled
  IF (NEW.status = 'completed' OR NEW.status = 'cancelled') AND OLD.status = 'dispatched' THEN
    UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
    UPDATE drivers SET status = 'available' WHERE id = NEW.driver_id;
    
    IF NEW.status = 'completed' THEN
       NEW.completed_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_trip_status
  AFTER UPDATE ON trips
  FOR EACH ROW EXECUTE PROCEDURE sync_trip_status();

-- C. Maintenance sync (In Shop / Available)
CREATE OR REPLACE FUNCTION sync_maintenance_status()
RETURNS trigger AS $$
DECLARE
  v_current_vehicle_status vehicle_status;
BEGIN
  -- Active maintenance = In Shop
  IF NEW.status = 'active' THEN
    UPDATE vehicles SET status = 'in_shop' WHERE id = NEW.vehicle_id;
  END IF;
  
  -- Closed maintenance = Available (if not retired)
  IF NEW.status = 'closed' THEN
    IF TG_OP = 'UPDATE' AND OLD.status != 'closed' THEN
      NEW.closed_at = now();
    END IF;
    
    SELECT status INTO v_current_vehicle_status FROM vehicles WHERE id = NEW.vehicle_id;
    IF v_current_vehicle_status != 'retired' THEN
      UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_maintenance_status
  AFTER INSERT OR UPDATE ON maintenance_logs
  FOR EACH ROW EXECUTE PROCEDURE sync_maintenance_status();


-- ==========================================
-- COMPUTED VALUES (VIEWS & RPCs)
-- ==========================================

CREATE OR REPLACE VIEW v_vehicle_operational_costs AS
SELECT 
  v.id AS vehicle_id,
  COALESCE(SUM(ml.cost), 0) AS total_maintenance_cost,
  COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id), 0) AS total_fuel_cost,
  COALESCE(SUM(ml.cost), 0) + COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id), 0) AS total_operational_cost
FROM vehicles v
LEFT JOIN maintenance_logs ml ON v.id = ml.vehicle_id
GROUP BY v.id;

CREATE OR REPLACE VIEW v_fleet_fuel_efficiency AS
SELECT 
  SUM(actual_distance_km) AS total_distance,
  SUM(fuel_consumed_l) AS total_fuel,
  CASE WHEN SUM(fuel_consumed_l) > 0 THEN SUM(actual_distance_km) / SUM(fuel_consumed_l) ELSE 0 END AS avg_efficiency_km_per_l
FROM trips
WHERE status = 'completed';

CREATE OR REPLACE VIEW v_fleet_utilization AS
SELECT 
  CASE WHEN (SELECT COUNT(*) FROM vehicles WHERE status != 'retired') = 0 THEN 0
  ELSE
    ((SELECT COUNT(*) FROM vehicles WHERE status = 'on_trip')::numeric / 
    (SELECT COUNT(*) FROM vehicles WHERE status != 'retired')::numeric) * 100 
  END AS utilization_pct;

CREATE OR REPLACE FUNCTION get_vehicle_roi(v_id uuid)
RETURNS numeric AS $$
DECLARE
  v_revenue numeric;
  v_cost numeric;
  v_acq_cost numeric;
BEGIN
  SELECT SUM(revenue) INTO v_revenue FROM trips WHERE vehicle_id = v_id AND status = 'completed';
  SELECT total_operational_cost INTO v_cost FROM v_vehicle_operational_costs WHERE vehicle_id = v_id;
  SELECT acquisition_cost INTO v_acq_cost FROM vehicles WHERE id = v_id;
  
  IF v_acq_cost IS NULL OR v_acq_cost = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ((COALESCE(v_revenue, 0) - COALESCE(v_cost, 0)) / v_acq_cost) * 100;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- ROW LEVEL SECURITY (RBAC)
-- ==========================================

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Auto create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (new.id, new.email, 'fleet_manager')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RBAC Helper
CREATE OR REPLACE FUNCTION auth_role() RETURNS user_role AS $$
  SELECT COALESCE(
    (SELECT role FROM user_profiles WHERE id = auth.uid()),
    'fleet_manager'::user_role
  );
$$ LANGUAGE sql STABLE;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Profiles read access" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles update own" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Vehicles: Fleet Manager (ALL), Drivers/Safety Officer/Analyst (SELECT)
CREATE POLICY "Vehicles select" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Vehicles fleet manager all" ON vehicles TO authenticated USING (auth_role() = 'fleet_manager');

-- Drivers: Safety Officer & Fleet Manager (ALL), Drivers/Analyst (SELECT)
CREATE POLICY "Drivers select" ON drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers admin all" ON drivers TO authenticated USING (auth_role() IN ('fleet_manager', 'safety_officer'));

-- Trips: Fleet Manager (ALL), Driver (INSERT, UPDATE own), Safety/Analyst (SELECT)
CREATE POLICY "Trips select" ON trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Trips manager all" ON trips TO authenticated USING (auth_role() = 'fleet_manager');
CREATE POLICY "Trips driver insert" ON trips FOR INSERT TO authenticated WITH CHECK (auth_role() = 'driver');
CREATE POLICY "Trips driver update" ON trips FOR UPDATE TO authenticated USING (auth_role() = 'driver');

-- Maintenance: Fleet Manager (ALL), Others (SELECT)
CREATE POLICY "Maintenance select" ON maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Maintenance manager all" ON maintenance_logs TO authenticated USING (auth_role() = 'fleet_manager');

-- Fuel & Expenses: Fleet Manager (ALL), Others (SELECT)
CREATE POLICY "Fuel select" ON fuel_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fuel manager all" ON fuel_logs TO authenticated USING (auth_role() = 'fleet_manager');
