#!/bin/bash
# =============================================================================
#  Browser Search — Dependency Setup
# =============================================================================
#  Installs npm dependencies for CloakBrowser (cloakbrowser + playwright-core).
#
#  USAGE:
#    bash scripts/setup.sh
# =============================================================================

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Browser Search — Dependency Setup ==="
echo "Skill dir: $SKILL_DIR"
echo ""

cd "$SKILL_DIR"

# Install npm dependencies
if [ -f package.json ]; then
  echo "Installing npm packages..."
  npm install
  echo "  ✅ npm dependencies installed"
else
  echo "  ❌ package.json not found in $SKILL_DIR"
  exit 1
fi

# Ensure CloakBrowser binary
echo ""
echo "Ensuring CloakBrowser Chromium binary..."
node -e "
import('cloakbrowser').then(c => {
  c.ensureBinary().then(() => console.log('  ✅ Chromium binary ready'));
}).catch(e => { console.error('  ❌ Failed:', e.message); process.exit(1); });
" 2>&1 || {
  echo "  ⚠️  Could not verify Chromium binary. Run manually:"
  echo "     node -e \"import('cloakbrowser').then(c => c.ensureBinary())\""
}

# Verify Readability.js integrity
echo ""
echo "Verifying Readability.js integrity..."
READABILITY="$SKILL_DIR/scripts/camofox/Readability.js"
HASH_FILE="$SKILL_DIR/scripts/camofox/Readability.js.sha256"

if [ -f "$READABILITY" ] && [ -f "$HASH_FILE" ]; then
  EXPECTED_HASH=$(cat "$HASH_FILE" | tr -d '[:space:]')
  # Cross-platform hash: sha256sum (Linux) or shasum -a 256 (macOS)
  if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL_HASH=$(sha256sum "$READABILITY" | awk '{print $1}')
  elif command -v shasum >/dev/null 2>&1; then
    ACTUAL_HASH=$(shasum -a 256 "$READABILITY" | awk '{print $1}')
  else
    echo "  ⚠️  No sha256sum/shasum found — skipping integrity check"
    ACTUAL_HASH=""
  fi
  if [ -n "$ACTUAL_HASH" ]; then
    if [ "$EXPECTED_HASH" = "$ACTUAL_HASH" ]; then
      echo "  ✅ Readability.js integrity verified"
    else
      echo "  ❌ Readability.js integrity check FAILED"
      echo "     Expected: $EXPECTED_HASH"
      echo "     Got:      $ACTUAL_HASH"
      exit 1
    fi
  fi
elif [ -f "$READABILITY" ] && [ ! -f "$HASH_FILE" ]; then
  echo "  ⚠️  Generating Readability.js hash..."
  sha256sum "$READABILITY" | awk '{print $1}' > "$HASH_FILE"
  echo "  ✅ Hash saved"
fi

echo ""
echo "=== Setup complete ==="
echo "Run 'node scripts/cloak/cloak-fetch.mjs --help' to verify."
echo "Run 'bash scripts/audit.sh' for security audit."
