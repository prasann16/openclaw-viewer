"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Loader2 } from "lucide-react";

interface SystemData {
  cpu: number;
  ram: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
  uptime: number;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "< 1 minute";
}

function ProgressBar({ label, value, detail }: { label: string; value: number; detail: string }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color =
    clampedValue >= 90
      ? "bg-red-500"
      : clampedValue >= 70
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{detail}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

export function SystemStats() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/system");
      if (!res.ok) throw new Error("Failed to fetch system stats");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Failed to load system stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Activity className="h-12 w-12" />
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex h-full flex-col gap-6">
      <h2 className="text-lg font-semibold">System Stats</h2>

      <div className="space-y-6">
        <ProgressBar
          label="CPU"
          value={data.cpu}
          detail={`${data.cpu}%`}
        />
        <ProgressBar
          label="RAM"
          value={data.ram.percent}
          detail={`${data.ram.used} GB / ${data.ram.total} GB (${data.ram.percent}%)`}
        />
        <ProgressBar
          label="Disk"
          value={data.disk.percent}
          detail={`${data.disk.used} GB / ${data.disk.total} GB (${data.disk.percent}%)`}
        />
      </div>

      <div className="rounded-lg border border-border p-4">
        <span className="text-sm text-muted-foreground">Server Uptime</span>
        <p className="mt-1 text-lg font-medium">{formatUptime(data.uptime)}</p>
      </div>
    </div>
  );
}
