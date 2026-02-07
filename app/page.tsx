"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import type { TabId } from "@/components/nav-tabs";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { CodeViewer } from "@/components/code-viewer";
import { ImageViewer } from "@/components/image-viewer";
import { DatabaseViewer } from "@/components/database-viewer";
import { CronViewer } from "@/components/cron-viewer";
import { SystemViewer } from "@/components/system-viewer";
import { FileText, Loader2, Menu, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useFileContent } from "@/lib/use-file-content";
import { toast } from "sonner";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"];

function isImageFile(path: string | null): boolean {
  if (!path) return false;
  const ext = path.toLowerCase().slice(path.lastIndexOf("."));
  return IMAGE_EXTENSIONS.includes(ext);
}

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedPath = searchParams.get("file");
  const workspaceParam = searchParams.get("workspace") || "main";
  const [workspace, setWorkspace] = useState(workspaceParam);
  const isImage = isImageFile(selectedPath);
  // Only fetch content for non-image files
  const { content, loading, error, refetch } = useFileContent(isImage ? null : selectedPath, workspace);
  const [activeTab, setActiveTab] = useState<TabId>("files");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(0); // 0 = none, 1 = first click, 2 = confirmed
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = useCallback(async () => {
    if (!selectedPath) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedPath, content: editContent, workspace }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setIsEditing(false);
      refetch();
      toast.success("File saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setIsSaving(false);
    }
  }, [selectedPath, editContent, workspace, refetch]);

  const handleDelete = useCallback(async () => {
    if (!selectedPath) return;
    
    if (deleteConfirm === 0) {
      setDeleteConfirm(1);
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setDeleteConfirm(0), 3000);
      return;
    }
    
    if (deleteConfirm === 1) {
      setDeleteConfirm(2);
      setIsDeleting(true);
      try {
        const params = new URLSearchParams({ path: selectedPath });
        if (workspace) params.set("workspace", workspace);
        
        const res = await fetch(`/api/file?${params.toString()}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete");
        }
        toast.success("File deleted");
        // Clear selection
        router.replace(`?workspace=${workspace}`, { scroll: false });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete file");
      } finally {
        setIsDeleting(false);
        setDeleteConfirm(0);
      }
    }
  }, [selectedPath, workspace, deleteConfirm, router]);

  const handleSelect = useCallback(
    (path: string) => {
      // Use replace with scroll: false for smoother navigation
      router.replace(`?workspace=${workspace}&file=${encodeURIComponent(path)}`, { scroll: false });
      setSheetOpen(false);
      setIsEditing(false);
    },
    [router, workspace]
  );

  const handleWorkspaceChange = useCallback(
    (newWorkspace: string) => {
      setWorkspace(newWorkspace);
      // Clear selected file when changing workspace
      router.replace(`?workspace=${newWorkspace}`, { scroll: false });
    },
    [router]
  );

  const renderFileContent = () => {
    if (!selectedPath) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <FileText className="h-12 w-12" />
          <p>Select a file to view</p>
        </div>
      );
    }

    // Handle images separately (no content loading needed)
    if (isImage) {
      return <ImageViewer path={selectedPath} workspace={workspace} />;
    }

    if (loading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-destructive">{error}</p>
        </div>
      );
    }

    if (content === null) {
      return null;
    }

    // Markdown files with edit support
    if (selectedPath.endsWith(".md")) {
      if (isEditing) {
        return (
          <div className="mx-auto max-w-3xl">
            <div className="flex h-full flex-col gap-4">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
              <textarea
                className="min-h-[calc(100vh-12rem)] w-full flex-1 resize-y rounded-md border border-input bg-muted p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </div>
          </div>
        );
      }
      return (
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditContent(content);
                setIsEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant={deleteConfirm === 1 ? "destructive" : "ghost"}
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deleteConfirm === 1 ? "Confirm Delete" : "Delete"}
            </Button>
          </div>
          <MarkdownViewer content={content} />
        </div>
      );
    }

    // Code files - full width for better readability
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex justify-end">
          <Button
            variant={deleteConfirm === 1 ? "destructive" : "ghost"}
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleteConfirm === 1 ? "Confirm Delete" : "Delete"}
          </Button>
        </div>
        <CodeViewer content={content} filePath={selectedPath} />
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        <Sidebar 
          selectedPath={selectedPath} 
          onSelect={handleSelect} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          workspace={workspace}
          onWorkspaceChange={handleWorkspaceChange}
        />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">File browser</SheetTitle>
          <Sidebar 
            selectedPath={selectedPath} 
            onSelect={handleSelect} 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            workspace={workspace}
            onWorkspaceChange={handleWorkspaceChange}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header with hamburger */}
        <div className="flex items-center border-b border-border px-4 py-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSheetOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
          <span className="ml-2 text-sm font-medium">
            {selectedPath || "OpenClaw"}
          </span>
        </div>

        <main className="flex-1 overflow-auto px-8 pt-8">
          {activeTab === "system" ? (
            <SystemViewer />
          ) : activeTab === "files" ? (
            renderFileContent()
          ) : activeTab === "database" ? (
            <DatabaseViewer workspace={workspace} />
          ) : activeTab === "cron" ? (
            <CronViewer />
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <ViewerContent />
    </Suspense>
  );
}
