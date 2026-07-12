import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Loader2,
  Send,
  Trash2,
  Check,
  Plus,
  X,
  Clock,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Eye,
  EyeOff,
  History,
  AlertTriangle,
  Copy,
  Archive,
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
  CalendarClock,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  PRIORITY_COLORS,
  STATUS_LABELS,
  type Task,
  type TaskDetails,
  type Comment,
  type Checklist,
  type Label,
} from "../../hooks/use-kanban";
import { useAuth } from "../../hooks/use-auth";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  task: TaskDetails | Task | null;
  isCreating: boolean;
  initialStatus?: string;
  labels: Label[];
  onSubmit: (data: any) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddComment: (taskId: string, data: { content: string; parentId?: string | null }) => void;
  onAddChecklist: (taskId: string, content: string) => void;
  onUpdateChecklist: (taskId: string, checklistId: string, data: any) => void;
  onDeleteChecklist: (taskId: string, checklistId: string) => void;
  loading?: boolean;
}

const TASK_TYPES = [
  { value: "TRIP", label: "Trip", icon: Truck },
  { value: "MAINTENANCE", label: "Maintenance", icon: Wrench },
  { value: "INSPECTION", label: "Inspection", icon: Search },
  { value: "FUEL", label: "Fuel", icon: Fuel },
  { value: "EXPENSE", label: "Expense", icon: DollarSign },
  { value: "DRIVER", label: "Driver", icon: Users },
  { value: "VEHICLE", label: "Vehicle", icon: Car },
  { value: "INCIDENT", label: "Incident", icon: AlertTriangle },
  { value: "COMPLIANCE", label: "Compliance", icon: ShieldAlert },
  { value: "DOCUMENT_RENEWAL", label: "Document Renewal", icon: FileText },
  { value: "GENERAL_TASK", label: "General Task", icon: ClipboardCheck },
];

const TASK_STATUSES = [
  "BACKLOG", "TODO", "IN_PROGRESS", "WAITING_APPROVAL", "BLOCKED", "COMPLETED",
];

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "";
  return format(new Date(dateStr), "MMM d, yyyy h:mm a");
}

