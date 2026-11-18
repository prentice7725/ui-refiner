#!/bin/bash
# 사용법: arm.sh <plain|unslop|refine[-이름]> <page id>  — 원본을 복사해 한 가지 방식으로 고친다
# refine으로 시작하는 이름은 모두 /ui-refine 방식이다. 아래 환경변수로 조건을 나눈다.
#   REFINER_ROOT  스킬과 CLI를 읽을 체크아웃 (기본값: 이 저장소). roots.sh가 다른 커밋의 체크아웃을 만든다
#   EXTRA_PROMPT  프롬프트 끝에 덧붙일 파일 (예: variants/isolated.md)
#   EXTRA_TOOLS   추가로 허용할 도구 (공백으로 구분, 예: "Agent Task")
#   REP           반복 번호. 결과 폴더가 <arm>.<REP>가 되고, 선택 기록도 반복마다 따로 쓴다
#   MODEL         생성 모델 (기본값 claude-opus-5-5)
#   KIND, TRADE, SEED  EXTRA_PROMPT의 {KIND} {LANG} {SEED} {TRADE_ARG} {TRADE_LINE}을 채운다 (variants/trade-*.md). TRADE가 비면 업종 없이 배정한다
# Git Bash(윈도우)에서는 /c/… 대신 C:/… 경로를 써야 에이전트의 파일 도구와 훅이 같은 경로를 읽는다
pw(){ pwd -W 2>/dev/null || pwd; }
HERE="$(cd "$(dirname "$0")" && pw)"; R="$(cd "$HERE/../.." && pw)"; B="${BENCH_DIR:-$(pw)/refine-bench-out}"; arm="$1"; id="$2"
[ -n "$arm" ] && [ -n "$id" ] || { echo "사용법: arm.sh <plain|unslop|refine[-이름]> <page id>" >&2; exit 2; }
name="$arm${REP:+.$REP}"; ROOT="$(cd "${REFINER_ROOT:-$R}" && pw)"; MODEL="${MODEL:-claude-opus-5-5}"
mkdir -p "$B/logs" "$B/meta"; B="$(cd "$B" && pw)"
U="${UNSLOP_SKILL:-}"  # unslop 방식만 필요: 내려받은 unslop 저장소의 skills/unslop 경로
d="$B/pages/$id/$name"; rm -rf "$d"; mkdir -p "$d"; cp "$B/pages/$id/before/index.html" "$d/index.html"; cd "$d"
export NODE_USE_ENV_PROXY=1  # 프록시 뒤에서 node fetch(사진 받기)가 프록시를 쓰게 한다. 프록시가 없으면 영향 없음
common=(--model "$MODEL" --strict-mcp-config --disable-slash-commands --permission-mode acceptEdits --output-format json)
log="$B/logs/$name-$id"
case "$arm" in
 plain)
  claude -p "Make this page look less AI-generated. Edit index.html in place." "${common[@]}" --setting-sources "" \
    --allowed-tools Read Edit Write > "$log.json" 2> "$log.err";;
 unslop)
  [ -d "$U" ] || { echo "UNSLOP_SKILL 경로가 필요합니다" >&2; exit 2; }
  cp -r "$U" ./unslop-skill
  claude -p "Unslop index.html in this folder. Follow the unslop skill in ./unslop-skill: read SKILL.md first, then the references it points to, and follow its process. No person is available to answer questions, so set the direction yourself and just do it. Edit index.html in place. No image generation tool is connected and none can be added. Do not make the story video. You may run node (Playwright is installed: require('playwright'), chromium.launch() needs no options) to render screenshots." \
    "${common[@]}" --setting-sources "" --allowed-tools Read Edit Write Glob Grep "Bash(node:*)" > "$log.json" 2> "$log.err"
  rm -rf ./unslop-skill;;
 refine*)
  # 선택 기록은 조건·반복마다 따로 둔다. 같은 조건 안에서는 페이지를 순서대로 돌려야 앞 페이지의 선택이 다음 배정에 반영된다
  export UI_REFINER_HOME="$B/home/$name" BENCH_PAGE_DIR="$d"
  # 어떤 코드와 프롬프트로 돌렸는지 남긴다 (에이전트가 보지 못하게 페이지 폴더 밖에 둔다)
  node -e 'const [f,arm,rep,id,root,model,extra]=process.argv.slice(1),{execSync:x}=require("child_process"),g=c=>{try{return x("git -C "+JSON.stringify(root)+" "+c,{encoding:"utf8"}).trim();}catch{return null;}};
   require("fs").writeFileSync(f,JSON.stringify({arm,rep:rep||null,page:id,model,root,commit:g("rev-parse HEAD"),dirty:!!g("status --porcelain -- skills commands src bin data"),extraPrompt:extra||null,kind:process.env.KIND||null,trade:process.env.TRADE||null,seed:process.env.SEED||null,claude:(()=>{try{return x("claude --version",{encoding:"utf8"}).trim();}catch{return null;}})(),startedAt:new Date().toISOString()},null,1)+"\n");' \
   "$B/meta/$name-$id.json" "$arm" "${REP:-}" "$id" "$ROOT" "$MODEL" "${EXTRA_PROMPT:-}"
  mkdir -p .claude
  # Stop: 마무리 게이트. PostToolUse: 단계별 스냅숏 (시안, 첫 구현, 검사 뒤 수정본을 남긴다)
  printf '{"hooks":{"Stop":[{"hooks":[{"type":"command","command":"node %s/scripts/refine-gate-hook.mjs","timeout":15}]}],"PostToolUse":[{"matcher":"*","hooks":[{"type":"command","command":"node %s/snapshot-hook.mjs","timeout":15}]}]}}\n' "$ROOT" "$HERE" > .claude/settings.json
  body="$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2' "$ROOT/commands/ui-refine.md")"
  body="${body//\$ARGUMENTS/index.html — no person is in the loop, so choose the direction yourself and say why the other two lost.}"
  body="${body//<UI_REFINER>/$ROOT}"
  extra=""; [ -n "${EXTRA_PROMPT:-}" ] && extra="

$(cat "$EXTRA_PROMPT")"
  lang="${id%%-*}"; [ "$lang" = en ] || [ "$lang" = ja ] || [ "$lang" = ko ] || lang=en
  bt='`'; if [ -n "${TRADE:-}" ]; then targ=" --trade $TRADE"; tline="The client is in the trade $bt$TRADE$bt."; else targ=""; tline="Do not pass $bt--trade$bt, even if one fits."; fi
  extra="${extra//\{KIND\}/${KIND:-}}"; extra="${extra//\{LANG\}/$lang}"; extra="${extra//\{SEED\}/${SEED:-}}"; extra="${extra//\{TRADE_ARG\}/$targ}"; extra="${extra//\{TRADE_LINE\}/$tline}"
  # shellcheck disable=SC2086
  claude -p "First read the skill at $ROOT/skills/ui-refiner-agent/SKILL.md (the \`ui-refiner-agent\` skill; \`ui-refiner\` means \`node $ROOT/bin/ui-refiner.mjs\`). Then:

$body$extra" "${common[@]}" --setting-sources project --add-dir "$ROOT" \
    --allowed-tools Read Edit Write Glob Grep "Bash(node:*)" ${EXTRA_TOOLS:-} > "$log.json" 2> "$log.err";;
 *) echo "모르는 방식: $arm" >&2; exit 2;;
esac
echo "$name $id done"
