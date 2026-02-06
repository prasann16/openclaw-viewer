"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Pause, Play, ScrollText, Trash2 } from "lucide-react";

const MAX_LINES = 100;

export function LogsViewer() {
  const [lines, setLines] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const containerRef = useRef<HTMLPreElement | null>(null);
  const autoScrollRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/logs");
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onmessage = (event) => {
      setLines((prev) => {
        const next = [...prev, event.data];
        return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
      });
    };

    es.addEventListener("error", (event) => {
      if (event instanceof MessageEvent) {
        setError(event.data);
      }
    });

    es.onerror = () => {
      setConnected(false);
      // EventSource will auto-reconnect by default
    };
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
  }, []);

  const handlePauseResume = useCallback(() => {
    if (paused) {
      connect();
      setPaused(false);
    } else {
      disconnect();
      setPaused(true);
    }
  }, [paused, connect, disconnect]);

  const handleClear = useCallback(() => {
    setLines([]);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

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

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Live Logs</h2>
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? "bg-green-400" : "bg-zinc-500"
            }`}
            title={connected ? "Connected" : "Disconnected"}
          />
        </div>
        <div className="flex items-center gap-2">
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

      {lines.length === 0 && !connected && !paused ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <ScrollText className="h-12 w-12" />
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Connecting to log stream...</p>
        </div>
      ) : lines.length === 0 && connected ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <ScrollText className="h-12 w-12" />
          <p>Waiting for log output...</p>
        </div>
      ) : (
        <pre
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto rounded-lg border border-border bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-green-400"
        >
          {lines.map((line, i) => (
            <div key={i}>{line || "\u00A0"}</div>
          ))}
        </pre>
      )}
    </div>
  );
}
