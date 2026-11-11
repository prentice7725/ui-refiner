#!/bin/bash
# 한 줄 프롬프트로 원본 페이지를 만든다 (스킬·플러그인·MCP·설정 없음)
HERE="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$HERE/../.." && pwd)"; B="${BENCH_DIR:-$PWD/refine-bench-out}"; mkdir -p "$B/logs"
while IFS=$'\t' read -r id prompt; do
  ( d="$B/pages/$id/before"; mkdir -p "$d"; cd "$d"
    claude -p "$prompt" --model claude-opus-5-5 --setting-sources "" --strict-mcp-config --disable-slash-commands \
      --permission-mode acceptEdits --allowed-tools Write Edit Read --output-format json > "$B/logs/gen-$id.json" 2> "$B/logs/gen-$id.err"
    echo "$id done $(wc -c < index.html 2>/dev/null)" ) &
done < "$HERE/prompts.tsv"
wait
