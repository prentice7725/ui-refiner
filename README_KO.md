# UI Refiner

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md)

UI Refiner는 한국·일본 사이트 2,245곳을 실측해 만든 웹 디자인 테마 13개를 제공합니다. Codex와 Claude Code에서 업종에 맞는 테마로 페이지를 만들거나, CLI로 기존 페이지를 점검할 수 있습니다.

![한국·일본 웹 디자인 테마 13개의 샘플 페이지를 모은 이미지](docs/assets/themes.jpg)

[테마 갤러리](skills/ui-refiner-agent/reference/themes/GALLERY.md) · [측정 방법과 테마 목록](skills/ui-refiner-agent/reference/themes/README.md)

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
- **새 페이지 제작.** 한국·일본 사이트 2,245곳의 실측을 바탕으로 만든 테마 13개가 있습니다. 저장소를 내려받은 뒤 갤러리를 브라우저로 열면 국가·업종·사진 보유 여부로 샘플을 고를 수 있습니다.

세 페이지를 대상으로 한 실험에서 세 시안 방식은 페이지별 평균 순위가 가장 높았지만, 완성된 세 페이지는 서로 비슷하다는 평가를 받았습니다. 모델 한 개가 평가한 결과입니다. [실험 결과](docs/refine-pilot-2026-11-15-local/results-five-arms.json)

[전체 가이드 및 프로젝트 QA 설정](docs/GUIDE_KO.md) · [변경 기록](CHANGELOG.md) · [MIT](LICENSE) · [외부 코드·데이터 라이선스](licenses/THIRD_PARTY.md)
