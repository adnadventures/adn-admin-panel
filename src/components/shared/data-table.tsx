"use client";
import { useState } from "react";
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable, type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Props<T> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  searchPlaceholder?: string;
  toolbar?: React.ReactNode; // e.g. the "Add" button
  pageSize?: number;
};

export function DataTable<T>({
  columns, data, searchPlaceholder = "Search…", toolbar, pageSize = 10,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const activePageSize = table.getState().pagination.pageSize;
  const firstVisible = filteredCount === 0 ? 0 : pageIndex * activePageSize + 1;
  const lastVisible = Math.min(pageIndex * activePageSize + rows.length, filteredCount);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search aria-hidden="true" className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder.replace(/…$/, "")}
            className="pl-9"
          />
        </div>
        {toolbar && <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{toolbar}</div>}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    aria-sort={
                      h.column.getIsSorted() === "asc"
                        ? "ascending"
                        : h.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
                  >
                    {h.isPlaceholder ? null : h.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex min-h-10 items-center gap-2 rounded-sm text-left font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onClick={h.column.getToggleSortingHandler()}
                        aria-label={`Sort by ${h.column.id}`}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === "asc" ? (
                          <ArrowUp aria-hidden="true" className="text-foreground size-3.5" />
                        ) : h.column.getIsSorted() === "desc" ? (
                          <ArrowDown aria-hidden="true" className="text-foreground size-3.5" />
                        ) : (
                          <ArrowUpDown aria-hidden="true" className="text-muted-foreground size-3.5" />
                        )}
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    {data.length === 0 ? (
                      <>
                        <SearchX aria-hidden="true" className="text-muted-foreground size-5" />
                        <p className="font-medium">No records yet</p>
                        <p className="text-muted-foreground text-sm">
                          New records will appear here.
                        </p>
                      </>
                    ) : (
                      <>
                        <SearchX aria-hidden="true" className="text-muted-foreground size-5" />
                        <p className="font-medium">No matching records</p>
                        <p className="text-muted-foreground text-sm">
                          Try a different search term.
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setGlobalFilter("")}
                        >
                          Clear search
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 text-sm sm:flex-row sm:items-center">
        <span className="text-muted-foreground" aria-live="polite">
          Showing {firstVisible}–{lastVisible} of {filteredCount}{" "}
          {filteredCount === 1 ? "record" : "records"}
        </span>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="outline" size="icon" aria-label="Previous page"
            onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-24 text-center tabular-nums">
            Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
          </span>
          <Button
            type="button"
            variant="outline" size="icon" aria-label="Next page"
            onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}