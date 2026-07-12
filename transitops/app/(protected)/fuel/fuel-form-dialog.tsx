"use client";

import { useState } from "react";
import { createFuelLog } from "@/lib/actions/fuel";
import { Vehicle } from "@/lib/types";

export function FuelFormDialog({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await createFuelLog(formData);

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
        + Log Expense
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150"
      >
        + Log Expense
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
            Log Fuel or Expense
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
                    {v.registration_number} - {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Expense Type
              </label>
              <select
                id="type"
                name="type"
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                defaultValue="fuel"
              >
                <option value="fuel">Fuel</option>
                <option value="toll">Toll / Fastag</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                  Cost (₹)
                </label>
                <input
                  id="cost"
                  name="cost"
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g. 5000"
                />
              </div>

              <div>
                <label htmlFor="liters" className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel (Liters)
                </label>
                <input
                  id="liters"
                  name="liters"
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Only if fuel"
                />
              </div>
            </div>

            <div>
              <label htmlFor="log_date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                id="log_date"
                name="log_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
                {loading ? "Saving..." : "Save Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
