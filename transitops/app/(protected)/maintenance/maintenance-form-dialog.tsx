"use client";

import { useState } from "react";
import { openMaintenance } from "@/lib/actions/maintenance";

interface VehicleOption {
  id: string;
  name: string;
  registration_number: string;
}

interface MaintenanceFormDialogProps {
  vehicles: VehicleOption[];
}

export function MaintenanceFormDialog({ vehicles }: MaintenanceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await openMaintenance(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOpen(false);
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150"
      >
        + New Record
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150"
      >
        + New Record
      </button>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => { setOpen(false); setError(null); }}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            New Maintenance Record
          </h2>

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle
              </label>
              <select
                id="vehicle_id"
                name="vehicle_id"
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
              >
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registration_number})
                  </option>
                ))}
              </select>
              {vehicles.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No available vehicles for maintenance</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                id="description"
                name="description"
                type="text"
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g. Oil change, brake repair"
              />
            </div>

            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Cost (₹)
              </label>
              <input
                id="cost"
                name="cost"
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g. 800"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null); }}
                className="flex-1 bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
