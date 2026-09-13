#!/usr/bin/env bash
# ==============================================================================
# HyperTrack - Single Point Installation Script
# Automated setup for Agile Project Management, Task & Bug Tracker
# ==============================================================================

set -e

# ANSI Color Codes
BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "  ██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ ████████╗██████╗  █████╗  ██████╗██╗  ██╗"
echo "  ██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝"
echo "  ███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝   ██║   ██████╔╝███████║██║     █████╔╝ "
echo "  ██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗   ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ "
echo "  ██║  ██║   ██║   ██║     ███████╗██║  ██║   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗"
echo "  ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "${BOLD}Lightweight, Modern, Self-Hosted Agile Tracker & Bug Management${NC}\n"

# 1. Environment & Prerequisite Checks
echo -e "${CYAN}[1/6] Checking system prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed.${NC}"
    echo "Please install Node.js (v18 or higher recommended) from https://nodejs.org or via your package manager:"
    echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
    echo "  macOS (Homebrew): brew install node"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo -e "  ✓ Node.js detected: $(node -v)"
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}[WARNING] Node.js version $(node -v) is below recommended v18+. Please upgrade if you experience issues.${NC}"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed. Please install npm alongside Node.js.${NC}"
    exit 1
fi
echo -e "  ✓ npm detected: $(npm -v)"

# 2. Directory Structure Setup
echo -e "\n${CYAN}[2/6] Preparing directory structure...${NC}"
mkdir -p data certs
echo "  ✓ Directories verified: ./data, ./certs"

# 3. Dependency Installation
echo -e "\n${CYAN}[3/6] Installing server and client dependencies...${NC}"
echo "  Installing server dependencies..."
npm --prefix server install --no-audit --no-fund

echo "  Installing client dependencies..."
npm --prefix client install --no-audit --no-fund
echo -e "  ✓ All dependencies installed successfully."

# 4. Generate TLS Certificates (Local HTTPS)
echo -e "\n${CYAN}[4/6] Setting up local TLS encryption certificates...${NC}"
if [ ! -f certs/cert.pem ] || [ ! -f certs/key.pem ]; then
    if command -v openssl &> /dev/null; then
        echo "  Generating self-signed TLS certificates in ./certs..."
        openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
            -keyout certs/key.pem \
            -out certs/cert.pem \
            -days 365 \
            -subj "/CN=localhost" \
            -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null || \
        openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
            -keyout certs/key.pem \
            -out certs/cert.pem \
            -days 365 \
            -subj "/CN=localhost" 2>/dev/null
        echo -e "  ✓ Generated local TLS certificates (certs/cert.pem, certs/key.pem)"
    else
        echo -e "${YELLOW}  [!] openssl not found; Node.js will auto-generate certificates at server startup.${NC}"
    fi
else
    echo "  ✓ Existing TLS certificates found in ./certs"
fi

# 5. Build Frontend Production Assets
echo -e "\n${CYAN}[5/6] Building production frontend bundle...${NC}"
npm --prefix client run build
echo -e "  ✓ Frontend production assets built into client/dist"

# 6. Database Initialization
echo -e "\n${CYAN}[6/6] Initializing local database (data/tracker.db)...${NC}"
npm --prefix server run seed
echo -e "  ✓ Database initialized with default Administrator profile."

# Setup Complete Summary
echo -e "\n${GREEN}${BOLD}==============================================================================${NC}"
echo -e "${GREEN}${BOLD}                   ✓ HyperTrack Installation Successful!                      ${NC}"
echo -e "${GREEN}${BOLD}==============================================================================${NC}\n"

echo -e "${BOLD}Default Administrator Credentials:${NC}"
echo -e "  • ${CYAN}Username / Email:${NC} admin  (or admin@hypertrack.local)"
echo -e "  • ${CYAN}Default Password:${NC} Admin@123"
echo -e "  ${YELLOW}(You can change this password anytime in the UI via Edit Profile & Password)${NC}\n"

echo -e "${BOLD}How to Run HyperTrack:${NC}"
echo -e "  ${BOLD}1. Production Mode (Single Process):${NC}"
echo -e "     ${CYAN}npm start${NC}"
echo -e "     Access at: ${BOLD}https://localhost:3001${NC} (or your server's IP/Domain)\n"

echo -e "  ${BOLD}2. Production with PM2 (Background Daemon):${NC}"
echo -e "     ${CYAN}pm2 start server/src/index.js --name hypertrack${NC}"
echo -e "     ${CYAN}pm2 save && pm2 startup${NC}\n"

echo -e "  ${BOLD}3. Development Mode (Vite Hot-Reload):${NC}"
echo -e "     ${CYAN}npm run dev${NC}"
echo -e "     Access at: ${BOLD}https://localhost:5173${NC}\n"

echo -e "${BOLD}Next Steps:${NC}"
echo -e "  • Open your browser and log in as ${CYAN}admin${NC} / ${CYAN}Admin@123${NC}"
echo -e "  • Go to ${BOLD}Admin Console${NC} to create your first project and add team members"
echo -e "  • For Nginx reverse proxy configuration, refer to the documentation in ${BOLD}README.md${NC}\n"
