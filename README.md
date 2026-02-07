# clawd-viewer

A lightweight web dashboard for monitoring [Clawdbot](https://github.com/clawdbot/clawdbot) instances. View logs, manage cron jobs, browse files, query databases, and monitor system stats — all from your browser.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![License](https://img.shields.io/badge/license-MIT-blue)

## What is this?

**Clawdbot** is an AI assistant framework that runs as a background daemon, connecting to messaging platforms (Telegram, Discord, WhatsApp, etc.) and executing tasks autonomously. It has memory, cron jobs, file access, and tool integrations.

**clawd-viewer** is a companion web UI that lets you see what your Clawdbot is doing:

- Watch logs stream in real-time
- See scheduled tasks and trigger them manually
- Browse the workspace files your bot reads/writes
- Check system resources (is it eating all your RAM?)
- View and query the SQLite databases it uses

Think of it as a control panel for your AI assistant.

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

The viewer expects to run on the same machine as Clawdbot. It reads from:

| Path | What |
|------|------|
| `~/.clawdbot/` | Clawdbot config and state |
| `~/clawd/` | Workspace (memory, files, databases) |
| `~/.clawdbot/gateway.log` | Live log file |

If your Clawdbot uses different paths, update the constants in `lib/files.ts` and `lib/database.ts`.

## Use Cases

**Local development** — Run alongside Clawdbot on your machine to debug and monitor.

**Remote server** — Deploy on your VPS next to Clawdbot. Access via SSH tunnel or reverse proxy with auth.

**Clawdbot Cloud** — This powers the monitoring dashboard in [Clawdbot Cloud](https://clawdbot.cloud), letting users see their hosted bot's activity.

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

## Remote Access

This dashboard has **no authentication** built-in. Here are secure ways to access it remotely:

### Tailscale (Recommended)

[Tailscale](https://tailscale.com) creates a private network between your devices. Free for personal use.

```bash
# On your server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Note your Tailscale IP (e.g., 100.x.x.x)
tailscale ip -4

# Run clawd-viewer
npm run dev
```

Then access from any device on your Tailnet: `http://100.x.x.x:3000`

**Bonus:** Add [Tailscale Serve](https://tailscale.com/kb/1242/tailscale-serve) for HTTPS:
```bash
tailscale serve --bg 3000
# Now accessible at https://your-server.tail-scale.ts.net
```

### SSH Tunnel

```bash
ssh -L 3000:localhost:3000 user@yourserver
# Then open http://localhost:3000 on your machine
```

### Reverse Proxy with Auth

Use nginx or Caddy with basic auth:

```
# Caddyfile example
viewer.yourdomain.com {
    basicauth {
        admin $2a$14$... # use: caddy hash-password
    }
    reverse_proxy localhost:3000
}
```

## License

MIT
