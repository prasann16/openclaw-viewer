"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { FileTree, type FileNode } from "@/components/file-tree";
import { NavTabs, type TabId } from "@/components/nav-tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceSelector } from "@/components/workspace-selector";

interface Workspace {
  id: string;
  name: string;
  path: string;
}

interface SidebarProps {
  selectedPath: string | null;
  onSelect: (path: string) => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  workspace: string;
  onWorkspaceChange: (workspace: string) => void;
}

export function Sidebar({ selectedPath, onSelect, activeTab, onTabChange, workspace, onWorkspaceChange }: SidebarProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback((ws: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/files?workspace=${ws}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load files");
        return res.json();
      })
      .then((data) => {
        setTree(data.tree);
        if (data.workspaces) {
          setWorkspaces(data.workspaces);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFiles(workspace);
  }, [workspace, fetchFiles]);

  const handleWorkspaceChange = (newWorkspace: string) => {
    onWorkspaceChange(newWorkspace);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">OpenClaw</h1>
        <ThemeToggle />
      </div>
      
      {/* Workspace selector - always visible */}
      <div className="border-b border-border p-2">
        <WorkspaceSelector
          workspaces={workspaces}
          selected={workspace}
          onSelect={handleWorkspaceChange}
        />
      </div>
      
      <NavTabs activeTab={activeTab} onTabChange={onTabChange} />
      
      {activeTab === "files" && (
        <ScrollArea className="flex-1">
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
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
      )}
    </div>
  );
}
