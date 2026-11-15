#!/bin/bash
# 가린 스크린샷으로 페이지 평가, 세트 평가, (있으면) 단계 평가를 돌린다. 이미 끝난 평가는 건너뛴다.
#   JUDGE_MODEL  평가 모델 (기본값 claude-opus-5-5)    JOBS  동시에 돌릴 평가 수 (기본값 6)
HERE="$(cd "$(dirname "$0")" && pwd)"; B="${BENCH_DIR:-$PWD/refine-bench-out}"; J="$B/judge"; mkdir -p "$B/verdicts"; JOBS="${JOBS:-6}"
opts=(--model "${JUDGE_MODEL:-claude-opus-5-5}" --setting-sources "" --strict-mcp-config --disable-slash-commands --allowed-tools Read --output-format json)
n=0
run(){ # run <폴더> <결과 이름> <프롬프트>
  local out="$B/verdicts/$2.json"; [ -s "$out" ] && grep -q '"result"' "$out" && return
  ( cd "$1" && claude -p "$3" "${opts[@]}" > "$out" 2> "$B/verdicts/$2.err" ) &
  n=$((n+1)); [ $((n%JOBS)) -eq 0 ] && wait
}
letters(){ ls "$1" | sed -n "s/^\(set-\)\{0,1\}\([A-H]\)\(-fold\)\{0,1\}\.png$/\2/p" | sort -u | tr '\n' ' ' | sed 's/ $//'; }
words=(zero one two three four five six seven eight)
for d in "$J"/page/*; do [ -d "$d" ] || continue; id=$(basename "$d"); L=($(letters "$d")); k=${#L[@]}; list=$(IFS=,; echo "${L[*]}" | sed 's/,/, /g')
 scores=""; for l in "${L[@]}"; do scores="$scores${scores:+,}\"$l\":{\"hierarchy\":0,\"distinctiveness\":0,\"typography\":0,\"cohesion\":0,\"ai_look\":0}"; done
 run "$d" "page-$id" "You are a senior product designer reviewing ${words[$k]} versions ($list) of the same web page. For each version there are two screenshots in this folder: <letter>-fold.png (the first screen at 1440x900) and <letter>-full.png (the full page). Read all $((k*2)) image files before judging. Score each version 1-10 on: hierarchy, distinctiveness, typography, cohesion, and ai_look (10 = obviously AI-generated, 1 = clearly designed by a person). Then rank the ${words[$k]} from best (1) to worst ($k) as a design you would ship for this client; no ties. Reply with JSON only, no prose and no code fence: {\"scores\":{$scores},\"ranking\":[\"best letter\",\"…\",\"worst letter\"],\"notes\":\"one sentence per version\"}"
done
for d in "$J"/set*; do [ -d "$d" ] || continue; id=$(basename "$d"); L=($(letters "$d")); k=${#L[@]}; list=$(IFS=,; echo "${L[*]}" | sed 's/,/, /g')
 pages=$(node -e 'const k=require(process.argv[1]).set[process.argv[2]];console.log(k?.pages??8)' "$B/judge-key.json" "${id#set}")
 zero=""; for l in "${L[@]}"; do zero="$zero${zero:+,}\"$l\":0"; done; habits=""; for l in "${L[@]}"; do habits="$habits${habits:+,}\"$l\":\"repeated habits seen\""; done
 run "$d" "$id" "You are a senior product designer. This folder has ${words[$k]} contact sheets: $(for l in "${L[@]}"; do printf 'set-%s.png ' "$l"; done). Each sheet shows the first screens of $pages websites for $pages different clients (software, finance, clinics, a food bank, hiring, logistics; in English, Japanese and Korean), all produced by one studio. Read all ${words[$k]} image files. For each set, rate sameness 1-10: how much the $pages sites look like one template applied $pages times (10 = one template, 1 = $pages clearly different designs, as you would expect from $pages different human studios). Then rank the ${words[$k]} sets from least templated and best designed (1) to most templated ($k); no ties. Reply with JSON only, no prose and no code fence: {\"sameness\":{$zero},\"ranking\":[\"best letter\",\"…\",\"worst letter\"],\"habits\":{$habits}}"
done
for d in "$J"/stage/*; do [ -d "$d" ] || continue; id=$(basename "$d")
 run "$d" "stage-$id" "You are a senior art director. This folder has two versions (X and Y) of the same client's web page, made at different moments of one redesign: X-fold.png and Y-fold.png show the first screen at 1440x900; X-full.png and Y-full.png, when present, show the full page. Read every image file in the folder. Answer two separate questions. direction: which version has the more specific, intentional art direction for this client, a look that would stop making sense if a rival's name were put on it? ship: which would you ship, counting polish and usability? Answer X, Y or same for each; say same only when you cannot tell them apart on that question. Reply with JSON only, no prose and no code fence: {\"direction\":\"X\",\"ship\":\"X\",\"lost\":\"one sentence on what the version with the weaker direction lacks\"}"
done
wait; echo judged
