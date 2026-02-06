"use client";

import { useEffect, useState } from "react";
import { FileTree, type FileNode } from "@/components/file-tree";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function Sidebar({ selectedPath, onSelect }: SidebarProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/files")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load files");
        return res.json();
      })
      .then((data) => setTree(data.tree))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Clawd</h1>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {error ? (
            <p className="px-2 text-sm text-destructive">{error}</p>
          ) : tree.length === 0 ? (
            <p className="px-2 text-sm text-muted-foreground">No files found</p>
          ) : (
            <FileTree
              tree={tree}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
