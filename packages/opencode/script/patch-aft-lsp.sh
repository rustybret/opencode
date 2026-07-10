#!/usr/bin/env bash
#
# Patches the @cortexkit/aft-opencode plugin to work around an npm v11+
# regression where `npm install --no-save` into a bare directory (no
# package.json) silently installs nothing.
#
# The fix: ensure a minimal package.json exists in the LSP cache dir
# before npm runs.
#
# Run this after any opencode version upgrade or plugin update:
#   ./packages/opencode/script/patch-aft-lsp.sh
#
# Safe to re-run (idempotent).

set -euo pipefail

PLUGIN_DIR="${HOME}/.cache/opencode/packages/@cortexkit/aft-opencode@latest"
DIST_FILE="${PLUGIN_DIR}/node_modules/@cortexkit/aft-opencode/dist/index.js"

if [[ ! -f "${DIST_FILE}" ]]; then
  echo "[patch-aft-lsp] AFT plugin not found at ${DIST_FILE} — skipping."
  exit 0
fi

# Already patched?
if grep -q 'aft-lsp' "${DIST_FILE}" 2>/dev/null; then
  echo "[patch-aft-lsp] Already patched — skipping."
  exit 0
fi

# Find the runInstall function and inject the package.json stub creation.
# The patch adds 6 lines after the "installing X to Y" log line.
PATCHED=$(awk '
/function runInstall\(spec, version2, cwd, signal\) \{/ {
  print
  found = 1
  next
}
found && /log2\(`\[lsp\] installing/ {
  print
  # Inject the package.json stub creation
  print "    try {"
  print "      const pkgPath = join13(cwd, \"package.json\");"
  print "      if (!existsSync5(pkgPath)) {"
  print "        writeFileSync5(pkgPath, JSON.stringify({ name: \"aft-lsp\", private: true }));"
  print "      }"
  print "    } catch {}"
  found = 0
  next
}
{ print }
' "${DIST_FILE}")

if echo "${PATCHED}" | grep -q 'aft-lsp'; then
  echo "${PATCHED}" > "${DIST_FILE}"
  echo "[patch-aft-lsp] Patched ${DIST_FILE} successfully."
else
  echo "[patch-aft-lsp] WARNING: Could not locate injection point — patch not applied."
  echo "  The plugin structure may have changed. Check manually."
  exit 1
fi
