"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { FileText, Loader2, Menu, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useFileContent } from "@/lib/use-file-content";

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedPath = searchParams.get("file");
  const { content, loading, error, refetch } = useFileContent(selectedPath);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const handleSelect = useCallback(
    (path: string) => {
      router.push(`?file=${encodeURIComponent(path)}`);
      setSheetOpen(false);
      setIsEditing(false);
    },
    [router]
  );

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        <Sidebar selectedPath={selectedPath} onSelect={handleSelect} />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">File browser</SheetTitle>
          <Sidebar selectedPath={selectedPath} onSelect={handleSelect} />
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
            {selectedPath || "Clawd"}
          </span>
        </div>

        <main className="flex-1 overflow-auto p-8">
          {!selectedPath ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText className="h-12 w-12" />
              <p>Select a file to view</p>
            </div>
          ) : loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : content !== null ? (
            <div className="mx-auto max-w-3xl">
              {!isEditing && (
                <div className="mb-4 flex justify-end">
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
                </div>
              )}
              <MarkdownViewer content={content} />
            </div>
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
