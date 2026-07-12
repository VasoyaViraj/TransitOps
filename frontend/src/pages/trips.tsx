import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/use-auth";
import {
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Edit,
  Plus,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { cn } from "../lib/utils";

const TRIP_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-50 border-gray-100 text-gray-500",
  DISPATCHED: "bg-blue-50 border-blue-100 text-blue-600",
  IN_PROGRESS: "bg-blue-50 border-blue-100 text-blue-600",
  COMPLETED: "bg-emerald-50 border-emerald-100 text-emerald-600",
  CANCELLED: "bg-red-50 border-red-100 text-red-600",
};

// MODAL FOR TRIP COMPLETION
function CompleteModal({
  open,
  onClose,
  trip,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  trip: any;
  onSubmit: (d: any) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    finalOdometerKm: "",
    fuelUsedLiters: "",
    fuelCost: "",
    tollCost: "0",
    otherExpenses: "0",
    revenue: "",
  });

  React.useEffect(() => {
    setForm({
      finalOdometerKm: "",
      fuelUsedLiters: "",
      fuelCost: "",
      tollCost: "0",
      otherExpenses: "0",
      revenue: "",
    });
  }, [open]);

  if (!open) return null;
  const inputCls =
    "w-full bg-[#F8FAFC] text-xs px-3 py-2 rounded-md border border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-md text-gray-400"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-1">
          Complete Trip
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          {trip?.source} → {trip?.destination}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              finalOdometerKm: Number(form.finalOdometerKm),
              fuelUsedLiters: Number(form.fuelUsedLiters),
              fuelCost: Number(form.fuelCost),
              tollCost: Number(form.tollCost),
              otherExpenses: Number(form.otherExpenses),
              revenue: Number(form.revenue),
            });
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Final Odometer (km)*
              </label>
              <input
                type="number"
                className={inputCls}
                required
                value={form.finalOdometerKm}
                onChange={(e) => setForm({ ...form, finalOdometerKm: e.target.value })}
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Fuel Used (L)*
              </label>
              <input
                type="number"
                className={inputCls}
                required
                value={form.fuelUsedLiters}
                onChange={(e) => setForm({ ...form, fuelUsedLiters: e.target.value })}
                min={0.1}
                step={0.1}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Fuel Cost (₹)*
              </label>
              <input
                type="number"
                className={inputCls}
                required
                value={form.fuelCost}
                onChange={(e) => setForm({ ...form, fuelCost: e.target.value })}
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Toll Cost (₹)
              </label>
              <input
                type="number"
                className={inputCls}
                value={form.tollCost}
                onChange={(e) => setForm({ ...form, tollCost: e.target.value })}
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Other Expenses (₹)
              </label>
              <input
                type="number"
                className={inputCls}
                value={form.otherExpenses}
                onChange={(e) => setForm({ ...form, otherExpenses: e.target.value })}
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Revenue (₹)*
              </label>
              <input
                type="number"
                className={inputCls}
                required
                value={form.revenue}
                onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                min={0}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs py-2 rounded-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Mark Complete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// DIALOG FOR CREATING AND EDITING TRIPS
