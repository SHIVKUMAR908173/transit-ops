import { createClient } from "@/lib/supabase/server";
import { Driver } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { DriverFormDialog } from "./driver-form-dialog";
import { getUserRole } from "@/lib/actions/auth";

export default async function DriversPage() {
  const supabase = await createClient();
  const role = await getUserRole();
  const isManager = role === "fleet_manager";

  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false });

  const driverList = (drivers as Driver[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Drivers</h1>
        {isManager && <DriverFormDialog />}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                License No
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Category
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Expiry
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Safety Score
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {driverList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No drivers registered yet. Click &quot;Add Driver&quot; to get started.
                </td>
              </tr>
            ) : (
              driverList.map((driver) => {
                const isExpired = new Date(driver.license_expiry) < new Date();
                return (
                  <tr
                    key={driver.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {driver.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {driver.license_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {driver.license_category || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={isExpired ? "text-red-600 font-medium" : "text-gray-900"}>
                        {new Date(driver.license_expiry).toLocaleDateString()}
                      </span>
                      {isExpired && (
                        <span className="ml-1 text-xs text-red-600">(Expired)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {driver.safety_score}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={driver.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
