# UI Refiner v0.4.0

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md) · [変更履歴](CHANGELOG.md)

UI Refinerは、コーディングエージェント（Claude Code、Codex）と、それを使って開発する人のためのツールです。次の2つを支援します。

1. **作る**：AIが作った感じのしないWebページやアプリ画面を作る。
2. **点検する**：既存ページのどこが「ありがち」に見えるかを指摘し、より良いデザインを提案する。

実際のブラウザでページを表示して計測し、エージェントやデザイナーがそのまま使えるレポートを出力します。日本語ページには専用の組版チェックがあり、レポートも日本語で出力できます。

## クイックスタート

必要環境：Node.js 22.18以上、npm、Git。

```sh
git clone https://github.com/prentice7725/ui-refiner && cd ui-refiner
npm ci && npx playwright install chromium

node bin/ui-refiner.mjs scan https://your-site.example --lang ja            # 日本語レポート、ja-JPブラウザ
node bin/ui-refiner.mjs scan http://127.0.0.1:5173 --source src --lang ja   # 開発サーバー＋ソースの静的検査
node bin/ui-refiner.mjs scan examples/ai-slop-landing-ja.html --lang ja     # ローカルHTMLファイル
node bin/ui-refiner.mjs scan https://your-site.example --lang ko --locale ja-JP   # 日本語ページを韓国語レポートで
```

`scan`はURL、ホスト名、ローカルの`.html`ファイルを受け付けます。設定は不要で、対象プロジェクトを変更しません。`--lang`は`ja`・`ko`・`en`（既定は`ko`）、ブラウザのロケールは`--lang`に合わせます（`--locale`で変更可）。

## `scan`の出力

`ui-refiner-scan/`に保存します（`--out`で変更可）。

| ファイル | 内容 |
|---|---|
| `DESIGN_REVIEW.md` | AI感指数、サインごとの根拠・理由・改善案、基本品質の表、日本語タイポグラフィ（日本語ページ）、ソース検査（`--source`）、避けられていたもの、エージェントの次の手順 |
| `scan.json` | 同じ内容の機械可読データ |
| `scan-desktop.png`、`scan-mobile.png` | 遅延読み込みまでスクロールした後の1440px・390pxの全体スクリーンショット |
| `before-scan-*.png`、`previous-scan.json` | `--compare`使用時、並べて確認するために保存した前回のスクリーンショットと結果 |

### 修正前後の比較

ページを直したら、`--compare`に前回のスキャンフォルダー（またはその`scan.json`）を指定して再スキャンします。

```sh
node bin/ui-refiner.mjs scan http://127.0.0.1:5173 --lang ja --out scan-before
# … ページを修正 …
node bin/ui-refiner.mjs scan http://127.0.0.1:5173 --lang ja --out scan-after --compare scan-before
node bin/ui-refiner.mjs scan http://127.0.0.1:5173 --lang ja --compare ui-refiner-scan   # 同じフォルダーでも可
```

レポートの先頭に比較の節が付きます。AI感指数の変化、解消・新規・残っているサイン（強くなったか弱くなったか）、ルールごとの基本品質の変化、日本語組版の変化、前後のスクリーンショットへのリンクを示します。パスが同じなら比較できるので、本番サイトとローカル開発サーバーの比較も可能です。別のページやブラウザのロケールが異なる場合は警告を出します。例として`examples/ai-slop-landing-ja.html` → `examples/redesign-landing-ja.html`は100 → 0、サイン13件と日本語の問題7件が解消します。

## 日本語タイポグラフィのチェック

ページの大部分が日本語の場合、レポートに**日本語タイポグラフィ**の節が加わります。ブラウザで実際に描画された結果を計測するため、CSSフレームワークやビルド方法に依存しません。

| チェック | 重要度 | 何を見るか・なぜ問題か | 改善の方向 |
|---|---|---|---|
| 和文書体が指定されていない | 高 | font-familyに日本語グリフを持つ書体がない。OSごとに別のフォールバック書体で表示される。AI生成の`Inter, sans-serif`で頻発 | `Inter, "Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", sans-serif`のように和文書体を明示 |
| 本文の行間が狭い | 中 | 40文字以上の段落でline-height 1.45未満。和文は字面が大きく詰まって見える | 本文1.7〜2.0、見出し1.3〜1.5 |
| 見出しの泣き別れ | 中/低 | 見出しの最終行が1〜2文字だけ。デスクトップとモバイルで別々に判定 | `word-break: auto-phrase`（Chrome）、BudouX、`<wbr>`で文節改行し、`text-wrap: balance` |
| 見出しの`word-break: break-all` | 中 | 文節を無視して任意の位置で改行される | 見出しは`auto-phrase`か`keep-all`＋`<wbr>`。`break-all`はURLなど長い英数字だけに |
| 日本語の斜体 | 中 | 和文書体に斜体はなく、ブラウザが機械的に傾ける | 強調は太さ・色・傍点（`text-emphasis`）で |
| 字間の詰めすぎ | 低 | 欧文向けの負の字間（tracking-tight）で文字がぶつかる | 0〜0.05em。詰めるなら`font-feature-settings: "palt"`で約物だけ |
| 12px未満の日本語 | 低 | 画数の多い漢字が潰れる（フッター・注記は除外） | 最小12px、本文15〜16px以上 |
| 半角カナ・全角英数字 | 低 | 古いシステムの印象。検索や読み上げにも不利 | 全角カナ・半角英数字に統一 |

