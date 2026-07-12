-- TransitOps Test Dataset (PRD Example Workflow)
-- Run this in the Supabase SQL editor to populate your database with fake data

-- 1. Insert Dummy Vehicles
INSERT INTO vehicles (registration_number, name, type, max_load_kg, odometer, acquisition_cost, status) VALUES
('Van-05', 'Ford Transit', 'Light Van', 500, 45000, 45000, 'available'),
('TRK-001', 'Volvo FH16', 'Heavy Truck', 25000, 120500, 150000, 'available'),
('TRK-003', 'Mercedes Actros', 'Heavy Truck', 26000, 210000, 160000, 'in_shop');

-- 2. Insert Dummy Drivers
INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES
('Alex', 'LIC-ALEX-01', 'Light', '2028-12-31', '+1-555-ALEX', 98, 'available'),
('Robert Wilson', 'LIC-1005', 'Light', '2024-11-05', '+1-555-0105', 75, 'suspended');

-- 3. Insert Dummy Trips (Testing the PRD workflow)
-- 3a. Draft trip for Alex and Van-05
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, revenue, status)
VALUES
('Warehouse A', 'Customer B', 
  (SELECT id FROM vehicles WHERE registration_number = 'Van-05'), 
  (SELECT id FROM drivers WHERE name = 'Alex'), 
  450, 25, 120, 'draft');

-- To test the workflow, run the following updates in sequence in your SQL Editor:

/*
-- Step 1: Dispatch the trip
UPDATE trips SET status = 'dispatched' WHERE status = 'draft';
-- Verification: Check that Van-05 and Alex are now 'on_trip' in their respective tables.

-- Step 2: Try to double book Alex
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, revenue, status)
VALUES ('Warehouse C', 'Customer D', (SELECT id FROM vehicles WHERE registration_number = 'TRK-001'), (SELECT id FROM drivers WHERE name = 'Alex'), 200, 10, 50, 'dispatched');
-- Verification: This should fail with "Cannot dispatch. Driver is currently on_trip"

-- Step 3: Complete the trip
UPDATE trips SET status = 'completed', actual_distance_km = 26, fuel_consumed_l = 2 WHERE source = 'Warehouse A';
-- Verification: Check that Van-05 and Alex are now 'available' again.

-- Step 4: Maintenance transition
INSERT INTO maintenance_logs (vehicle_id, description, cost, status) VALUES ((SELECT id FROM vehicles WHERE registration_number = 'Van-05'), 'Oil change', 50, 'active');
-- Verification: Check that Van-05 is now 'in_shop'.
*/
