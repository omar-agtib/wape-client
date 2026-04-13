import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";

export interface ColumnDef<T> {
  header: string;
  accessor?: keyof T;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T extends { id?: string | number }> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading,
  onRowClick,
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((col, i) => (
              <TableHead
                key={i}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-12 text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow
                key={row.id ?? i}
                className={onRowClick ? "cursor-pointer hover:bg-muted/30" : ""}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, j) => (
                  <TableCell key={j} className="text-sm">
                    {col.cell
                      ? col.cell(row)
                      : col.accessor !== undefined
                        ? String(row[col.accessor] ?? "")
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
