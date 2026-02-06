import { NextResponse } from "next/server";
import { getTableRows } from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = getTableRows(table, limit, offset);
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
