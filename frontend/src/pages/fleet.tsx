import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/use-auth";
import { Plus, X, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  type: string;
  capacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: string;
  purchaseDate?: string;
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 border-emerald-100 text-emerald-600",
  ON_TRIP: "bg-blue-50 border-blue-100 text-blue-600",
  IN_SHOP: "bg-orange-50 border-orange-100 text-orange-600",
  RETIRED: "bg-gray-100 border-gray-200 text-gray-500",
};

const VEHICLE_TYPES = ["VAN", "TRUCK", "MINI", "BUS", "SUV", "PICKUP"];
const STATUS_OPTIONS = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"];

function VehicleModal({
  open,
  onClose,
  initial,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Vehicle>;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    registrationNumber: initial?.registrationNumber || "",
    model: initial?.model || "",
    type: initial?.type || "VAN",
    capacityKg: initial?.capacityKg || "",
    odometerKm: initial?.odometerKm || "",
    acquisitionCost: initial?.acquisitionCost || "",
    purchaseDate: initial?.purchaseDate ? initial.purchaseDate.slice(0, 10) : "",
    status: initial?.status || "AVAILABLE",
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      capacityKg: Number(form.capacityKg),
      odometerKm: Number(form.odometerKm),
      acquisitionCost: Number(form.acquisitionCost),
    });
  };

  const inputCls = "w-full bg-[#fafafa] text-xs px-3 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider mb-5">
          {initial?.id ? "Edit Vehicle" : "Add Vehicle"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Registration No.*</label>
              <input className={inputCls} value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} required disabled={!!initial?.id} placeholder="GJ01AB1234" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Model / Name*</label>
            <input className={inputCls} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required placeholder="Tata Ace" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Capacity (kg)*</label>
              <input type="number" className={inputCls} value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: e.target.value })} required min={1} placeholder="500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Odometer (km)</label>
              <input type="number" className={inputCls} value={form.odometerKm} onChange={(e) => setForm({ ...form, odometerKm: e.target.value })} min={0} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Acquisition Cost (₹)*</label>
              <input type="number" className={inputCls} value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} required min={1} placeholder="800000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Purchase Date</label>
              <input type="date" className={inputCls} value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
          </div>
          {initial?.id && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#3ecf8e] hover:bg-[#24b47e] text-[#171717] font-semibold text-xs py-2 rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {initial?.id ? "Save Changes" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const Fleet: React.FC = () => {
  const { hasPermission, isAdmin } = useAuth();
  const canEdit = isAdmin || hasPermission("fleet", "EDIT");
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | undefined>(undefined);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vehicles", statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await api.get(`/vehicles${params}`);
      return res.data.vehicles as Vehicle[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/vehicles", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle added successfully.");
      setShowModal(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to add vehicle."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.patch(`/vehicles/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle updated.");
      setShowModal(false);
      setEditVehicle(undefined);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to update vehicle."),
  });

  const retireMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle retired.");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Cannot retire vehicle."),
  });

  const filtered = (data || []).filter((v) => {
    const q = search.toLowerCase();
    return (
      (!q || v.registrationNumber.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)) &&
      (!typeFilter || v.type === typeFilter)
    );
  });

  return (
    <div className="space-y-6">
      <VehicleModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditVehicle(undefined); }}
        initial={editVehicle}
        onSubmit={(data) => {
          if (editVehicle?.id) {
            updateMutation.mutate({ id: editVehicle.id, body: data });
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] tracking-tight">Vehicle Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Manage transport fleet inventory, status, and costs.</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditVehicle(undefined); setShowModal(true); }} className="flex items-center gap-2 bg-[#3ecf8e] hover:bg-[#24b47e] text-[#171717] font-semibold text-xs px-4 py-2.5 rounded-md shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        )}
      </div>

      <div className="bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search registration or model..."
              className="w-full bg-[#fafafa] text-xs px-4 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-[#fafafa] text-xs px-3 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none cursor-pointer">
              <option value="">All Types</option>
              {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#fafafa] text-xs px-3 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none cursor-pointer">
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#3ecf8e]" /></div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-2 text-gray-400"><AlertCircle className="w-8 h-8" /><p className="text-sm">Failed to load vehicles.</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {data?.length === 0 ? "No vehicles registered yet. Add your first vehicle." : "No vehicles match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#dfdfdf] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Reg. No</th>
                  <th className="pb-3">Model</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Capacity</th>
                  <th className="pb-3">Odometer</th>
                  <th className="pb-3">Cost (₹)</th>
                  <th className="pb-3">Status</th>
                  {canEdit && <th className="pb-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 font-semibold text-[#171717]">{v.registrationNumber}</td>
                    <td className="py-3.5 text-gray-600">{v.model}</td>
                    <td className="py-3.5 text-gray-600">{v.type}</td>
                    <td className="py-3.5 text-gray-600">{v.capacityKg} kg</td>
                    <td className="py-3.5 text-gray-600">{v.odometerKm?.toLocaleString()} km</td>
                    <td className="py-3.5 text-gray-600">₹{v.acquisitionCost?.toLocaleString()}</td>
                    <td className="py-3.5">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[v.status] || "bg-gray-50 border-gray-100 text-gray-500"}`}>
                        {v.status.replace("_", " ")}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditVehicle(v); setShowModal(true); }}
                            className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-md text-gray-400 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {v.status !== "RETIRED" && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Retire ${v.registrationNumber}? This cannot be undone.`)) {
                                  retireMutation.mutate(v.id);
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md text-gray-400 transition-colors"
                              title="Retire"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-md text-xs text-gray-500">
          <strong>Rules:</strong> Registration No. must be unique. Retired/In-Shop vehicles are hidden from Trip Dispatcher.
        </div>
      </div>
    </div>
  );
};
