#!/bin/bash
# =============================================================================
#  check.sh — Browser Search health check
# =============================================================================
#
#  Verifies the status of browser-search components:
#    - Docker accessibility
#    - SearXNG container (health check)
#    - Camofox container (health check)
#    - CloakBrowser npm module
#
#  USAGE:
#    ./scripts/check.sh
#    ./scripts/check.sh --help
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CAMOFOX_CONTAINER="camofox-browser"

PASSED=true
SEARXNG_URL="${SEARXNG_URL:-http://127.0.0.1:8080/search}"
CAMOFOX_URL="${CAMOFOX_URL:-http://127.0.0.1:9377}"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "[${GREEN}OK${NC}] $1"; }
warn() { echo -e "[${YELLOW}⚠${NC}] $1"; }
fail() { echo -e "[${RED}✗${NC}] $1"; PASSED=false; }
info() { echo -e "[${CYAN}i${NC}] $1"; }
sep()  { echo ""; }

docker_running_name() {
    local pattern="$1"
    docker ps --filter "status=running" --format '{{.Names}}' 2>/dev/null \
        | grep -E "$pattern" | head -1 || true
}

searxng_api_ok() {
    curl -sf --max-time 10 "${SEARXNG_URL}?format=json&q=health" >/dev/null 2>&1
}

camofox_api_ok() {
    curl -sf --max-time 5 "${CAMOFOX_URL}/health" >/dev/null 2>&1
}

cloak_pkg_ok() {
    (cd "$SCRIPT_DIR" && node -e "
      import('cloakbrowser').then(() => process.exit(0)).catch(() => process.exit(1));
    " 2>/dev/null)
}

cloak_version() {
    (cd "$SCRIPT_DIR" && node -e "
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
      console.log(require('cloakbrowser/package.json').version);
    " 2>/dev/null) || echo 'not installed'
}

cloak_binary_ok() {
    [ -d "$HOME/.cloakbrowser" ] && \
        find "$HOME/.cloakbrowser" -type f \( -name chrome -o -name chromium \) 2>/dev/null | grep -q .
}

show_help() {
    sed -n '3,/^$/p' "$0" | sed 's/^# \?//g'
    exit 0
}

for arg in "$@"; do
    case "$arg" in
        --help) show_help ;;
    esac
done

echo "=================================================="
echo "  Browser Search — Health Check"
echo "=================================================="
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="
echo ""

echo "─── Docker ───"
if docker --version >/dev/null 2>&1; then
    DOCKER_VER=$(docker --version 2>/dev/null | awk '{print $3}' | tr -d ',')
    ok "Docker $DOCKER_VER"
else
    fail "Docker not installed or not accessible"
    warn "SearXNG and Camofox require Docker"
fi
sep

echo "─── SearXNG ───"
SEARXNG_NAME=$(docker_running_name 'searxng')
if searxng_api_ok; then
    HEALTH=$(curl -s --max-time 10 "${SEARXNG_URL}?format=json&q=health" 2>/dev/null || echo "")
    RESULT_COUNT=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('results',[])))" 2>/dev/null || echo "?")
    LABEL="${SEARXNG_URL}"
    if [ -n "$SEARXNG_NAME" ]; then LABEL="$SEARXNG_NAME ($SEARXNG_URL)"; fi
    ok "SearXNG running (${LABEL}, ${RESULT_COUNT} results in test query)"
elif [ -n "$SEARXNG_NAME" ]; then
    warn "SearXNG container running ($SEARXNG_NAME) but API not responding at ${SEARXNG_URL}"
elif docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qE 'searxng'; then
    warn "SearXNG container exists but is not running"
else
    warn "SearXNG container not found"
    info "To install: https://docs.searxng.org/admin/installation-docker.html"
    info "Bind locally: set SEARXNG_HOST=127.0.0.1 in searxng/.env"
fi
sep

echo "─── Camofox ───"
CAMOFOX_NAME=$(docker_running_name 'camofox')
if camofox_api_ok; then
    HEALTH=$(curl -s --max-time 5 "${CAMOFOX_URL}/health" 2>/dev/null || echo "")
    BROWSER_OK=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('browserConnected','?'))" 2>/dev/null || echo "?")
    TAB_COUNT=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('activeTabs','?'))" 2>/dev/null || echo "?")
    LABEL="${CAMOFOX_URL}"
    if [ -n "$CAMOFOX_NAME" ]; then LABEL="$CAMOFOX_NAME ($CAMOFOX_URL)"; fi
    ok "Camofox running (${LABEL}, browserConnected: ${BROWSER_OK}, tabs: ${TAB_COUNT})"
elif [ -n "$CAMOFOX_NAME" ]; then
    warn "Camofox container running ($CAMOFOX_NAME) but API not responding at ${CAMOFOX_URL}"
elif docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qE 'camofox'; then
    warn "Camofox container exists but is not running"
else
    warn "Camofox container not found"
    info "Image: ghcr.io/jo-inc/camofox-browser:latest"
    info "See docker/setup.md"
fi
sep

echo "─── CloakBrowser ───"
if cloak_pkg_ok; then
    ok "cloakbrowser npm package installed ($(cloak_version))"
else
    fail "cloakbrowser not installed"
    info "Run: npm install (from repo root)"
fi

if cloak_binary_ok; then
    ok "Chromium binary present (~/.cloakbrowser/)"
elif [ -d "$HOME/.cloakbrowser" ]; then
    warn "~/.cloakbrowser/ exists but chrome binary not found yet"
else
    warn "~/.cloakbrowser/ not found (binary downloads on first cloak-fetch run)"
fi
sep

echo "=================================================="
echo "  Summary"
echo "=================================================="
echo ""

if searxng_api_ok; then SEARXNG_STATUS="running"; else SEARXNG_STATUS="stopped/missing"; fi
if camofox_api_ok; then CAMO_STATUS="running"; else CAMO_STATUS="stopped/missing"; fi

echo "  SearXNG:      ${SEARXNG_STATUS}"
echo "  Camofox:      ${CAMO_STATUS}"
echo "  CloakBrowser: $(cloak_version)"
echo ""

if [ "$PASSED" = true ]; then
    echo -e "[${GREEN}OK${NC}] All checks passed — browser-search is ready."
else
    echo -e "[${YELLOW}⚠${NC}] Some checks failed — review messages above."
fi
echo "=================================================="
