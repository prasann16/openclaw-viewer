import { NextRequest, NextResponse } from "next/server";
import { readFileContent } from "@/lib/files";

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path");

  if (!filePath) {
    return NextResponse.json(
      { error: "Missing 'path' parameter" },
      { status: 400 }
    );
  }

  try {
    const result = await readFileContent(filePath);
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
