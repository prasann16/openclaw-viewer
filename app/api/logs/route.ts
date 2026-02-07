import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

// Fetch logs from multiple sources
async function getJournalLogs(lines: number): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      `journalctl --user -u clawdbot-gateway --no-pager -n ${lines} 2>/dev/null`,
      { timeout: 10000, maxBuffer: 2 * 1024 * 1024 }
    );
    return stdout.split("\n").filter(line => line.trim());
  } catch {
    return [];
  }
}

async function getFileLogs(lines: number): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      `clawdbot logs --plain --limit ${lines} 2>/dev/null | tail -${lines}`,
      { timeout: 10000, maxBuffer: 1024 * 1024 }
    );
    return stdout.split("\n").filter(line => line.trim());
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "journal"; // journal, file, or all
  const limit = Math.min(parseInt(searchParams.get("limit") || "150"), 500);

  try {
    let logs: string[] = [];

    if (source === "journal" || source === "all") {
      const journalLogs = await getJournalLogs(limit);
      logs = logs.concat(journalLogs);
    }

    if (source === "file" || source === "all") {
      const fileLogs = await getFileLogs(limit);
      if (source === "all" && fileLogs.length > 0) {
        logs.push("", "--- File Logs (clawdbot logs) ---", "");
      }
      logs = logs.concat(fileLogs);
    }

    return NextResponse.json({
      logs,
      source,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch logs";
    return NextResponse.json(
      { error: message, logs: [] },
      { status: 500 }
    );
  }
}
