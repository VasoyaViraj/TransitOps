import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/use-auth";
import { Plus, X, Pencil, Loader2, AlertCircle, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  contactNumber: string;
  safetyScore: number;
  status: string;
  tripsCompleted?: number;
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 border-emerald-100 text-emerald-600",
  ON_TRIP: "bg-blue-50 border-blue-100 text-blue-600",
  OFF_DUTY: "bg-gray-50 border-gray-100 text-gray-500",
  SUSPENDED: "bg-red-50 border-red-100 text-red-600",
};

const STATUS_OPTIONS = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"];
const LICENSE_CATEGORIES = ["LMV", "HMV", "HTV", "MGV", "MCWOG", "TRANS"];

function DriverModal({
  open, onClose, initial, onSubmit, loading,
}: {
  open: boolean; onClose: () => void; initial?: Partial<Driver>; onSubmit: (d: any) => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    licenseNumber: initial?.licenseNumber || "",
    licenseCategory: initial?.licenseCategory || "LMV",
    licenseExpiry: initial?.licenseExpiry ? initial.licenseExpiry.slice(0, 10) : "",
    contactNumber: initial?.contactNumber || "",
    safetyScore: initial?.safetyScore ?? 100,
    status: initial?.status || "AVAILABLE",
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, safetyScore: Number(form.safetyScore) });
  };

  const inputCls = "w-full bg-[#fafafa] text-xs px-3 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-md text-gray-400"><X className="w-4 h-4" /></button>
        <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider mb-5">{initial?.id ? "Edit Driver" : "Add Driver"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name*</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Rajesh Kumar" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">License No.*</label>
              <input className={inputCls} value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} required disabled={!!initial?.id} placeholder="DL-88213" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select className={inputCls} value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
                {LICENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">License Expiry*</label>
              <input type="date" className={inputCls} value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact*</label>
              <input className={inputCls} value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} required placeholder="+91 98765 00000" minLength={10} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Safety Score (0-100)</label>
              <input type="number" className={inputCls} value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: Number(e.target.value) })} min={0} max={100} />
            </div>
            {initial?.id && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 rounded-md transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#3ecf8e] hover:bg-[#24b47e] text-[#171717] font-semibold text-xs py-2 rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {initial?.id ? "Save Changes" : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const Drivers: React.FC = () => {
  const { hasPermission, isAdmin } = useAuth();
  const canEdit = isAdmin || hasPermission("drivers", "EDIT");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | undefined>(undefined);

  const { data, isLoading, error } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const res = await api.get("/drivers");
      return res.data.drivers as Driver[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/drivers", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast.success("Driver registered."); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to add driver."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.patch(`/drivers/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast.success("Driver updated."); setShowModal(false); setEditDriver(undefined); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to update driver."),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast.success("Driver suspended."); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Cannot suspend driver."),
  });

  const isExpired = (expiry: string) => new Date(expiry) < new Date();

  const filtered = (data || []).filter((d) => {
    const q = search.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <DriverModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditDriver(undefined); }}
        initial={editDriver}
        onSubmit={(data) => {
          if (editDriver?.id) {
            updateMutation.mutate({ id: editDriver.id, body: data });
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] tracking-tight">Drivers & Safety Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage driver records, licensing compliance, and safety scores.</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditDriver(undefined); setShowModal(true); }} className="flex items-center gap-2 bg-[#3ecf8e] hover:bg-[#24b47e] text-[#171717] font-semibold text-xs px-4 py-2.5 rounded-md shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        )}
      </div>

      <div className="bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search driver by name or license..."
            className="w-full bg-[#fafafa] text-xs px-4 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#3ecf8e]" /></div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-2 text-gray-400"><AlertCircle className="w-8 h-8" /><p className="text-sm">Failed to load drivers.</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {data?.length === 0 ? "No drivers registered yet." : "No drivers match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#dfdfdf] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Driver</th>
                  <th className="pb-3">License No.</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Expiry</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Safety Score</th>
                  <th className="pb-3">Status</th>
                  {canEdit && <th className="pb-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((d) => {
                  const expired = isExpired(d.licenseExpiry);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 font-semibold text-[#171717]">{d.name}</td>
                      <td className={`py-3.5 font-mono text-xs ${expired ? "text-red-500 font-semibold" : "text-gray-600"}`}>{d.licenseNumber}</td>
                      <td className="py-3.5 text-gray-600">{d.licenseCategory}</td>
                      <td className={`py-3.5 text-xs ${expired ? "text-red-500 font-semibold" : "text-gray-500"}`}>
                        {new Date(d.licenseExpiry).toLocaleDateString("en-IN")}
                        {expired && " ⚠️ EXPIRED"}
                      </td>
                      <td className="py-3.5 text-gray-600">{d.contactNumber}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-xs ${d.safetyScore >= 90 ? "text-emerald-600" : d.safetyScore >= 75 ? "text-blue-600" : "text-orange-600"}`}>
                            {d.safetyScore}%
                          </span>
                          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${d.safetyScore >= 90 ? "bg-emerald-500" : d.safetyScore >= 75 ? "bg-blue-500" : "bg-orange-500"}`}
                              style={{ width: `${d.safetyScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[d.status] || "bg-gray-50 border-gray-100 text-gray-500"}`}>
                          {d.status.replace("_", " ")}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditDriver(d); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-md text-gray-400 transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {d.status !== "SUSPENDED" && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Suspend ${d.name}?`)) {
                                    suspendMutation.mutate(d.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md text-gray-400 transition-colors"
                                title="Suspend"
                              >
                                <ShieldOff className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-md text-xs text-gray-500">
          <strong>Rules:</strong> Expired license or Suspended status → blocked from trip assignment.
        </div>
      </div>
    </div>
  );
};
