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

# Clawd Viewer v2 — Dark/Light Toggle + Edit Mode

Add two features to the existing clawd-viewer app.

## Feature 1: Dark/Light Mode Toggle

- Add a theme toggle button in the sidebar header (sun/moon icon)
- Use next-themes for theme management
- Store preference in localStorage
- Default to dark mode
- Toggle should be smooth (no flash on page load)

## Feature 2: File Editing

- Add an "Edit" button when viewing a file
- Clicking Edit switches the markdown viewer to a textarea editor
- Editor should be a nice code editor feel (monospace font, proper sizing)
- Add "Save" and "Cancel" buttons when in edit mode
- Save calls POST /api/file to write the file
- Show loading state while saving
- Show success/error toast after save
- Return to view mode after successful save

## API Changes

### POST /api/file
- Body: { path: string, content: string }
- Validates path is within CLAWD_ROOT
- Writes content to file
- Returns { success: true } or error

## UI Notes
- Keep it minimal — just add what's needed
- Theme toggle: small icon button, top right of sidebar header
- Edit button: top right of the content area, only shows when file is selected
- Use existing shadcn components (Button, Textarea if available)
