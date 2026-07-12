import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Gauge, TrendingUp, DollarSign, BarChart3, Loader2, Download } from "lucide-react";

export const Analytics: React.FC = () => {
  const { data: fuelData, isLoading: fuelLoading } = useQuery({
    queryKey: ["report-fuel"],
    queryFn: async () => (await api.get("/reports/fuel-efficiency")).data.data,
  });

  const { data: utilizationData, isLoading: utilLoading } = useQuery({
    queryKey: ["report-utilization"],
    queryFn: async () => (await api.get("/reports/fleet-utilization")).data.data,
  });

  const { data: costData, isLoading: costLoading } = useQuery({
    queryKey: ["report-cost"],
    queryFn: async () => (await api.get("/reports/operational-cost")).data.data,
  });

  const { data: roiData, isLoading: roiLoading } = useQuery({
    queryKey: ["report-roi"],
    queryFn: async () => (await api.get("/reports/roi")).data.data,
  });

  const avgFuelEfficiency =
    fuelData?.length > 0
      ? (fuelData.reduce((acc: number, r: any) => acc + (r.fuelEfficiency || 0), 0) / fuelData.length).toFixed(1)
      : null;

  const totalCost = (costData || []).reduce((acc: number, r: any) => acc + (r.totalTripCost || 0), 0);

  const avgROI =
    roiData?.length > 0
      ? (roiData.reduce((acc: number, r: any) => acc + (r.roi || 0), 0) / roiData.length).toFixed(1)
      : null;

  const topVehicles = (roiData || [])
    .filter((v: any) => v.totalOperationalCost > 0)
    .sort((a: any, b: any) => b.totalOperationalCost - a.totalOperationalCost)
    .slice(0, 5);

  const maxCost = topVehicles[0]?.totalOperationalCost || 1;

  const kpis = [
    {
      label: "Avg Fuel Efficiency",
      value: avgFuelEfficiency ? `${avgFuelEfficiency} km/L` : "—",
      sub: fuelLoading ? "Loading..." : `${fuelData?.length || 0} trip${fuelData?.length !== 1 ? "s" : ""} analyzed`,
      icon: Gauge,
      loading: fuelLoading,
    },
    {
      label: "Fleet Utilization",
      value: utilLoading ? "..." : `${utilizationData?.utilization ?? 0}%`,
      sub: utilLoading ? "Loading..." : `${utilizationData?.total || 0} total vehicles`,
      icon: TrendingUp,
      loading: utilLoading,
    },
    {
      label: "Operational Cost",
      value: costLoading ? "..." : `₹${totalCost.toLocaleString()}`,
      sub: costLoading ? "Loading..." : `${costData?.length || 0} completed trips`,
      icon: DollarSign,
      loading: costLoading,
    },
    {
      label: "Avg Vehicle ROI",
      value: avgROI !== null ? `${avgROI}%` : roiLoading ? "..." : "No data",
      sub: roiLoading ? "Loading..." : `${roiData?.length || 0} vehicles analyzed`,
      icon: BarChart3,
      loading: roiLoading,
    },
  ];

  const exportCSV = () => {
    if (!roiData?.length) return;
    const headers = ["Vehicle", "Registration", "Trips", "Revenue (₹)", "Op Cost (₹)", "ROI (%)"];
    const rows = roiData.map((r: any) => [
      r.model, r.registrationNumber, r.tripCount, r.totalRevenue, r.totalOperationalCost, r.roi,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transitops-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Review operational performance, fuel efficiency and cost analytics.</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!roiData?.length}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs px-4 py-2 rounded-md shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex items-start justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">{kpi.label}</span>
              {kpi.loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#2563EB] mt-2" />
              ) : (
                <>
                  <span className="text-2xl font-bold text-[#0F172A] mt-2 block tracking-tight">{kpi.value}</span>
                  <span className="text-xs text-gray-400 mt-1 block">{kpi.sub}</span>
                </>
              )}
            </div>
            <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#1D4ED8]">
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fleet Utilization Breakdown */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider mb-5">Fleet Status Breakdown</h3>
          {utilLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" /></div>
          ) : !utilizationData ? (
            <p className="text-sm text-gray-400 text-center py-10">No data available.</p>
          ) : (
            <div className="space-y-4">
              {(utilizationData.breakdown || []).map((b: any) => {
                const pct = utilizationData.total > 0 ? Math.round((b.count / utilizationData.total) * 100) : 0;
                const color = b.status === "AVAILABLE" ? "bg-emerald-500" : b.status === "ON_TRIP" ? "bg-blue-500" : b.status === "IN_SHOP" ? "bg-orange-500" : "bg-gray-400";
                return (
                  <div key={b.status}>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-gray-600">{b.status.replace("_", " ")}</span>
                      <span className="text-[#0F172A]">{b.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Costliest Vehicles */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider mb-5">Top Costliest Vehicles</h3>
          {roiLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" /></div>
          ) : !topVehicles.length ? (
            <p className="text-sm text-gray-400 text-center py-10">No completed trips yet to analyze costs.</p>
          ) : (
            <div className="space-y-4">
              {topVehicles.map((v: any) => (
                <div key={v.vehicleId}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-gray-600">{v.registrationNumber} ({v.model})</span>
                    <span className="text-[#0F172A]">₹{v.totalOperationalCost?.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${Math.round((v.totalOperationalCost / maxCost) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fuel Efficiency Table */}
      {fuelData?.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider mb-5">Fuel Efficiency by Trip</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Distance (km)</th>
                  <th className="pb-3">Fuel Used (L)</th>
                  <th className="pb-3">Efficiency (km/L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fuelData.slice(0, 10).map((r: any) => (
                  <tr key={r.tripId} className="hover:bg-gray-50/50">
                    <td className="py-3 font-semibold text-[#0F172A]">{r.registrationNumber} <span className="text-gray-400 font-normal">({r.model})</span></td>
                    <td className="py-3 text-gray-600">{r.distanceKm} km</td>
                    <td className="py-3 text-gray-600">{r.fuelUsedLiters} L</td>
                    <td className="py-3">
                      <span className={`font-bold ${r.fuelEfficiency >= 10 ? "text-emerald-600" : r.fuelEfficiency >= 7 ? "text-blue-600" : "text-orange-600"}`}>
                        {r.fuelEfficiency?.toFixed(2)} km/L
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
