import { NextResponse } from "next/server";
import { getFileTree, WORKSPACES } from "@/lib/files";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspace = searchParams.get("workspace") || undefined;
    
    const tree = await getFileTree(workspace);
    return NextResponse.json({ tree, workspaces: WORKSPACES });
  } catch {
    return NextResponse.json(
      { error: "Failed to read directory" },
      { status: 500 }
    );
  }
}
