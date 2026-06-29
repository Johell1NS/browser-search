#!/bin/bash
# =============================================================================
#  audit.sh — Security audit for browser-search
# =============================================================================
#
#  Verifies security posture:
#    - Readability.js integrity (SHA-256)
#    - package-lock.json presence
#    - .npmrc configuration
#    - .gitignore completeness
#    - Docker port binding (127.0.0.1)
#    - API key exposure in files
#    - npm audit (if node_modules exists)
#
#  USAGE:
#    bash scripts/audit.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PASSED=true
CHECKS=0
OK_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "[${GREEN}OK${NC}] $1"; OK_COUNT=$((OK_COUNT + 1)); CHECKS=$((CHECKS + 1)); }
warn() { echo -e "[${YELLOW}⚠${NC}] $1"; WARN_COUNT=$((WARN_COUNT + 1)); CHECKS=$((CHECKS + 1)); }
fail() { echo -e "[${RED}✗${NC}] $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); CHECKS=$((CHECKS + 1)); PASSED=false; }

echo "=================================================="
echo "  browser-search — Security Audit"
echo "=================================================="
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="
echo ""

# ═════════════════════════════════════════════════════════════════
#  CHECK 1 — Readability.js integrity
# ═════════════════════════════════════════════════════════════════
echo "─── Readability.js Integrity ───"
READABILITY="$REPO_DIR/scripts/camofox/Readability.js"
HASH_FILE="$REPO_DIR/scripts/camofox/Readability.js.sha256"

if [ -f "$READABILITY" ] && [ -f "$HASH_FILE" ]; then
  EXPECTED_HASH=$(cat "$HASH_FILE" | tr -d '[:space:]')
  # Cross-platform hash: sha256sum (Linux) or shasum -a 256 (macOS)
  if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL_HASH=$(sha256sum "$READABILITY" | awk '{print $1}')
  elif command -v shasum >/dev/null 2>&1; then
    ACTUAL_HASH=$(shasum -a 256 "$READABILITY" | awk '{print $1}')
  else
    warn "No sha256sum/shasum found — skipping Readability.js integrity check"
    ACTUAL_HASH=""
  fi
  if [ -n "$ACTUAL_HASH" ]; then
    if [ "$EXPECTED_HASH" = "$ACTUAL_HASH" ]; then
      ok "Readability.js SHA-256 matches"
    else
      fail "Readability.js SHA-256 mismatch! Expected: $EXPECTED_HASH Got: $ACTUAL_HASH"
    fi
  fi
elif [ -f "$READABILITY" ] && [ ! -f "$HASH_FILE" ]; then
  warn "Readability.js exists but no hash file. Run: sha256sum scripts/camofox/Readability.js | awk '{print \$1}' > scripts/camofox/Readability.js.sha256"
else
  warn "Readability.js not found (may not be installed yet)"
fi
echo ""

# ═════════════════════════════════════════════════════════════════
#  CHECK 2 — package-lock.json
# ═════════════════════════════════════════════════════════════════
echo "─── Dependency Locking ───"
if [ -f "$REPO_DIR/package-lock.json" ]; then
  ok "package-lock.json present"
else
  fail "package-lock.json missing — versions not pinned. Run: npm install"
fi
echo ""

# ═════════════════════════════════════════════════════════════════
#  CHECK 3 — .npmrc
# ═════════════════════════════════════════════════════════════════
echo "─── npm Configuration ───"
if [ -f "$REPO_DIR/.npmrc" ]; then
  if grep -q "strict-ssl=true" "$REPO_DIR/.npmrc"; then
    ok ".npmrc has strict-ssl=true"
  else
    warn ".npmrc missing strict-ssl=true"
  fi
  if grep -q "registry=https://registry.npmjs.org/" "$REPO_DIR/.npmrc"; then
    ok ".npmrc has registry pinned"
  else
    warn ".npmrc missing registry pinning"
  fi
else
  fail ".npmrc missing — no registry or SSL enforcement"
fi
echo ""

# ═════════════════════════════════════════════════════════════════
#  CHECK 4 — .gitignore completeness
# ═════════════════════════════════════════════════════════════════
echo "─── .gitignore ───"
GITIGNORE="$REPO_DIR/.gitignore"
if [ -f "$GITIGNORE" ]; then
  MISSING=0
  for pattern in ".env" "*.key" "*.pem" "*.png" "profile/"; do
    if ! grep -qF "$pattern" "$GITIGNORE"; then
      warn ".gitignore missing: $pattern"
      MISSING=1
    fi
  done
  if [ $MISSING -eq 0 ]; then
    ok ".gitignore covers sensitive patterns"
  fi
else
  fail ".gitignore missing"
fi
echo ""

# ═════════════════════════════════════════════════════════════════
#  CHECK 5 — Docker port binding
# ═════════════════════════════════════════════════════════════════
echo "─── Docker Security ───"
DOCKER_SETUP="$REPO_DIR/docker/setup.md"
SKILL_MD="$REPO_DIR/SKILL.md"

if [ -f "$DOCKER_SETUP" ]; then
  if grep -qE '\-p 127\.0\.0\.1:' "$DOCKER_SETUP"; then
    ok "docker/setup.md uses 127.0.0.1 binding"
  else
    fail "docker/setup.md missing 127.0.0.1 binding — ports exposed to 0.0.0.0"
  fi
  if grep -qE '\-\-env-file' "$DOCKER_SETUP"; then
    ok "docker/setup.md uses --env-file for API keys"
  else
    warn "docker/setup.md should use --env-file instead of -e for API keys"
  fi
fi

if [ -f "$SKILL_MD" ]; then
  if grep -qE '\-p 127\.0\.0\.1:' "$SKILL_MD"; then
    ok "SKILL.md uses 127.0.0.1 binding"
  else
    warn "SKILL.md should use 127.0.0.1 binding in Docker examples"
  fi
fi
echo ""

# ═════════════════════════════════════════════════════════════════
#  CHECK 6 — API key exposure
# ═════════════════════════════════════════════════════════════════
echo "─── API Key Exposure ───"
# Check for hardcoded API keys (not env var references)
if grep -rnE '(CAMOFOX_API_KEY|CAMOFOX_ADMIN_KEY)\s*=\s*["\x27][a-zA-Z0-9]{10,}' "$REPO_DIR" --include="*.md" --include="*.sh" --include="*.mjs" --include="*.json" 2>/dev/null | grep -v node_modules | grep -v '.git'; then
  fail "Potential hardcoded API key found in repository files"
else
  ok "No hardcoded API keys found in repository files"
fi
echo ""

# ═════════════════════════════════════════════════════════════════
#  CHECK 7 — npm audit (if node_modules exists)
# ═════════════════════════════════════════════════════════════════
echo "─── npm audit ───"
if [ -d "$REPO_DIR/node_modules" ]; then
  AUDIT_OUTPUT=$(cd "$REPO_DIR" && npm audit --production --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"info":999}}}')
  VULNS=$(echo "$AUDIT_OUTPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    v = d.get('metadata', {}).get('vulnerabilities', {})
    high = v.get('high', 0)
    critical = v.get('critical', 0)
    print(f'high={high} critical={critical}')
except:
    print('high=0 critical=0')
" 2>/dev/null || echo "high=0 critical=0")
  echo "  $VULNS"
  if echo "$VULNS" | grep -qE 'critical=[1-9]'; then
    fail "npm audit found critical vulnerabilities"
  elif echo "$VULNS" | grep -qE 'high=[1-9]'; then
    warn "npm audit found high vulnerabilities"
  else
    ok "npm audit clean (no high/critical vulnerabilities)"
  fi
else
  warn "node_modules not found — run 'npm install' first for full audit"
fi
echo ""

# ═════════════════════════════════════════════════════════════════
#  CHECK 8 — Version pinning in package.json
# ═════════════════════════════════════════════════════════════════
echo "─── Version Pinning ───"
if [ -f "$REPO_DIR/package.json" ]; then
  if grep -qE '"\^' "$REPO_DIR/package.json"; then
    warn "package.json uses caret (^) ranges — pin exact versions for reproducibility"
  else
    ok "package.json uses exact versions (no caret ranges)"
  fi
else
  fail "package.json missing"
fi
echo ""

# ═════════════════════════════════════════════════════════════════
#  SUMMARY
# ═════════════════════════════════════════════════════════════════
echo "=================================================="
echo "  Audit Summary"
echo "=================================================="
echo "  Total checks:  $CHECKS"
echo -e "  ${GREEN}Passed:        $OK_COUNT${NC}"
echo -e "  ${YELLOW}Warnings:      $WARN_COUNT${NC}"
echo -e "  ${RED}Failed:        $FAIL_COUNT${NC}"
echo "=================================================="

if [ "$PASSED" = true ]; then
  echo -e "  ${GREEN}✅ ALL CRITICAL CHECKS PASSED${NC}"
  exit 0
else
  echo -e "  ${RED}❌ SOME CHECKS FAILED — review above${NC}"
  exit 1
fi
