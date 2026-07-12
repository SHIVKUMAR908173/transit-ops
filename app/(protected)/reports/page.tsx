import { createClient } from "@/lib/supabase/server";
import { CsvExportButton } from "./csv-export-button";
import { AnalyticsCharts } from "./charts";

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

    const totalDistance = vTrips.reduce((sum, t) => sum + (Number(t.actual_distance_km) || 0), 0);
    const totalFuelLiters = vTrips.reduce((sum, t) => sum + (Number(t.fuel_consumed_l) || 0), 0);
    
    // Revenue is now pulled from actual trip records (defaulting to 0 if null)
    const totalRevenue = vTrips.reduce((sum, t) => sum + (Number(t.revenue) || 0), 0);
    
    // Direct fuel entries + maintenance entries
    const fuelCost = vFuel.reduce((sum, f) => sum + (Number(f.cost) || 0), 0);
    const maintenanceCost = vMaint.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
    const operationalCost = fuelCost + maintenanceCost;
    
    const roiPct = vehicle.acquisition_cost > 0 
      ? ((totalRevenue - operationalCost) / vehicle.acquisition_cost) * 100
      : 0;

    const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters) : 0;

    return {
      vehicleId: vehicle.id,
      registration: vehicle.registration_number,
      name: vehicle.name,
      tripsCompleted: vTrips.length,
      totalDistanceKm: totalDistance,
      fuelEfficiency: Number(fuelEfficiency.toFixed(2)),
      operationalCost,
      estimatedRevenue: totalRevenue,
      roiPct: Number(roiPct.toFixed(2)),
      fuelCost,
      maintenanceCost
    };
  });

  // Global Stats
  const totalFleetRevenue = vehicleStats.reduce((sum, v) => sum + v.estimatedRevenue, 0);
  const totalFleetCost = vehicleStats.reduce((sum, v) => sum + v.operationalCost, 0);

  // Utilization Stats: group trips by date
  // For a real app, this might track snapshots, but we'll approximate active trips by their created_at date
  const utilizationMap: Record<string, number> = {};
  trips.forEach(t => {
    const dateStr = new Date(t.created_at).toISOString().split('T')[0];
    utilizationMap[dateStr] = (utilizationMap[dateStr] || 0) + 1;
  });
  const utilizationStats = Object.keys(utilizationMap)
    .sort()
    .map(date => ({
      date,
      activeTrips: utilizationMap[date]
    }));

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
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-none">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Total Fleet Revenue</h3>
          <p className="text-4xl font-semibold text-gray-900">₹{totalFleetRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-none">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Total Operational Cost</h3>
          <p className="text-4xl font-semibold text-red-600">₹{totalFleetCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts vehicleStats={vehicleStats} utilizationStats={utilizationStats} />
      
    </div>
  );
}
