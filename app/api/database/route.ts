import { NextResponse } from "next/server";
import { getTables } from "@/lib/database";

export async function GET() {
  try {
    const tables = getTables();
    return NextResponse.json({ tables });
  } catch {
    return NextResponse.json(
      { error: "Failed to read database" },
      { status: 500 }
    );
  }
}
