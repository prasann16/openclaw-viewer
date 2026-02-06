"use client";

import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import yaml from "highlight.js/lib/languages/yaml";
import ini from "highlight.js/lib/languages/ini";
import plaintext from "highlight.js/lib/languages/plaintext";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark.css";
import { useMemo } from "react";

hljs.registerLanguage("json", json);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("ini", ini);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);

const EXT_TO_LANGUAGE: Record<string, string> = {
  ".json": "json",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".sh": "bash",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "ini",
  ".env": "ini",
  ".txt": "plaintext",
  ".css": "css",
  ".html": "xml",
};

function getLanguage(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf("."));
  return EXT_TO_LANGUAGE[ext] || "plaintext";
}

interface CodeViewerProps {
  content: string;
  filePath: string;
}

export function CodeViewer({ content, filePath }: CodeViewerProps) {
  const highlighted = useMemo(() => {
    const language = getLanguage(filePath);
    return hljs.highlight(content, { language }).value;
  }, [content, filePath]);

  return (
    <pre className="overflow-auto rounded-lg border border-border bg-zinc-900 p-4">
      <code
        className="hljs text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </pre>
  );
}
