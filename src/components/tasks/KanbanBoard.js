import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DragDropContext, Droppable, Draggable, } from "@hello-pangea/dnd";
import { Eye, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
// ── Constants ─────────────────────────────────────────────────────────────────
const COLUMNS = [
    { id: "planned", label: "Planned", color: "border-t-slate-400" },
    { id: "on_progress", label: "In Progress", color: "border-t-blue-500" },
    { id: "completed", label: "Completed", color: "border-t-green-500" },
];
// ── Component ─────────────────────────────────────────────────────────────────
export default function KanbanBoard({ tasks, onStatusChange, onEdit }) {
    const tasksByColumn = COLUMNS.reduce((acc, col) => {
        acc[col.id] = tasks.filter((t) => t.status === col.id);
        return acc;
    }, {});
    const handleDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination || source.droppableId === destination.droppableId)
            return;
        onStatusChange(draggableId, destination.droppableId);
    };
    return (_jsx(DragDropContext, { onDragEnd: handleDragEnd, children: _jsx("div", { className: "flex gap-4 overflow-x-auto pb-4", children: COLUMNS.map((col) => (_jsx("div", { className: "flex-shrink-0 w-64", children: _jsxs("div", { className: `bg-muted/40 rounded-xl border-t-4 ${col.color}`, children: [_jsxs("div", { className: "px-3 py-3 flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold text-sm", children: col.label }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: tasksByColumn[col.id]?.length ?? 0 })] }), _jsx(Droppable, { droppableId: col.id, children: (provided, snapshot) => (_jsxs("div", { ref: provided.innerRef, ...provided.droppableProps, className: `min-h-[200px] px-2 pb-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`, children: [(tasksByColumn[col.id] ?? []).map((task, index) => (_jsx(Draggable, { draggableId: task.id, index: index, children: (provided, snapshot) => (_jsxs("div", { ref: provided.innerRef, ...provided.draggableProps, ...provided.dragHandleProps, className: `bg-card rounded-lg p-3 shadow-sm border text-xs cursor-grab active:cursor-grabbing transition-shadow ${snapshot.isDragging ? "shadow-lg rotate-1" : ""}`, children: [_jsx("p", { className: "font-medium text-foreground mb-1 line-clamp-2", children: task.name }), task.startDate && task.endDate && (_jsxs("p", { className: "text-muted-foreground mb-1 text-[10px]", children: [task.startDate, " \u2192 ", task.endDate] })), (task.progress ?? 0) > 0 && (_jsx("div", { className: "w-full bg-muted rounded-full h-1 mb-2", children: _jsx("div", { className: "bg-primary h-1 rounded-full", style: { width: `${task.progress}%` } }) })), _jsxs("div", { className: "flex items-center justify-between mt-1", children: [(task.estimatedCost ?? 0) > 0 ? (_jsxs("span", { className: "text-warning font-semibold", children: [task.estimatedCost.toLocaleString(), " ", task.currency] })) : (_jsx("span", {})), _jsxs("div", { className: "flex gap-1 ml-auto", children: [_jsx(Link, { to: `/tasks/${task.id}`, children: _jsx("button", { className: "p-1 hover:bg-muted rounded", children: _jsx(Eye, { className: "w-3 h-3 text-muted-foreground" }) }) }), _jsx("button", { className: "p-1 hover:bg-muted rounded", onClick: () => onEdit(task), children: _jsx(Edit, { className: "w-3 h-3 text-muted-foreground" }) })] })] })] })) }, task.id))), provided.placeholder] })) })] }) }, col.id))) }) }));
}
