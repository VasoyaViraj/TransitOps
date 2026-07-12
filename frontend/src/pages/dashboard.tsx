import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { Truck, Navigation, Wrench, Users, CheckCircle2, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DISPATCHED: "bg-blue-50 border-blue-100 text-blue-600",
    IN_PROGRESS: "bg-blue-50 border-blue-100 text-blue-600",
    COMPLETED: "bg-emerald-50 border-emerald-100 text-emerald-600",
    DRAFT: "bg-gray-50 border-gray-100 text-gray-500",
    CANCELLED: "bg-red-50 border-red-100 text-red-600",
    SCHEDULED: "bg-yellow-50 border-yellow-100 text-yellow-600",
  };
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[status] || "bg-gray-50 border-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

export const Dashboard: React.FC = () => {
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data.stats;
    },
    refetchInterval: 30000,
  });

  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ["recent-trips"],
    queryFn: async () => {
      const res = await api.get("/trips");
      return res.data.trips?.slice(0, 6) || [];
    },
    refetchInterval: 30000,
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ["recent-maintenance"],
    queryFn: async () => {
      const res = await api.get("/maintenance");
      return res.data.records?.slice(0, 5) || [];
    },
    refetchInterval: 30000,
  });

  const stats = statsData;

  const kpis = stats
    ? [
        { label: "Total Vehicles", value: String(stats.totalVehicles), sub: "In fleet", icon: Truck, color: "text-[#3ecf8e]" },
        { label: "Available", value: String(stats.availableVehicles), sub: "Ready for dispatch", icon: CheckCircle2, color: "text-emerald-500" },
        { label: "On Trip", value: String(stats.activeVehicles), sub: "Currently dispatched", icon: Navigation, color: "text-blue-500" },
        { label: "In Maintenance", value: String(stats.vehiclesInShop), sub: "In shop", icon: Wrench, color: "text-orange-500" },
        { label: "Active Drivers", value: String(stats.driversOnDuty), sub: `of ${stats.totalDrivers} total`, icon: Users, color: "text-purple-500" },
        { label: "Fleet Utilization", value: `${stats.fleetUtilization}%`, sub: "Vehicles on road", icon: TrendingUp, color: "text-[#3ecf8e]" },
      ]
    : [];

  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500 text-sm">Failed to load dashboard data.</p>
        <button onClick={() => refetch()} className="text-xs text-[#3ecf8e] font-semibold hover:underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time KPIs, fleet status and active assignments.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#171717] font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-[#dfdfdf] rounded-lg p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpis.map((kpi, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="bg-white border border-[#dfdfdf] rounded-lg p-6 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">{kpi.label}</span>
                <span className="text-3xl font-bold text-[#171717] mt-2 block tracking-tight">{kpi.value}</span>
                <span className="text-xs text-gray-400 mt-1 block">{kpi.sub}</span>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Trips */}
        <div className="bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm">
          <h3 className="text-md font-bold text-[#171717] mb-5">Recent Trips</h3>
          {tripsLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : tripsData?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No trips yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#dfdfdf] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Route</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tripsData?.map((trip: any) => (
                    <tr key={trip.id} className="hover:bg-gray-50/50">
                      <td className="py-3 text-xs text-gray-600">{trip.source} → {trip.destination}</td>
                      <td className="py-3 text-xs text-gray-500">{trip.vehicleRegistration || "—"}</td>
                      <td className="py-3"><StatusBadge status={trip.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fleet Status */}
        <div className="bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm">
          <h3 className="text-md font-bold text-[#171717] mb-5">Fleet Allocation</h3>
          {statsLoading ? (
            <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : stats ? (
            <div className="space-y-5">
              {[
                { label: "Available", count: stats.availableVehicles, color: "bg-[#3ecf8e]" },
                { label: "On Trip", count: stats.activeVehicles, color: "bg-blue-500" },
                { label: "In Shop", count: stats.vehiclesInShop, color: "bg-orange-500" },
                { label: "Retired", count: stats.retiredVehicles, color: "bg-gray-400" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-gray-600">{stat.label}</span>
                    <span className="text-[#171717]">{stat.count} vehicle{stat.count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color}`}
                      style={{ width: `${stats.totalVehicles > 0 ? Math.round((stat.count / stats.totalVehicles) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Recent Maintenance */}
      {maintenanceData && maintenanceData.length > 0 && (
        <div className="bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm">
          <h3 className="text-md font-bold text-[#171717] mb-5">Recent Maintenance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#dfdfdf] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Cost</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maintenanceData.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-semibold text-[#171717] text-xs">{m.vehicleRegistration}</td>
                    <td className="py-3 text-gray-600 text-xs">{m.description}</td>
                    <td className="py-3 text-gray-600 text-xs">₹{m.cost?.toLocaleString()}</td>
                    <td className="py-3"><StatusBadge status={m.status} /></td>
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
