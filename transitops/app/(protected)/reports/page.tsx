import { createClient } from "@/lib/supabase/server";
import { CsvExportButton } from "./csv-export-button";

export default async function ReportsPage() {
  const supabase = await createClient();

  // Fetch all required data
  const [
    { data: vehiclesData },
    { data: tripsData },
    { data: maintenanceData },
    { data: fuelData }
  ] = await Promise.all([
    supabase.from("vehicles").select("*"),
    supabase.from("trips").select("*").eq("status", "completed"),
    supabase.from("maintenance_logs").select("*"),
    supabase.from("fuel_logs").select("*")
  ]);

  const vehicles = vehiclesData || [];
  const trips = tripsData || [];
  const maintenanceLogs = maintenanceData || [];
  const fuelLogs = fuelData || [];

  // Aggregation per vehicle
  const vehicleStats = vehicles.map(vehicle => {
    const vTrips = trips.filter(t => t.vehicle_id === vehicle.id);
    const vMaint = maintenanceLogs.filter(m => m.vehicle_id === vehicle.id);
    const vFuel = fuelLogs.filter(f => f.vehicle_id === vehicle.id);

    const totalDistance = vTrips.reduce((sum, t) => sum + (t.actual_distance_km || 0), 0);
    const totalFuelLiters = vTrips.reduce((sum, t) => sum + (t.fuel_consumed_l || 0), 0);
    
    // Some fuel logs might not be tied to a trip but directly to the vehicle
    const directFuelCost = vFuel.reduce((sum, f) => sum + Number(f.cost), 0);
    const maintCost = vMaint.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    
    const operationalCost = directFuelCost + maintCost;
    const estimatedRevenue = totalDistance * 50; // Simulated revenue (50 per km)
    
    const roiPct = vehicle.acquisition_cost > 0 
      ? ((estimatedRevenue - operationalCost) / vehicle.acquisition_cost) * 100
      : 0;

    const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : '0.00';

    return {
      vehicleId: vehicle.id,
      registration: vehicle.registration_number,
      name: vehicle.name,
      tripsCompleted: vTrips.length,
      totalDistanceKm: totalDistance,
      fuelEfficiency,
      operationalCost,
      estimatedRevenue,
      roiPct: roiPct.toFixed(2)
    };
  });

  // Global Stats
  const totalFleetRevenue = vehicleStats.reduce((sum, v) => sum + v.estimatedRevenue, 0);
  const totalFleetCost = vehicleStats.reduce((sum, v) => sum + v.operationalCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Financial and operational performance metrics.
          </p>
        </div>
        <CsvExportButton data={vehicleStats} filename={`transitops_report_${new Date().toISOString().split('T')[0]}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Estimated Revenue</h3>
          <p className="text-4xl font-bold text-gray-900">₹{totalFleetRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Operational Cost</h3>
          <p className="text-4xl font-bold text-red-600">₹{totalFleetCost.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Vehicle Performance (ROI & Efficiency)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Trips</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Efficiency (km/L)</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Op Cost</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Est. Revenue</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">ROI %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicleStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No data available for reports.
                  </td>
                </tr>
              ) : (
                vehicleStats.map((stat) => (
                  <tr key={stat.vehicleId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stat.registration}</div>
                      <div className="text-sm text-gray-500">{stat.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.tripsCompleted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{stat.fuelEfficiency}</span>
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min((Number(stat.fuelEfficiency) / 10) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      ₹{stat.operationalCost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                      ₹{stat.estimatedRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        Number(stat.roiPct) > 0 ? 'bg-green-100 text-green-800' : 
                        Number(stat.roiPct) < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {Number(stat.roiPct) > 0 ? '+' : ''}{stat.roiPct}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
