// Vehicle status enum
export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";

// Driver status enum
export type DriverStatus = "available" | "on_trip" | "off_duty" | "suspended";

// Trip status enum
export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";

// Maintenance status enum
export type MaintenanceStatus = "active" | "closed";

// Fuel log type enum
export type FuelLogType = "fuel" | "toll" | "misc";

// Database row types
export interface Vehicle {
  id: string;
  registration_number: string;
  name: string;
  type: string;
  max_load_kg: number;
  odometer: number;
  acquisition_cost: number | null;
  status: VehicleStatus;
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string | null;
  license_expiry: string;
  contact_number: string | null;
  safety_score: number;
  status: DriverStatus;
  created_at: string;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight_kg: number;
  planned_distance_km: number | null;
  actual_distance_km: number | null;
  fuel_consumed_l: number | null;
  status: TripStatus;
  created_at: string;
  completed_at: string | null;
  // Joined fields (from queries with vehicle/driver names)
  vehicle?: Vehicle;
  driver?: Driver;
}

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  description: string;
  cost: number | null;
  status: MaintenanceStatus;
  created_at: string;
  closed_at: string | null;
  // Joined field
  vehicle?: Vehicle;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  trip_id: string | null;
  type: FuelLogType;
  liters: number | null;
  cost: number;
  log_date: string;
}

// Dashboard KPIs
export interface DashboardStats {
  activeVehicles: number;
  availableVehicles: number;
  inShop: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  utilizationPct: number;
}
