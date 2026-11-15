#!/bin/bash
# 18차 파일럿: 네 조건을 같은 페이지에 여러 번 돌린다. 모델을 호출하므로 비용이 든다 (17차 기준 페이지당 약 $2.6).
#   refine-a  17차 그대로 (origin/main)
#   refine-b  12차 (de170f6: 구조와 바탕만 배정, 고객 사실로 쓴 제목)
#   refine-c  이 체크아웃: 17차에서 고유 요소 예시만 뺀 스킬
#   refine-d  refine-c + 시안 세 개를 서로 못 보는 서브에이전트가 따로 만든다
#   refine-e  재료 배정 (origin/feat/refine-materials: 시안마다 재료 하나, 새 맥락의 히어로·마무리 리뷰). ARMS에 e를 넣을 때만 돈다
#   refine-f  refine-e에서 색과 서체 고정만 푼 것 (variants/materials-free.patch): 재료는 만드는 법만 정하고, 색과 서체는 고객에 맞춰 고른다. ARMS에 f를 넣을 때만 돈다
#   refine-g  refine-e에서 재료 배정만 바꾼 것 (variants/materials-deal.patch): 최근 네 프로젝트에서 고른 재료는 빼고, 성격·종류 중 하나만 맞아도 후보에 넣는다. ARMS에 g를 넣을 때만 돈다
# 폴더 이름을 a–d로 둔 것은 에이전트가 경로에서 조건을 읽지 못하게 하려는 것이다.
# 환경변수: PAGES (기본 4개), REPS (기본 "1 2 3"), ARMS (기본 "a b c d")
HERE="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$HERE/../.." && pwd)"; export BENCH_DIR="${BENCH_DIR:-$PWD/refine-bench-out}"; B="$BENCH_DIR"
PAGES="${PAGES:-en-dental en-foodbank ko-fintech ja-recruit}"; REPS="${REPS:-1 2 3}"; ARMS="${ARMS:-a b c d}"
for id in $PAGES; do [ -f "$B/pages/$id/before/index.html" ] || { mkdir -p "$B/pages/$id/before"; cp "$R/docs/refine-bench-2026-11-11/pages/$id/before.html" "$B/pages/$id/before/index.html"; }; done
[ -d "$B/roots/r17" ] && [ -d "$B/roots/r12" ] || "$HERE/roots.sh" r17=origin/main r12=de170f6 || exit 1
case " $ARMS " in *" e "*) [ -d "$B/roots/mat" ] || "$HERE/roots.sh" mat="${MATERIALS_REF:-origin/feat/refine-materials}" || exit 1;; esac
case " $ARMS " in *" f "*) [ -d "$B/roots/matf" ] || { "$HERE/roots.sh" matf="${MATERIALS_REF:-origin/feat/refine-materials}" && git -C "$B/roots/matf" apply "$HERE/variants/materials-free.patch"; } || exit 1;; esac
case " $ARMS " in *" g "*) [ -d "$B/roots/matg" ] || { "$HERE/roots.sh" matg="${MATERIALS_REF:-origin/feat/refine-materials}" && git -C "$B/roots/matg" apply "$HERE/variants/materials-deal.patch"; } || exit 1;; esac
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
    esac
  done
}
for rep in $REPS; do for arm in $ARMS; do one "$arm" "$rep" & done; wait; done
names=""; for arm in $ARMS; do for rep in $REPS; do names="$names refine-$arm.$rep"; done; done
# shellcheck disable=SC2086
STAGES=1 node "$HERE/shots.cjs" $names && node "$HERE/forms.cjs" $names
echo "다음: ARMS=$(echo $ARMS | sed 's/[a-z]/refine-&/g; s/ /,/g') REPS=$(echo $REPS | tr ' ' ,) ORDERS=2 STAGES=1 node $HERE/judge-prep.cjs && $HERE/judge.sh && node $HERE/agg.cjs"
