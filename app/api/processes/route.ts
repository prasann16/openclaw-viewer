import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { stdout } = await execAsync(
      `ps -u clawdbot -o pid,pcpu,pmem,etime,args --sort=-pcpu 2>/dev/null | head -20`,
      { timeout: 5000 }
    );

    const lines = stdout.split("\n").slice(1).filter(l => l.trim());
    const processes = lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parts[0],
        cpu: parts[1] + "%",
        mem: parts[2] + "%",
        time: parts[3],
        cmd: parts.slice(4).join(" ").slice(0, 80),
      };
    }).filter(p => !p.cmd.includes("ps -u"));

    return NextResponse.json({ processes });
  } catch (error) {
    return NextResponse.json({ processes: [], error: "Failed to fetch processes" });
  }
}
