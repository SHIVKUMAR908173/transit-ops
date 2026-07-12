"use client";

import { Download } from "lucide-react";

export function CsvExportButton({ data, filename }: { data: any[], filename: string }) {
  const exportToCsv = () => {
    if (!data || data.length === 0) return;
    
    // Extract headers
    const headers = Object.keys(data[0]);
    
    // Build CSV string
    const csvRows = [];
    csvRows.push(headers.join(","));
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof val === 'string') {
          const escaped = val.replace(/"/g, '""');
          if (escaped.includes(',') || escaped.includes('\n')) {
            return `"${escaped}"`;
          }
          return escaped;
        }
        return val !== null && val !== undefined ? val : '';
      });
      csvRows.push(values.join(","));
    }
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button
      onClick={exportToCsv}
      className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 shadow-sm"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}
