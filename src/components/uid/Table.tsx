import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

// ── Column definition ─────────────────────────────────────────────────────────
export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render: (row: T, index: number) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  loading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
  stickyHeader?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
  onRowClick,
  className,
  stickyHeader = false,
}: TableProps<T>) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-border",
        className,
      )}
    >
      <table className="w-full text-sm border-collapse">
        <thead
          className={cn("bg-muted/50", stickyHeader && "sticky top-0 z-10")}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  "px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide",
                  "border-b border-border whitespace-nowrap",
                  alignClass[col.align ?? "left"],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div
                      className="h-4 bg-muted rounded animate-pulse"
                      style={{ width: `${60 + Math.random() * 30}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex items-center justify-center py-16">
                  {emptyState ?? (
                    <p className="text-sm text-muted-foreground">
                      No data found
                    </p>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                className={cn(
                  "border-b border-border/50 transition-colors duration-100",
                  "last:border-0",
                  onRowClick
                    ? "hover:bg-muted/40 cursor-pointer"
                    : "hover:bg-muted/20",
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-foreground",
                      alignClass[col.align ?? "left"],
                    )}
                  >
                    {col.render(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
