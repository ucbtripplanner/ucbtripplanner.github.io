#!/usr/bin/env bash
# Screenshot site pages with headless Chrome (macOS) for a visual check.
# Usage: tools/screenshot.sh <path> [desktop|mobile] [out.png]
#   tools/screenshot.sh /2026-yosemite/stay/            → /tmp/utp-shot.png (1280px wide)
#   tools/screenshot.sh /2026-yosemite/stay/ mobile     → 390px wide (via tools/mobile.html iframe harness,
#                                                          because headless Chrome can't go below ~500px)
# Needs the preview server running: python3 tools/serve.py   (port 8765)
# Then look at the PNG (e.g. Claude's Read tool on the file).
set -euo pipefail
PAGE="${1:-/2026-yosemite/}"
MODE="${2:-desktop}"
OUT="${3:-/tmp/utp-shot.png}"
BASE="http://127.0.0.1:${PORT:-8765}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PROFILE="$(mktemp -d /tmp/utp-chrome.XXXX)"   # throwaway profile: no downloads/history in your real profile
if [ "$MODE" = "mobile" ]; then
  ENC=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1], safe=""))' "$PAGE")
  URL="$BASE/tools/mobile.html#$ENC"; SIZE="390,2600"
else
  URL="$BASE$PAGE"; SIZE="1280,2600"
fi
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$PROFILE" \
  --window-size="$SIZE" --virtual-time-budget=14000 --screenshot="$OUT" "$URL" 2>/dev/null
rm -rf "$PROFILE"
echo "$OUT"
