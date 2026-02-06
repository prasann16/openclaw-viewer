import { useCallback, useEffect, useRef, useState } from "react";

interface FetchResult {
  content: string | null;
  error: string | null;
}

interface FileContentState {
  content: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFileContent(path: string | null): FileContentState {
  const [result, setResult] = useState<FetchResult & { path: string | null }>({
    content: null,
    error: null,
    path: null,
  });
  const [fetchKey, setFetchKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!path) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`/api/file?path=${encodeURIComponent(path)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load file");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ content: data.content, error: null, path });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setResult({ content: null, error: err.message, path });
        }
      });

    return () => controller.abort();
  }, [path, fetchKey]);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  if (!path) {
    return { content: null, loading: false, error: null, refetch };
  }

  // If the result is for a different path, we're still loading
  if (result.path !== path) {
    return { content: null, loading: true, error: null, refetch };
  }

  return { content: result.content, loading: false, error: result.error, refetch };
}
