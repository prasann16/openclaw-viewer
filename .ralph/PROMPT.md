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

# Clawd Viewer v3 — Visibility Pack

Add tabs/sections for viewing all server data: files, database, cron, logs, system stats.

## Navigation

Add a vertical nav/tabs in the sidebar above the file tree:
- 📁 Files (current functionality)
- 🗄️ Database (new)
- ⏰ Cron (new)
- 📜 Logs (new)
- 📊 System (new)

Clicking a nav item shows that section in the main area.

## Feature 1: All File Types

Update the file tree to show ALL files (not just .md).
- Use appropriate syntax highlighting based on file extension
- Support: .json, .ts, .tsx, .js, .jsx, .py, .sh, .yaml, .yml, .toml, .env, .txt, .css, .html
- Use highlight.js or shiki with language detection
- Keep the existing markdown rendering for .md files

## Feature 2: SQLite Database Viewer

Show contents of ~/clawd/memory/clawd.db

API endpoint: GET /api/database
- Returns list of tables
- For each table, returns schema and row count

API endpoint: GET /api/database/[table]?limit=50&offset=0
- Returns rows from that table with pagination

UI:
- Show tabs for each table (sessions, events, decisions, messages)
- Display as a nice table with columns
- Pagination controls
- Show total count

## Feature 3: Cron Jobs Viewer

Show Clawdbot cron jobs.

API endpoint: GET /api/cron
- Runs: clawdbot cron list --json
- Returns jobs array

API endpoint: POST /api/cron/[id]/toggle
- Enables or disables a job

API endpoint: POST /api/cron/[id]/run
- Runs a job immediately

UI:
- Table showing: name, schedule, last run, status, enabled toggle
- "Run Now" button for each job
- Auto-refresh every 30s

## Feature 4: Live Logs Viewer

Stream gateway logs in real-time.

API endpoint: GET /api/logs (Server-Sent Events)
- Runs: tail -f ~/.clawdbot/logs/gateway.log
- Streams new lines as SSE events

UI:
- Dark terminal-style log viewer
- Auto-scroll to bottom
- Pause/resume button
- Clear button
- Show last 100 lines initially

## Feature 5: System Stats

Show server resource usage.

API endpoint: GET /api/system
- Returns: CPU %, RAM used/total, Disk used/total
- Get via: node os module or run shell commands

UI:
- Three progress bars with labels
- CPU: X%
- RAM: X GB / Y GB (Z%)
- Disk: X GB / Y GB (Z%)
- Auto-refresh every 5s
- Show uptime

## File Structure Changes

```
app/
├── api/
│   ├── database/
│   │   ├── route.ts        # GET tables list
│   │   └── [table]/route.ts # GET table rows
│   ├── cron/
│   │   ├── route.ts        # GET jobs list
│   │   └── [id]/
│   │       ├── toggle/route.ts
│   │       └── run/route.ts
│   ├── logs/route.ts       # SSE log stream
│   └── system/route.ts     # GET system stats
components/
├── nav-tabs.tsx            # Vertical navigation
├── database-viewer.tsx     # SQLite browser
├── cron-viewer.tsx         # Cron jobs list
├── logs-viewer.tsx         # Live log tail
├── system-stats.tsx        # Resource bars
└── code-viewer.tsx         # Syntax highlighted code
```

## Dependencies to Add
- better-sqlite3 (for SQLite access)
- Possibly: os-utils or just use Node's os module
