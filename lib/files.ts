import fs from "fs/promises";
import path from "path";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

export interface Workspace {
  id: string;
  name: string;
  path: string;
}

// Available workspaces - add more as needed
export const WORKSPACES: Workspace[] = [
  { id: "main", name: "Main (Clawd)", path: "/home/clawdbot/clawd" },
  { id: "myreader", name: "MyReader Bot", path: "/home/clawdbot/clawd-myreader" },
  { id: "creator", name: "Creator Bot", path: "/home/clawdbot/clawd-creator" },
  { id: "trader", name: "Trader Bot", path: "/home/clawdbot/trader" },
];

const DEFAULT_WORKSPACE = process.env.CLAWD_ROOT || "/home/clawdbot/clawd";

export function getWorkspaceRoot(workspaceId?: string): string {
  if (!workspaceId) return path.resolve(DEFAULT_WORKSPACE);
  const workspace = WORKSPACES.find(w => w.id === workspaceId);
  return path.resolve(workspace?.path || DEFAULT_WORKSPACE);
}

export async function getFileTree(
  workspaceId?: string,
  dir?: string,
  basePath: string = ""
): Promise<FileNode[]> {
  const root = getWorkspaceRoot(workspaceId);
  const targetDir = dir || root;
  
  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    // Skip hidden files/directories
    if (entry.name.startsWith(".")) continue;

    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const children = await getFileTree(
        workspaceId,
        path.join(targetDir, entry.name),
        relativePath
      );
      // Only include folders that contain files (directly or nested)
      if (children.length > 0) {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: "folder",
          children,
        });
      }
    } else {
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
  filePath: string,
  workspaceId?: string
): Promise<{ content: string; path: string }> {
  const root = getWorkspaceRoot(workspaceId);
  const resolved = path.resolve(root, filePath);

  // Path traversal protection
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("FORBIDDEN");
  }

  try {
    const content = await fs.readFile(resolved, "utf-8");
    return { content, path: filePath };
  } catch {
    throw new Error("NOT_FOUND");
  }
}

export async function writeFileContent(
  filePath: string,
  content: string,
  workspaceId?: string
): Promise<void> {
  const root = getWorkspaceRoot(workspaceId);
  const resolved = path.resolve(root, filePath);

  // Path traversal protection
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("FORBIDDEN");
  }

  // Ensure it's a .md file
  if (!resolved.endsWith(".md")) {
    throw new Error("FORBIDDEN");
  }

  // Ensure file exists before writing (don't create new files)
  try {
    await fs.access(resolved);
  } catch {
    throw new Error("NOT_FOUND");
  }

  await fs.writeFile(resolved, content, "utf-8");
}
