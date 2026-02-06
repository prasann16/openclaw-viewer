# Ralph Loop Prompt

## First: Check Branch

Before doing anything, make sure you're on a feature branch (not main):
```bash
git branch --show-current
```
If on `main`, create a branch first:
```bash
git checkout -b <feature-name>
```

## Files

Read these to understand your task:
- `.ralph/prd.json` - Task list (check `passes` field)
- `.ralph/progress.txt` - What's been done
- `.ralph/AGENTS.md` - Project-specific context (if exists)

## Your Mission

1. **Pick a task** - Choose the highest priority item from prd.json where `passes: false`
   - Not necessarily the first one - use judgment on dependencies

2. **Investigate** - Read relevant source files before implementing
   - Don't assume something isn't implemented - check first

3. **Implement** - Write the code for this ONE task only
   - Follow existing code patterns
   - Keep changes minimal and focused

4. **Validate** - Run all feedback loops:
   - Type checking, tests, linting, build (if applicable)

5. **Update progress** - Append to `.ralph/progress.txt`:
   - Task completed (reference PRD item id)
   - Key decisions made
   - Files changed

6. **Update PRD** - Set `passes: true` for the completed task in prd.json

7. **Commit** - Make a git commit with a descriptive message

## Rules

- **ONE TASK PER ITERATION** - Do not work on multiple tasks
- **COMMIT AFTER EACH TASK** - Clean git history
- **DON'T SKIP VALIDATION** - Run tests even if confident

## Completion

When ALL items in prd.json have `passes: true`:

1. Push: `git push origin HEAD`
2. Create PR: `gh pr create --fill`
3. Output: `<promise>COMPLETE</promise>`

Do not output COMPLETE until PR is created.

---

# Feature Spec

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
