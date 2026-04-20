import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DragDropContext, Droppable, Draggable, } from "@hello-pangea/dnd";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// ── Constants ─────────────────────────────────────────────────────────────────
// Backend state machine: open ↔ in_review → closed (closed is terminal)
const COLUMNS = [
    {
        id: "open",
        label: "Open",
        color: "border-t-gray-400",
        bg: "bg-gray-50 dark:bg-gray-900/20",
    },
    {
        id: "in_review",
        label: "In Review",
        color: "border-t-blue-400",
        bg: "bg-blue-50/50 dark:bg-blue-900/10",
    },
    {
        id: "closed",
        label: "Closed",
        color: "border-t-slate-400",
        bg: "bg-slate-50/50 dark:bg-slate-900/10",
    },
];
// ── Component ─────────────────────────────────────────────────────────────────
export default function NCKanbanBoard({ ncs, onStatusChange, onEdit }) {
    const onDragEnd = (result) => {
        if (!result.destination)
            return;
        const newStatus = result.destination.droppableId;
        const nc = ncs.find((n) => n.id === result.draggableId);
        if (nc && nc.status !== newStatus) {
            onStatusChange(result.draggableId, newStatus);
        }
    };
    return (_jsx(DragDropContext, { onDragEnd: onDragEnd, children: _jsx("div", { className: "flex gap-4 overflow-x-auto pb-4", children: COLUMNS.map((col) => {
                const colNCs = ncs.filter((n) => n.status === col.id);
                return (_jsx("div", { className: "flex-shrink-0 w-64", children: _jsxs("div", { className: cn("rounded-lg border border-border border-t-4 overflow-hidden", col.color), children: [_jsxs("div", { className: cn("px-3 py-2.5 flex items-center justify-between", col.bg), children: [_jsx("span", { className: "text-sm font-semibold", children: col.label }), _jsx(Badge, { variant: "secondary", className: "text-xs h-5 px-1.5", children: colNCs.length })] }), _jsx(Droppable, { droppableId: col.id, children: (provided, snapshot) => (_jsxs("div", { ref: provided.innerRef, ...provided.droppableProps, className: cn("min-h-[200px] p-2 space-y-2 transition-colors", snapshot.isDraggingOver
                                        ? "bg-primary/5"
                                        : "bg-background"), children: [colNCs.map((nc, index) => (_jsx(Draggable, { draggableId: nc.id, index: index, isDragDisabled: col.id === "closed", children: (provided, snapshot) => (_jsxs("div", { ref: provided.innerRef, ...provided.draggableProps, ...provided.dragHandleProps, className: cn("bg-card rounded-lg border border-border p-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow", snapshot.isDragging &&
                                                    "shadow-lg ring-2 ring-primary/20", col.id === "closed" &&
                                                    "opacity-60 cursor-default"), children: [_jsxs("div", { className: "flex items-start gap-1.5 mb-2", children: [_jsx(AlertTriangle, { className: "w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" }), _jsx("p", { className: "text-xs font-semibold leading-tight line-clamp-2", children: nc.title })] }), nc.description && (_jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 mb-2", children: nc.description })), _jsx(Button, { variant: "ghost", size: "sm", className: "w-full h-6 text-xs mt-1 text-muted-foreground hover:text-foreground", onClick: () => onEdit(nc), children: "Edit" })] })) }, nc.id))), provided.placeholder] })) })] }) }, col.id));
            }) }) }));
}
