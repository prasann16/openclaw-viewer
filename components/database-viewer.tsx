"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Loader2,
  X,
} from "lucide-react";

interface TableInfo {
  name: string;
  rowCount: number;
}

interface TableData {
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
}

const PAGE_SIZE = 50;

export function DatabaseViewer() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [offset, setOffset] = useState(0);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  // Fetch tables on mount
  useEffect(() => {
    fetch("/api/database")
      .then((res) => res.json())
      .then((data) => {
        setTables(data.tables || []);
        if (data.tables?.length > 0) {
          setSelectedTable(data.tables[0].name);
        }
      })
      .catch(() => setError("Failed to load database tables"))
      .finally(() => setLoadingTables(false));
  }, []);

  // Fetch rows when table or offset changes
  const fetchRows = useCallback(async (table: string, rowOffset: number) => {
    setLoadingRows(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/database/${encodeURIComponent(table)}?limit=${PAGE_SIZE}&offset=${rowOffset}`
      );
      if (!res.ok) throw new Error("Failed to fetch rows");
      const data = await res.json();
      setTableData(data);
    } catch {
      setError("Failed to load table data");
      setTableData(null);
    } finally {
      setLoadingRows(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchRows(selectedTable, offset);
    }
  }, [selectedTable, offset, fetchRows]);

  const handleTableSelect = (name: string) => {
    setSelectedTable(name);
    setOffset(0);
  };

  if (loadingTables) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !tableData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Database className="h-12 w-12" />
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Database className="h-12 w-12" />
        <p>No tables found</p>
      </div>
    );
  }

  const totalPages = tableData ? Math.ceil(tableData.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const startRow = offset + 1;
  const endRow = tableData
    ? Math.min(offset + PAGE_SIZE, tableData.total)
    : 0;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Table tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-2">
        {tables.map((t) => (
          <button
            key={t.name}
            onClick={() => handleTableSelect(t.name)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selectedTable === t.name
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            {t.name}
            <span className="ml-1.5 text-xs opacity-60">({t.rowCount})</span>
          </button>
        ))}
      </div>

      {/* Table content */}
      {loadingRows ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tableData ? (
        <>
          <div className="flex-1 overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {tableData.columns.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedRow(row)}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                  >
                    {tableData.columns.map((col) => (
                      <td
                        key={col}
                        className="max-w-xs truncate whitespace-nowrap px-3 py-2"
                        title={String(row[col] ?? "")}
                      >
                        {row[col] === null ? (
                          <span className="italic text-muted-foreground">
                            null
                          </span>
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {tableData.rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={tableData.columns.length}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      No rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {tableData.total > PAGE_SIZE && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {startRow}–{endRow} of {tableData.total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + PAGE_SIZE >= tableData.total}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Row Detail Modal */}
      {selectedRow && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedRow(null)}
        >
          <div 
            className="relative max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedRow(null)}
              className="absolute right-4 top-4 rounded-md p-1 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="mb-4 text-lg font-semibold">Row Details</h3>
            
            <div className="space-y-3">
              {tableData?.columns.map((col) => (
                <div key={col} className="rounded-md border border-border bg-muted/30 p-3">
                  <div className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {col}
                  </div>
                  <div className="whitespace-pre-wrap break-words font-mono text-sm">
                    {selectedRow[col] === null ? (
                      <span className="italic text-muted-foreground">null</span>
                    ) : (
                      String(selectedRow[col])
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
