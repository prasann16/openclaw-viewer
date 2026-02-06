"use client";

import {
  FolderOpen,
  Database,
  Clock,
  ScrollText,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "files" | "database" | "cron" | "logs" | "system";

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "files", label: "Files", icon: FolderOpen },
  { id: "database", label: "Database", icon: Database },
  { id: "cron", label: "Cron", icon: Clock },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "system", label: "System", icon: Activity },
];

interface NavTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  return (
    <nav className="flex flex-col gap-0.5 border-b border-border p-2">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
            activeTab === id
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </button>
      ))}
    </nav>
  );
}
