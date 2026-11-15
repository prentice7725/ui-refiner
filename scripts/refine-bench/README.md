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

## 조건을 여러 번 돌려 비교하기 (18차 파일럿)

1–17차는 차수마다 한 번씩만 돌려서, 낱장 평균 순위 0.6 미만의 차이는 가릴 수 없었습니다. 아래 장치는 그 한계를 줄이려는 것입니다.

- **반복.** `REP=2 arm.sh refine-c en-dental`처럼 돌리면 결과가 `pages/<id>/refine-c.2`에 쌓입니다. 선택 기록(`UI_REFINER_HOME`)도 조건·반복마다 따로 두므로 조건끼리는 병렬로 돌려도 됩니다. 한 조건 안의 페이지는 순서대로 돌립니다.
- **다른 시점의 스킬.** `roots.sh r17=origin/main r12=de170f6`가 `$BENCH_DIR/roots/`에 체크아웃을 만들고, `REFINER_ROOT`로 그 스킬과 CLI를 씁니다. 실행마다 커밋, 모델, 덧붙인 프롬프트가 `meta/`에 남습니다.
- **단계별 사본.** refine 방식에는 PostToolUse 훅(`snapshot-hook.mjs`)이 걸려, 페이지가 바뀔 때마다 사본을 남기고 선택 순간의 시안 폴더를 보관합니다. `STAGES=1 node shots.cjs …`가 고른 시안, 처음 검사받은 구현, 최종본을 찍습니다. 개성이 처음부터 없었는지, 구현이나 검사 뒤 수정에서 사라졌는지 가르기 위한 것입니다.
- **순서 뒤집기.** `ORDERS=2`면 같은 비교를 글자 순서를 뒤집어 한 번 더 평가합니다. 집계는 두 순서에서 1위가 같았던 비율과 자리별 평균 순위를 같이 냅니다.
- **첫 화면 형태.** `forms.cjs`가 첫 화면의 표, 숫자 행 묶음, 시각 표기, 가는 선을 셉니다. 평가자의 말을 숫자로 확인하는 용도입니다.

네 조건(17차, 12차, 고유 요소 예시를 뺀 스킬, 거기에 시안을 따로 만드는 서브에이전트)을 4페이지에 3번씩 돌리는 묶음은 `pilot.sh`에 있습니다.

```bash
export BENCH_DIR=~/refine-pilot
scripts/refine-bench/pilot.sh          # 48회 실행. 중단돼도 다시 돌리면 끝난 실행은 건너뛴다
ARMS=refine-a,refine-b,refine-c,refine-d REPS=1,2,3 ORDERS=2 STAGES=1 node scripts/refine-bench/judge-prep.cjs
scripts/refine-bench/judge.sh && node scripts/refine-bench/agg.cjs   # 요약과 results.json
```

집계표의 "반복별 평균 (최대-최소)"는 한 조건이 반복 사이에 흔들린 폭입니다. 조건 사이의 차이가 그 폭보다 작으면 차이로 보지 않습니다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `prompts.tsv` | 페이지 id와 한 줄 프롬프트 8개 (영어 4, 일본어 2, 한국어 2) |
| `gen.sh` | 스킬·플러그인·MCP·설정 없이 원본 페이지를 만든다 |
| `arm.sh <plain\|unslop\|refine[-이름]> <id>` | 원본을 복사해 한 가지 방식으로 고친다. refine은 마무리 게이트(Stop 훅)와 단계별 사본 훅을 건다. 환경변수는 파일 머리말 참고 |
| `roots.sh <이름>=<커밋> …` | 다른 커밋의 스킬과 CLI로 돌릴 체크아웃을 만든다 |
| `pilot.sh` | 네 조건 × 4페이지 × 3회 묶음 |
| `snapshot-hook.mjs` | refine 도중 페이지 사본과 시안 폴더를 남긴다 |
| `variants/isolated.md` | 시안 세 개를 서로 못 보는 서브에이전트가 만들게 하는 덧붙임 프롬프트 |
| `forms.cjs <방식…>` | 첫 화면의 표, 숫자 행 묶음, 시각 표기, 가는 선을 센다 |
| `shots.cjs <방식…>` | 1440×900 첫 화면과 전체 페이지 스크린샷. `STAGES=1`이면 중간 단계도 찍는다 |
| `judge-prep.cjs` | 방식 이름을 가리고 글자를 섞는다. 세트 평가용 대조 시트(8페이지 첫 화면)를 만든다. 대응표는 `judge-key.json` |
| `judge.sh` | 페이지 평가, 세트 평가, 단계 평가. 끝난 평가는 건너뛴다 |
| `agg.cjs` | 대응표로 글자를 풀어 방식별 평균을 낸다 |

## 알아 둘 것

- **새 방식을 추가하려면** `arm.sh`에 분기를 하나 더 넣고, `ARMS=before,plain,refine,새방식` 환경변수로 `judge-prep.cjs`와 `agg.cjs`에 알려 줍니다. `judge.sh`는 폴더에 있는 버전 수에 맞춰 프롬프트를 만듭니다(최대 8개).
- **허용 도구는 `Bash(node:*)`뿐입니다.** `cd … && node …`처럼 묶은 명령이나 `python3`, `sed`는 거부됩니다. 2026-11-11 실행에서 페이지마다 2–9번 거부됐고, 에이전트는 대부분 다른 방법으로 돌아갔습니다.
- **refine의 사진은 위키미디어 응답에 달려 있습니다.** 클라우드 IP에서는 검색이 429로 거절돼 서비스 페이지가 사진 없이 돌았습니다. 로컬에서는 `ui-refiner photos "dental chair"`가 되는지 먼저 확인하세요.
- **선택 기록은 `$BENCH_DIR/home/<방식>`에 따로 쌓입니다.** 사용자의 `~/.ui-refiner/refine-log.json`은 건드리지 않습니다. 같은 `BENCH_DIR`에서 refine을 다시 돌리면 이전 실행의 선택이 배정에 섞이니, 새로 시작하려면 `home/`을 지웁니다.
- 평가 모델과 생성 모델은 기본값이 `claude-opus-5-5`이고, `MODEL`(생성)과 `JUDGE_MODEL`(평가)로 바꿉니다.
