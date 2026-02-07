# clawd-viewer

A lightweight web dashboard for monitoring Clawdbot instances. View logs, manage cron jobs, browse files, query databases, and monitor system stats — all from your browser.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **📊 System Stats** — CPU, RAM, disk usage, uptime
- **📜 Live Logs** — Real-time log streaming with SSE
- **⏰ Cron Jobs** — View, toggle, and manually run scheduled tasks
- **📁 File Browser** — Navigate and view workspace files
- **🗄️ Database Viewer** — Browse SQLite tables and query data
- **🔄 Process Monitor** — View running processes with kill capability
- **🌙 Dark Mode** — Easy on the eyes

## Quick Start

```bash
# Clone
git clone https://github.com/prasann16/clawd-viewer.git
cd clawd-viewer

# Install
npm install

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration

The viewer expects to run alongside a Clawdbot instance. It reads from:

- `~/.clawdbot/` — Config and state
- `~/clawd/` — Workspace files
- SQLite databases in the workspace

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/system` | System stats (CPU, RAM, disk, uptime) |
| `GET /api/logs` | SSE stream of gateway logs |
| `GET /api/activity` | Recent activity/events |
| `GET /api/cron` | List cron jobs |
| `POST /api/cron/[id]/toggle` | Enable/disable a cron job |
| `POST /api/cron/[id]/run` | Manually trigger a cron job |
| `GET /api/files` | List workspace files |
| `GET /api/file?path=...` | Read file contents |
| `GET /api/database` | List SQLite tables |
| `GET /api/database/[table]` | Query table rows |
| `GET /api/processes` | List running processes |
| `POST /api/process/kill` | Kill a process |

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **State:** React hooks
- **Streaming:** Server-Sent Events (SSE)

## License

MIT
