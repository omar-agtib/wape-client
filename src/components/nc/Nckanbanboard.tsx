import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { AlertTriangle } from "lucide-react";
import { NonConformity } from "../../types/api";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  ncs: NonConformity[];
  onStatusChange: (id: string, status: "open" | "in_review" | "closed") => void;
  onEdit: (nc: NonConformity) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Backend state machine: open ↔ in_review → closed (closed is terminal)
const COLUMNS = [
  {
    id: "open" as const,
    label: "Open",
    color: "border-t-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/20",
  },
  {
    id: "in_review" as const,
    label: "In Review",
    color: "border-t-blue-400",
    bg: "bg-blue-50/50 dark:bg-blue-900/10",
  },
  {
    id: "closed" as const,
    label: "Closed",
    color: "border-t-slate-400",
    bg: "bg-slate-50/50 dark:bg-slate-900/10",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function NCKanbanBoard({ ncs, onStatusChange, onEdit }: Props) {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as
      | "open"
      | "in_review"
      | "closed";
    const nc = ncs.find((n) => n.id === result.draggableId);
    if (nc && nc.status !== newStatus) {
      onStatusChange(result.draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colNCs = ncs.filter((n) => n.status === col.id);
          return (
            <div key={col.id} className="flex-shrink-0 w-64">
              <div
                className={cn(
                  "rounded-lg border border-border border-t-4 overflow-hidden",
                  col.color,
                )}
              >
                <div
                  className={cn(
                    "px-3 py-2.5 flex items-center justify-between",
                    col.bg,
                  )}
                >
                  <span className="text-sm font-semibold">{col.label}</span>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {colNCs.length}
                  </Badge>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[200px] p-2 space-y-2 transition-colors",
                        snapshot.isDraggingOver
                          ? "bg-primary/5"
                          : "bg-background",
                      )}
                    >
                      {colNCs.map((nc, index) => (
                        <Draggable
                          key={nc.id}
                          draggableId={nc.id}
                          index={index}
                          isDragDisabled={col.id === "closed"}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-card rounded-lg border border-border p-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow",
                                snapshot.isDragging &&
                                  "shadow-lg ring-2 ring-primary/20",
                                col.id === "closed" &&
                                  "opacity-60 cursor-default",
                              )}
                            >
                              {/* Title */}
                              <div className="flex items-start gap-1.5 mb-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-semibold leading-tight line-clamp-2">
                                  {nc.title}
                                </p>
                              </div>

                              {/* Description preview */}
                              {nc.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {nc.description}
                                </p>
                              )}

                              {/* Edit button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-6 text-xs mt-1 text-muted-foreground hover:text-foreground"
                                onClick={() => onEdit(nc)}
                              >
                                Edit
                              </Button>
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
          );
        })}
      </div>
    </DragDropContext>
  );
}
