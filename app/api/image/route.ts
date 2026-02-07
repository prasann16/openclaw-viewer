import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";
import { getWorkspaceRoot } from "@/lib/files";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path");
  const workspace = request.nextUrl.searchParams.get("workspace") || undefined;

  if (!filePath) {
    return NextResponse.json({ error: "Missing 'path' parameter" }, { status: 400 });
  }

  const root = getWorkspaceRoot(workspace);

  // Security: prevent path traversal
  const normalizedPath = resolve(root, filePath);
  if (!normalizedPath.startsWith(root)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Get extension
  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf("."));
  const mimeType = MIME_TYPES[ext];

  if (!mimeType) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  if (!existsSync(normalizedPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const data = await readFile(normalizedPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
