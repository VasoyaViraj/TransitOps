import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/use-auth";
import { Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const EXPENSE_TYPES = ["TOLL", "LOADING", "UNLOADING", "BORDER_TAX", "DRIVER_ALLOWANCE", "PARKING", "OTHER"];

function FuelModal({ open, onClose, vehicles, onSubmit, loading }: {
  open: boolean; onClose: () => void; vehicles: any[]; onSubmit: (d: any) => void; loading: boolean;
}) {
  const { data: tripsData } = useQuery({
    queryKey: ["trips-completed"],
    queryFn: async () => (await api.get("/trips?status=COMPLETED")).data.trips,
  });
  const [form, setForm] = useState({ vehicleId: "", tripId: "", liters: "", cost: "", date: new Date().toISOString().slice(0, 10) });
  if (!open) return null;
  const inputCls = "w-full bg-[#F8FAFC] text-xs px-3 py-2 rounded-md border border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none";
  const vehicleTrips = (tripsData || []).filter((t: any) => !form.vehicleId || t.vehicleId === form.vehicleId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-md text-gray-400"><X className="w-4 h-4" /></button>
        <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-5">Log Fuel Fill</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, liters: Number(form.liters), cost: Number(form.cost) }); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle*</label>
            <select required className={inputCls} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value, tripId: "" })}>
              <option value="">Select vehicle...</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Linked Trip (optional)</label>
            <select className={inputCls} value={form.tripId} onChange={(e) => setForm({ ...form, tripId: e.target.value })}>
              <option value="">No trip linked</option>
              {vehicleTrips.map((t: any) => <option key={t.id} value={t.id}>{t.source} → {t.destination}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Liters*</label>
              <input type="number" required className={inputCls} value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} min={0.1} step={0.1} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Total Cost (₹)*</label>
              <input type="number" required className={inputCls} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} min={0} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs py-2 rounded-md disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Log Fuel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExpenseModal({ open, onClose, onSubmit, loading }: {
  open: boolean; onClose: () => void; onSubmit: (d: any) => void; loading: boolean;
}) {
  const { data: tripsData } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => (await api.get("/trips")).data.trips,
  });
  const [form, setForm] = useState({ tripId: "", type: "TOLL", amount: "", description: "", date: new Date().toISOString().slice(0, 10) });
  if (!open) return null;
  const inputCls = "w-full bg-[#F8FAFC] text-xs px-3 py-2 rounded-md border border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-md text-gray-400"><X className="w-4 h-4" /></button>
        <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-5">Add Expense</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, amount: Number(form.amount) }); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Trip*</label>
            <select required className={inputCls} value={form.tripId} onChange={(e) => setForm({ ...form, tripId: e.target.value })}>
              <option value="">Select trip...</option>
              {(tripsData || []).map((t: any) => <option key={t.id} value={t.id}>{t.source} → {t.destination} ({t.status})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type*</label>
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {EXPENSE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (₹)*</label>
              <input type="number" required className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min={0} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs py-2 rounded-md disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const Expenses: React.FC = () => {
  const { hasPermission, isAdmin } = useAuth();
  const canEdit = isAdmin || hasPermission("fuelExpenses", "EDIT");
  const qc = useQueryClient();
  const [showFuel, setShowFuel] = useState(false);
  const [showExpense, setShowExpense] = useState(false);

  const { data: fuelData, isLoading: fuelLoading } = useQuery({
    queryKey: ["fuel-logs"],
    queryFn: async () => (await api.get("/fuel-logs")).data.logs,
  });

  const { data: expenseData, isLoading: expenseLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => (await api.get("/expenses")).data.expenses,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await api.get("/vehicles")).data.vehicles,
    enabled: canEdit,
  });

  const fuelMutation = useMutation({
    mutationFn: (body: any) => api.post("/fuel-logs", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fuel-logs"] }); toast.success("Fuel log saved."); setShowFuel(false); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to log fuel."),
  });

  const expenseMutation = useMutation({
    mutationFn: (body: any) => api.post("/expenses", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense recorded."); setShowExpense(false); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to add expense."),
  });

  const totalFuelCost = (fuelData || []).reduce((acc: number, l: any) => acc + (l.cost || 0), 0);
  const totalExpenses = (expenseData || []).reduce((acc: number, e: any) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <FuelModal open={showFuel} onClose={() => setShowFuel(false)} vehicles={vehiclesData || []} onSubmit={(d) => fuelMutation.mutate(d)} loading={fuelMutation.isPending} />
      <ExpenseModal open={showExpense} onClose={() => setShowExpense(false)} onSubmit={(d) => expenseMutation.mutate(d)} loading={expenseMutation.isPending} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Fuel & Expense Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track fuel logs, tolls, and operational costs.</p>
        </div>
        {canEdit && (
          <div className="flex gap-3">
            <button onClick={() => setShowFuel(true)} className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs px-3.5 py-2 rounded-md shadow-sm transition-colors">
              <Plus className="w-3.5 h-3.5" /> Log Fuel
            </button>
            <button onClick={() => setShowExpense(true)} className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs px-3.5 py-2 rounded-md shadow-sm transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Expense
            </button>
          </div>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Fuel Cost</span>
          <span className="text-2xl font-bold text-[#0F172A] mt-1 block">₹{totalFuelCost.toLocaleString()}</span>
          <span className="text-xs text-gray-400">{fuelData?.length || 0} fuel log{fuelData?.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Expenses</span>
          <span className="text-2xl font-bold text-[#0F172A] mt-1 block">₹{totalExpenses.toLocaleString()}</span>
          <span className="text-xs text-gray-400">{expenseData?.length || 0} expense record{expenseData?.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fuel Logs */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider mb-5">Fuel Logs</h3>
          {fuelLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" /></div>
          ) : !fuelData?.length ? (
            <p className="text-sm text-gray-400 text-center py-10">No fuel logs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Liters</th>
                    <th className="pb-3">Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fuelData.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-semibold text-[#0F172A]">{log.vehicleRegistration}</td>
                      <td className="py-3 text-gray-500 text-xs">{new Date(log.date).toLocaleDateString("en-IN")}</td>
                      <td className="py-3 text-gray-600">{log.liters} L</td>
                      <td className="py-3 text-gray-600">₹{log.cost?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expenses */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider mb-5">Operational Expenses</h3>
          {expenseLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" /></div>
          ) : !expenseData?.length ? (
            <p className="text-sm text-gray-400 text-center py-10">No expenses recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Trip</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Amount (₹)</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenseData.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-semibold text-[#0F172A] text-xs">{exp.tripSource} → {exp.tripDestination}</td>
                      <td className="py-3"><span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exp.type}</span></td>
                      <td className="py-3 font-bold text-[#0F172A]">₹{exp.amount?.toLocaleString()}</td>
                      <td className="py-3 text-gray-500 text-xs">{new Date(exp.date).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Grand Total (Fuel + Expenses)</span>
            <span className="text-lg font-bold text-[#0F172A]">₹{(totalFuelCost + totalExpenses).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
