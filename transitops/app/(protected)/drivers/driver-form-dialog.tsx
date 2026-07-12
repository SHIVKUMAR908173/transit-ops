"use client";

import { useState } from "react";
import { createDriver } from "@/lib/actions/drivers";

export function DriverFormDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await createDriver(formData);

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
        + Add Driver
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150"
      >
        + Add Driver
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
            Add Driver
          </h2>

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="driver_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="driver_name"
                name="name"
                type="text"
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g. Raj Kumar"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  id="license_number"
                  name="license_number"
                  type="text"
                  required
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g. DL-1234567890"
                />
              </div>

              <div>
                <label htmlFor="license_category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="license_category"
                  name="license_category"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                >
                  <option value="">Select</option>
                  <option value="LMV">LMV</option>
                  <option value="HMV">HMV</option>
                  <option value="HGMV">HGMV</option>
                  <option value="Transport">Transport</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="license_expiry" className="block text-sm font-medium text-gray-700 mb-1">
                  License Expiry
                </label>
                <input
                  id="license_expiry"
                  name="license_expiry"
                  type="date"
                  required
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  id="contact_number"
                  name="contact_number"
                  type="tel"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label htmlFor="safety_score" className="block text-sm font-medium text-gray-700 mb-1">
                Safety Score (0–100)
              </label>
              <input
                id="safety_score"
                name="safety_score"
                type="number"
                min="0"
                max="100"
                defaultValue="100"
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
                {loading ? "Adding..." : "Add Driver"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
