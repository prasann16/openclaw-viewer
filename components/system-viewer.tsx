"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Pause,
  Play,
  Square,
  Skull,
  Activity,
  ScrollText,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";

type SubTab = "activity" | "processes" | "system";

interface Process {
  pid: string;
  cmd: string;
  cpu: string;
  mem: string;
  time: string;
}

interface SystemStats {
  cpu: number;
  ram: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
  uptime: number;
}

export function SystemViewer() {
  const [activeTab, setActiveTab] = useState<SubTab>("activity");
  const [lines, setLines] = useState<string[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [killing, setKilling] = useState<string | null>(null);

  const containerRef = useRef<HTMLPreElement | null>(null);
  const autoScrollRef = useRef(true);
  const visibleRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!visibleRef.current) return;

    try {
      if (activeTab === "activity") {
        const res = await fetch("/api/activity");
        const json = await res.json();
        setLines(json.lines || []);
      } else if (activeTab === "processes") {
        // Fetch processes via activity endpoint which has process data
        const res = await fetch("/api/processes");
        const json = await res.json();
        setProcesses(json.processes || []);
      } else if (activeTab === "system") {
        const res = await fetch("/api/system");
        const json = await res.json();
        setStats(json);
      }
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const killProcess = useCallback(async (pid: string, force = false) => {
    setKilling(pid);
    try {
      const res = await fetch("/api/process/kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid, signal: force ? "KILL" : "TERM" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success(`Process ${pid} stopped`);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setKilling(null);
    }
  }, [fetchData]);

  // Visibility
  useEffect(() => {
    const handler = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (visibleRef.current && !paused) fetchData();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [fetchData, paused]);

  // Polling
  useEffect(() => {
    fetchData();
    if (!paused) {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [fetchData, paused]);

  // Auto-scroll for activity
  useEffect(() => {
    if (activeTab === "activity" && autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, activeTab]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  const tabs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: "activity", label: "Activity", icon: <ScrollText className="h-4 w-4" /> },
    { id: "processes", label: "Processes", icon: <Cpu className="h-4 w-4" /> },
    { id: "system", label: "System", icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Sub-tabs */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-border bg-muted/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setLoading(true); }}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              paused ? "bg-yellow-400" : "bg-green-400 animate-pulse"
            }`}
          />
          {lastUpdate && <span className="text-xs text-muted-foreground">{lastUpdate}</span>}
          <Button variant="outline" size="sm" onClick={() => setPaused(!paused)}>
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "activity" && (
        <pre
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto rounded-lg border border-border bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-green-400"
        >
          {lines.length === 0 ? (
            <span className="text-muted-foreground">{loading ? "Loading..." : "No logs yet"}</span>
          ) : (
            lines.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all hover:bg-white/5">{line}</div>
            ))
          )}
        </pre>
      )}

      {activeTab === "processes" && (
        <div className="flex-1 overflow-auto rounded-lg border border-border bg-card p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4">PID</th>
                  <th className="pb-2 pr-4">CPU</th>
                  <th className="pb-2 pr-4">MEM</th>
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Command</th>
                  <th className="pb-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p, i) => {
                  const isCritical = ["clawdbot-gateway", "systemd", "sshd", "dbus", "gpg-agent"].some(c => p.cmd.includes(c));
                  return (
                    <tr key={i} className="border-b border-border/30 group">
                      <td className="py-2 pr-4 font-mono text-xs">{p.pid}</td>
                      <td className="py-2 pr-4 text-xs">{p.cpu}</td>
                      <td className="py-2 pr-4 text-xs">{p.mem}</td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{p.time}</td>
                      <td className="py-2 pr-4 font-mono text-xs truncate max-w-xs">{p.cmd}</td>
                      <td className="py-2">
                        {!isCritical && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => killProcess(p.pid)}
                              disabled={killing === p.pid}
                              className="rounded p-1 hover:bg-red-500/20 text-red-400"
                              title="Stop"
                            >
                              {killing === p.pid ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
                            </button>
                            <button
                              onClick={() => killProcess(p.pid, true)}
                              disabled={killing === p.pid}
                              className="rounded p-1 hover:bg-red-500/20 text-red-400"
                              title="Force Kill"
                            >
                              <Skull className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "system" && (
        <div className="flex-1 overflow-auto">
          {loading || !stats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* CPU */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">CPU</h3>
                <div className="text-2xl font-bold">{stats.cpu.toFixed(1)}%</div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(stats.cpu, 100)}%` }} />
                </div>
              </div>

              {/* Memory */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Memory</h3>
                <div className="text-2xl font-bold">{stats.ram.percent.toFixed(1)}%</div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: `${stats.ram.percent}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {stats.ram.used.toFixed(1)} / {stats.ram.total.toFixed(1)} GB
                </div>
              </div>

              {/* Disk */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Disk</h3>
                <div className="text-2xl font-bold">{stats.disk.percent.toFixed(1)}%</div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${stats.disk.percent}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {stats.disk.used.toFixed(1)} / {stats.disk.total.toFixed(1)} GB
                </div>
              </div>

              {/* Uptime */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Uptime</h3>
                <div className="text-2xl font-bold">
                  {Math.floor(stats.uptime / 86400)}d {Math.floor((stats.uptime % 86400) / 3600)}h {Math.floor((stats.uptime % 3600) / 60)}m
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
