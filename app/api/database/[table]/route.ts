import { NextResponse } from "next/server";
import { getTableRows } from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const { searchParams } = new URL(request.url);
    const dbPath = searchParams.get("db");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!dbPath) {
      return NextResponse.json(
        { error: "Missing 'db' parameter" },
        { status: 400 }
      );
    }

    const result = getTableRows(dbPath, table, limit, offset);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_TABLE") {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to read table" },
      { status: 500 }
    );
  }
}
