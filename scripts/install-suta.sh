#!/usr/bin/env bash
# Install pinned suta skill only. No remote code is executed during install.
set -euo pipefail
ROOT="${1:-$(pwd)}"
REV="412bd62e479ce249ef25ca31bc015cfb308aff10"
DEST="$ROOT/.agents/skills/suta"
if [[ -e "$DEST" ]]; then
  echo "Refusing to overwrite $DEST. Remove or back it up manually before updating." >&2
  exit 2
fi
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
git init -q
git remote add origin https://github.com/Guksu/suta.git
git sparse-checkout init --cone
git sparse-checkout set skills/suta
git -c advice.detachedHead=false fetch --quiet --depth 1 origin "$REV"
git checkout --quiet --detach FETCH_HEAD
mkdir -p "$(dirname "$DEST")"
cp -R skills/suta "$DEST"
echo "Installed suta pinned at $REV into $DEST"
