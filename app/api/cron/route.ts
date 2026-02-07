import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/* eslint-disable @typescript-eslint/no-explicit-any */
interface RawJob {
  id: string;
  name: string;
  enabled: boolean;
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
  payload?: any;
  agentId?: string;
  sessionTarget?: string;
  [key: string]: any;
}

export async function GET() {
  try {
    const { stdout } = await execAsync("clawdbot cron list --all --json", {
      timeout: 10000,
    });
    const parsed = JSON.parse(stdout);
    const rawJobs: RawJob[] = parsed.jobs ?? [];
    
    // Transform to match component expectations, include raw for details
    const jobs = rawJobs.map((job) => ({
      id: job.id,
      name: job.name || job.id,
      schedule: job.schedule?.expr 
        ? `${job.schedule.expr}${job.schedule.tz ? ` (${job.schedule.tz})` : ''}`
        : 'N/A',
      lastRun: job.state?.lastRunAtMs 
        ? new Date(job.state.lastRunAtMs).toISOString()
        : null,
      nextRun: job.state?.nextRunAtMs
        ? new Date(job.state.nextRunAtMs).toISOString()
        : null,
      status: job.state?.lastStatus || 'idle',
      enabled: job.enabled ?? true,
      // Include full details for expansion
      details: {
        agentId: job.agentId,
        sessionTarget: job.sessionTarget,
        payload: job.payload,
        schedule: job.schedule,
        state: job.state,
      },
    }));
    
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json(
      { error: "Failed to list cron jobs" },
      { status: 500 }
    );
  }
}
