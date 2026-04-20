import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
export function usePaginatedQuery(queryKey, fetcher, options = {}) {
    const { limit = 20, defaultFilters = {}, enabled = true } = options;
    const [page, setPageRaw] = useState(1);
    const [search, setSearchRaw] = useState("");
    const [filters, setFilters] = useState(defaultFilters);
    const setPage = useCallback((p) => setPageRaw(p), []);
    const setSearch = useCallback((s) => {
        setSearchRaw(s);
        setPageRaw(1);
    }, []);
    const setFilter = useCallback((key, value) => {
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
export function useToggle(initial = false) {
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
export function useSelected() {
    const [selected, setSelected] = useState(new Set());
    const toggle = useCallback((item) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(item.id))
                next.delete(item.id);
            else
                next.add(item.id);
            return next;
        });
    }, []);
    const toggleAll = useCallback((items) => {
        setSelected((prev) => {
            if (items.every((i) => prev.has(i.id)))
                return new Set();
            return new Set(items.map((i) => i.id));
        });
    }, []);
    const isSelected = useCallback((id) => selected.has(id), [selected]);
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
