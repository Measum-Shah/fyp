import { useState, useEffect, useCallback } from "react";

export interface UseAcademicDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredData: T[];
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  setItemsPerPage: (num: number) => void;
  refresh: () => void;
  addItem: (item: T) => void;
  updateItem: (id: number, item: Partial<T>) => void;
  removeItem: (id: number) => void;
}

export function useAcademicData<T extends { id: number }>(
  fetcher: () => Promise<T[]>,
  searchFields: (keyof T)[] = [],
  initialPageSize = 10
): UseAcademicDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialPageSize);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result || []);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering logic
  const filteredData = data.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    if (searchFields.length === 0) {
      return Object.values(item).some((val) =>
        String(val || "").toLowerCase().includes(query)
      );
    }
    return searchFields.some((field) => {
      const val = item[field];
      return String(val || "").toLowerCase().includes(query);
    });
  });

  const totalCount = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const addItem = (item: T) => {
    setData((prev) => [item, ...prev]);
  };

  const updateItem = (id: number, updatedFields: Partial<T>) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    );
  };

  const removeItem = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    data: paginatedData,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filteredData,
    page,
    setPage,
    totalPages,
    totalCount,
    itemsPerPage,
    setItemsPerPage,
    refresh: loadData,
    addItem,
    updateItem,
    removeItem,
  };
}
