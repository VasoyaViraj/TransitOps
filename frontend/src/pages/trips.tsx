import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/use-auth";
import { X, CheckCircle2, XCircle, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

const TRIP_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-50 border-gray-100 text-gray-500",
  DISPATCHED: "bg-blue-50 border-blue-100 text-blue-600",
  IN_PROGRESS: "bg-blue-50 border-blue-100 text-blue-600",
  COMPLETED: "bg-emerald-50 border-emerald-100 text-emerald-600",
  CANCELLED: "bg-red-50 border-red-100 text-red-600",
};

function CompleteModal({ open, onClose, trip, onSubmit, loading }: {
  open: boolean; onClose: () => void; trip: any; onSubmit: (d: any) => void; loading: boolean;
}) {
  const [form, setForm] = useState({ finalOdometerKm: "", fuelUsedLiters: "", fuelCost: "", tollCost: "0", otherExpenses: "0", revenue: "" });
  if (!open) return null;
  const inputCls = "w-full bg-[#fafafa] text-xs px-3 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-md text-gray-400"><X className="w-4 h-4" /></button>
        <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider mb-1">Complete Trip</h2>
        <p className="text-xs text-gray-500 mb-5">{trip?.source} → {trip?.destination}</p>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ finalOdometerKm: Number(form.finalOdometerKm), fuelUsedLiters: Number(form.fuelUsedLiters), fuelCost: Number(form.fuelCost), tollCost: Number(form.tollCost), otherExpenses: Number(form.otherExpenses), revenue: Number(form.revenue) }); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Final Odometer (km)*</label>
              <input type="number" className={inputCls} required value={form.finalOdometerKm} onChange={(e) => setForm({ ...form, finalOdometerKm: e.target.value })} min={1} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fuel Used (L)*</label>
              <input type="number" className={inputCls} required value={form.fuelUsedLiters} onChange={(e) => setForm({ ...form, fuelUsedLiters: e.target.value })} min={0.1} step={0.1} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fuel Cost (₹)*</label>
              <input type="number" className={inputCls} required value={form.fuelCost} onChange={(e) => setForm({ ...form, fuelCost: e.target.value })} min={0} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Toll Cost (₹)</label>
              <input type="number" className={inputCls} value={form.tollCost} onChange={(e) => setForm({ ...form, tollCost: e.target.value })} min={0} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Other Expenses (₹)</label>
              <input type="number" className={inputCls} value={form.otherExpenses} onChange={(e) => setForm({ ...form, otherExpenses: e.target.value })} min={0} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Revenue (₹)*</label>
              <input type="number" className={inputCls} required value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} min={0} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs py-2 rounded-md disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Mark Complete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const Trips: React.FC = () => {
  const { hasPermission, isAdmin } = useAuth();
  const canEdit = isAdmin || hasPermission("trips", "EDIT");
  const qc = useQueryClient();
  const [completeTrip, setCompleteTrip] = useState<any>(null);
  const [form, setForm] = useState({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: "", distanceKm: "" });
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => (await api.get("/trips")).data.trips,
    refetchInterval: 15000,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles-available"],
    queryFn: async () => (await api.get("/vehicles?status=AVAILABLE")).data.vehicles,
    enabled: canEdit,
  });

  const { data: driversData } = useQuery({
    queryKey: ["drivers-available"],
    queryFn: async () => (await api.get("/drivers?status=AVAILABLE")).data.drivers,
    enabled: canEdit,
  });

  const selectedVehicle = vehiclesData?.find((v: any) => v.id === form.vehicleId);

  // Live capacity validation
  const cargoNum = Number(form.cargoWeightKg);
  const capacityExceeded = selectedVehicle && cargoNum > 0 && cargoNum > selectedVehicle.capacityKg;

  const dispatchMutation = useMutation({
    mutationFn: async (body: any) => {
      const { data: tripData } = await api.post("/trips", body);
      const tripId = tripData.trip.id;
      await api.post(`/trips/${tripId}/dispatch`);
      return tripData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles-available"] });
      qc.invalidateQueries({ queryKey: ["drivers-available"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Trip dispatched successfully!");
      setForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: "", distanceKm: "" });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Dispatch failed."),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.post(`/trips/${id}/complete`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles-available"] });
      qc.invalidateQueries({ queryKey: ["drivers-available"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Trip completed!");
      setCompleteTrip(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to complete trip."),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/trips/${id}`, { status: "CANCELLED" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles-available"] });
      qc.invalidateQueries({ queryKey: ["drivers-available"] });
      toast.success("Trip cancelled.");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Cannot cancel trip."),
  });

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (capacityExceeded) {
      setValidationError(`Cargo ${cargoNum}kg exceeds vehicle capacity of ${selectedVehicle?.capacityKg}kg.`);
      return;
    }
    setValidationError(null);
    dispatchMutation.mutate({
      source: form.source,
      destination: form.destination,
      vehicleId: form.vehicleId,
      driverId: form.driverId,
      cargoWeightKg: Number(form.cargoWeightKg),
      distanceKm: Number(form.distanceKm),
    });
  };

  const inputCls = "w-full bg-[#fafafa] text-xs px-3 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none";

  return (
    <div className="space-y-6">
      <CompleteModal
        open={!!completeTrip}
        onClose={() => setCompleteTrip(null)}
        trip={completeTrip}
        onSubmit={(data) => completeMutation.mutate({ id: completeTrip.id, body: data })}
        loading={completeMutation.isPending}
      />

      <div>
        <h1 className="text-2xl font-bold text-[#171717] tracking-tight">Trip Dispatcher</h1>
        <p className="text-sm text-gray-500 mt-1">Assign vehicles and drivers to cargo runs with weight validations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Trip Form */}
        {canEdit && (
          <div className="lg:col-span-5 bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm h-fit">
            <h3 className="text-sm font-semibold text-[#171717] uppercase tracking-wider mb-5">Create & Dispatch Trip</h3>
            <form onSubmit={handleDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">Source*</label>
                <input type="text" required className={inputCls} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Ahmedabad Hub" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">Destination*</label>
                <input type="text" required className={inputCls} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Sanand Warehouse" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">Vehicle (Available Only)*</label>
                <select required className={inputCls} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value, cargoWeightKg: "" })}>
                  <option value="">Select vehicle...</option>
                  {(vehiclesData || []).map((v: any) => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} — {v.model} (Cap: {v.capacityKg}kg)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">Driver (Available Only)*</label>
                <select required className={inputCls} value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                  <option value="">Select driver...</option>
                  {(driversData || []).map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name} — {d.licenseCategory} (Safety: {d.safetyScore}%)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">Cargo Weight (kg)*</label>
                  <input type="number" required className={inputCls} value={form.cargoWeightKg} onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })} min={1} placeholder="500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider mb-1.5">Distance (km)*</label>
                  <input type="number" required className={inputCls} value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} min={1} placeholder="30" />
                </div>
              </div>

              {(capacityExceeded || validationError) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                  <span className="font-semibold block">⚠ Validation Error</span>
                  {capacityExceeded
                    ? `Cargo ${cargoNum}kg exceeds vehicle capacity of ${selectedVehicle?.capacityKg}kg.`
                    : validationError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!!capacityExceeded || dispatchMutation.isPending}
                  className="flex-1 bg-[#3ecf8e] hover:bg-[#24b47e] text-[#171717] font-semibold text-xs py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {dispatchMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Dispatch
                </button>
                <button
                  type="button"
                  onClick={() => { setForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: "", distanceKm: "" }); setValidationError(null); }}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2.5 rounded-md transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Board */}
        <div className={`${canEdit ? "lg:col-span-7" : "lg:col-span-12"} bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm`}>
          <h3 className="text-sm font-semibold text-[#171717] uppercase tracking-wider mb-5">Live Board</h3>
          {tripsLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#3ecf8e]" /></div>
          ) : !tripsData?.length ? (
            <div className="text-center py-16 text-gray-400 text-sm">No trips yet. Create your first dispatch.</div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {tripsData.map((trip: any) => (
                <div key={trip.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-[#171717]">{trip.source} → {trip.destination}</span>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {trip.vehicleRegistration && <span className="mr-3">🚛 {trip.vehicleRegistration}</span>}
                        {trip.driverName && <span>👤 {trip.driverName}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${TRIP_STATUS_STYLES[trip.status] || "bg-gray-50 border-gray-100 text-gray-500"}`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Cargo: {trip.cargoWeightKg}kg · {trip.distanceKm}km</span>
                    <span className="text-gray-400 text-[10px]">{new Date(trip.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  {canEdit && (trip.status === "DISPATCHED" || trip.status === "IN_PROGRESS") && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setCompleteTrip(trip)}
                        className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md transition-colors border border-emerald-100"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Complete
                      </button>
                      <button
                        onClick={() => { if (window.confirm("Cancel this trip?")) cancelMutation.mutate(trip.id); }}
                        className="flex items-center gap-1 text-[10px] font-semibold bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-md transition-colors border border-red-100"
                      >
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
