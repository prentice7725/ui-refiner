#!/bin/bash
# 18차 파일럿: 네 조건을 같은 페이지에 여러 번 돌린다. 모델을 호출하므로 비용이 든다 (17차 기준 페이지당 약 $2.6).
#   refine-a  17차 그대로 (origin/main)
#   refine-b  12차 (de170f6: 구조와 바탕만 배정, 고객 사실로 쓴 제목)
#   refine-c  이 체크아웃: 17차에서 고유 요소 예시만 뺀 스킬
#   refine-d  refine-c + 시안 세 개를 서로 못 보는 서브에이전트가 따로 만든다
#   refine-e  재료 배정 (feat/refine-materials의 f4684f5: 시안마다 재료 하나, 새 맥락의 히어로·마무리 리뷰). ARMS에 e를 넣을 때만 돈다
#   refine-f  refine-e에서 색과 서체 고정만 푼 것 (variants/materials-free.patch): 재료는 만드는 법만 정하고, 색과 서체는 고객에 맞춰 고른다. ARMS에 f를 넣을 때만 돈다
#   refine-g  refine-e에서 재료 배정만 바꾼 것 (variants/materials-deal.patch): 최근 네 프로젝트에서 고른 재료는 빼고, 성격·종류 중 하나만 맞아도 후보에 넣는다. ARMS에 g를 넣을 때만 돈다
#   refine-h  refine-b(12차) + 새 맥락의 히어로·마무리 리뷰 (variants/review.md). 재료는 쓰지 않는다. ARMS에 h를 넣을 때만 돈다
#   refine-i  Rhythm 절이 들어간 재료(7eca68b)에 refine-g의 배정 패치를 얹은 것. ARMS에 i를 넣을 때만 돈다
#   refine-j  이 체크아웃: 익숙한 안·맞춤 안·과감한 안을 각각 다른 서브에이전트가 만든다. ARMS에 j를 넣을 때만 돈다
#   refine-k, refine-l  업종 벤치마크 1단계: 익숙한 안(A) 시안만 만든다 (variants/trade-mock.md). k는 --trade 없이, l은 trades.tsv의 업종으로.
#                       두 조건은 페이지·반복마다 같은 --seed를 쓴다. 시안은 refine-directions/a.html에 남는다
#   refine-m, refine-n  업종 벤치마크 2단계: 끝까지 고치되 A를 고른다 (variants/trade-full.md). m은 --trade 없이, n은 업종으로
# 폴더 이름을 a–d로 둔 것은 에이전트가 경로에서 조건을 읽지 못하게 하려는 것이다.
# 환경변수: PAGES (기본 4개), REPS (기본 "1 2 3"), ARMS (기본 "a b c d")
pw(){ pwd -W 2>/dev/null || pwd; }  # Git Bash(윈도우)에서는 C:/… 경로
HERE="$(cd "$(dirname "$0")" && pw)"; R="$(cd "$HERE/../.." && pw)"; BENCH_DIR="${BENCH_DIR:-$(pw)/refine-bench-out}"; mkdir -p "$BENCH_DIR"; export BENCH_DIR="$(cd "$BENCH_DIR" && pw)"; B="$BENCH_DIR"
PAGES="${PAGES:-en-dental en-foodbank ko-fintech ja-recruit}"; REPS="${REPS:-1 2 3}"; ARMS="${ARMS:-a b c d}"
for id in $PAGES; do [ -f "$B/pages/$id/before/index.html" ] && continue; src="$R/docs/refine-bench-2026-11-11/pages/$id/before.html"; [ -f "$src" ] || { echo "$id: 원본이 없습니다. 먼저 ONLY=$id $HERE/gen.sh 로 만드세요" >&2; exit 1; }; mkdir -p "$B/pages/$id/before"; cp "$src" "$B/pages/$id/before/index.html"; done
case " $ARMS " in *" a "*|*" b "*|*" h "*) { [ -d "$B/roots/r17" ] && [ -d "$B/roots/r12" ]; } || "$HERE/roots.sh" r17=origin/main r12=de170f6 || exit 1;; esac
case " $ARMS " in *" e "*) [ -d "$B/roots/mat" ] || "$HERE/roots.sh" mat="${MATERIALS_REF:-f4684f5}" || exit 1;; esac
case " $ARMS " in *" f "*) [ -d "$B/roots/matf" ] || { "$HERE/roots.sh" matf="${MATERIALS_REF:-f4684f5}" && git -C "$B/roots/matf" apply "$HERE/variants/materials-free.patch"; } || exit 1;; esac
case " $ARMS " in *" g "*) [ -d "$B/roots/matg" ] || { "$HERE/roots.sh" matg="${MATERIALS_REF:-f4684f5}" && git -C "$B/roots/matg" apply "$HERE/variants/materials-deal.patch"; } || exit 1;; esac
case " $ARMS " in *" i "*) [ -d "$B/roots/mati" ] || { "$HERE/roots.sh" mati="${MATERIALS_RHYTHM_REF:-7eca68b}" && git -C "$B/roots/mati" apply "$HERE/variants/materials-deal.patch"; } || exit 1;; esac
# 업종 벤치마크: trades.tsv에서 페이지의 종류·업종과 고정 씨앗(반복×1000+줄 번호)을 읽는다
trade_env(){ awk -F'	' -v id="$1" -v rep="$2" '$1==id{print "KIND="$2" TRADE="$3" SEED="(rep*1000+NR)}' "$HERE/trades.tsv"; }
one(){ # 한 조건의 한 반복: 페이지를 순서대로 돌려 앞 페이지의 선택이 다음 배정에 반영되게 한다
  local arm="$1" rep="$2"
  for id in $PAGES; do
    [ -s "$B/logs/refine-$arm.$rep-$id.json" ] && grep -q '"is_error":false' "$B/logs/refine-$arm.$rep-$id.json" && continue  # 정상으로 끝난 실행은 건너뛴다
    case "$arm" in
      a) REP=$rep REFINER_ROOT="$B/roots/r17" "$HERE/arm.sh" refine-a "$id";;
      b) REP=$rep REFINER_ROOT="$B/roots/r12" "$HERE/arm.sh" refine-b "$id";;
      c) REP=$rep "$HERE/arm.sh" refine-c "$id";;
      d) REP=$rep EXTRA_PROMPT="$HERE/variants/isolated.md" EXTRA_TOOLS="Agent Task" "$HERE/arm.sh" refine-d "$id";;
      e) REP=$rep REFINER_ROOT="$B/roots/mat" EXTRA_TOOLS="Agent Task" "$HERE/arm.sh" refine-e "$id";;
      f) REP=$rep REFINER_ROOT="$B/roots/matf" EXTRA_TOOLS="Agent Task" "$HERE/arm.sh" refine-f "$id";;
      g) REP=$rep REFINER_ROOT="$B/roots/matg" EXTRA_TOOLS="Agent Task" "$HERE/arm.sh" refine-g "$id";;
      h) REP=$rep REFINER_ROOT="$B/roots/r12" EXTRA_PROMPT="$HERE/variants/review.md" EXTRA_TOOLS="Agent Task" "$HERE/arm.sh" refine-h "$id";;
      i) REP=$rep REFINER_ROOT="$B/roots/mati" EXTRA_TOOLS="Agent Task" "$HERE/arm.sh" refine-i "$id";;
      j) REP=$rep EXTRA_TOOLS="Agent Task" "$HERE/arm.sh" refine-j "$id";;
      k|l|m|n) eval "$(trade_env "$id" "$rep")"; [ -n "${KIND:-}" ] || { echo "$id: trades.tsv에 없습니다" >&2; continue; }
         case "$arm" in k|m) TRADE="";; esac
         case "$arm" in k|l) v=trade-mock.md; gate=off; tools="";; *) v=trade-full.md; gate=on; tools="Agent Task";; esac
         REP=$rep KIND="$KIND" TRADE="$TRADE" SEED="$SEED" UI_REFINER_GATE=$gate EXTRA_PROMPT="$HERE/variants/$v" EXTRA_TOOLS="$tools" "$HERE/arm.sh" refine-$arm "$id";;
    esac
  done
}
for rep in $REPS; do for arm in $ARMS; do one "$arm" "$rep" & done; wait; done
names=""; mocks=""; for arm in $ARMS; do for rep in $REPS; do case "$arm" in k|l) mocks="$mocks refine-$arm.$rep";; *) names="$names refine-$arm.$rep";; esac; done; done
# shellcheck disable=SC2086
[ -n "$names" ] && STAGES=1 node "$HERE/shots.cjs" $names && node "$HERE/forms.cjs" $names
# shellcheck disable=SC2086
[ -n "$mocks" ] && SHOT_FILE=refine-directions/a.html node "$HERE/shots.cjs" $mocks && node "$HERE/trade-fit.mjs" $mocks
echo "다음: ARMS=$(echo $ARMS | sed 's/[a-z]/refine-&/g; s/ /,/g') REPS=$(echo $REPS | tr ' ' ,) ORDERS=2 STAGES=1 node $HERE/judge-prep.cjs && $HERE/judge.sh && node $HERE/agg.cjs"
