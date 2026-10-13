#!/usr/bin/env bash
# Install from source already checked into ui-refiner; no remote checkout or npm lintapple dependency.
set -euo pipefail
ROOT="${1:-$(pwd)}"
SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/vendor/suta/skills/suta"
DEST="$ROOT/.agents/skills/suta"
test -f "$SOURCE/scripts/audit.mjs" || { echo "Missing bundled suta audit source: $SOURCE" >&2; exit 2; }
if [[ -e "$DEST" ]]; then
  echo "Refusing to overwrite existing $DEST" >&2; exit 2
fi
mkdir -p "$(dirname "$DEST")"
cp -R "$SOURCE" "$DEST"
echo "Installed bundled suta source into $DEST"
