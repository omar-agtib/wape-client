import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { format, differenceInDays, addDays, parseISO } from "date-fns";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    planned: "bg-muted-foreground/40",
    on_progress: "bg-warning",
    completed: "bg-success",
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function GanttChart({ tasks, personnel = [], tools = [], }) {
    const [filterDateStart, setFilterDateStart] = useState("");
    const [filterDateEnd, setFilterDateEnd] = useState("");
    const [filterPersonnel, setFilterPersonnel] = useState("all");
    const [filterTool, setFilterTool] = useState("all");
    const [filterArticle, setFilterArticle] = useState("all");
    // Tasks that have both dates set
    const validTasks = tasks.filter((t) => t.startDate && t.endDate);
    // ── Filters
    const filteredTasks = useMemo(() => {
        return validTasks.filter((t) => {
            if (filterDateStart && t.endDate < filterDateStart)
                return false;
            if (filterDateEnd && t.startDate > filterDateEnd)
                return false;
            // Personnel / tool / article filters are best-effort:
            // the task object from list endpoint doesn't carry sub-resource lists,
            // so these filters apply only when the data is available.
            return true;
        });
    }, [validTasks, filterDateStart, filterDateEnd]);
    // ── Timeline bounds
    const { minDate, days } = useMemo(() => {
        if (!filteredTasks.length)
            return { minDate: new Date(), days: 30 };
        const starts = filteredTasks.map((t) => parseISO(t.startDate));
        const ends = filteredTasks.map((t) => parseISO(t.endDate));
        const min = new Date(Math.min(...starts.map((d) => d.getTime())));
        const max = new Date(Math.max(...ends.map((d) => d.getTime())));
        const totalDays = Math.max(differenceInDays(max, min) + 7, 30);
        return { minDate: min, days: totalDays };
    }, [filteredTasks]);
    // ── Week header labels
    const headerDates = useMemo(() => {
        const result = [];
        for (let i = 0; i < days; i += 7)
            result.push(addDays(minDate, i));
        return result;
    }, [minDate, days]);
    const hasFilters = filterDateStart ||
        filterDateEnd ||
        filterPersonnel !== "all" ||
        filterTool !== "all" ||
        filterArticle !== "all";
    const clearFilters = () => {
        setFilterDateStart("");
        setFilterDateEnd("");
        setFilterPersonnel("all");
        setFilterTool("all");
        setFilterArticle("all");
    };
    const getBar = (task) => {
        const start = parseISO(task.startDate);
        const end = parseISO(task.endDate);
        const left = (differenceInDays(start, minDate) / days) * 100;
        const width = Math.max(((differenceInDays(end, start) + 1) / days) * 100, 0.5);
        return { left: `${left}%`, width: `${width}%` };
    };
    const getProgress = (task) => {
        if (task.status === "completed")
            return 100;
        if (task.status === "on_progress")
            return task.progress ?? 50;
        return task.progress ?? 0;
    };
    // ── Render
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "p-3 rounded-lg bg-muted/30 border border-border space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase", children: "Filters" }), hasFilters && (_jsxs("button", { className: "text-xs text-primary flex items-center gap-1 hover:underline", onClick: clearFilters, children: [_jsx(X, { className: "w-3 h-3" }), " Clear all"] }))] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-xs mb-1 block", children: "Start From" }), _jsx(Input, { type: "date", className: "h-7 text-xs", value: filterDateStart, onChange: (e) => setFilterDateStart(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs mb-1 block", children: "Start To" }), _jsx(Input, { type: "date", className: "h-7 text-xs", value: filterDateEnd, onChange: (e) => setFilterDateEnd(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs mb-1 block", children: "Personnel" }), _jsxs(Select, { value: filterPersonnel, onValueChange: setFilterPersonnel, children: [_jsx(SelectTrigger, { className: "h-7 text-xs", children: _jsx(SelectValue, { placeholder: "All" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Personnel" }), personnel.map((p) => (_jsx(SelectItem, { value: p.id, children: p.fullName }, p.id)))] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs mb-1 block", children: "Tool" }), _jsxs(Select, { value: filterTool, onValueChange: setFilterTool, children: [_jsx(SelectTrigger, { className: "h-7 text-xs", children: _jsx(SelectValue, { placeholder: "All" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Tools" }), tools.map((t) => (_jsx(SelectItem, { value: t.id, children: t.name }, t.id)))] })] })] })] })] }), filteredTasks.length === 0 ? (_jsx("div", { className: "text-center py-8 text-muted-foreground text-sm", children: validTasks.length === 0
                    ? "No tasks with dates. Set start and end dates on tasks to see Gantt chart."
                    : "No tasks match the current filters." })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("div", { style: { minWidth: 900 }, children: [_jsxs("div", { className: "flex border-b border-border", children: [_jsx("div", { className: "w-56 shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase border-r border-border", children: "Task" }), _jsx("div", { className: "flex-1 relative h-8", children: headerDates.map((d, i) => (_jsx("div", { className: "absolute top-0 text-xs text-muted-foreground py-2", style: {
                                            left: `${(differenceInDays(d, minDate) / days) * 100}%`,
                                        }, children: format(d, "MMM d") }, i))) })] }), filteredTasks.map((task) => {
                            const bar = getBar(task);
                            const progress = getProgress(task);
                            const colorClass = STATUS_COLORS[task.status] ?? "bg-muted-foreground/40";
                            return (_jsxs("div", { className: "flex border-b border-border/50 hover:bg-muted/20 transition-colors", children: [_jsx("div", { className: "w-56 shrink-0 px-3 py-2 border-r border-border flex items-center gap-2", children: _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs font-medium truncate", children: task.name }), _jsxs("p", { className: "text-[10px] text-muted-foreground truncate", children: [task.startDate
                                                            ? format(parseISO(task.startDate), "MMM d")
                                                            : "", " → ", task.endDate
                                                            ? format(parseISO(task.endDate), "MMM d")
                                                            : ""] })] }) }), _jsxs("div", { className: "flex-1 relative h-10 py-1.5", children: [_jsx("div", { className: "absolute top-0 bottom-0 w-px bg-primary/40 z-10", style: {
                                                    left: `${(differenceInDays(new Date(), minDate) / days) * 100}%`,
                                                } }), _jsxs("div", { className: `absolute h-6 rounded-full opacity-90 ${colorClass}`, style: { left: bar.left, width: bar.width }, title: `${task.name}: ${task.startDate} → ${task.endDate}`, children: [_jsx("div", { className: "h-full rounded-full bg-white/25", style: { width: `${progress}%` } }), _jsx("span", { className: "absolute inset-0 flex items-center px-2 text-[10px] font-medium text-white truncate", children: task.name })] })] })] }, task.id));
                        }), _jsxs("div", { className: "flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground flex-wrap", children: [Object.entries(STATUS_COLORS).map(([s, c]) => (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${c}` }), _jsx("span", { className: "capitalize", children: s.replace("_", " ") })] }, s))), _jsxs("div", { className: "flex items-center gap-1.5 ml-2", children: [_jsx("div", { className: "w-px h-4 bg-primary/40" }), _jsx("span", { children: "Today" })] }), hasFilters && (_jsxs("span", { className: "ml-auto text-primary font-medium", children: [filteredTasks.length, " of ", validTasks.length, " tasks shown"] }))] })] }) }))] }));
}
