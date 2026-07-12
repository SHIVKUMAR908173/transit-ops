"use client";

import { useState } from "react";
import { closeMaintenance } from "@/lib/actions/maintenance";

interface MaintenanceActionsProps {
  logId: string;
  status: string;
}

export function MaintenanceActions({ logId, status }: MaintenanceActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    setLoading(true);
    await closeMaintenance(logId);
    setLoading(false);
  }

  if (status === "active") {
    return (
      <button
        onClick={handleClose}
        disabled={loading}
        className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:opacity-50"
      >
        {loading ? "..." : "Close Record"}
      </button>
    );
  }

  return <span className="text-xs text-gray-400">—</span>;
}
