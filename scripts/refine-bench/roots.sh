#!/bin/bash
# 사용법: roots.sh <이름>=<커밋> …  — 다른 시점의 스킬과 CLI로 돌릴 체크아웃을 $BENCH_DIR/roots/<이름>에 만든다
# 예: roots.sh r17=origin/main r12=de170f6   →  REFINER_ROOT=$BENCH_DIR/roots/r12 arm.sh refine-r12 en-dental
HERE="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$HERE/../.." && pwd)"; B="${BENCH_DIR:-$PWD/refine-bench-out}"; mkdir -p "$B/roots"
for spec in "$@"; do name="${spec%%=*}"; ref="${spec#*=}"; d="$B/roots/$name"
  [ -d "$d" ] && git -C "$R" worktree remove --force "$d"
  git -C "$R" worktree add --detach "$d" "$ref" >/dev/null || exit 1
  # 의존성은 이 저장소의 node_modules를 같이 쓴다 (12차 이후 package.json은 바뀌지 않았다)
  ln -s "$R/node_modules" "$d/node_modules"
  echo "$name $(git -C "$d" rev-parse --short HEAD) $d"
done
