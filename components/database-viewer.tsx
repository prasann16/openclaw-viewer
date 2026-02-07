"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Loader2,
  X,
} from "lucide-react";

interface DatabaseInfo {
  name: string;
  path: string;
}

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

interface DatabaseViewerProps {
  workspace: string;
}

export function DatabaseViewer({ workspace }: DatabaseViewerProps) {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDb, setSelectedDb] = useState<DatabaseInfo | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [offset, setOffset] = useState(0);
  const [loadingDbs, setLoadingDbs] = useState(true);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [dbDropdownOpen, setDbDropdownOpen] = useState(false);

  // Fetch databases when workspace changes
  useEffect(() => {
    setLoadingDbs(true);
    setDatabases([]);
    setSelectedDb(null);
    setTables([]);
    setSelectedTable(null);
    setTableData(null);
    setError(null);

    fetch(`/api/database?workspace=${workspace}`)
      .then((res) => res.json())
      .then((data) => {
        const dbs = data.databases || [];
        setDatabases(dbs);
        if (dbs.length > 0) {
          setSelectedDb(dbs[0]);
        }
      })
      .catch(() => setError("Failed to load databases"))
      .finally(() => setLoadingDbs(false));
  }, [workspace]);

  // Fetch tables when database changes
  useEffect(() => {
    if (!selectedDb) {
      setTables([]);
      return;
    }

    setLoadingTables(true);
    setTables([]);
    setSelectedTable(null);
    setTableData(null);

    fetch(`/api/database?db=${encodeURIComponent(selectedDb.path)}`)
      .then((res) => res.json())
      .then((data) => {
        const tbls = data.tables || [];
        setTables(tbls);
        if (tbls.length > 0) {
          setSelectedTable(tbls[0].name);
        }
      })
      .catch(() => setError("Failed to load tables"))
      .finally(() => setLoadingTables(false));
  }, [selectedDb]);

  // Fetch rows when table or offset changes
  const fetchRows = useCallback(async (dbPath: string, table: string, rowOffset: number) => {
    setLoadingRows(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/database/${encodeURIComponent(table)}?db=${encodeURIComponent(dbPath)}&limit=${PAGE_SIZE}&offset=${rowOffset}`
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
    if (selectedDb && selectedTable) {
      fetchRows(selectedDb.path, selectedTable, offset);
    }
  }, [selectedDb, selectedTable, offset, fetchRows]);

  const handleTableSelect = (name: string) => {
    setSelectedTable(name);
    setOffset(0);
    setSelectedRow(null);
  };

  const handleDbSelect = (db: DatabaseInfo) => {
    setSelectedDb(db);
    setDbDropdownOpen(false);
    setOffset(0);
    setSelectedRow(null);
  };

  if (loadingDbs) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (databases.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Database className="h-12 w-12" />
        <p>No databases found in this workspace</p>
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

  const totalPages = tableData ? Math.ceil(tableData.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const startRow = offset + 1;
  const endRow = tableData
    ? Math.min(offset + PAGE_SIZE, tableData.total)
    : 0;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Database selector */}
      {databases.length > 1 && (
        <div className="relative">
          <button
            onClick={() => setDbDropdownOpen(!dbDropdownOpen)}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{selectedDb?.name}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dbDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          
          {dbDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-background shadow-lg">
              {databases.map((db) => (
                <button
                  key={db.path}
                  onClick={() => handleDbSelect(db)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${
                    db.path === selectedDb?.path ? "bg-muted font-medium" : ""
                  }`}
                >
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{db.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table tabs */}
      {loadingTables ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : tables.length > 0 ? (
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
      ) : (
        <div className="py-4 text-center text-muted-foreground">No tables found</div>
      )}

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
