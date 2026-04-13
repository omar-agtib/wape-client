import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Generate page numbers to show
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const btn = (
    disabled: boolean,
    onClick: () => void,
    children: React.ReactNode,
    label: string,
  ) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        {btn(
          page === 1,
          () => onPageChange(1),
          <ChevronsLeft className="w-4 h-4" />,
          "First",
        )}
        {btn(
          page === 1,
          () => onPageChange(page - 1),
          <ChevronLeft className="w-4 h-4" />,
          "Previous",
        )}

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-input text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {p}
            </button>
          ),
        )}

        {btn(
          page === totalPages,
          () => onPageChange(page + 1),
          <ChevronRight className="w-4 h-4" />,
          "Next",
        )}
        {btn(
          page === totalPages,
          () => onPageChange(totalPages),
          <ChevronsRight className="w-4 h-4" />,
          "Last",
        )}
      </div>
    </div>
  );
}
