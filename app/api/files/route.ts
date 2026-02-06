import { NextResponse } from "next/server";
import { getFileTree } from "@/lib/files";

export async function GET() {
  try {
    const tree = await getFileTree();
    return NextResponse.json({ tree });
  } catch {
    return NextResponse.json(
      { error: "Failed to read directory" },
      { status: 500 }
    );
  }
}
