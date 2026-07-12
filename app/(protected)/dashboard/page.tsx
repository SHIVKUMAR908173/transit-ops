import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/kpi-card";
import { DashboardFilters } from "./dashboard-filters";

export default async function DashboardPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const supabase = await createClient();

  // Await searchParams in Next.js 15+ if needed, but since it's an object, we can just access it. Wait, Next.js 15 requires awaiting searchParams. Let's do it safely for future compatibility.
  const params = await Promise.resolve(searchParams);
  const typeFilter = typeof params.type === 'string' ? params.type : undefined;
  const statusFilter = typeof params.status === 'string' ? params.status : undefined;

  // Base queries
  let vTotal = supabase.from("vehicles").select("*", { count: "exact", head: true }).not("status", "eq", "retired");
  let vAvail = supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "available");
  let vTrip = supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "on_trip");
  let vShop = supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "in_shop");

  // Apply filters
  if (typeFilter) {
    vTotal = vTotal.eq("type", typeFilter);
    vAvail = vAvail.eq("type", typeFilter);
    vTrip = vTrip.eq("type", typeFilter);
    vShop = vShop.eq("type", typeFilter);
  }
  if (statusFilter) {
    vTotal = vTotal.eq("status", statusFilter);
    vAvail = vAvail.eq("status", statusFilter);
    vTrip = vTrip.eq("status", statusFilter);
    vShop = vShop.eq("status", statusFilter);
  }

  // Fetch all counts in parallel
  const [
    { count: totalVehicles },
    { count: availableVehicles },
    { count: onTripVehicles },
    { count: inShopVehicles },
    { count: activeTrips },
    { count: pendingTrips },
    { count: driversOnDuty },
    { count: totalDrivers },
  ] = await Promise.all([
    vTotal,
    vAvail,
    vTrip,
    vShop,
    supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "dispatched"),
    supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("drivers").select("*", { count: "exact", head: true }).eq("status", "on_trip"),
    supabase.from("drivers").select("*", { count: "exact", head: true }).not("status", "eq", "suspended"),
  ]);

  const total = totalVehicles ?? 0;
  const onTrip = onTripVehicles ?? 0;
  const utilizationPct = total > 0 ? Math.round((onTrip / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fleet operations at a glance.
          </p>
        </div>
        <DashboardFilters />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <KpiCard title={typeFilter ? `Active ${typeFilter}s` : "Active Vehicles"} value={total} />
        <KpiCard title="Available Vehicles" value={availableVehicles ?? 0} />
        <KpiCard title="Vehicles in Maintenance" value={inShopVehicles ?? 0} />
        <KpiCard title="Active Trips" value={activeTrips ?? 0} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Pending Trips" value={pendingTrips ?? 0} subtitle="Trips in Draft status" />
        <KpiCard title="Drivers On Duty" value={driversOnDuty ?? 0} subtitle={`of ${totalDrivers ?? 0} total drivers`} />
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500">Fleet Utilization</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{utilizationPct}%</p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all"
              style={{ width: `${utilizationPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
