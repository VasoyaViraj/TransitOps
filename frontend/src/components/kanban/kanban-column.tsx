import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "../../lib/utils";
import { STATUS_LABELS } from "../../hooks/use-kanban";
import type { Task } from "../../hooks/use-kanban";
import { TaskCard } from "./task-card";
import { Plus } from "lucide-react";

interface KanbanColumnProps {
  status: string;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onAdd: (status: string) => void;
}

const COLUMN_COLORS: Record<string, { header: string; dot: string; bg: string; border: string }> = {
  BACKLOG: {
    header: "bg-gray-50 border-gray-200",
    dot: "bg-gray-400",
    bg: "bg-gray-50/30",
    border: "border-gray-200",
  },
  TODO: {
    header: "bg-blue-50/50 border-blue-200",
    dot: "bg-blue-500",
    bg: "bg-blue-50/20",
    border: "border-blue-200",
  },
  IN_PROGRESS: {
    header: "bg-amber-50/50 border-amber-200",
    dot: "bg-amber-500",
    bg: "bg-amber-50/20",
    border: "border-amber-200",
  },
  WAITING_APPROVAL: {
    header: "bg-purple-50/50 border-purple-200",
    dot: "bg-purple-500",
    bg: "bg-purple-50/20",
    border: "border-purple-200",
  },
  BLOCKED: {
    header: "bg-red-50/50 border-red-200",
    dot: "bg-red-500",
    bg: "bg-red-50/20",
    border: "border-red-200",
  },
  COMPLETED: {
    header: "bg-emerald-50/50 border-emerald-200",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50/20",
    border: "border-emerald-200",
  },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks, onOpen, onAdd }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const colors = COLUMN_COLORS[status] || COLUMN_COLORS.BACKLOG;

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0 w-[300px] rounded-xl border overflow-hidden transition-colors duration-200",
        colors.bg,
        colors.border,
        isOver && "ring-2 ring-emerald-400 ring-offset-2 bg-emerald-50/30",
      )}
    >
      <div className={cn("px-4 py-3 border-b flex items-center justify-between sticky top-0 z-10", colors.header)}>
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
            {STATUS_LABELS[status] || status}
          </h3>
          <span className="text-[11px] font-medium text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-full border border-gray-200/50 min-w-[20px] text-center">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(status); }}
          className="p-1 hover:bg-white/80 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-280px)]"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpen} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-2", colors.bg)}>
              <Plus className={cn("w-5 h-5", colors.dot.replace("bg-", "text-"))} />
            </div>
            <p className="text-xs font-medium">No tasks</p>
            <button
              onClick={() => onAdd(status)}
              className="text-xs text-gray-400 hover:text-gray-600 mt-1 underline underline-offset-2"
            >
              Add a task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
