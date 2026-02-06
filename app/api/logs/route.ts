import { spawn } from "child_process";
import { homedir } from "os";
import { join } from "path";

const LOG_FILE = join(homedir(), ".clawdbot", "logs", "gateway.log");

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // First send the last 100 lines, then follow
      const tail = spawn("tail", ["-n", "100", "-f", LOG_FILE], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let buffer = "";

      tail.stdout.on("data", (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          controller.enqueue(encoder.encode(`data: ${line}\n\n`));
        }
      });

      tail.stderr.on("data", (data: Buffer) => {
        const msg = data.toString().trim();
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${msg}\n\n`)
        );
      });

      tail.on("close", () => {
        // Flush any remaining buffer
        if (buffer) {
          controller.enqueue(encoder.encode(`data: ${buffer}\n\n`));
        }
        controller.close();
      });

      tail.on("error", (err) => {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${err.message}\n\n`)
        );
        controller.close();
      });

      // Clean up on cancel (client disconnect)
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Store cleanup function for cancel
      (stream as unknown as { _tailProcess: typeof tail })._tailProcess = tail;
    },
    cancel() {
      const proc = (stream as unknown as { _tailProcess: ReturnType<typeof spawn> })._tailProcess;
      if (proc && !proc.killed) {
        proc.kill();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
