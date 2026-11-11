#!/bin/bash
# 사용법: arm.sh <plain|unslop|refine> <page id>  — 원본을 복사해 한 가지 방식으로 고친다
HERE="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$HERE/../.." && pwd)"; B="${BENCH_DIR:-$PWD/refine-bench-out}"; mkdir -p "$B/logs"; arm="$1"; id="$2"
U="${UNSLOP_SKILL:-}"  # unslop 방식만 필요: 내려받은 unslop 저장소의 skills/unslop 경로
d="$B/pages/$id/$arm"; rm -rf "$d"; mkdir -p "$d"; cp "$B/pages/$id/before/index.html" "$d/index.html"; cd "$d"
export NODE_USE_ENV_PROXY=1  # 프록시 뒤에서 node fetch(사진 받기)가 프록시를 쓰게 한다. 프록시가 없으면 영향 없음
common=(--model claude-opus-5-5 --strict-mcp-config --disable-slash-commands --permission-mode acceptEdits --output-format json)
case "$arm" in
 plain)
  claude -p "Make this page look less AI-generated. Edit index.html in place." "${common[@]}" --setting-sources "" \
    --allowed-tools Read Edit Write > "$B/logs/$arm-$id.json" 2> "$B/logs/$arm-$id.err";;
 unslop)
  [ -d "$U" ] || { echo "UNSLOP_SKILL 경로가 필요합니다" >&2; exit 2; }
  cp -r "$U" ./unslop-skill
  claude -p "Unslop index.html in this folder. Follow the unslop skill in ./unslop-skill: read SKILL.md first, then the references it points to, and follow its process. No person is available to answer questions, so set the direction yourself and just do it. Edit index.html in place. No image generation tool is connected and none can be added. Do not make the story video. You may run node (Playwright is installed: require('playwright'), chromium.launch() needs no options) to render screenshots." \
    "${common[@]}" --setting-sources "" --allowed-tools Read Edit Write Glob Grep "Bash(node:*)" > "$B/logs/$arm-$id.json" 2> "$B/logs/$arm-$id.err"
  rm -rf ./unslop-skill;;
 refine)
  mkdir -p .claude
  printf '{"hooks":{"Stop":[{"hooks":[{"type":"command","command":"node %s/scripts/refine-gate-hook.mjs","timeout":15}]}]}}\n' "$R" > .claude/settings.json
  body="$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2' "$R/commands/ui-refine.md")"
  body="${body//\$ARGUMENTS/index.html — no person is in the loop, so choose the direction yourself and say why the other two lost.}"
  body="${body//<UI_REFINER>/$R}"
  claude -p "First read the skill at $R/skills/ui-refiner-agent/SKILL.md (the \`ui-refiner-agent\` skill; \`ui-refiner\` means \`node $R/bin/ui-refiner.mjs\`). Then:

$body" "${common[@]}" --setting-sources project --add-dir "$R" \
    --allowed-tools Read Edit Write Glob Grep "Bash(node:*)" > "$B/logs/$arm-$id.json" 2> "$B/logs/$arm-$id.err";;
esac
echo "$arm $id done"