日本のWebの慣習はAI感として扱いません。ヒラギノ・Noto Sans JP・游ゴシックの書体指定、ロゴを入れた小さな`h1`、情報密度の高いレイアウトは正常です。

### 日本語のAI感サイン

- **紋切り型のコピー**（2つ以上で検出）：可能性を解き放つ、シームレスな、次世代の、ワンランク上の、ビジネスを加速、未来を切り拓く、新たな価値を創造、誰でも簡単に、魔法のように、かつてない、想像を超える、オールインワン など。「次世代」「革新」のような単語単体ではなく、言い回しで判定します。
- **汎用CTAの繰り返し**：詳しく見る、詳細はこちら、もっと見る、続きを読む、今すぐ始める、無料で始める など。

## AI感指数（0〜100）

描画結果から計測したサインによるヒューリスティックです。強いサインは3、中程度は2、弱いサインは1の重みです。選ばれたWebフォント、実際の画像、豊かな文字サイズ階層がそれぞれスコアを15%下げますが、サイン自体は一覧に残ります。何もブロックしません。

| サイン | 計測内容 |
|---|---|
| 紫・藍色のグラデーションヒーロー | 文字の背後の大きなグラデーションで、色の大半が紫・藍・ピンク |
| 広い面積のグラデーション | 文字のある広い面を覆うグラデーション |
| グラデーション文字 | `background-clip: text`のグラデーション。見出しなら強いサイン |
| すりガラス | `backdrop-filter: blur`の箱の繰り返し（固定ナビゲーションは除外） |
| グロー | 色のついたぼかし影 |
| 絵文字アイコン | 単独または先頭に置かれたアイコン用の絵文字（ユーザー投稿内の絵文字は除外） |
| アイコンカードの並び | 1行に並ぶ同じ角丸カード3〜4枚（見出し＋説明） |
| 見出し上のピル型バッジ | ヘッドライン直上のバッジ |
| 中央揃え | ほとんどの段落が中央揃え |
| 角丸の多用 | ほぼすべての箱が16px以上の角丸 |
| 個性のない書体 | Inter・Roboto・システム書体ひとつで全部（日本語ページで和文書体の指定があれば除外） |
| 平坦なサイズ階層 | 最大の見出しが本文の2倍未満（日本語ページでは判定しない） |
| 既定のアクセントカラー | 手を加えていないTailwindのindigo/violet/blue、Bootstrapの青 |
| 色数が多い | UIの有彩色が5系統以上 |
| `transition: all` | 操作要素の計算済みスタイル |
| 紋切り型のコピー | 英語・韓国語・日本語の定型句が2つ以上 |
| 汎用CTAの繰り返し | 同じ汎用ボタン文言の繰り返し |

装飾イラスト、`aria-hidden`の図、SVGの内部、固定ナビゲーションは除外し、作り込まれたブランド表現が誤検出されないようにしています。

### 基本品質

同梱のlintappleエンジンの共通ルールを描画済みページで計測します。文字のコントラスト、アクセシブルネーム、フォームラベル、ARIA参照、コントロールの状態、タップ領域、横はみ出し、ビューポート境界、フォント読み込みを確認します。書体・サイズ・文言などプロジェクト固有のルールは詳細ゲートで扱います。

### キャリブレーション

執筆時点の結果です（サイトの更新でスコアは変わります）。

| ページ | AI感指数 | 備考 |
|---|---:|---|
| `examples/ai-slop-landing-ja.html` | 100 | AI感サインに加え日本語組版の問題7件 |
| `examples/ai-slop-landing.html` | 100 | サイン13件 |
| デモ（`npm run demo`） | 6 | 書体のみ |
| smarthr.jp、freee.co.jp、note.com、mercari、cybozu、yahoo.co.jp、apple.com/jp、line.me | 0〜19 | 日本語組版の指摘は別枠（例：yahoo.co.jpの`break-all`や全角数字） |
| stripe.com、linear.app、github.com、toss.im、apple.com/kr | 6〜28 | |

