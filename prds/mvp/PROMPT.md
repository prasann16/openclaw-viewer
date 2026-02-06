# Clawd Viewer — Personal Memory Interface

A simple Next.js web app to browse and view Clawdbot's memory files.

## Stack
- Next.js 14+ (App Router)
- Tailwind CSS
- shadcn/ui components
- Runs on VPS, accesses ~/clawd directly via filesystem

## Features (MVP)

### 1. File Browser (sidebar)
- Tree view of ~/clawd/ directory
- Shows .md files and folders
- Click to select file
- Highlight current file
- Collapsible folders

### 2. Markdown Viewer (main area)
- Render selected markdown file
- Nice typography (prose styles)
- Code syntax highlighting (use highlight.js or shiki)
- Support for tables, lists, code blocks, GFM

### 3. Basic Layout
- Sidebar (250px, file tree) + Main (content viewer)
- Dark mode by default
- Clean, minimal design
- Mobile: sidebar as drawer/sheet

## File Structure
```
clawd-viewer/
├── app/
│   ├── page.tsx              # Main viewer page
│   ├── layout.tsx            # Root layout with sidebar
│   └── api/
│       ├── files/route.ts    # GET: List directory tree
│       └── file/route.ts     # GET: Read file content by path
├── components/
│   ├── file-tree.tsx         # Recursive tree component
│   ├── markdown-viewer.tsx   # Markdown renderer
│   └── sidebar.tsx           # Sidebar wrapper
├── lib/
│   └── files.ts              # File system utilities
├── tailwind.config.ts
├── package.json
└── .env.local
```

## Environment Variables
- `CLAWD_ROOT` — path to clawd workspace (default: `/home/clawdbot/clawd`)

## API Routes

### GET /api/files
Returns recursive tree of all .md files in CLAWD_ROOT.
```json
{
  "tree": [
    { "name": "MEMORY.md", "path": "MEMORY.md", "type": "file" },
    { "name": "memory", "path": "memory", "type": "folder", "children": [...] }
  ]
}
```

### GET /api/file?path=memory/2026-01-26.md
Returns file content. Validates path is within CLAWD_ROOT (prevent traversal).
```json
{
  "content": "# Daily Log...",
  "path": "memory/2026-01-26.md"
}
```

## Constraints
- Read-only (no editing in v1)
- No authentication (Tailscale handles network security)
- No database
- Single user (personal tool)

## Design Notes
- Dark theme: zinc/slate background, clean white text
- Monospace for code, nice serif or sans for prose
- File tree: subtle hover states, folder icons, file icons
- Keep it simple and fast
