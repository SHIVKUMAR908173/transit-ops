"use client";

import { useState } from "react";
import { createTrip } from "@/lib/actions/trips";

interface VehicleOption {
  id: string;
  name: string;
  registration_number: string;
  max_load_kg: number;
}

interface DriverOption {
  id: string;
  name: string;
}

interface TripFormDialogProps {
  vehicles: VehicleOption[];
  drivers: DriverOption[];
}

export function TripFormDialog({ vehicles, drivers }: TripFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const cargoNum = Number(cargoWeight);
  const isOverweight =
    selectedVehicle && cargoNum > 0 && cargoNum > selectedVehicle.max_load_kg;

  async function handleSubmit(formData: FormData) {
    if (isOverweight) return;

    setLoading(true);
    setError(null);

    const result = await createTrip(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOpen(false);
      setLoading(false);
      setSelectedVehicleId("");
      setCargoWeight("");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150"
      >
        + Create Trip
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150"
      >
        + Create Trip
      </button>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => {
          setOpen(false);
          setError(null);
          setSelectedVehicleId("");
          setCargoWeight("");
        }}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create Trip
          </h2>

          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <input
                  id="source"
                  name="source"
                  type="text"
                  required
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g. Mumbai"
                />
              </div>

              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <input
                  id="destination"
                  name="destination"
                  type="text"
                  required
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g. Ahmedabad"
                />
              </div>
            </div>

            <div>
              <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle
              </label>
              <select
                id="vehicle_id"
                name="vehicle_id"
                required
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
              >
                <option value="">Select available vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registration_number}) — {v.max_load_kg} kg
                  </option>
                ))}
              </select>
              {vehicles.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No available vehicles</p>
              )}
            </div>

            <div>
              <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-1">
                Driver
              </label>
              <select
                id="driver_id"
                name="driver_id"
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
              >
                <option value="">Select available driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {drivers.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No available drivers with valid license</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cargo_weight_kg" className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo Weight (kg)
                </label>
                <input
                  id="cargo_weight_kg"
                  name="cargo_weight_kg"
                  type="number"
                  required
                  min="1"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    isOverweight
                      ? "border-red-300 focus:ring-red-600"
                      : "border-gray-200 focus:ring-gray-900"
                  }`}
                  placeholder="e.g. 500"
                />
                {isOverweight && (
                  <p className="text-xs text-red-600 mt-1">
                    Exceeds vehicle capacity of {selectedVehicle?.max_load_kg} kg
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="planned_distance_km" className="block text-sm font-medium text-gray-700 mb-1">
                  Distance (km)
                </label>
                <input
                  id="planned_distance_km"
                  name="planned_distance_km"
                  type="number"
                  min="1"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                  setSelectedVehicleId("");
                  setCargoWeight("");
                }}
                className="flex-1 bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!isOverweight}
                className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Trip"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
