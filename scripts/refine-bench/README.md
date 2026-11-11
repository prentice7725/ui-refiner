# Refine 벤치마크 하네스

같은 페이지를 여러 방식으로 고치고, 이름을 가린 스크린샷으로 평가하는 스크립트 모음입니다. 모델을 실제로 호출하므로 `npm test`나 CI에서는 돌지 않습니다. 2026-11-11 실행은 약 $47이 들었습니다([결과](../../docs/REFINE_BENCHMARK_UNSLOP_2026-11-11_KO.md)).

## 필요한 것

- `claude` CLI (헤드리스 `claude -p`), Node.js 22.18+, 저장소 루트에서 `npm ci`
- Playwright와 Chromium (`require('playwright')`가 되는 환경)
- unslop 방식을 돌릴 때만: `git clone https://github.com/heydamir/unslop`

## 실행 순서

작업 폴더는 `BENCH_DIR`(기본값 `./refine-bench-out`)입니다. 저장소 밖 폴더를 권합니다.

```bash
export BENCH_DIR=~/refine-bench-out
H=scripts/refine-bench

# 1. 원본 페이지: 새로 만들거나, 2026-11-11 원본을 그대로 쓴다
$H/gen.sh
#   또는: for d in docs/refine-bench-2026-11-11/pages/*; do
#           mkdir -p $BENCH_DIR/pages/$(basename $d)/before
#           cp $d/before.html $BENCH_DIR/pages/$(basename $d)/before/index.html; done

# 2. 방식별로 고치기. plain과 unslop은 병렬로 돌려도 된다
export UNSLOP_SKILL=~/unslop/skills/unslop
for id in $(cut -f1 $H/prompts.tsv); do $H/arm.sh plain $id & $H/arm.sh unslop $id & done; wait
# refine은 사용자 단위 선택 기록(~/.ui-refiner/refine-log.json)을 공유하므로 순서대로 돌린다
for id in $(cut -f1 $H/prompts.tsv); do $H/arm.sh refine $id; done

# 3. 스크린샷, 평가 자료, 평가, 집계
node $H/shots.cjs before plain refine unslop
node $H/judge-prep.cjs
$H/judge.sh
node $H/agg.cjs
```

## 파일

| 파일 | 하는 일 |
|---|---|
| `prompts.tsv` | 페이지 id와 한 줄 프롬프트 8개 (영어 4, 일본어 2, 한국어 2) |
| `gen.sh` | 스킬·플러그인·MCP·설정 없이 원본 페이지를 만든다 |
| `arm.sh <plain\|unslop\|refine> <id>` | 원본을 복사해 한 가지 방식으로 고친다. refine은 마무리 게이트(Stop 훅)를 건다 |
| `shots.cjs <방식…>` | 1440×900 첫 화면과 전체 페이지 스크린샷 |
| `judge-prep.cjs` | 방식 이름을 가리고 글자를 섞는다. 세트 평가용 대조 시트(8페이지 첫 화면)를 만든다. 대응표는 `judge-key.json` |
| `judge.sh` | 페이지 평가 8회, 세트 평가 2회 |
| `agg.cjs` | 대응표로 글자를 풀어 방식별 평균을 낸다 |

## 알아 둘 것

- **새 방식을 추가하려면** `arm.sh`에 분기를 하나 더 넣고, `ARMS=before,plain,refine,새방식` 환경변수로 `judge-prep.cjs`와 `agg.cjs`에 알려 줍니다. `judge.sh`의 프롬프트는 버전 4개(A–D)를 전제로 쓰여 있으니 개수가 달라지면 문구와 JSON 예시를 고쳐야 합니다.
- **허용 도구는 `Bash(node:*)`뿐입니다.** `cd … && node …`처럼 묶은 명령이나 `python3`, `sed`는 거부됩니다. 2026-11-11 실행에서 페이지마다 2–9번 거부됐고, 에이전트는 대부분 다른 방법으로 돌아갔습니다.
- **refine의 사진은 위키미디어 응답에 달려 있습니다.** 클라우드 IP에서는 검색이 429로 거절돼 서비스 페이지가 사진 없이 돌았습니다. 로컬에서는 `ui-refiner photos "dental chair"`가 되는지 먼저 확인하세요.
- **refine을 다시 돌리기 전에** `~/.ui-refiner/refine-log.json`을 다른 곳으로 옮겨 두어야 이전 실행의 선택이 배정에 섞이지 않습니다.
- 평가 모델과 생성 모델은 스크립트 안의 `--model claude-opus-5-5`입니다.
