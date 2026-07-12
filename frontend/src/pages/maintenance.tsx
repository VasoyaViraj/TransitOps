import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/use-auth";
import { X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-yellow-50 border-yellow-100 text-yellow-600",
  IN_PROGRESS: "bg-orange-50 border-orange-100 text-orange-600",
  COMPLETED: "bg-emerald-50 border-emerald-100 text-emerald-600",
};

const SERVICE_TYPES = ["Routine Service", "Engine Repair", "Tyre Replacement", "Brake Service", "Oil Change", "AC Repair", "Body Work", "Electrical", "Other"];

function LogModal({ open, onClose, vehicles, onSubmit, loading }: {
  open: boolean; onClose: () => void; vehicles: any[]; onSubmit: (d: any) => void; loading: boolean;
}) {
  const [form, setForm] = useState({ vehicleId: "", description: "Routine Service", cost: "", date: new Date().toISOString().slice(0, 10) });
  if (!open) return null;
  const inputCls = "w-full bg-[#fafafa] text-xs px-3 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-md text-gray-400"><X className="w-4 h-4" /></button>
        <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider mb-5">Log Maintenance Record</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, cost: Number(form.cost) }); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle*</label>
            <select required className={inputCls} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Select vehicle...</option>
              {vehicles.filter((v) => v.status !== "ON_TRIP" && v.status !== "RETIRED").map((v: any) => (
                <option key={v.id} value={v.id}>{v.registrationNumber} — {v.model} ({v.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Service Type*</label>
            <select className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}>
              {SERVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cost (₹)*</label>
              <input type="number" required className={inputCls} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} min={0} placeholder="4500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Service Date*</label>
              <input type="date" required className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-md text-xs text-amber-700">
            ⚠ Vehicle will be marked <strong>IN_SHOP</strong> upon saving.
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#3ecf8e] hover:bg-[#24b47e] text-[#171717] font-semibold text-xs py-2 rounded-md disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const Maintenance: React.FC = () => {
  const { hasPermission, isAdmin } = useAuth();
  const canEdit = isAdmin || hasPermission("maintenance", "EDIT");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => (await api.get("/maintenance")).data.records,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await api.get("/vehicles")).data.vehicles,
    enabled: canEdit,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/maintenance", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicles-available"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Maintenance record saved. Vehicle marked In Shop.");
      setShowModal(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to save record."),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/maintenance/${id}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicles-available"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Maintenance completed. Vehicle restored to Available.");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to complete."),
  });

  return (
    <div className="space-y-6">
      <LogModal
        open={showModal}
        onClose={() => setShowModal(false)}
        vehicles={vehiclesData || []}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] tracking-tight">Maintenance Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Log and track vehicle service histories, costs and status changes.</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#3ecf8e] hover:bg-[#24b47e] text-[#171717] font-semibold text-xs px-4 py-2.5 rounded-md shadow-sm transition-colors">
            + Log Service
          </button>
        )}
      </div>

      <div className="bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#171717] uppercase tracking-wider mb-5">Service History Log</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#3ecf8e]" /></div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-2 text-gray-400"><AlertCircle className="w-8 h-8" /><p className="text-sm">Failed to load records.</p></div>
        ) : !data?.length ? (
          <div className="text-center py-16 text-gray-400 text-sm">No maintenance records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#dfdfdf] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Cost (₹)</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  {canEdit && <th className="pb-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 font-semibold text-[#171717]">{r.vehicleRegistration} <span className="text-gray-400 font-normal text-xs">({r.vehicleModel})</span></td>
                    <td className="py-3.5 text-gray-600">{r.description}</td>
                    <td className="py-3.5 text-gray-600">₹{r.cost?.toLocaleString()}</td>
                    <td className="py-3.5 text-gray-500 text-xs">{new Date(r.date).toLocaleDateString("en-IN")}</td>
                    <td className="py-3.5">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[r.status] || "bg-gray-50 border-gray-100 text-gray-500"}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-3.5">
                        {r.status !== "COMPLETED" && (
                          <button
                            onClick={() => { if (window.confirm("Mark as completed? Vehicle will be restored to Available.")) completeMutation.mutate(r.id); }}
                            className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-100"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Complete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
