import { NextRequest, NextResponse } from "next/server";
import { readFileContent, writeFileContent, deleteFile } from "@/lib/files";

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path");
  const workspace = request.nextUrl.searchParams.get("workspace") || undefined;

  if (!filePath) {
    return NextResponse.json(
      { error: "Missing 'path' parameter" },
      { status: 400 }
    );
  }

  try {
    const result = await readFileContent(filePath, workspace);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
      if (error.message === "NOT_FOUND") {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: { path?: string; content?: string; workspace?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { path: filePath, content, workspace } = body;

  if (!filePath || typeof content !== "string") {
    return NextResponse.json(
      { error: "Missing 'path' or 'content' in request body" },
      { status: 400 }
    );
  }

  try {
    await writeFileContent(filePath, content, workspace);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
      if (error.message === "NOT_FOUND") {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path");
  const workspace = request.nextUrl.searchParams.get("workspace") || undefined;

  if (!filePath) {
    return NextResponse.json(
      { error: "Missing 'path' parameter" },
      { status: 400 }
    );
  }

  try {
    await deleteFile(filePath, workspace);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
      if (error.message === "NOT_FOUND") {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
