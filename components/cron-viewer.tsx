"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Play, ToggleLeft, ToggleRight, ChevronDown, ChevronRight, X } from "lucide-react";

interface CronJobDetails {
  agentId?: string;
  sessionTarget?: string;
  payload?: {
    kind?: string;
    text?: string;
  };
  schedule?: {
    kind?: string;
    expr?: string;
    tz?: string;
  };
  state?: {
    lastRunAtMs?: number;
    lastStatus?: string;
    nextRunAtMs?: number;
  };
}

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string | null;
  status: string;
  enabled: boolean;
  details: CronJobDetails;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffMs < 0) {
    // Future time
    const absDiffSec = Math.abs(diffSec);
    if (absDiffSec < 60) return `in ${absDiffSec}s`;
    const absDiffMin = Math.floor(absDiffSec / 60);
    if (absDiffMin < 60) return `in ${absDiffMin}m`;
    const absDiffHr = Math.floor(absDiffMin / 60);
    if (absDiffHr < 24) return `in ${absDiffHr}h`;
    const absDiffDay = Math.floor(absDiffHr / 24);
    return `in ${absDiffDay}d`;
  }
  
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
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
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
    async (e: React.MouseEvent, job: CronJob) => {
      e.stopPropagation();
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
    async (e: React.MouseEvent, job: CronJob) => {
      e.stopPropagation();
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
          Auto-refreshes every 30s • Click row for details
        </span>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Jobs table */}
        <div className={cn(
          "overflow-auto rounded-lg border border-border",
          selectedJob ? "flex-1" : "w-full"
        )}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-8 px-2 py-2"></th>
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
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  className={cn(
                    "border-b border-border last:border-0 cursor-pointer transition-colors",
                    selectedJob?.id === job.id 
                      ? "bg-accent" 
                      : "hover:bg-muted/30"
                  )}
                >
                  <td className="px-2 py-2 text-muted-foreground">
                    {selectedJob?.id === job.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </td>
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
                          : job.status === "ok"
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
                      onClick={(e) => handleToggle(e, job)}
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
                      onClick={(e) => handleRun(e, job)}
                      disabled={runningIds.has(job.id)}
                    >
                      {runningIds.has(job.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Run
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details panel */}
        {selectedJob && (
          <div className="w-96 overflow-auto rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Job Details</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">ID</label>
                <p className="font-mono text-xs break-all">{selectedJob.id}</p>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Name</label>
                <p>{selectedJob.name}</p>
              </div>
              
              {selectedJob.details.agentId && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Agent</label>
                  <p>{selectedJob.details.agentId}</p>
                </div>
              )}
              
              {selectedJob.details.sessionTarget && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Session Target</label>
                  <p>{selectedJob.details.sessionTarget}</p>
                </div>
              )}
              
              {selectedJob.details.schedule && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Schedule</label>
                  <p className="font-mono text-xs">{selectedJob.details.schedule.expr}</p>
                  {selectedJob.details.schedule.tz && (
                    <p className="text-xs text-muted-foreground">Timezone: {selectedJob.details.schedule.tz}</p>
                  )}
                </div>
              )}
              
              {selectedJob.nextRun && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Next Run</label>
                  <p>{formatRelativeTime(selectedJob.nextRun)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(selectedJob.nextRun).toLocaleString()}</p>
                </div>
              )}
              
              {selectedJob.details.payload && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Payload</label>
                  {selectedJob.details.payload.kind && (
                    <p className="text-xs text-muted-foreground mb-1">Kind: {selectedJob.details.payload.kind}</p>
                  )}
                  {selectedJob.details.payload.text && (
                    <div className="bg-muted/50 rounded p-2 mt-1">
                      <p className="text-xs whitespace-pre-wrap">{selectedJob.details.payload.text}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