function TripDialog({
  open,
  onClose,
  trip,
  vehicles,
  drivers,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  trip: any;
  vehicles: any[];
  drivers: any[];
  onSubmit: (data: any, dispatch: boolean) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoWeightKg: "",
    distanceKm: "",
  });

  React.useEffect(() => {
    if (trip) {
      setForm({
        source: trip.source,
        destination: trip.destination,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        cargoWeightKg: trip.cargoWeightKg.toString(),
        distanceKm: trip.distanceKm.toString(),
      });
    } else {
      setForm({
        source: "",
        destination: "",
        vehicleId: "",
        driverId: "",
        cargoWeightKg: "",
        distanceKm: "",
      });
    }
  }, [trip, open]);

  if (!open) return null;

  const selectedVehicle =
    vehicles?.find((v: any) => v.id === form.vehicleId) ||
    (trip && trip.vehicleId === form.vehicleId
      ? {
          registrationNumber: trip.vehicleRegistration,
          model: trip.vehicleModel,
          capacityKg: trip.vehicleCapacityKg || 99999,
        }
      : null);

  const cargoNum = Number(form.cargoWeightKg);
  const capacityExceeded =
    selectedVehicle && cargoNum > 0 && cargoNum > selectedVehicle.capacityKg;

  const inputCls =
    "w-full bg-[#F8FAFC] text-xs px-3 py-2 rounded-md border border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none";

  const handleSubmitInternal = (e: React.FormEvent, dispatch: boolean) => {
    e.preventDefault();
    if (capacityExceeded) return;
    onSubmit(
      {
        source: form.source,
        destination: form.destination,
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        cargoWeightKg: Number(form.cargoWeightKg),
        distanceKm: Number(form.distanceKm),
      },
      dispatch,
    );
  };

  // Merge trip's current vehicle and driver if not in list
  const allVehicles = [...vehicles];
  if (trip && !allVehicles.some((v) => v.id === trip.vehicleId)) {
    allVehicles.push({
      id: trip.vehicleId,
      registrationNumber: trip.vehicleRegistration,
      model: trip.vehicleModel,
      capacityKg: trip.vehicleCapacityKg || 99999,
    });
  }

  const allDrivers = [...drivers];
  if (trip && !allDrivers.some((d) => d.id === trip.driverId)) {
    allDrivers.push({
      id: trip.driverId,
      name: trip.driverName,
      licenseCategory: trip.driverLicenseCategory || "N/A",
      safetyScore: trip.driverSafetyScore || 100,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-6 rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-2">
            {trip ? "Edit Trip Draft" : "Create New Trip"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
              Source*
            </label>
            <input
              type="text"
              required
              className={inputCls}
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="Ahmedabad Hub"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
              Destination*
            </label>
            <input
              type="text"
              required
              className={inputCls}
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Sanand Warehouse"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
              Vehicle*
            </label>
            <select
              required
              className={inputCls}
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            >
              <option value="">Select vehicle...</option>
              {allVehicles.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} — {v.model} (Cap: {v.capacityKg}kg)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
              Driver*
            </label>
            <select
              required
              className={inputCls}
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
            >
              <option value="">Select driver...</option>
              {allDrivers.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.licenseCategory ? `— ${d.licenseCategory}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Cargo Weight (kg)*
              </label>
              <input
                type="number"
                required
                className={inputCls}
                value={form.cargoWeightKg}
                onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })}
                min={1}
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Distance (km)*
              </label>
              <input
                type="number"
                required
                className={inputCls}
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                min={1}
                placeholder="30"
              />
            </div>
          </div>

          {capacityExceeded && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              <span className="font-semibold block">⚠ Validation Error</span>
              Cargo {cargoNum}kg exceeds vehicle capacity of {selectedVehicle?.capacityKg}kg.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => handleSubmitInternal(e, false)}
              disabled={capacityExceeded || loading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gray-200"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {trip ? "Save Draft" : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmitInternal(e, true)}
              disabled={capacityExceeded || loading}
              className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {trip ? "Dispatch Now" : "Dispatch"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// TRIP KANBAN CARD
function TripKanbanCard({
  trip,
  canEdit,
  onEdit,
  onComplete,
  onCancel,
}: {
  trip: any;
  canEdit: boolean;
  onEdit: (trip: any) => void;
  onComplete: (trip: any) => void;
  onCancel: (id: string) => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", trip.id);
  };

  const isDraggable =
    canEdit &&
    (trip.status === "DRAFT" || trip.status === "DISPATCHED" || trip.status === "IN_PROGRESS");

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all space-y-3",
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="font-bold text-xs text-[#0F172A] block truncate">
            {trip.source} → {trip.destination}
          </span>
          <div className="text-[10px] text-gray-400 mt-1 space-y-0.5">
            {trip.vehicleRegistration && (
              <span className="block truncate">🚛 {trip.vehicleRegistration} ({trip.vehicleModel})</span>
            )}
            {trip.driverName && <span className="block truncate">👤 {trip.driverName}</span>}
          </div>
        </div>
        <span
          className={cn(
            "text-[9px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0",
            TRIP_STATUS_STYLES[trip.status],
          )}
        >
          {trip.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-50 pt-2">
        <span>
          Cargo: {trip.cargoWeightKg}kg · {trip.distanceKm}km
        </span>
      </div>

      {canEdit && (trip.status === "DRAFT" || trip.status === "DISPATCHED" || trip.status === "IN_PROGRESS") && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-50 mt-1">
          {trip.status === "DRAFT" && (
            <button
              onClick={() => onEdit(trip)}
              className="flex items-center gap-1 text-[9px] font-semibold bg-gray-50 hover:bg-gray-100 text-gray-600 px-2 py-0.5 rounded transition-colors border border-gray-100"
            >
              <Edit className="w-2.5 h-2.5" /> Edit
            </button>
          )}
          {(trip.status === "DISPATCHED" || trip.status === "IN_PROGRESS") && (
            <button
              onClick={() => onComplete(trip)}
              className="flex items-center gap-1 text-[9px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded transition-colors border border-emerald-100"
            >
              <CheckCircle2 className="w-2.5 h-2.5" /> Complete
            </button>
          )}
          <button
            onClick={() => onCancel(trip.id)}
            className="flex items-center gap-1 text-[9px] font-semibold bg-red-50 hover:bg-red-100 text-red-600 px-2 py-0.5 rounded transition-colors border border-red-100 ml-auto"
          >
            <XCircle className="w-2.5 h-2.5" /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// TRIP KANBAN BOARD
function TripKanbanBoard({
  trips,
  canEdit,
  onEdit,
  onComplete,
  onCancel,
  onTransition,
}: {
  trips: any[];
  canEdit: boolean;
  onEdit: (trip: any) => void;
  onComplete: (trip: any) => void;
  onCancel: (id: string) => void;
  onTransition: (tripId: string, newStatus: string) => void;
}) {
  const columns = [
    {
      id: "DRAFT",
      label: "Drafted",
      dotClass: "bg-gray-400",
      bgClass: "bg-gray-50/20 border-gray-200",
    },
    {
      id: "DISPATCHED",
      label: "On Trip",
      dotClass: "bg-blue-500",
      bgClass: "bg-blue-50/10 border-blue-200",
    },
    {
      id: "COMPLETED",
      label: "Completed",
      dotClass: "bg-emerald-500",
      bgClass: "bg-emerald-50/10 border-emerald-200",
    },
    {
      id: "CANCELLED",
      label: "Cancelled",
      dotClass: "bg-red-500",
      bgClass: "bg-red-50/10 border-red-200",
    },
  ];

  const grouped = {
    DRAFT: [] as any[],
    DISPATCHED: [] as any[],
    COMPLETED: [] as any[],
    CANCELLED: [] as any[],
  };

  trips.forEach((t) => {
    const colId = t.status === "IN_PROGRESS" || t.status === "DISPATCHED" ? "DISPATCHED" : t.status;
    if (grouped[colId as keyof typeof grouped]) {
      grouped[colId as keyof typeof grouped].push(t);
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colTrips = grouped[col.id as keyof typeof grouped] || [];

        const handleDragOver = (e: React.DragEvent) => {
          e.preventDefault();
        };

        const handleDrop = (e: React.DragEvent) => {
          e.preventDefault();
          const tripId = e.dataTransfer.getData("text/plain");
          if (tripId) {
            onTransition(tripId, col.id);
          }
        };

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col w-full min-w-[250px] rounded-xl border p-3 space-y-3 min-h-[500px]",
              col.bgClass,
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", col.dotClass)} />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {col.label}
                </span>
                <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  {colTrips.length}
                </span>
              </div>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {colTrips.map((trip) => (
                <TripKanbanCard
                  key={trip.id}
                  trip={trip}
                  canEdit={canEdit}
                  onEdit={onEdit}
                  onComplete={onComplete}
                  onCancel={onCancel}
                />
              ))}
              {colTrips.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/20">
                  <span className="text-xs">No trips</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// MAIN TRIPS PAGE COMPONENT
export const Trips: React.FC = () => {
  const { hasPermission, isAdmin } = useAuth();
  const canEdit = isAdmin || hasPermission("trips", "EDIT");
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [completeTrip, setCompleteTrip] = useState<any>(null);
  const [tripDialogOpen, setTripDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  // Form for list view creation
  const [listForm, setListForm] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoWeightKg: "",
    distanceKm: "",
  });
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

  // MUTATIONS
  const createTripMutation = useMutation({
    mutationFn: async (body: any) => {
      const { data } = await api.post("/trips", body);
      return data.trip;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles-available"] });
      qc.invalidateQueries({ queryKey: ["drivers-available"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Trip draft created successfully!");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to create trip draft."),
  });

  const updateTripMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) => {
      const { data } = await api.patch(`/trips/${id}`, body);
      return data.trip;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles-available"] });
      qc.invalidateQueries({ queryKey: ["drivers-available"] });
      toast.success("Trip updated successfully!");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to update trip."),
  });

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
      setListForm({
        source: "",
        destination: "",
        vehicleId: "",
        driverId: "",
        cargoWeightKg: "",
        distanceKm: "",
      });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Dispatch failed."),
  });

  const dispatchExistingMutation = useMutation({
    mutationFn: async (tripId: string) => {
      await api.post(`/trips/${tripId}/dispatch`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles-available"] });
      qc.invalidateQueries({ queryKey: ["drivers-available"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Trip dispatched successfully!");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Dispatch failed."),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api.post(`/trips/${id}/complete`, body),
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
    mutationFn: (id: string) => api.post(`/trips/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles-available"] });
      qc.invalidateQueries({ queryKey: ["drivers-available"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Trip cancelled.");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Cannot cancel trip."),
  });

  const handleCancelClick = (id: string) => {
    if (window.confirm("Cancel this trip?")) {
      cancelMutation.mutate(id);
    }
  };

  // DIALOG FORM SUBMIT HANDLER
  const handleSaveTrip = async (formData: any, dispatchImmediately: boolean) => {
    try {
      if (selectedTrip) {
        if (dispatchImmediately) {
          await updateTripMutation.mutateAsync({ id: selectedTrip.id, body: formData });
          await dispatchExistingMutation.mutateAsync(selectedTrip.id);
        } else {
          await updateTripMutation.mutateAsync({ id: selectedTrip.id, body: formData });
        }
      } else {
        if (dispatchImmediately) {
          await dispatchMutation.mutateAsync(formData);
        } else {
          await createTripMutation.mutateAsync(formData);
        }
      }
      setTripDialogOpen(false);
      setSelectedTrip(null);
    } catch {
      // errors handled by mutation
    }
  };

  // LIST VIEW CREATE SUBMIT
  const selectedListVehicle = vehiclesData?.find((v: any) => v.id === listForm.vehicleId);
  const listCargoNum = Number(listForm.cargoWeightKg);
  const listCapacityExceeded =
    selectedListVehicle && listCargoNum > 0 && listCargoNum > selectedListVehicle.capacityKg;

  const handleListDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (listCapacityExceeded) {
      setValidationError(
        `Cargo ${listCargoNum}kg exceeds vehicle capacity of ${selectedListVehicle?.capacityKg}kg.`,
      );
      return;
    }
    setValidationError(null);
    dispatchMutation.mutate({
      source: listForm.source,
      destination: listForm.destination,
      vehicleId: listForm.vehicleId,
      driverId: listForm.driverId,
      cargoWeightKg: Number(listForm.cargoWeightKg),
      distanceKm: Number(listForm.distanceKm),
    });
  };

  // KANBAN DRAG-AND-DROP TRANSITION HANDLER
  const handleTransition = async (tripId: string, newStatus: string) => {
    const trip = tripsData?.find((t: any) => t.id === tripId);
    if (!trip) return;

    const currentStatus =
      trip.status === "IN_PROGRESS" || trip.status === "DISPATCHED" ? "DISPATCHED" : trip.status;
    if (currentStatus === newStatus) return;

    if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
      toast.error("Completed or cancelled trips cannot be modified.");
      return;
    }

    if (newStatus === "DRAFT") {
      toast.error("Cannot revert a trip to draft once dispatched, completed, or cancelled.");
      return;
    }

    if (newStatus === "DISPATCHED") {
      try {
        await dispatchExistingMutation.mutateAsync(tripId);
      } catch {
        // error already toasted
      }
    } else if (newStatus === "COMPLETED") {
      setCompleteTrip(trip);
    } else if (newStatus === "CANCELLED") {
      handleCancelClick(tripId);
    }
  };

  // FILTERED TRIPS FOR SEARCH
  const filteredTrips = (tripsData || []).filter((trip: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      trip.source.toLowerCase().includes(searchLower) ||
      trip.destination.toLowerCase().includes(searchLower) ||
      (trip.vehicleRegistration && trip.vehicleRegistration.toLowerCase().includes(searchLower)) ||
      (trip.driverName && trip.driverName.toLowerCase().includes(searchLower)) ||
      trip.status.toLowerCase().includes(searchLower)
    );
  });

  const inputCls =
    "w-full bg-[#F8FAFC] text-xs px-3 py-2 rounded-md border border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none";

  return (
    <div className="space-y-6">
      <CompleteModal
        open={!!completeTrip}
        onClose={() => setCompleteTrip(null)}
        trip={completeTrip}
        onSubmit={(data) => completeMutation.mutate({ id: completeTrip.id, body: data })}
        loading={completeMutation.isPending}
      />

      <TripDialog
        open={tripDialogOpen}
        onClose={() => {
          setTripDialogOpen(false);
          setSelectedTrip(null);
        }}
        trip={selectedTrip}
        vehicles={vehiclesData || []}
        drivers={driversData || []}
        onSubmit={handleSaveTrip}
        loading={
          createTripMutation.isPending ||
          updateTripMutation.isPending ||
          dispatchMutation.isPending ||
          dispatchExistingMutation.isPending
        }
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Trip Dispatcher</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage trips, dispatch vehicles, and track routes dynamically.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white text-xs pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors w-48"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "kanban"
                  ? "bg-white text-gray-800 shadow-xs"
                  : "text-gray-400 hover:text-gray-600",
              )}
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "list"
                  ? "bg-white text-gray-800 shadow-xs"
                  : "text-gray-400 hover:text-gray-600",
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* New Trip Button */}
          {canEdit && (
            <button
              onClick={() => {
                setSelectedTrip(null);
                setTripDialogOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Trip
            </button>
          )}
        </div>
      </div>

      {/* VIEW RENDERER */}
      {viewMode === "kanban" ? (
        tripsLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
          </div>
        ) : (
          <TripKanbanBoard
            trips={filteredTrips}
            canEdit={canEdit}
            onEdit={(trip) => {
              setSelectedTrip(trip);
              setTripDialogOpen(true);
            }}
            onComplete={(trip) => setCompleteTrip(trip)}
            onCancel={handleCancelClick}
            onTransition={handleTransition}
          />
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Trip Form (List View Layout) */}
          {canEdit && (
            <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm h-fit">
              <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider mb-5">
                Create & Dispatch Trip
              </h3>
              <form onSubmit={handleListDispatch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Source*
                  </label>
                  <input
                    type="text"
                    required
                    className={inputCls}
                    value={listForm.source}
                    onChange={(e) => setListForm({ ...listForm, source: e.target.value })}
                    placeholder="Ahmedabad Hub"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Destination*
                  </label>
                  <input
                    type="text"
                    required
                    className={inputCls}
                    value={listForm.destination}
                    onChange={(e) => setListForm({ ...listForm, destination: e.target.value })}
                    placeholder="Sanand Warehouse"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Vehicle (Available Only)*
                  </label>
                  <select
                    required
                    className={inputCls}
                    value={listForm.vehicleId}
                    onChange={(e) =>
                      setListForm({ ...listForm, vehicleId: e.target.value, cargoWeightKg: "" })
                    }
                  >
                    <option value="">Select vehicle...</option>
                    {(vehiclesData || []).map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} — {v.model} (Cap: {v.capacityKg}kg)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Driver (Available Only)*
                  </label>
                  <select
                    required
                    className={inputCls}
                    value={listForm.driverId}
                    onChange={(e) => setListForm({ ...listForm, driverId: e.target.value })}
                  >
                    <option value="">Select driver...</option>
                    {(driversData || []).map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.licenseCategory} (Safety: {d.safetyScore}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                      Cargo Weight (kg)*
                    </label>
                    <input
                      type="number"
                      required
                      className={inputCls}
                      value={listForm.cargoWeightKg}
                      onChange={(e) => setListForm({ ...listForm, cargoWeightKg: e.target.value })}
                      min={1}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                      Distance (km)*
                    </label>
                    <input
                      type="number"
                      required
                      className={inputCls}
                      value={listForm.distanceKm}
                      onChange={(e) => setListForm({ ...listForm, distanceKm: e.target.value })}
                      min={1}
                      placeholder="30"
                    />
                  </div>
                </div>

                {(listCapacityExceeded || validationError) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                    <span className="font-semibold block">⚠ Validation Error</span>
                    {listCapacityExceeded
                      ? `Cargo ${listCargoNum}kg exceeds vehicle capacity of ${selectedListVehicle?.capacityKg}kg.`
                      : validationError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!!listCapacityExceeded || dispatchMutation.isPending}
                    className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {dispatchMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Dispatch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setListForm({
                        source: "",
                        destination: "",
                        vehicleId: "",
                        driverId: "",
                        cargoWeightKg: "",
                        distanceKm: "",
                      });
                      setValidationError(null);
                    }}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2.5 rounded-md transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Live Board (List View Layout) */}
          <div
            className={cn(
              "bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm",
              canEdit ? "lg:col-span-7" : "lg:col-span-12",
            )}
          >
            <h3 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider mb-5">
              Live Board
            </h3>
            {tripsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
              </div>
            ) : !filteredTrips.length ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No trips yet or none match your search.
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {filteredTrips.map((trip: any) => (
                  <div key={trip.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-[#0F172A]">
                          {trip.source} → {trip.destination}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {trip.vehicleRegistration && (
                            <span className="mr-3">🚛 {trip.vehicleRegistration}</span>
                          )}
                          {trip.driverName && <span>👤 {trip.driverName}</span>}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0",
                          TRIP_STATUS_STYLES[trip.status],
                        )}
                      >
                        {trip.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Cargo: {trip.cargoWeightKg}kg · {trip.distanceKm}km
                      </span>
                      <span className="text-gray-400 text-[10px]">
                        {new Date(trip.createdAt).toLocaleDateString("en-IN")}
                      </span>
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
                          onClick={() => handleCancelClick(trip.id)}
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
      )}
    </div>
  );
};
