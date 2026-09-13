# HyperTrack - Self-Hosted Agile Project Management & Bug Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20WAL-003B57.svg)](https://www.sqlite.org/)

**HyperTrack** is a lightweight, modern, self-hosted project management, sprint planning, and bug tracking platform tailored for agile software teams. Built with zero external database dependencies (using local, high-performance SQLite in WAL mode), granular Role-Based Access Control (RBAC), end-to-end TLS/HTTPS security, mobile responsiveness, and a refined editorial design aesthetic.

---

## Key Highlights

- **Zero-Config File Database**: Uses local SQLite (`data/tracker.db`) in WAL mode. No Docker container, Postgres, or MySQL installation required. Instant portability, atomic backups, and snapshot exports.
- **Single-Script Installation**: Run `./install.sh` on any Linux server or macOS machine for a turnkey automated setup in seconds.
- **Granular Role-Based Access Control (RBAC)**:
  - **Admin**: Full system management, project lifecycle, user account provisioning, role assignment, and database backups.
  - **Project Manager (PM)**: Milestone planning, roadmap & capacity metrics, task assignment.
  - **Developer**: Focus workspace, Kanban status moves, comments, issue resolution.
  - **QA Tester**: Bug triage workbench, repro steps documentation, fix verification & sign-offs.
  - **Viewer**: Read-only oversight across boards and metrics.
- **Clean Production Auth**: Zero dummy users or mock tickets out of the box. Ships with a single default **Admin** account ready to be configured.
- **Full Mobile Responsive & PWA-Ready**: Seamless vertical navigation sidebar, mobile drawer, touch scroll-snap Kanban board, and bottom-sheet modals.
- **Security-First**: End-to-end HTTPS/TLS encryption with automated certificate provisioning and industry-standard security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).

---

## Quick Start (Automated Installation)

### 1. Clone Repository & Run Installer

```bash
git clone https://github.com/your-username/HyperTrack.git
cd HyperTrack
chmod +x install.sh
./install.sh
```

The installer will:
1. Validate your Node.js (v18+) and npm environment.
2. Install server and client dependencies.
3. Generate local TLS certificates in `./certs/`.
4. Build the production React client into `./client/dist/`.
5. Initialize the local database (`data/tracker.db`) with the default Admin user.

### 2. Default Credentials

| Field | Value |
| :--- | :--- |
| **Username / Email** | `admin` *(or `admin@hypertrack.local`)* |
| **Default Password** | `Admin@123` |
| **Role** | System Administrator |

> [!IMPORTANT]
> Change the default administrator password immediately after first login via **Edit Profile & Password** in the bottom user menu.

---

## Running the Application

### Option A: Production Mode (Recommended)

Run the Express server (which automatically serves the compiled frontend and API on port 3001):

```bash
npm start
```
Access at: **`https://localhost:3001`** (or `https://your-server-ip:3001`).

#### Running with PM2 (Background Daemon):
```bash
sudo npm install -g pm2
pm2 start server/src/index.js --name hypertrack
pm2 save && pm2 startup
```

### Option B: Development Mode (Vite Hot-Reload)

```bash
npm run dev
```
- **Client (Vite with HMR)**: `https://localhost:5173`
- **Server (Express API)**: `https://127.0.0.1:3001`

---

## Production Deployment with Nginx (VPS / Cloud)

For production domain deployment with a public SSL certificate (e.g. Let's Encrypt), configure Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name tracker.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tracker.yourdomain.com;

    # SSL Certificates (e.g. via Certbot)
    ssl_certificate /etc/letsencrypt/live/tracker.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tracker.yourdomain.com/privkey.pem;

    # Serve React Static Build
    location / {
        root /var/www/HyperTrack/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests to Backend
    location /api/ {
        proxy_pass https://127.0.0.1:3001;
        proxy_ssl_verify off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Configuration (`.env`)

HyperTrack works out of the box with zero configuration. You can customize options by creating a `.env` file at the root:

```env
# Port to bind backend Express server
HTTPS_PORT=3001

# Network host (0.0.0.0 for public access, 127.0.0.1 for local/reverse-proxy only)
HOST=0.0.0.0

# Environment mode
NODE_ENV=production
```

---

## Project Structure

```
HyperTrack/
├── install.sh                  # Single-command automated installation script
├── package.json                # Root orchestration scripts (dev, build, start, seed)
├── .gitignore                  # Clean open-source Git ignore patterns
├── .env.example                # Example environment configuration
├── data/
│   └── tracker.db              # SQLite database (generated on first seed)
├── certs/                      # Local TLS keys (generated on first launch)
├── server/                     # Express REST API Backend
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js     # SQLite connection & WAL config
│   │   │   ├── schema.sql      # Database schema (users, projects, issues, comments, activity)
│   │   │   └── seed.js         # Default Admin seed initializer
│   │   ├── middleware/
│   │   │   └── rbac.js         # Role-Based Access Control middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # Authentication, session tokens & password validation
│   │   │   ├── users.js        # User directory & role management
│   │   │   ├── projects.js     # Project CRUD
│   │   │   ├── issues.js       # Bug & Task tracker, workflow moves, sequential IDs
│   │   │   ├── comments.js     # Ticket discussion threads
│   │   │   ├── team.js         # Workload distribution analytics
│   │   │   └── backup.js       # Database JSON backup & restore
│   │   ├── utils/
│   │   │   ├── auth.js         # Scrypt password hashing & session management
│   │   │   └── certs.js        # Automatic TLS certificate provisioner
│   │   └── index.js            # Express server entry point & static file server
│   └── package.json
└── client/                     # React 19 Frontend Web Application
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx             # Collapsible vertical navigation & user menu
    │   │   ├── KanbanBoard.jsx         # Touch-optimized agile workflow columns
    │   │   ├── BugTrackerView.jsx      # High-urgency defect triage & repro steps
    │   │   ├── AdminConsoleView.jsx    # Projects & users management, role controls
    │   │   ├── TeamDashboard.jsx       # Roadmap & workload capacity allocation
    │   │   ├── DeveloperWorkspaceView.jsx # Focus work & git snippet helpers
    │   │   ├── QAVerificationView.jsx  # Defect sign-off & verification workbench
    │   │   ├── MetricsDashboard.jsx    # Velocity & health analytics
    │   │   ├── LoginPage.jsx           # Clean credentials-based login
    │   │   └── IssueModal.jsx          # Create/edit tickets with bug diagnostics
    │   ├── context/
    │   │   └── AuthContext.jsx         # Global user state, RBAC permissions & theme
    │   ├── index.css                   # Refined Vanilla CSS design system
    │   └── App.jsx
    ├── vite.config.js
    └── package.json
```

---

## Contributing & Pushing to Git

HyperTrack is prepared for Git:
1. All dummy data, mock accounts, and test tickets have been cleared.
2. Local database files (`data/*.db`), logs, and private keys (`certs/*.pem`) are strictly ignored via `.gitignore`.
3. Directory structure is preserved with `.gitkeep` markers.

```bash
git add .
git commit -m "feat: initial open source release of HyperTrack"
git remote add origin https://github.com/<your-username>/HyperTrack.git
git branch -M main
git push -u origin main
```

---

## License

This project is licensed under the [MIT License](LICENSE).