## エージェントと使う

[skills/ui-refiner-agent/SKILL.md](skills/ui-refiner-agent/SKILL.md)のスキルが2つの手順を定めます。

- **点検**：`scan`を実行し、まずスクリーンショットを見てから各サインの妥当性を判断する。結論、根本原因2〜3個、原因ごとのリデザイン方針（守るべきものを含む）、ユーザーが実際に困る品質問題を報告する。
- **作る**：プロジェクトと同梱のsutaガイドを読み、マークアップの前にデザイン方針を決め、既定値の罠を避ける。その後、開発サーバーを`scan`して意図しないものを直す（最大2回）。日本語UIでは和文書体の指定、行間、見出しの改行位置を必ず確認する。

インストール方法：

| エージェント | 方法 |
|---|---|
| Claude Code（プラグイン） | `/plugin marketplace add prentice7725/ui-refiner`のあと`ui-refiner`をインストール。プラグインのフォルダーで`npm ci && npx playwright install chromium`を一度実行 |
| Claude Code / Codex（プロジェクト単位） | アプリの`tools/ui-refiner`にこのリポジトリを置き、`node tools/ui-refiner/scripts/install-agent-skill.mjs .`を実行。`.claude/skills/ui-refiner-agent`（Claude Code）と`.agents/skills/ui-refiner-agent`（Codex）にスキルを置き、編集後フックを登録 |

同梱のデザイン知識は`vendor/suta/skills/suta`（韓国語）にあります。AIスロップの禁止ライン、レイアウト・モーションの値、テスト済みUIパターン57種です。

## 詳細QAゲート（任意）

開発やCIで強制ゲートが必要なプロジェクトでは、`init`＋`check`でプロジェクトのポリシーに沿ってsutaの静的検査とlintappleの描画検査を実行します。ルート、操作状態、ベースライン、変更行スコープ、証拠画像、ARIA比較、ビジュアルリグレッション、SARIF/HTMLエクスポート、レビューパケットに対応します。

```sh
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale ja-JP
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

`--locale ja-JP`の初期ポリシーには、ヒラギノ・Noto Sans JP・メイリオ・游ゴシックなどの和文書体と日本語の禁止文言が入ります。終了コード：0 合格（人の確認が残る場合あり）、1 違反、2 エラーまたは検査範囲の不足、3 部分範囲のみ合格。既定ポリシーは承認済みの書体だけを許可するので、強制する前に`ui-policy.json`をプロジェクトのタイポグラフィに合わせてください。

詳しい説明：[docs/gate/README_JA.md](docs/gate/README_JA.md) · [English](docs/gate/README.md) · [한국어](docs/gate/README_KO.md)。エージェントの手順：[reference/quality-gate.md](skills/ui-refiner-agent/reference/quality-gate.md)。

## 制限

- `scan`はビューポートごとに読み込み直後の状態を1つだけ見ます。操作後の状態、ログインが必要なページ、アプリ全体の一貫性は詳細ゲートか人の確認が必要です。
- 指数はヒューリスティックであり、センスの判定ではありません。スコアが低くても良いデザインとは限らず、意図したブランドのグラデーションは問題ありません。最終的な見た目の承認は人が行います。
- ビジョンモデルは呼び出しません。見た目の判断はスクリーンショットを読むエージェントが行います。
- Canvasアプリ、Godot・PhaserのUI、ゲームHUDは対象外です。
- スクリーンショットとレポートにはページの内容が含まれます。共有前に確認してください。

## 開発

```sh
npm test                 # ユニットテスト
npm run smoke:scan       # 実ブラウザ：英語・日本語のスロップ見本とデモの比較
npm run smoke:ui         # その他のスモーク：smoke:gate、smoke:routes、smoke:visual …
```

CIですべてのテストを実行します（[.github/workflows/ci.yml](.github/workflows/ci.yml)）。同梱エンジンは固定バージョンとハッシュで検証しています（[vendor/UPSTREAM.json](vendor/UPSTREAM.json)）。変更点は[CHANGELOG.md](CHANGELOG.md)、背景調査は[docs/](docs/)にあります。

## ライセンス

MIT。同梱しているサードパーティのコードとデータはそれぞれのライセンスに従います。suta（[vendor/suta/LICENSE](vendor/suta/LICENSE)）、lintapple（[vendor/lintapple/LICENSE](vendor/lintapple/LICENSE)）、UI UX Pro Maxデータ（[knowledge/ui-ux-pro-max/LICENSE](knowledge/ui-ux-pro-max/LICENSE)）、npmパッケージ（[licenses/THIRD_PARTY.md](licenses/THIRD_PARTY.md)）。
