"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Play, ToggleLeft, ToggleRight } from "lucide-react";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string | null;
  status: string;
  enabled: boolean;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function CronViewer() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/cron");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setJobs(data.jobs || []);
      setError(null);
    } catch {
      setError("Failed to load cron jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    intervalRef.current = setInterval(fetchJobs, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchJobs]);

  const handleToggle = useCallback(
    async (job: CronJob) => {
      setTogglingIds((prev) => new Set(prev).add(job.id));
      try {
        const res = await fetch(`/api/cron/${job.id}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !job.enabled }),
        });
        if (!res.ok) throw new Error("Failed to toggle");
        await fetchJobs();
      } catch {
        setError("Failed to toggle job");
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(job.id);
          return next;
        });
      }
    },
    [fetchJobs]
  );

  const handleRun = useCallback(
    async (job: CronJob) => {
      setRunningIds((prev) => new Set(prev).add(job.id));
      try {
        const res = await fetch(`/api/cron/${job.id}/run`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to run");
        await fetchJobs();
      } catch {
        setError("Failed to run job");
      } finally {
        setRunningIds((prev) => {
          const next = new Set(prev);
          next.delete(job.id);
          return next;
        });
      }
    },
    [fetchJobs]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Clock className="h-12 w-12" />
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Clock className="h-12 w-12" />
        <p>No cron jobs found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cron Jobs</h2>
        <span className="text-xs text-muted-foreground">
          Auto-refreshes every 30s
        </span>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex-1 overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                Name
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                Schedule
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                Last Run
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                Enabled
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td className="whitespace-nowrap px-3 py-2 font-medium">
                  {job.name}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                  {job.schedule}
                </td>
                <td
                  className="whitespace-nowrap px-3 py-2 text-muted-foreground"
                  title={job.lastRun ?? "Never"}
                >
                  {formatRelativeTime(job.lastRun)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      job.status === "running"
                        ? "bg-blue-500/15 text-blue-400"
                        : job.status === "success"
                          ? "bg-green-500/15 text-green-400"
                          : job.status === "error"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-muted text-muted-foreground"
                    )}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <button
                    onClick={() => handleToggle(job)}
                    disabled={togglingIds.has(job.id)}
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                    title={job.enabled ? "Disable" : "Enable"}
                  >
                    {togglingIds.has(job.id) ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : job.enabled ? (
                      <ToggleRight className="h-5 w-5 text-green-400" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRun(job)}
                    disabled={runningIds.has(job.id)}
                  >
                    {runningIds.has(job.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Run Now
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
