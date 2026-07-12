import React, { useState, useCallback, useEffect } from "react";
import {
  KanbanBoard,
} from "../components/kanban/kanban-board";
import { TaskDialog } from "../components/kanban/task-dialog";
import {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useDuplicateTask,
  useAddComment,
  useAddChecklist,
  useUpdateChecklist,
  useDeleteChecklist,
  useLabels,
  COLUMN_STATUSES,
  STATUS_LABELS,
  type Task,
} from "../hooks/use-kanban";
import { useAuth } from "../hooks/use-auth";
import { cn } from "../lib/utils";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Loader2,
  Filter,
  X,
} from "lucide-react";

export const Kanban: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const canEdit = isAdmin || hasPermission("fleet", "EDIT");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [initialStatus, setInitialStatus] = useState("BACKLOG");

  const params: Record<string, string> = {};
  if (debouncedSearch) params.search = debouncedSearch;
  if (statusFilter) params.status = statusFilter;
  if (priorityFilter) params.priority = priorityFilter;
  if (typeFilter) params.taskType = typeFilter;
  params.limit = "200";

  const { data, isLoading } = useTasks(params);
  const { data: taskDetails, refetch: refetchTask } = useTask(selectedTaskId);
  const { data: labelsData } = useLabels();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const duplicateTask = useDuplicateTask();
  const addComment = useAddComment();
  const addChecklist = useAddChecklist();
  const updateChecklist = useUpdateChecklist();
  const deleteChecklist = useDeleteChecklist();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const tasks = data?.tasks || [];

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: string) => {
      await updateStatus.mutateAsync({ id: taskId, status: newStatus });
    },
    [updateStatus],
  );

  const handleOpenTask = useCallback(
    (task: Task) => {
      setSelectedTaskId(task.id);
      setIsCreating(false);
      setDialogOpen(true);
    },
    [],
  );

  const handleAddTask = useCallback(
    (status: string) => {
      setSelectedTaskId(null);
      setIsCreating(true);
      setInitialStatus(status);
      setDialogOpen(true);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (data: any) => {
      if (isCreating) {
        await createTask.mutateAsync(data);
      } else if (selectedTaskId) {
        await updateTask.mutateAsync({ id: selectedTaskId, data });
      }
    },
    [isCreating, selectedTaskId, createTask, updateTask],
  );

  const handleClose = useCallback(() => {
    setDialogOpen(false);
    setSelectedTaskId(null);
  }, []);

  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setTypeFilter("");
  };

  const hasFilters = statusFilter || priorityFilter || typeFilter;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Operations Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={() => handleAddTask("BACKLOG")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white text-xs pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
            showFilters || hasFilters
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {hasFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-2 text-xs text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filter by
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="">All Statuses</option>
            {COLUMN_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="">All Priorities</option>
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="">All Types</option>
            {["TRIP", "MAINTENANCE", "INSPECTION", "FUEL", "EXPENSE", "DRIVER", "VEHICLE", "INCIDENT", "COMPLIANCE", "DOCUMENT_RENEWAL", "GENERAL_TASK"].map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onOpenTask={handleOpenTask}
            onAddTask={handleAddTask}
          />
        )}
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onClose={handleClose}
        task={isCreating ? null : (taskDetails || null)}
        isCreating={isCreating}
        initialStatus={initialStatus}
        labels={labelsData || []}
        onSubmit={handleSubmit}
        onStatusChange={async (id, status) => {
          await updateStatus.mutateAsync({ id, status });
          await refetchTask();
        }}
        onDelete={async (id) => {
          await deleteTask.mutateAsync(id);
          handleClose();
        }}
        onDuplicate={async (id) => {
          await duplicateTask.mutateAsync(id);
          handleClose();
        }}
        onAddComment={async (taskId, data) => {
          await addComment.mutateAsync({ taskId, data });
          await refetchTask();
        }}
        onAddChecklist={async (taskId, content) => {
          await addChecklist.mutateAsync({ taskId, content });
          await refetchTask();
        }}
        onUpdateChecklist={async (taskId, checklistId, data) => {
          await updateChecklist.mutateAsync({ taskId, checklistId, data });
          await refetchTask();
        }}
        onDeleteChecklist={async (taskId, checklistId) => {
          await deleteChecklist.mutateAsync({ taskId, checklistId });
          await refetchTask();
        }}
      />
    </div>
  );
};
