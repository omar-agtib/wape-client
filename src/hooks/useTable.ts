import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResult } from "../types/api";

// ── usePaginatedQuery ─────────────────────────────────────────────────────────
// Drop-in hook for any paginated backend endpoint
// Usage:
//   const { data, loading, page, setPage, search, setSearch, filters, setFilter } =
//     usePaginatedQuery(['projects'], projectsService.list, { limit: 20 });

interface UsePaginatedQueryOptions {
  limit?: number;
  defaultFilters?: Record<string, string>;
  enabled?: boolean;
}

export function usePaginatedQuery<T>(
  queryKey: string[],
  fetcher: (params: Record<string, unknown>) => Promise<PaginatedResult<T>>,
  options: UsePaginatedQueryOptions = {},
) {
  const { limit = 20, defaultFilters = {}, enabled = true } = options;

  const [page, setPageRaw] = useState(1);
  const [search, setSearchRaw] = useState("");
  const [filters, setFilters] =
    useState<Record<string, string>>(defaultFilters);

  const setPage = useCallback((p: number) => setPageRaw(p), []);
  const setSearch = useCallback((s: string) => {
    setSearchRaw(s);
    setPageRaw(1);
  }, []);
  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPageRaw(1);
  }, []);
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchRaw("");
    setPageRaw(1);
  }, [defaultFilters]);

  const params = {
    page,
    limit,
    ...(search ? { search } : {}),
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
  };

  const query = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => fetcher(params),
    enabled,
    placeholderData: (prev) => prev,
  });

  return {
    data: query.data?.items ?? [],
    meta: query.data?.meta,
    total: query.data?.meta?.total ?? 0,
    totalPages: query.data?.meta?.totalPages ?? 1,
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    // Pagination
    page,
    setPage,
    limit,
    // Search
    search,
    setSearch,
    // Filters
    filters,
    setFilter,
    resetFilters,
  };
}

// ── useToggle ─────────────────────────────────────────────────────────────────
export function useToggle(
  initial = false,
): [boolean, () => void, (v: boolean) => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}

// ── useDisclosure (modal/dialog control) ──────────────────────────────────────
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  return { isOpen, open, close, toggle };
}

// ── useSelected (multi-select rows) ──────────────────────────────────────────
export function useSelected<T extends { id: string }>() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((item: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((items: T[]) => {
    setSelected((prev) => {
      if (items.every((i) => prev.has(i.id))) return new Set();
      return new Set(items.map((i) => i.id));
    });
  }, []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);
  const clear = useCallback(() => setSelected(new Set()), []);

  return {
    selected,
    toggle,
    toggleAll,
    isSelected,
    clear,
    count: selected.size,
  };
}
