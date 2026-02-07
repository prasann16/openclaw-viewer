"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Pause, Play, ScrollText, Trash2, RefreshCw } from "lucide-react";

type LogSource = "journal" | "file" | "all";

export function LogsViewer() {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [source, setSource] = useState<LogSource>("journal");
  const containerRef = useRef<HTMLPreElement | null>(null);
  const autoScrollRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/logs?source=${source}&limit=200`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLines(data.logs || []);
      setLastUpdate(data.timestamp);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [source]);

  // Initial fetch and polling
  useEffect(() => {
    fetchLogs();
    
    if (!paused) {
      intervalRef.current = setInterval(fetchLogs, 3000); // Poll every 3s
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchLogs, paused]);

  // Auto-scroll when new lines arrive
  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  // Track user scroll to disable auto-scroll when scrolled up
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 40;
  }, []);

  const handlePauseResume = useCallback(() => {
    setPaused(prev => !prev);
  }, []);

  const handleClear = useCallback(() => {
    setLines([]);
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  if (loading && lines.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <ScrollText className="h-12 w-12" />
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Loading logs...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Gateway Logs</h2>
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              paused ? "bg-yellow-400" : "bg-green-400"
            }`}
            title={paused ? "Paused" : "Auto-refreshing"}
          />
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value as LogSource);
              setLoading(true);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="journal">Gateway (journalctl)</option>
            <option value="file">File Logs</option>
            <option value="all">All Sources</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePauseResume}
          >
            {paused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <ScrollText className="h-12 w-12" />
          <p>No logs found</p>
        </div>
      ) : (
        <pre
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto rounded-lg border border-border bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-green-400"
        >
          {lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all">{line || "\u00A0"}</div>
          ))}
        </pre>
      )}
    </div>
  );
}
