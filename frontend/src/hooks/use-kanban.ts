import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "WAITING_APPROVAL" | "BLOCKED" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  taskType: "TRIP" | "MAINTENANCE" | "INSPECTION" | "FUEL" | "EXPENSE" | "DRIVER" | "VEHICLE" | "INCIDENT" | "COMPLIANCE" | "DOCUMENT_RENEWAL" | "GENERAL_TASK";
  assignedUserId: string | null;
  createdById: string;
  dueDate: string | null;
  estimatedHours: number | null;
  vehicleId: string | null;
  driverId: string | null;
  tripId: string | null;
  maintenanceId: string | null;
  archived: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUser: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
  vehicle: { id: string; registrationNumber: string; model: string } | null;
  driver: { id: string; name: string; licenseNumber: string } | null;
  trip: { id: string; source: string; destination: string; status: string } | null;
  commentCount: number;
  attachmentCount: number;
  checklistCount: number;
  checklistCompletedCount: number;
  watcherCount: number;
  labels: Label[];
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface DashboardStats {
  tasksDueToday: number;
  overdueTasks: number;
  criticalTasks: number;
  blockedTasks: number;
  completedThisWeek: number;
  averageCompletionTime: number;
  taskCompletionRate: number;
  cardsPerColumn: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
  tasksByType: { taskType: string; count: number }[];
  recentActivity: ActivityItem[];
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  edited: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; email: string };
}

export interface Checklist {
  id: string;
  taskId: string;
  content: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  uploadedById: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; name: string };
  task: { id: string; title: string };
}

export interface Watcher {
  id: string;
  userId: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface TaskDetails extends Task {
  comments: Comment[];
  checklists: Checklist[];
  attachments: Attachment[];
  watchers: Watcher[];
  history: ActivityItem[];
}

const COLUMN_STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "WAITING_APPROVAL",
  "BLOCKED",
  "COMPLETED",
] as const;

export { COLUMN_STATUSES };

export const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  WAITING_APPROVAL: "Waiting Approval",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
  MEDIUM: "bg-blue-50 text-blue-600 border-blue-200",
  HIGH: "bg-orange-50 text-orange-600 border-orange-200",
  CRITICAL: "bg-red-50 text-red-600 border-red-300",
};

export const PRIORITY_BORDER: Record<string, string> = {
  LOW: "",
  MEDIUM: "",
  HIGH: "",
  CRITICAL: "border-l-2 border-l-red-500",
};

export function useTasks(params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const query = searchParams.toString();

  return useQuery({
    queryKey: ["tasks", params],
    queryFn: async () => {
      const res = await api.get(`/tasks${query ? `?${query}` : ""}`);
      return res.data as { tasks: Task[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
    },
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const res = await api.get(`/tasks/${id}`);
      return res.data.task as TaskDetails;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/tasks", data);
      return res.data.task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks-dashboard"] });
      toast.success("Task created");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/tasks/${id}`, data);
      return res.data.task;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", task.id] });
      qc.invalidateQueries({ queryKey: ["tasks-dashboard"] });
      toast.success("Task updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update task");
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/tasks/${id}/status`, { status });
      return res.data.task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update status");
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks-dashboard"] });
      toast.success("Task archived");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete task");
    },
  });
}

export function useDuplicateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/tasks/${id}/duplicate`);
      return res.data.task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task duplicated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to duplicate task");
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: { content: string; parentId?: string | null } }) => {
      const res = await api.post(`/tasks/${taskId}/comments`, data);
      return res.data.comment;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.taskId] });
      toast.success("Comment added");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to add comment");
    },
  });
}

export function useAddChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const res = await api.post(`/tasks/${taskId}/checklists`, { content });
      return res.data.item;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.taskId] });
    },
  });
}

export function useUpdateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, checklistId, data }: { taskId: string; checklistId: string; data: any }) => {
      const res = await api.patch(`/tasks/${taskId}/checklists/${checklistId}`, data);
      return res.data.item;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.taskId] });
    },
  });
}

export function useDeleteChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, checklistId }: { taskId: string; checklistId: string }) => {
      await api.delete(`/tasks/${taskId}/checklists/${checklistId}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.taskId] });
    },
  });
}

export function useToggleWatcher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, watching }: { taskId: string; watching: boolean }) => {
      if (watching) {
        await api.delete(`/tasks/${taskId}/watchers`);
      } else {
        await api.post(`/tasks/${taskId}/watchers`);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.taskId] });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["tasks-dashboard"],
    queryFn: async () => {
      const res = await api.get("/tasks/dashboard");
      return res.data.stats as DashboardStats;
    },
  });
}

export function useLabels() {
  return useQuery({
    queryKey: ["task-labels"],
    queryFn: async () => {
      const res = await api.get("/tasks/labels");
      return res.data.labels as Label[];
    },
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await api.post("/tasks/labels", data);
      return res.data.label;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-labels"] });
    },
  });
}
