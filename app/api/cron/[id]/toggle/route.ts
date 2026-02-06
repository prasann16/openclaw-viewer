import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: "Invalid job id" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body.enabled ? "enable" : "disable";

    await execAsync(`clawdbot cron ${action} ${id}`, {
      timeout: 10000,
    });

    return NextResponse.json({ success: true, action });
  } catch {
    return NextResponse.json(
      { error: "Failed to toggle cron job" },
      { status: 500 }
    );
  }
}
