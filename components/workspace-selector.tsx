"use client";

import { ChevronDown, Folder } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Workspace {
  id: string;
  name: string;
  path: string;
}

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  selected: string;
  onSelect: (id: string) => void;
}

export function WorkspaceSelector({ workspaces, selected, onSelect }: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedWorkspace = workspaces.find(w => w.id === selected) || workspaces[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{selectedWorkspace?.name}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-background shadow-lg">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => {
                onSelect(workspace.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${
                workspace.id === selected ? "bg-muted font-medium" : ""
              }`}
            >
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{workspace.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
