"use client";

import { ChevronRight, File, Folder } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

interface FileTreeProps {
  tree: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function FileTree({ tree, selectedPath, onSelect }: FileTreeProps) {
  return (
    <div className="text-sm">
      {tree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth: number;
}

function FileTreeNode({
  node,
  selectedPath,
  onSelect,
  depth,
}: FileTreeNodeProps) {
  if (node.type === "folder") {
    return (
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center gap-1 rounded-sm px-2 py-1 hover:bg-accent group">
          <span style={{ paddingLeft: `${depth * 12}px` }} />
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.name}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {node.children?.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={cn(
        "flex w-full items-center gap-1 rounded-sm px-2 py-1 hover:bg-accent",
        selectedPath === node.path && "bg-accent text-accent-foreground"
      )}
    >
      <span style={{ paddingLeft: `${depth * 12}px` }} />
      <span className="w-3.5 shrink-0" />
      <File className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
