import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Eye, Edit } from "lucide-react";
import { Link } from "react-router-dom";

import type { Task } from "@/types/api";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = "planned" | "on_progress" | "completed";

interface Column {
  id: TaskStatus;
  label: string;
  color: string;
}

interface Props {
  tasks: Task[];
  onStatusChange: (id: string, status: string) => void;
  onEdit: (task: Task) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS: Column[] = [
  { id: "planned", label: "Planned", color: "border-t-slate-400" },
  { id: "on_progress", label: "In Progress", color: "border-t-blue-500" },
  { id: "completed", label: "Completed", color: "border-t-green-500" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function KanbanBoard({ tasks, onStatusChange, onEdit }: Props) {
  const tasksByColumn = COLUMNS.reduce<Record<string, Task[]>>((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    onStatusChange(draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex-shrink-0 w-64">
            <div className={`bg-muted/40 rounded-xl border-t-4 ${col.color}`}>
              {/* Column header */}
              <div className="px-3 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">{col.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {tasksByColumn[col.id]?.length ?? 0}
                </Badge>
              </div>

              {/* Droppable area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] px-2 pb-2 space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? "bg-primary/5" : ""
                    }`}
                  >
                    {(tasksByColumn[col.id] ?? []).map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-card rounded-lg p-3 shadow-sm border text-xs cursor-grab active:cursor-grabbing transition-shadow ${
                              snapshot.isDragging ? "shadow-lg rotate-1" : ""
                            }`}
                          >
                            {/* Task name */}
                            <p className="font-medium text-foreground mb-1 line-clamp-2">
                              {task.name}
                            </p>

                            {/* Dates */}
                            {task.startDate && task.endDate && (
                              <p className="text-muted-foreground mb-1 text-[10px]">
                                {task.startDate} → {task.endDate}
                              </p>
                            )}

                            {/* Progress */}
                            {(task.progress ?? 0) > 0 && (
                              <div className="w-full bg-muted rounded-full h-1 mb-2">
                                <div
                                  className="bg-primary h-1 rounded-full"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            )}

                            {/* Footer row */}
                            <div className="flex items-center justify-between mt-1">
                              {/* Estimated cost */}
                              {(task.estimatedCost ?? 0) > 0 ? (
                                <span className="text-warning font-semibold">
                                  {task.estimatedCost!.toLocaleString()}{" "}
                                  {task.currency}
                                </span>
                              ) : (
                                <span />
                              )}

                              {/* Actions */}
                              <div className="flex gap-1 ml-auto">
                                <Link to={`/tasks/${task.id}`}>
                                  <button className="p-1 hover:bg-muted rounded">
                                    <Eye className="w-3 h-3 text-muted-foreground" />
                                  </button>
                                </Link>
                                <button
                                  className="p-1 hover:bg-muted rounded"
                                  onClick={() => onEdit(task)}
                                >
                                  <Edit className="w-3 h-3 text-muted-foreground" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
