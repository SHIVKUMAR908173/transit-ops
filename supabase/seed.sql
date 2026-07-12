-- TransitOps Dummy Data Seed
-- Run this in the Supabase SQL editor to populate your database with fake data

-- Ensure the revenue column exists (in case you created the tables before the schema was updated)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS revenue numeric;

-- 1. Insert Dummy Vehicles
INSERT INTO vehicles (registration_number, name, type, max_load_kg, odometer, acquisition_cost, status) VALUES
('TRK-001', 'Volvo FH16', 'Heavy Truck', 25000, 120500, 150000, 'available'),
('TRK-002', 'Scania R500', 'Heavy Truck', 24000, 85000, 140000, 'available'),
('VAN-001', 'Ford Transit', 'Light Van', 3500, 45000, 45000, 'on_trip'),
('TRK-003', 'Mercedes Actros', 'Heavy Truck', 26000, 210000, 160000, 'in_shop'),
('VAN-002', 'Mercedes Sprinter', 'Light Van', 3500, 15000, 50000, 'available');

-- 2. Insert Dummy Drivers
INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES
('John Doe', 'LIC-1001', 'Heavy', '2028-12-31', '+1-555-0101', 98, 'available'),
('Jane Smith', 'LIC-1002', 'Heavy', '2027-06-15', '+1-555-0102', 95, 'available'),
('Mike Johnson', 'LIC-1003', 'Light', '2025-03-20', '+1-555-0103', 88, 'on_trip'),
('Emily Davis', 'LIC-1004', 'Heavy', '2029-01-10', '+1-555-0104', 100, 'available'),
('Robert Wilson', 'LIC-1005', 'Light', '2024-11-05', '+1-555-0105', 75, 'suspended');

-- 3. Insert Dummy Trips (using subqueries to fetch uuids based on above records)
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, actual_distance_km, fuel_consumed_l, revenue, status)
VALUES
('New York, NY', 'Boston, MA', (SELECT id FROM vehicles WHERE registration_number = 'VAN-001'), (SELECT id FROM drivers WHERE license_number = 'LIC-1003'), 2000, 350, NULL, NULL, 800, 'dispatched'),
('Chicago, IL', 'Detroit, MI', (SELECT id FROM vehicles WHERE registration_number = 'TRK-001'), (SELECT id FROM drivers WHERE license_number = 'LIC-1001'), 22000, 450, 460, 120, 2500, 'completed'),
('Los Angeles, CA', 'San Francisco, CA', (SELECT id FROM vehicles WHERE registration_number = 'TRK-002'), (SELECT id FROM drivers WHERE license_number = 'LIC-1002'), 18000, 600, 615, 180, 3200, 'completed');

-- 4. Insert Dummy Maintenance Logs
INSERT INTO maintenance_logs (vehicle_id, description, cost, status)
VALUES
((SELECT id FROM vehicles WHERE registration_number = 'TRK-003'), 'Engine overhaul and oil change', 2500, 'active'),
((SELECT id FROM vehicles WHERE registration_number = 'TRK-001'), 'Replaced brake pads', 450, 'closed');

-- 5. Insert Dummy Fuel Logs
INSERT INTO fuel_logs (vehicle_id, trip_id, type, liters, cost, log_date)
VALUES
((SELECT id FROM vehicles WHERE registration_number = 'TRK-001'), (SELECT id FROM trips WHERE source = 'Chicago, IL' LIMIT 1), 'fuel', 120, 400, CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM vehicles WHERE registration_number = 'TRK-002'), (SELECT id FROM trips WHERE source = 'Los Angeles, CA' LIMIT 1), 'fuel', 180, 650, CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM vehicles WHERE registration_number = 'VAN-001'), NULL, 'misc', NULL, 50, CURRENT_DATE);
