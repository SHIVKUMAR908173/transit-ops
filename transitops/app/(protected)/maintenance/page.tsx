import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { MaintenanceFormDialog } from "./maintenance-form-dialog";
import { MaintenanceActions } from "./maintenance-actions";

export default async function MaintenancePage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("maintenance_logs")
    .select(`
      *,
      vehicle:vehicles(id, name, registration_number)
    `)
    .order("created_at", { ascending: false });

  // Fetch available vehicles for the form
  const { data: availableVehicles } = await supabase
    .from("vehicles")
    .select("id, name, registration_number")
    .eq("status", "available");

  const logList = logs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
        <MaintenanceFormDialog vehicles={availableVehicles || []} />
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Vehicle
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Description
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Cost
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
            {logList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No maintenance records yet. Click &quot;New Record&quot; to create one.
                </td>
              </tr>
            ) : (
              logList.map((log: any) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {log.vehicle?.name || "—"} ({log.vehicle?.registration_number || ""})
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {log.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {log.cost != null ? `₹${log.cost}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-4 py-3">
                    <MaintenanceActions logId={log.id} status={log.status} />
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
