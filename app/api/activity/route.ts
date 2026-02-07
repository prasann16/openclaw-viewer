import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Just raw journalctl output - nothing fancy
    const { stdout } = await execAsync(
      `journalctl --user -u clawdbot-gateway --no-pager -n 100 2>/dev/null`,
      { timeout: 10000, maxBuffer: 2 * 1024 * 1024 }
    );
    
    const lines = stdout.split("\n").filter(l => l.trim());
    
    return NextResponse.json({
      lines,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch logs";
    return NextResponse.json({ error: message, lines: [] }, { status: 500 });
  }
}