export const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  onClose,
  task,
  isCreating,
  initialStatus,
  labels,
  onSubmit,
  onStatusChange,
  onDelete,
  onDuplicate,
  onAddComment,
  onAddChecklist,
  onUpdateChecklist,
  onDeleteChecklist,
  loading,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("BACKLOG");
  const [priority, setPriority] = useState("MEDIUM");
  const [taskType, setTaskType] = useState("GENERAL_TASK");
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [checklistInput, setChecklistInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !isCreating && task;

  useEffect(() => {
    if (isCreating) {
      setTitle("");
      setDescription("");
      setStatus(initialStatus || "BACKLOG");
      setPriority("MEDIUM");
      setTaskType("GENERAL_TASK");
      setAssignedUserId(null);
      setDueDate("");
      setEstimatedHours("");
      setSelectedLabels([]);
      setComment("");
      setChecklistInput("");
    } else if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setTaskType(task.taskType);
      setAssignedUserId(task.assignedUserId);
      setDueDate(task.dueDate ? task.dueDate.slice(0, 16) : "");
      setEstimatedHours(task.estimatedHours?.toString() || "");
      setSelectedLabels(task.labels?.map((l: any) => l.id) || []);
    }
  }, [task, isCreating, initialStatus, open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      const data: any = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        taskType,
        assignedUserId: assignedUserId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        estimatedHours: estimatedHours ? parseInt(estimatedHours, 10) : null,
        labelIds: selectedLabels.length > 0 ? selectedLabels : undefined,
      };
      await onSubmit(data);
      onClose();
    } catch {
      // error handled by mutation
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (task && !isCreating) {
      setStatus(newStatus);
      await onStatusChange(task.id, newStatus);
    } else {
      setStatus(newStatus);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !task) return;
    await onAddComment(task.id, { content: comment.trim() });
    setComment("");
  };

  const handleAddChecklist = async () => {
    if (!checklistInput.trim() || !task) return;
    await onAddChecklist(task.id, checklistInput.trim());
    setChecklistInput("");
  };

  const handleToggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    );
  };

  const taskDetails = task as TaskDetails | null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {isCreating ? "Create Task" : "Edit Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {TASK_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all",
                status === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-semibold border-0 px-0 text-gray-900 placeholder:text-gray-300 focus-visible:ring-0"
          />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className={cn("px-2 py-0.5 rounded text-xs font-semibold", PRIORITY_COLORS[p])}>
                        {p}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Type</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className="w-3.5 h-3.5 text-gray-500" />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Assignee</Label>
              <Select value={assignedUserId || ""} onValueChange={(v) => setAssignedUserId(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {user && (
                    <SelectItem value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[8px] flex items-center justify-center font-bold">
                          {user.name.charAt(0)}
                        </div>
                        {user.name}
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">
                <CalendarClock className="w-3 h-3 inline mr-1" />
                Due Date
              </Label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">
                <Clock className="w-3 h-3 inline mr-1" />
                Est. Hours
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Description</Label>
            <Textarea
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-2 block">
              <Tag className="w-3 h-3 inline mr-1" />
              Labels
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => handleToggleLabel(label.id)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all",
                    selectedLabels.includes(label.id)
                      ? "border-transparent text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-300",
                  )}
                  style={
                    selectedLabels.includes(label.id)
                      ? { backgroundColor: label.color }
                      : undefined
                  }
                >
                  {label.name}
                </button>
              ))}
              {labels.length === 0 && (
                <span className="text-xs text-gray-300">No labels available</span>
              )}
            </div>
          </div>

          {/* Detail Tabs (for editing) */}
          {!isCreating && task && (
            <Tabs defaultValue="comments" className="mt-6">
              <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
                {[
                  { value: "comments", label: "Comments", icon: MessageSquare, count: taskDetails?.comments?.length },
                  { value: "checklist", label: "Checklist", icon: CheckSquare, count: taskDetails?.checklists?.length },
                  { value: "activity", label: "History", icon: History },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none"
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="text-[10px] text-gray-400">({tab.count})</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="comments" className="pt-4">
                <div className="space-y-4">
                  {taskDetails?.comments && taskDetails.comments.length > 0 ? (
                    taskDetails.comments.map((comment: Comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {comment.author.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">{comment.author.name}</span>
                            <span className="text-[10px] text-gray-400">{formatDateTime(comment.createdAt)}</span>
                            {comment.edited && (
                              <span className="text-[10px] text-gray-300 italic">(edited)</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-6">No comments yet</p>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Input
                      placeholder="Write a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleAddComment())}
                      className="text-xs"
                    />
                    <Button size="sm" onClick={handleAddComment} disabled={!comment.trim()}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="checklist" className="pt-4">
                <div className="space-y-2">
                  {taskDetails?.checklists && taskDetails.checklists.length > 0 ? (
                    taskDetails.checklists.map((item: Checklist) => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <button
                          onClick={() =>
                            onUpdateChecklist(task.id, item.id, { completed: !item.completed })
                          }
                          className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                            item.completed
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-gray-300 hover:border-gray-400",
                          )}
                        >
                          {item.completed && <Check className="w-2.5 h-2.5" />}
                        </button>
                        <span className={cn(
                          "text-xs flex-1",
                          item.completed && "line-through text-gray-400",
                        )}>
                          {item.content}
                        </span>
                        <button
                          onClick={() => onDeleteChecklist(task.id, item.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-6">No checklist items</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add checklist item..."
                      value={checklistInput}
                      onChange={(e) => setChecklistInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddChecklist()}
                      className="text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={handleAddChecklist} disabled={!checklistInput.trim()}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="pt-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {taskDetails?.history && taskDetails.history.length > 0 ? (
                    taskDetails.history.map((entry: any) => (
                      <div key={entry.id} className="flex items-start gap-3 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-700">{entry.user.name}</span>{" "}
                          <span className="text-gray-500">
                            {entry.action === "created" && "created this task"}
                            {entry.action === "archived" && "archived this task"}
                            {entry.action === "status_changed" && `changed status from ${entry.oldValue} to ${entry.newValue}`}
                            {entry.action === "updated" && entry.field === "priority" && `changed priority to ${entry.newValue}`}
                            {entry.action === "updated" && entry.field === "assignedUserId" && `assigned task`}
                            {entry.action === "updated" && entry.field && !["priority", "assignedUserId", "status"].includes(entry.field) && `updated ${entry.field.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                            {entry.action === "updated" && !entry.field && "updated this task"}
                            {entry.action === "comment_added" && "added a comment"}
                            {!["created", "archived", "status_changed", "updated", "comment_added"].includes(entry.action) && entry.action}
                          </span>
                          <span className="text-gray-400 ml-1">{formatDateTime(entry.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-6">No activity yet</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-2">
              {!isCreating && task && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDuplicate(task.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(task.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Archive className="w-3.5 h-3.5 mr-1" />
                    Archive
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting || !title.trim()}>
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                {isCreating ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
