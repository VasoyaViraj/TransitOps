import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../hooks/use-auth";
import { Shield, Save, CheckCircle, RefreshCw, AlertTriangle, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type PermLevel = "NONE" | "VIEW" | "EDIT";

interface RolePermissionsRow {
  role: "FLEET_MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";
  fleet: PermLevel;
  drivers: PermLevel;
  trips: PermLevel;
  maintenance: PermLevel;
  fuelExpenses: PermLevel;
  analytics: PermLevel;
}

const MODULES: { key: keyof Omit<RolePermissionsRow, "role">; label: string }[] = [
  { key: "fleet", label: "Fleet" },
  { key: "drivers", label: "Drivers" },
  { key: "trips", label: "Trips" },
  { key: "maintenance", label: "Maintenance" },
  { key: "fuelExpenses", label: "Fuel/Exp" },
  { key: "analytics", label: "Analytics" },
];

const PERM_OPTIONS: { value: PermLevel; label: string; style: string }[] = [
  { value: "NONE", label: "None (—)", style: "text-gray-500" },
  { value: "VIEW", label: "View (◎)", style: "text-blue-600" },
  { value: "EDIT", label: "Edit (✔)", style: "text-emerald-600" },
];

function formatRole(role: string) {
  return role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export const Settings: React.FC = () => {
  const { isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<RolePermissionsRow[]>([]);
  const [depotName, setDepotName] = useState("Gandhinagar Depot G74");
  const [currency, setCurrency] = useState("INR");
  const [unit, setUnit] = useState("KM");
  const [loading, setLoading] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingRole, setSavingRole] = useState<string | null>(null);

  const fetchPermissions = async () => {
    setLoadingPerms(true);
    try {
      const res = await api.get("/auth/permissions");
      // Filter out ADMIN from editable list
      setPermissions((res.data || []).filter((r: any) => r.role !== "ADMIN"));
    } catch {
      toast.error("Failed to load permissions.");
    } finally {
      setLoadingPerms(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handlePermChange = (roleIndex: number, module: keyof Omit<RolePermissionsRow, "role">, value: PermLevel) => {
    const updated = [...permissions];
    updated[roleIndex] = { ...updated[roleIndex], [module]: value };
    setPermissions(updated);
  };

  const handleSave = async (row: RolePermissionsRow) => {
    setSavingRole(row.role);
    try {
      await api.put(`/auth/permissions/${row.role}`, {
        fleet: row.fleet,
        drivers: row.drivers,
        trips: row.trips,
        maintenance: row.maintenance,
        fuelExpenses: row.fuelExpenses,
        analytics: row.analytics,
      });
      toast.success(`${formatRole(row.role)} permissions updated.`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to update permissions.");
    } finally {
      setSavingRole(null);
    }
  };

  const handleGeneralSave = () => {
    toast.success("General settings saved.");
  };

  const selectCls = "bg-white text-xs px-2 py-1 rounded border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none cursor-pointer";
  const inputCls = "w-full bg-[#fafafa] text-sm px-3 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#171717] tracking-tight">System Settings & RBAC</h1>
        <p className="text-sm text-gray-500 mt-1">Configure depot settings and manage role permission matrices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* General Settings */}
        <div className="bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#171717] uppercase tracking-wider mb-5">General Settings</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Depot Name</label>
              <input className={inputCls} value={depotName} onChange={(e) => setDepotName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Currency</label>
              <select className={`${inputCls} cursor-pointer`} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Distance Unit</label>
              <select className={`${inputCls} cursor-pointer`} value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="KM">Kilometers</option>
                <option value="MILES">Miles</option>
              </select>
            </div>
            <button
              onClick={handleGeneralSave}
              className="w-full bg-[#3ecf8e] hover:bg-[#24b47e] text-[#171717] font-semibold text-xs py-2.5 rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>

        {/* RBAC Matrix — ADMIN ONLY */}
        <div className="bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-[#171717] uppercase tracking-wider">Role-Based Access Control (RBAC)</h3>
            {isAdmin && (
              <button onClick={fetchPermissions} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-5">
            {isAdmin ? "Configure module access for each role." : "Only Admin can modify permissions."}
          </p>

          {!isAdmin ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <Lock className="w-8 h-8 text-gray-300" />
              <p className="text-sm font-semibold text-gray-400">Admin Access Required</p>
              <p className="text-xs text-gray-400">Only Admin can view and modify the RBAC permission matrix.</p>
            </div>
          ) : loadingPerms ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#3ecf8e]" /></div>
          ) : (
            <div className="space-y-5">
              {permissions.map((row, roleIdx) => (
                <div key={row.role} className="border border-gray-100 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider mb-3">{formatRole(row.role)}</h4>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {MODULES.map((mod) => (
                      <div key={mod.key} className="flex flex-col gap-1">
                        <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{mod.label}</label>
                        <select
                          className={selectCls}
                          value={row[mod.key]}
                          onChange={(e) => handlePermChange(roleIdx, mod.key, e.target.value as PermLevel)}
                        >
                          {PERM_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleSave(row)}
                    disabled={savingRole === row.role}
                    className="w-full bg-[#3ecf8e] hover:bg-[#24b47e] text-[#171717] font-semibold text-[10px] py-1.5 rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                  >
                    {savingRole === row.role ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </button>
                </div>
              ))}

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-amber-700 block">Administrator Warning</span>
                    <span className="text-[11px] text-amber-600">Changes take effect immediately on next page load for affected users.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin info */}
      {isAdmin && (
        <div className="bg-white border border-[#dfdfdf] rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[#171717] mb-1">Admin Access</h4>
              <p className="text-xs text-gray-500">
                You are logged in as <strong>Admin</strong>. You have full access to all modules and can modify role permissions for all other roles.
                Admin role permissions cannot be modified — Admin always has full EDIT access to everything.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
