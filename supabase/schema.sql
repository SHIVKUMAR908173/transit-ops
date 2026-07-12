-- TransitOps Database Schema
-- Run this once in the Supabase SQL editor

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- VEHICLES
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  registration_number text unique not null,
  name text not null,
  type text not null,
  max_load_kg numeric not null,
  odometer numeric default 0,
  acquisition_cost numeric,
  status text not null default 'available'
    check (status in ('available', 'on_trip', 'in_shop', 'retired')),
  created_at timestamptz default now()
);

-- DRIVERS
create table drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  license_number text not null,
  license_category text,
  license_expiry date not null,
  contact_number text,
  safety_score numeric default 100,
  status text not null default 'available'
    check (status in ('available', 'on_trip', 'off_duty', 'suspended')),
  created_at timestamptz default now()
);

-- TRIPS
create table trips (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  destination text not null,
  vehicle_id uuid references vehicles(id) not null,
  driver_id uuid references drivers(id) not null,
  cargo_weight_kg numeric not null,
  planned_distance_km numeric,
  actual_distance_km numeric,
  fuel_consumed_l numeric,
  revenue numeric,
  status text not null default 'draft'
    check (status in ('draft', 'dispatched', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- MAINTENANCE LOGS
create table maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) not null,
  description text not null,
  cost numeric,
  status text not null default 'active'
    check (status in ('active', 'closed')),
  created_at timestamptz default now(),
  closed_at timestamptz
);

-- FUEL / EXPENSE LOGS
create table fuel_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) not null,
  trip_id uuid references trips(id),
  type text not null default 'fuel' check (type in ('fuel', 'toll', 'misc')),
  liters numeric,
  cost numeric not null,
  log_date date default current_date,
  created_at timestamptz default now()
);

-- RLS: enabled but permissive for the hackathon window
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table trips enable row level security;
alter table maintenance_logs enable row level security;
alter table fuel_logs enable row level security;

create policy "allow all authenticated" on vehicles for all using (true);
create policy "allow all authenticated" on drivers for all using (true);
create policy "allow all authenticated" on trips for all using (true);
create policy "allow all authenticated" on maintenance_logs for all using (true);
create policy "allow all authenticated" on fuel_logs for all using (true);

-- RPC: atomic dispatch (sets trip + vehicle + driver status together)
create or replace function dispatch_trip(trip_id uuid)
returns void as $$
declare
  v_vehicle_id uuid;
  v_driver_id uuid;
begin
  select vehicle_id, driver_id into v_vehicle_id, v_driver_id
  from trips where id = trip_id;

  update trips set status = 'dispatched' where id = trip_id;
  update vehicles set status = 'on_trip' where id = v_vehicle_id;
  update drivers set status = 'on_trip' where id = v_driver_id;
end;
$$ language plpgsql;

-- RPC: atomic complete
create or replace function complete_trip(trip_id uuid, p_actual_distance numeric, p_fuel_consumed numeric)
returns void as $$
declare
  v_vehicle_id uuid;
  v_driver_id uuid;
begin
  select vehicle_id, driver_id into v_vehicle_id, v_driver_id
  from trips where id = trip_id;

  update trips set status = 'completed', actual_distance_km = p_actual_distance,
    fuel_consumed_l = p_fuel_consumed, completed_at = now() where id = trip_id;
  update vehicles set status = 'available' where id = v_vehicle_id;
  update drivers set status = 'available' where id = v_driver_id;
end;
$$ language plpgsql;

-- RPC: atomic cancel (only valid from dispatched)
create or replace function cancel_trip(trip_id uuid)
returns void as $$
declare
  v_vehicle_id uuid;
  v_driver_id uuid;
begin
  select vehicle_id, driver_id into v_vehicle_id, v_driver_id
  from trips where id = trip_id;

  update trips set status = 'cancelled' where id = trip_id;
  update vehicles set status = 'available' where id = v_vehicle_id;
  update drivers set status = 'available' where id = v_driver_id;
end;
$$ language plpgsql;

-- RPC: maintenance open (flips vehicle to in_shop)
create or replace function open_maintenance(p_vehicle_id uuid, p_description text, p_cost numeric)
returns void as $$
begin
  insert into maintenance_logs (vehicle_id, description, cost)
  values (p_vehicle_id, p_description, p_cost);
  update vehicles set status = 'in_shop' where id = p_vehicle_id;
end;
$$ language plpgsql;

-- RPC: maintenance close (restores to available unless retired)
create or replace function close_maintenance(log_id uuid)
returns void as $$
declare
  v_vehicle_id uuid;
  v_current_status text;
begin
  select vehicle_id into v_vehicle_id from maintenance_logs where id = log_id;
  select status into v_current_status from vehicles where id = v_vehicle_id;

  update maintenance_logs set status = 'closed', closed_at = now() where id = log_id;

  if v_current_status != 'retired' then
    update vehicles set status = 'available' where id = v_vehicle_id;
  end if;
end;
$$ language plpgsql;

-- RBAC (User Profiles)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'fleet_manager'
    check (role in ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst')),
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;
create policy "allow all authenticated" on user_profiles for all using (true);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, role)
  values (new.id, new.email, 'fleet_manager'); -- Defaulting to fleet_manager for MVP
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to allow re-running
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
