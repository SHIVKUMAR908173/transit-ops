"use client";

import { useState } from "react";
import { dispatchTrip, completeTrip, cancelTrip } from "@/lib/actions/trips";

interface TripActionsProps {
  tripId: string;
  status: string;
}

export function TripActions({ tripId, status }: TripActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  async function handleDispatch() {
    setLoading(true);
    await dispatchTrip(tripId);
    setLoading(false);
  }

  async function handleComplete(formData: FormData) {
    setLoading(true);
    await completeTrip(tripId, formData);
    setLoading(false);
    setShowComplete(false);
  }

  async function handleCancel() {
    setLoading(true);
    await cancelTrip(tripId);
    setLoading(false);
  }

  if (status === "draft") {
    return (
      <button
        onClick={handleDispatch}
        disabled={loading}
        className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:opacity-50"
      >
        {loading ? "..." : "Dispatch"}
      </button>
    );
  }

  if (status === "dispatched") {
    return (
      <div className="flex items-center gap-2">
        {!showComplete ? (
          <>
            <button
              onClick={() => setShowComplete(true)}
              disabled={loading}
              className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:opacity-50"
            >
              Complete
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="bg-red-600 text-white hover:bg-red-700 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? "..." : "Cancel"}
            </button>
          </>
        ) : (
          <form action={handleComplete} className="flex items-center gap-2">
            <input
              name="actual_distance_km"
              type="number"
              placeholder="km"
              min="0"
              className="w-16 border border-gray-200 rounded-md px-2 py-1 text-xs"
            />
            <input
              name="fuel_consumed_l"
              type="number"
              placeholder="liters"
              min="0"
              className="w-16 border border-gray-200 rounded-md px-2 py-1 text-xs"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "✓"}
            </button>
            <button
              type="button"
              onClick={() => setShowComplete(false)}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              ✕
            </button>
          </form>
        )}
      </div>
    );
  }

  // Completed or Cancelled — no actions
  return <span className="text-xs text-gray-400">—</span>;
}
