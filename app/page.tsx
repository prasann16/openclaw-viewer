"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { FileText } from "lucide-react";

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedPath = searchParams.get("file");
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = useCallback(
    (path: string) => {
      router.push(`?file=${encodeURIComponent(path)}`);
    },
    [router]
  );

  useEffect(() => {
    if (!selectedPath) {
      setContent(null);
      return;
    }

    setError(null);
    fetch(`/api/file?path=${encodeURIComponent(selectedPath)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load file");
        return res.json();
      })
      .then((data) => setContent(data.content))
      .catch((err) => {
        setContent(null);
        setError(err.message);
      });
  }, [selectedPath]);

  return (
    <div className="flex h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        <Sidebar selectedPath={selectedPath} onSelect={handleSelect} />
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {error ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : content !== null ? (
          <div className="mx-auto max-w-3xl">
            <MarkdownViewer content={content} />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <FileText className="h-12 w-12" />
            <p>Select a file to view</p>
          </div>
        )}
      </main>
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
