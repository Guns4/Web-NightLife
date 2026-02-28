/**
 * =====================================================
 * ADMIN DATA TABLE
 * Server-side pagination, filtering, sorting
 * =====================================================
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Loader2,
  AlertCircle
} from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  fetchData: (params: FetchParams) => Promise<PaginatedResponse<T>>;
  keyField: keyof T;
  onRowClick?: (item: T) => void;
}

interface FetchParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  filters?: Record<string, any>;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminDataTable<T extends Record<string, any>>({
  columns,
  fetchData,
  keyField,
  onRowClick,
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    loadData();
  }, [page, limit, sortBy, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchData({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
      });
      setData(response.data);
      setTotal(response.total);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page
    // Debounce search
    setTimeout(() => loadData(), 300);
  };

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnKey);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const goToPage = (newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(clampedPage);
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-white/10">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-amber-500/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer hover:text-white" : ""
                  } ${column.width || ""}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <span className="text-white/40">
                        {sortBy === column.key ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-20 text-center">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p className="text-red-400">{error}</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-20 text-center">
                  <p className="text-white/40">No data available</p>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <motion.tr
                  key={String(item[keyField])}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`hover:bg-white/5 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-white/80 text-sm">
                      {column.render 
                        ? column.render(item) 
                        : item[column.key]
                      }
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>of {total} results</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(1)}
            disabled={page === 1}
            className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-5 h-5 text-white/60" />
          </button>
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>

          <span className="px-4 text-white/60 text-sm">
            Page {page} of {totalPages || 1}
          </span>

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={page >= totalPages}
            className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>
    </div>
  );
}
