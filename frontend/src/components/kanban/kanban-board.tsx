import React, { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import type { Task } from "../../hooks/use-kanban";
import { COLUMN_STATUSES } from "../../hooks/use-kanban";

type TaskStatus = Task["status"];

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onOpenTask: (task: Task) => void;
  onAddTask: (status: string) => void;
  loading?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onStatusChange,
  onOpenTask,
  onAddTask,
  loading,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [columns, setColumns] = useState<Record<string, Task[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groupedTasks = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const status of COLUMN_STATUSES) {
      grouped[status] = tasks
        .filter((t) => t.status === status)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return grouped;
  }, [tasks]);

  const isColumnStatus = useCallback(
    (value: string): value is TaskStatus => COLUMN_STATUSES.includes(value as TaskStatus),
    [],
  );

  const findColumn = useCallback(
    (taskId: string): TaskStatus | null => {
      for (const [status, items] of Object.entries(groupedTasks)) {
        if (items.some((t) => t.id === taskId)) return status as TaskStatus;
      }
      return null;
    },
    [groupedTasks],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) setActiveTask(task);
    },
    [tasks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeColumn = findColumn(activeId);
      const overColumn = isColumnStatus(overId) ? overId : findColumn(overId);

      if (!activeColumn || !overColumn) return;

      if (activeColumn !== overColumn) {
        onStatusChange(activeId, overColumn);
      }
    },
    [findColumn, isColumnStatus, onStatusChange],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeColumn = findColumn(activeId);
      const overColumn = isColumnStatus(overId) ? overId : findColumn(overId);

      if (!activeColumn || !overColumn || activeColumn === overColumn) return;

      setColumns((prev) => {
        const newCols = { ...prev };
        const activeItems = [...(newCols[activeColumn] || groupedTasks[activeColumn] || [])];
        const overItems = [...(newCols[overColumn] || groupedTasks[overColumn] || [])];

        const activeIndex = activeItems.findIndex((t) => t.id === activeId);
        if (activeIndex === -1) return prev;

        const [movedItem] = activeItems.splice(activeIndex, 1);
        if (!movedItem) return prev;

        const updatedItem = { ...movedItem, status: overColumn };
        overItems.push(updatedItem);

        newCols[activeColumn] = activeItems;
        newCols[overColumn] = overItems;
        return newCols;
      });
    },
    [findColumn, groupedTasks, isColumnStatus],
  );

  const displayColumns = useMemo(() => {
    const merged: Record<string, Task[]> = {};
    for (const status of COLUMN_STATUSES) {
      merged[status] = columns[status] || groupedTasks[status] || [];
    }
    return merged;
  }, [groupedTasks, columns]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {COLUMN_STATUSES.map((status) => (
          <div key={status} className="flex flex-col flex-shrink-0 w-[300px] rounded-xl border border-gray-200 bg-gray-50/30 overflow-hidden animate-pulse">
            <div className="px-4 py-3 border-b bg-gray-50">
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  <div className="flex gap-2">
                    <div className="h-3 w-12 bg-gray-100 rounded" />
                    <div className="h-3 w-12 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {COLUMN_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={displayColumns[status]}
            onOpen={onOpenTask}
            onAdd={onAddTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-[3deg] shadow-2xl opacity-90">
            <TaskCard task={activeTask} onOpen={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
