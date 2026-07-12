import { createClient } from "@/lib/supabase/server";
import { Vehicle } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { VehicleFormDialog } from "./vehicle-form-dialog";

export default async function VehiclesPage() {
  const supabase = await createClient();

  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  const vehicleList = (vehicles as Vehicle[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Vehicles</h1>
        <VehicleFormDialog />
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Reg. No
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Capacity
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Odometer
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {vehicleList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No vehicles registered yet. Click &quot;Add Vehicle&quot; to get started.
                </td>
              </tr>
            ) : (
              vehicleList.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {vehicle.registration_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {vehicle.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {vehicle.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {vehicle.max_load_kg} kg
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {vehicle.odometer} km
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={vehicle.status} />
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
