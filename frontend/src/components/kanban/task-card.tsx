import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  MessageSquare,
  Paperclip,
  Clock,
  CheckSquare,
  CalendarClock,
  AlertTriangle,
  Truck,
  Wrench,
  Search,
  Fuel,
  DollarSign,
  Users,
  Car,
  ShieldAlert,
  FileText,
  ClipboardCheck,
  MoreHorizontal,
  User,
} from "lucide-react";

import type { Task } from "../../hooks/use-kanban";
import { PRIORITY_COLORS, PRIORITY_BORDER } from "../../hooks/use-kanban";
import { cn } from "../../lib/utils";

interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
}

const TASK_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  TRIP: { icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
  MAINTENANCE: { icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" },
  INSPECTION: { icon: Search, color: "text-purple-600", bg: "bg-purple-50" },
  FUEL: { icon: Fuel, color: "text-yellow-600", bg: "bg-yellow-50" },
  EXPENSE: { icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
  DRIVER: { icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
  VEHICLE: { icon: Car, color: "text-indigo-600", bg: "bg-indigo-50" },
  INCIDENT: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  COMPLIANCE: { icon: ShieldAlert, color: "text-teal-600", bg: "bg-teal-50" },
  DOCUMENT_RENEWAL: { icon: FileText, color: "text-pink-600", bg: "bg-pink-50" },
  GENERAL_TASK: { icon: ClipboardCheck, color: "text-gray-600", bg: "bg-gray-50" },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return { text: `${Math.abs(days)}d overdue`, urgent: true };
  if (days === 0) return { text: "Today", urgent: true };
  if (days === 1) return { text: "Tomorrow", urgent: false };
  if (days <= 7) return { text: `In ${days} days`, urgent: false };
  return { text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), urgent: false };
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onOpen }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDateInfo = formatDate(task.dueDate);
  const typeConfig = TASK_TYPE_CONFIG[task.taskType] || TASK_TYPE_CONFIG.GENERAL_TASK;
  const TypeIcon = typeConfig.icon;
  const completedChecklist = task.checklistCount > 0 ? `${task.checklistCompletedCount}/${task.checklistCount}` : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
        PRIORITY_BORDER[task.priority],
        isDragging && "opacity-50 shadow-lg rotate-[2deg] scale-[1.02]",
      )}
      onClick={() => onOpen(task)}
    >
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <button
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors -ml-1 p-0.5"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap",
          PRIORITY_COLORS[task.priority],
        )}>
          {task.priority === "CRITICAL" && <AlertTriangle className="w-2.5 h-2.5" />}
          {task.priority}
        </span>
        <div className="flex-1" />
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-100 rounded text-gray-400"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-1">
        <div className="flex items-start gap-2">
          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5", typeConfig.bg)}>
            <TypeIcon className={cn("w-3.5 h-3.5", typeConfig.color)} />
          </div>
          <h3 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">
            {task.title}
          </h3>
        </div>
      </div>

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 py-1">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: label.color + "20", color: label.color }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] text-gray-400">+{task.labels.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          {task.assignedUser ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[8px] font-bold">
                {task.assignedUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] text-gray-500 truncate max-w-[80px]">
                {task.assignedUser.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-300">
              <User className="w-3 h-3" />
              <span className="text-[11px]">Unassigned</span>
            </div>
          )}
        </div>
        {dueDateInfo && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-medium",
            dueDateInfo.urgent ? "text-red-500" : "text-gray-400",
          )}>
            <CalendarClock className="w-3 h-3" />
            <span>{dueDateInfo.text}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 px-3 pb-3 pt-1 text-gray-400">
        {completedChecklist && (
          <div className="flex items-center gap-1 text-[11px]">
            <CheckSquare className="w-3 h-3" />
            <span>{completedChecklist}</span>
          </div>
        )}
        {task.commentCount > 0 && (
          <div className="flex items-center gap-1 text-[11px]">
            <MessageSquare className="w-3 h-3" />
            <span>{task.commentCount}</span>
          </div>
        )}
        {task.attachmentCount > 0 && (
          <div className="flex items-center gap-1 text-[11px]">
            <Paperclip className="w-3 h-3" />
            <span>{task.attachmentCount}</span>
          </div>
        )}
        {task.estimatedHours && (
          <div className="flex items-center gap-1 text-[11px] ml-auto">
            <Clock className="w-3 h-3" />
            <span>{task.estimatedHours}h</span>
          </div>
        )}
      </div>
    </div>
  );
};
