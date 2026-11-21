# UI Refiner

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md)

UI Refiner는 한국·일본 사이트 2,326곳을 실측해 만든 웹 디자인 테마 13개를 제공합니다. Codex와 Claude Code에서 업종에 맞는 테마로 페이지를 만들거나, CLI로 기존 페이지를 점검할 수 있습니다.

## 테마를 만든 과정

**1. 페이지 유형 8가지.** 실측한 2,326곳은 전체 인상에 따라 8가지 유형으로 나뉩니다. 그림은 유형별 실측 평균(바탕, 사진, 글자 크기, 밀도)을 도식으로 그린 것입니다.

![페이지 유형 8가지의 도식과 유형별 실측 사이트 수](docs/assets/archetypes.jpg)

**2. 업종군 6개.** 업종은 방문자가 그 사이트에서 하려는 일을 기준으로 묶었습니다.

| 업종군 | 업종 | 한국 | 일본 |
|---|---|---|---|
| place | 숙박, 관광, 외식, 웨딩 | 143 | 156 |
| care | 의원, 병원, 돌봄, 미용, 피트니스 | 175 | 259 |
| public | 정부, 협회, 대학, 언론, 금융 | 202 | 179 |
| shop | 쇼핑몰, 패션, 화장품, 식품 | 199 | 165 |
| business | 제조, 물류, 소프트웨어, 건설, 세무, 채용 | 235 | 249 |
| creative | 디자인, 게임, 건축, 사진, 일러스트 | 130 | 153 |

**3. 테마 13개.** 테마는 한 나라의 한 업종군에서 흔한 유형을 완성한 디자인입니다. 크기, 색, 배치는 그 유형에 속한 사이트의 실측값에서 가져왔습니다. 테마 옆의 숫자는 그 나라, 그 업종군에서 해당 유형에 속한 사이트 수입니다. `kr-business-white`는 한국 business 235곳 가운데 50곳을 근거로 합니다.

![한국·일본 웹 디자인 테마 13개의 샘플 페이지를 모은 이미지](docs/assets/themes.jpg)

[테마 갤러리](skills/ui-refiner-agent/reference/themes/GALLERY.md) · [측정 방법과 테마 목록](skills/ui-refiner-agent/reference/themes/README.md)

**4. 한 업종군을 8가지 유형으로.** 어느 업종군이든 8가지 유형으로 그릴 수 있습니다. 아래는 한국 business 업종군의 가상 제조사 한 곳을 8가지로 그린 것입니다. 이 가운데 둘은 테마입니다. 나머지 여섯은 해당 유형의 실측값으로 만든 시연용 샘플이며 테마로 제공하지 않습니다. 숫자는 그 조합이 얼마나 흔한지를 보여줍니다. 한국 business 사이트 가운데 white quiet는 50곳이고 bold colour는 15곳입니다.

![가상의 한국 제조사 한 곳을 페이지 유형 8가지로 그린 이미지](docs/assets/archetype-demo-kr-business.jpg)

[시연 페이지와 실측 수](docs/archetype-demo/README.md)

## 빠른 시작

Node.js 22.18 이상, npm, Git이 필요합니다. 기존 앱에 연결하려면 앱의 루트에서 실행하세요.

```sh
git clone https://github.com/prentice7725/ui-refiner tools/ui-refiner
cd tools/ui-refiner
npm ci
npx playwright install chromium
node bin/ui-refiner.mjs doctor
node bin/ui-refiner.mjs scan examples/ai-slop-landing.html --lang ko
```

예제 스캔이 끝나면 `ui-refiner-scan/DESIGN_REVIEW.md`를 여세요. 같은 폴더에 데스크톱·모바일 스크린샷이 저장됩니다. 예제 파일 대신 URL이나 로컬 HTML 경로를 넣으면 내 페이지를 검사합니다. 같은 페이지를 같은 출력 폴더에 다시 스캔하면 이전 결과와 비교합니다.

## 에이전트에 연결하기

위에서 연 `tools/ui-refiner` 폴더에서 사용하는 도구에 맞는 명령 하나를 실행하세요. CLI만 쓴다면 여기까지 설치할 필요가 없습니다.

| 도구 | 설치 명령 | 대상 앱에서 사용 |
|---|---|---|
| Codex | `node scripts/install-agent-skill.mjs ../.. --host codex` | 새 채팅에서 “landing.html 디자인을 점검해 줘” |
| Claude Code | `node scripts/install-agent-skill.mjs ../.. --host claude` | `/ui-review landing.html`로 점검, `/ui-refine landing.html`로 수정 |

설치기를 다시 실행하면 버전과 파일 차이를 확인할 수 있습니다. `--update`를 붙이면 갱신 가능한 파일을 적용하고 사용자가 수정한 파일은 표시합니다.

<details>
<summary>Claude Code 플러그인으로 설치</summary>

Claude Code 채팅에서 아래 두 명령을 실행한 뒤 플러그인 폴더에서 `npm ci`와 `npx playwright install chromium`을 실행하세요.

```text
/plugin marketplace add prentice7725/ui-refiner
/plugin install ui-refiner@ui-refiner
```

</details>

## 사용 목적별 기능

- **기존 페이지 점검.** `scan`은 디자인 신호의 근거와 수정 방향을 보여줍니다. 0–100점은 감지한 패턴의 강도를 나타냅니다. 글자 대비 같은 품질 문제는 별도로 보고합니다. 보고서는 한국어·일본어·영어를 지원하며 `--lang ko`처럼 지정할 수 있습니다.
- **기존 페이지 수정.** 에이전트는 수정 범위가 작으면 기존 구조를 유지하고, 전면 개편할 때는 세 시안을 비교해 선택을 받습니다. `keep check`로 링크·폼·수치가 보존됐는지, `stress`로 긴 문구와 큰 숫자가 레이아웃을 깨는지 검사할 수 있습니다.
- **새 페이지 제작.** 한국·일본 사이트 2,326곳의 실측을 바탕으로 만든 테마 13개가 있습니다. 저장소를 내려받은 뒤 갤러리를 브라우저로 열면 국가·업종·사진 보유 여부로 샘플을 고를 수 있습니다.

세 페이지를 대상으로 한 실험에서 세 시안 방식은 페이지별 평균 순위가 가장 높았지만, 완성된 세 페이지는 서로 비슷하다는 평가를 받았습니다. 모델 한 개가 평가한 결과입니다. [실험 결과](docs/refine-pilot-2026-11-15-local/results-five-arms.json)

[전체 가이드 및 프로젝트 QA 설정](docs/GUIDE_KO.md) · [변경 기록](CHANGELOG.md) · [MIT](LICENSE) · [외부 코드·데이터 라이선스](licenses/THIRD_PARTY.md)
