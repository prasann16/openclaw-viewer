import fs from "fs/promises";
import path from "path";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

const CLAWD_ROOT = process.env.CLAWD_ROOT || "/home/clawdbot/clawd";

function getClawdRoot(): string {
  return path.resolve(CLAWD_ROOT);
}

export async function getFileTree(
  dir: string = getClawdRoot(),
  basePath: string = ""
): Promise<FileNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    // Skip hidden files/directories
    if (entry.name.startsWith(".")) continue;

    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const children = await getFileTree(
        path.join(dir, entry.name),
        relativePath
      );
      // Only include folders that contain .md files (directly or nested)
      if (children.length > 0) {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: "folder",
          children,
        });
      }
    } else if (entry.name.endsWith(".md")) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: "file",
      });
    }
  }

  // Sort: folders first, then files, alphabetically within each group
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

export async function readFileContent(
  filePath: string
): Promise<{ content: string; path: string }> {
  const root = getClawdRoot();
  const resolved = path.resolve(root, filePath);

  // Path traversal protection
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("FORBIDDEN");
  }

  // Ensure it's a .md file
  if (!resolved.endsWith(".md")) {
    throw new Error("FORBIDDEN");
  }

  try {
    const content = await fs.readFile(resolved, "utf-8");
    return { content, path: filePath };
  } catch {
    throw new Error("NOT_FOUND");
  }
}
