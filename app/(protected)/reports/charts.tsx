"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

type VehicleStat = {
  vehicleId: string;
  registration: string;
  name: string;
  tripsCompleted: number;
  totalDistanceKm: number;
  fuelEfficiency: number;
  operationalCost: number;
  estimatedRevenue: number;
  roiPct: number;
  fuelCost: number;
  maintenanceCost: number;
};

type UtilizationStat = {
  date: string;
  activeTrips: number;
};

export function AnalyticsCharts({ vehicleStats, utilizationStats }: { vehicleStats: VehicleStat[], utilizationStats: UtilizationStat[] }) {
  // Chart 1 Config: Fuel Efficiency
  const efficiencyConfig = {
    efficiency: {
      label: "Fuel Efficiency (km/L)",
      color: "var(--color-efficiency)",
    },
  };

  // Chart 2 Config: Operational Cost
  const costConfig = {
    fuel: {
      label: "Fuel Cost",
      color: "var(--color-fuel)",
    },
    maintenance: {
      label: "Maintenance Cost",
      color: "var(--color-maintenance)",
    },
  };

  // Chart 3 Config: Utilization
  const utilizationConfig = {
    activeTrips: {
      label: "Active Trips",
      color: "var(--color-activeTrips)",
    },
  };

  // Chart 4 Config: ROI
  const roiConfig = {
    roi: {
      label: "Vehicle ROI %",
      color: "var(--color-roi)",
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fuel Efficiency Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-none">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Fuel Efficiency per Vehicle (km/L)</h3>
          <ChartContainer config={efficiencyConfig} className="h-[300px] w-full">
            <BarChart data={vehicleStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="registration" tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="fuelEfficiency" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Operational Cost Stacked Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-none">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Operational Cost Breakdown (₹)</h3>
          <ChartContainer config={costConfig} className="h-[300px] w-full">
            <BarChart data={vehicleStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="registration" tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="fuelCost" stackId="a" fill="#6B7280" />
              <Bar dataKey="maintenanceCost" stackId="a" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Fleet Utilization Over Time */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-none">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Fleet Utilization (Active Trips per Day)</h3>
          <ChartContainer config={utilizationConfig} className="h-[300px] w-full">
            <LineChart data={utilizationStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="stepAfter" dataKey="activeTrips" stroke="#111827" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Vehicle ROI */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-none">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Vehicle ROI (%)</h3>
          <ChartContainer config={roiConfig} className="h-[300px] w-full">
            <BarChart data={vehicleStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="registration" tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="roiPct" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

      </div>
    </div>
  );
}
