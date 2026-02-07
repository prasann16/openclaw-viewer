"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Pause, Play } from "lucide-react";

export function ActivityViewer() {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLPreElement | null>(null);
  const autoScrollRef = useRef(true);
  const visibleRef = useRef(true);

  const fetchLogs = useCallback(async () => {
    if (!visibleRef.current) return;
    
    try {
      const res = await fetch("/api/activity");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setLines(json.lines || []);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  // Visibility detection
  useEffect(() => {
    const handleVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (visibleRef.current && !paused) fetchLogs();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchLogs, paused]);

  // Polling
  useEffect(() => {
    fetchLogs();
    if (!paused) {
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [fetchLogs, paused]);

  // Auto-scroll
  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  if (loading && lines.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading logs...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Live Logs</h2>
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              paused ? "bg-yellow-400" : "bg-green-400 animate-pulse"
            }`}
          />
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">{lastUpdate}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPaused(!paused)}>
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Raw log output */}
      <pre
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto rounded-lg border border-border bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-green-400"
      >
        {lines.length === 0 ? (
          <span className="text-muted-foreground">No logs yet</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all hover:bg-white/5">
              {line}
            </div>
          ))
        )}
      </pre>
    </div>
  );
}
