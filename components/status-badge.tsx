import { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from "@/lib/types";

type StatusType = VehicleStatus | DriverStatus | TripStatus | MaintenanceStatus;

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
  available: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  on_trip: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  in_shop: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  suspended: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  retired: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  off_duty: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  draft: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  dispatched: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  completed: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  active: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  closed: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

const statusLabels: Record<string, string> = {
  available: "Available",
  on_trip: "On Trip",
  in_shop: "In Shop",
  suspended: "Suspended",
  retired: "Retired",
  off_duty: "Off Duty",
  draft: "Draft",
  dispatched: "Dispatched",
  completed: "Completed",
  cancelled: "Cancelled",
  active: "Active",
  closed: "Closed",
};

export function StatusBadge({ status }: { status: StatusType }) {
  const config = statusConfig[status] || statusConfig.draft;
  const label = statusLabels[status] || status;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
    >
      {label}
    </span>
  );
}
