import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { TripFormDialog } from "./trip-form-dialog";
import { TripActions } from "./trip-actions";

import { getUserRole } from "@/lib/actions/auth";

export default async function TripsPage() {
  const supabase = await createClient();
  const role = await getUserRole();
  const isManager = role === "fleet_manager";

  const { data: trips } = await supabase
    .from("trips")
    .select(`
      *,
      vehicle:vehicles(id, name, registration_number, max_load_kg),
      driver:drivers(id, name)
    `)
    .order("created_at", { ascending: false });

  // Fetch available vehicles and drivers for the trip form
  const [{ data: availableVehicles }, { data: availableDrivers }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, name, registration_number, max_load_kg")
      .eq("status", "available"),
    supabase
      .from("drivers")
      .select("id, name, license_expiry, status")
      .eq("status", "available")
      .gt("license_expiry", new Date().toISOString().split("T")[0]),
  ]);

  const tripList = trips || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Trips</h1>
        {isManager && (
          <TripFormDialog
            vehicles={availableVehicles || []}
            drivers={availableDrivers || []}
          />
        )}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Route
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Vehicle
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Driver
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Cargo
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tripList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No trips created yet. Click &quot;Create Trip&quot; to get started.
                </td>
              </tr>
            ) : (
              tripList.map((trip: any) => (
                <tr
                  key={trip.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {trip.source} → {trip.destination}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {trip.vehicle?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {trip.driver?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {trip.cargo_weight_kg} kg
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={trip.status} />
                  </td>
                  <td className="px-4 py-3">
                    <TripActions tripId={trip.id} status={trip.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
