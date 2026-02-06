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
