import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { pid, signal = "TERM" } = await request.json();
    
    if (!pid || !/^\d+$/.test(String(pid))) {
      return NextResponse.json({ error: "Invalid PID" }, { status: 400 });
    }

    // Safety: only allow killing processes owned by clawdbot user
    const { stdout: owner } = await execAsync(`ps -o user= -p ${pid} 2>/dev/null || echo ""`);
    if (owner.trim() !== "clawdbot") {
      return NextResponse.json({ error: "Can only kill clawdbot processes" }, { status: 403 });
    }

    // Don't allow killing critical processes
    const { stdout: cmd } = await execAsync(`ps -o args= -p ${pid} 2>/dev/null || echo ""`);
    const criticalPatterns = ["clawdbot-gateway", "systemd", "sshd", "dbus"];
    if (criticalPatterns.some(p => cmd.includes(p))) {
      return NextResponse.json({ error: "Cannot kill critical system process" }, { status: 403 });
    }

    // Kill the process
    const sig = signal === "KILL" ? "-9" : "-15";
    await execAsync(`kill ${sig} ${pid}`);

    return NextResponse.json({ success: true, pid, signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to kill process";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
