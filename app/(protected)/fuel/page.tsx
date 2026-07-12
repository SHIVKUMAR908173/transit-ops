import { createClient } from "@/lib/supabase/server";
import { Vehicle, FuelLog } from "@/lib/types";
import { FuelFormDialog } from "./fuel-form-dialog";
import { getUserRole } from "@/lib/actions/auth";

export default async function FuelPage() {
  const supabase = await createClient();
  const role = await getUserRole();
  const isManager = role === "fleet_manager" || role === "financial_analyst";

  // Fetch fuel logs joined with vehicles
  const { data: logs, error: logsError } = await supabase
    .from("fuel_logs")
    .select(`
      *,
      vehicle:vehicles (
        registration_number,
        name
      )
    `)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false });

  // Fetch vehicles for the dialog
  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("*")
    .not("status", "eq", "retired");

  const fuelLogs = (logs || []) as (FuelLog & { vehicle: { registration_number: string, name: string } })[];
  const vehicleList = (vehicles as Vehicle[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fuel & Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track fuel logs, tolls, and other operational expenses.
          </p>
        </div>
        {isManager && <FuelFormDialog vehicles={vehicleList} />}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Vehicle
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Details
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {fuelLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No expenses logged yet. Click &quot;Log Expense&quot; to get started.
                </td>
              </tr>
            ) : (
              fuelLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(log.log_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {log.vehicle?.registration_number} <span className="text-gray-500 font-normal">({log.vehicle?.name})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      log.type === 'fuel' ? 'bg-blue-100 text-blue-800' :
                      log.type === 'toll' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {log.liters ? `${log.liters} L` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                    ₹{log.cost.toLocaleString()}
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
