"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") || "";
  const currentStatus = searchParams.get("status") || "";

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex-1">
        <label htmlFor="type-filter" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Vehicle Type
        </label>
        <select
          id="type-filter"
          value={currentType}
          onChange={(e) => updateFilters("type", e.target.value)}
          className="w-full border-gray-300 rounded-md text-sm focus:ring-gray-900 focus:border-gray-900 border p-2 bg-white"
        >
          <option value="">All Types</option>
          <option value="Truck">Truck</option>
          <option value="Van">Van</option>
          <option value="Trailer">Trailer</option>
          <option value="Tanker">Tanker</option>
          <option value="Bus">Bus</option>
          <option value="Pickup">Pickup</option>
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="status-filter" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Vehicle Status
        </label>
        <select
          id="status-filter"
          value={currentStatus}
          onChange={(e) => updateFilters("status", e.target.value)}
          className="w-full border-gray-300 rounded-md text-sm focus:ring-gray-900 focus:border-gray-900 border p-2 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="on_trip">On Trip</option>
          <option value="in_shop">In Shop</option>
        </select>
      </div>
    </div>
  );
}
