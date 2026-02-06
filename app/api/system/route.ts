import { NextResponse } from "next/server";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function getCpuPercent(): Promise<number> {
  try {
    const { stdout } = await execAsync(
      "awk '{u=$2+$4; t=$2+$4+$5; if(NR==1){u1=u;t1=t} else {print (u-u1)/(t-t1)*100}}' <(head -1 /proc/stat) <(sleep 0.5 && head -1 /proc/stat)",
      { shell: "/bin/bash", timeout: 5000 }
    );
    const val = parseFloat(stdout.trim());
    return isNaN(val) ? 0 : Math.round(val * 10) / 10;
  } catch {
    return 0;
  }
}

async function getDiskUsage(): Promise<{
  used: number;
  total: number;
  percent: number;
}> {
  try {
    const { stdout } = await execAsync("df -B1 / | tail -1", {
      timeout: 5000,
    });
    const parts = stdout.trim().split(/\s+/);
    const total = parseInt(parts[1], 10);
    const used = parseInt(parts[2], 10);
    const percent = total > 0 ? Math.round((used / total) * 1000) / 10 : 0;
    return {
      used: Math.round((used / 1073741824) * 10) / 10,
      total: Math.round((total / 1073741824) * 10) / 10,
      percent,
    };
  } catch {
    return { used: 0, total: 0, percent: 0 };
  }
}

export async function GET() {
  try {
    const [cpuPercent, disk] = await Promise.all([
      getCpuPercent(),
      getDiskUsage(),
    ]);

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const ram = {
      used: Math.round((usedMem / 1073741824) * 10) / 10,
      total: Math.round((totalMem / 1073741824) * 10) / 10,
      percent: Math.round((usedMem / totalMem) * 1000) / 10,
    };

    const uptime = os.uptime();

    return NextResponse.json({
      cpu: cpuPercent,
      ram,
      disk,
      uptime,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to get system stats" },
      { status: 500 }
    );
  }
}
