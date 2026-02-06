import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync("clawdbot cron list --json", {
      timeout: 10000,
    });
    const parsed = JSON.parse(stdout);
    return NextResponse.json({ jobs: parsed.jobs ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to list cron jobs" },
      { status: 500 }
    );
  }
}
