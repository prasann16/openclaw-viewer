import { NextRequest, NextResponse } from "next/server";
import { getDatabases, getTables } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const workspace = request.nextUrl.searchParams.get("workspace") || undefined;
    const dbPath = request.nextUrl.searchParams.get("db") || undefined;

    // If no specific DB requested, return list of databases
    if (!dbPath) {
      const databases = getDatabases(workspace);
      return NextResponse.json({ databases });
    }

    // If DB specified, return its tables
    const tables = getTables(dbPath);
    return NextResponse.json({ tables });
  } catch {
    return NextResponse.json(
      { error: "Failed to read database" },
      { status: 500 }
    );
  }
}
