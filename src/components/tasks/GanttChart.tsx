import { useMemo, useState } from "react";
import { format, differenceInDays, addDays, parseISO } from "date-fns";
import { X } from "lucide-react";

import type { Task, Personnel, Tool, Article } from "@/types/api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  tasks: Task[];
  personnel?: Personnel[];
  tools?: Tool[];
  articles?: Article[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-muted-foreground/40",
  on_progress: "bg-warning",
  completed: "bg-success",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function GanttChart({
  tasks,
  personnel = [],
  tools = [],
}: Props) {
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
      if (filterDateStart && t.endDate < filterDateStart) return false;
      if (filterDateEnd && t.startDate > filterDateEnd) return false;
      // Personnel / tool / article filters are best-effort:
      // the task object from list endpoint doesn't carry sub-resource lists,
      // so these filters apply only when the data is available.
      return true;
    });
  }, [validTasks, filterDateStart, filterDateEnd]);

  // ── Timeline bounds
  const { minDate, days } = useMemo(() => {
    if (!filteredTasks.length) return { minDate: new Date(), days: 30 };
    const starts = filteredTasks.map((t) => parseISO(t.startDate));
    const ends = filteredTasks.map((t) => parseISO(t.endDate));
    const min = new Date(Math.min(...starts.map((d) => d.getTime())));
    const max = new Date(Math.max(...ends.map((d) => d.getTime())));
    const totalDays = Math.max(differenceInDays(max, min) + 7, 30);
    return { minDate: min, days: totalDays };
  }, [filteredTasks]);

  // ── Week header labels
  const headerDates = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < days; i += 7) result.push(addDays(minDate, i));
    return result;
  }, [minDate, days]);

  const hasFilters =
    filterDateStart ||
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

  const getBar = (task: Task) => {
    const start = parseISO(task.startDate);
    const end = parseISO(task.endDate);
    const left = (differenceInDays(start, minDate) / days) * 100;
    const width = Math.max(
      ((differenceInDays(end, start) + 1) / days) * 100,
      0.5,
    );
    return { left: `${left}%`, width: `${width}%` };
  };

  const getProgress = (task: Task) => {
    if (task.status === "completed") return 100;
    if (task.status === "on_progress") return task.progress ?? 50;
    return task.progress ?? 0;
  };

  // ── Render
  return (
    <div className="space-y-3">
      {/* ── Filters */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            Filters
          </span>
          {hasFilters && (
            <button
              className="text-xs text-primary flex items-center gap-1 hover:underline"
              onClick={clearFilters}
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <Label className="text-xs mb-1 block">Start From</Label>
            <Input
              type="date"
              className="h-7 text-xs"
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Start To</Label>
            <Input
              type="date"
              className="h-7 text-xs"
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Personnel</Label>
            <Select value={filterPersonnel} onValueChange={setFilterPersonnel}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Personnel</SelectItem>
                {personnel.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Tool</Label>
            <Select value={filterTool} onValueChange={setFilterTool}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tools</SelectItem>
                {tools.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Chart */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {validTasks.length === 0
            ? "No tasks with dates. Set start and end dates on tasks to see Gantt chart."
            : "No tasks match the current filters."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: 900 }}>
            {/* Header */}
            <div className="flex border-b border-border">
              <div className="w-56 shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase border-r border-border">
                Task
              </div>
              <div className="flex-1 relative h-8">
                {headerDates.map((d, i) => (
                  <div
                    key={i}
                    className="absolute top-0 text-xs text-muted-foreground py-2"
                    style={{
                      left: `${(differenceInDays(d, minDate) / days) * 100}%`,
                    }}
                  >
                    {format(d, "MMM d")}
                  </div>
                ))}
              </div>
            </div>

            {/* Task rows */}
            {filteredTasks.map((task) => {
              const bar = getBar(task);
              const progress = getProgress(task);
              const colorClass =
                STATUS_COLORS[task.status] ?? "bg-muted-foreground/40";

              return (
                <div
                  key={task.id}
                  className="flex border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  {/* Label */}
                  <div className="w-56 shrink-0 px-3 py-2 border-r border-border flex items-center gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {task.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {task.startDate
                          ? format(parseISO(task.startDate), "MMM d")
                          : ""}
                        {" → "}
                        {task.endDate
                          ? format(parseISO(task.endDate), "MMM d")
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 relative h-10 py-1.5">
                    {/* Today line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                      style={{
                        left: `${(differenceInDays(new Date(), minDate) / days) * 100}%`,
                      }}
                    />
                    {/* Task bar */}
                    <div
                      className={`absolute h-6 rounded-full opacity-90 ${colorClass}`}
                      style={{ left: bar.left, width: bar.width }}
                      title={`${task.name}: ${task.startDate} → ${task.endDate}`}
                    >
                      {/* Progress fill */}
                      <div
                        className="h-full rounded-full bg-white/25"
                        style={{ width: `${progress}%` }}
                      />
                      <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-white truncate">
                        {task.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground flex-wrap">
              {Object.entries(STATUS_COLORS).map(([s, c]) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${c}`} />
                  <span className="capitalize">{s.replace("_", " ")}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-px h-4 bg-primary/40" />
                <span>Today</span>
              </div>
              {hasFilters && (
                <span className="ml-auto text-primary font-medium">
                  {filteredTasks.length} of {validTasks.length} tasks shown
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
