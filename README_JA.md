# UI Refiner v0.3.0

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md)

UI Refinerは、一般的なDOMベースのWebアプリ向けに、**sutaのソース監査・デザインガイド**と**lintappleの実際のレンダリングに基づくレイアウト・アクセシビリティ・操作検証**を組み合わせます。開発者とコーディングエージェントに、修正に必要な証拠と決定的な品質ゲートを提供します。

固定されたsutaの完全なスキルカタログと57のパターン、保守対象のlintappleランタイムソースを含みます。UIの自動生成、コードの自動修正、ビジョンモデルの呼び出し、リリース承認は行いません。Godot UI、Phaser Canvas、ゲームHUDは対象外です。

## 1. 必要環境とインストール

**Node.js 22.18以上**、npm、Git、および明示的にインストールしたPlaywright Chromiumが必要です。ランタイムのnpm依存関係は`axe-core@4.14.0`と`playwright@1.63.0`に固定されています。

このリポジトリを対象アプリの`tools/ui-refiner`に配置してください。このソース配置をサポートしますが、`node_modules`配下でsutaのnative TypeScriptを実行する方式はサポートしません。コンパイル済みのnpm配布版はまだありません。

**対象アプリのルート**から実行します。

```sh
(cd tools/ui-refiner && npm ci && npx playwright install chromium)
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale ja-JP
```

初期ポリシーのロケールは`en-US`、`ko-KR`、`ja-JP`です。ポリシーは唯一の正本`vendor/lintapple/ui-policy.json`から派生します。韓国語・日本語版には初期フォント一覧とコピー表現のルールを追加し、日本語版にはHiragino、Noto Sans JP、Meiryo、Yu Gothicなどを含みます。生成したポリシーは、プロジェクトで承認されたデザインシステムに合わせて確認してください。

`init`は既存の設定・ポリシーファイルを保持します。別のロケールで再実行しても既存ポリシーは置き換えません。

## 2. プロジェクト設定

`init`は`ui-refiner.config.json`と`ui-policy.json`を生成します。プロジェクトのパスはすべて、**設定ファイルがあるディレクトリ**を基準に解決します。

| フィールド | 用途 / 既定値 |
|---|---|
| `preset` | `web`のみ対応 |
| `locale` | ブラウザーのロケールと初期ポリシー選択。既定は`en-US` |
| `static.auditPath` | 既定は`"bundled"`。保守対象の`vendor/suta`を直接実行 |
| `static.targets` | 静的監査対象のソースパス。既定は`["src"]` |
| `static.enforcement` / `browser.enforcement` | `enforce`または`advisory`。両方とも既定は`enforce` |
| `browser.url` | 起動中のアプリURL。既定は`http://127.0.0.1:5173` |
| `browser.routes` | 単一URLを置き換える名前付きルート1–50個。パスは`browser.url`基準 |
| `browser.policyPath` | プロジェクトポリシー。既定は`ui-policy.json` |
| `browser.ready` | 指定した準備完了セレクターが表示されるまで待機。既定は`null` |
| `browser.interactionsPath` | 任意の操作計画JSON。既定は`null` |
| `browser.captureScreenshots` | 同一セッションの状態画像・要素クロップ。既定は`false` |
| `browser.captureAriaSnapshots` | 同一状態のアクセシビリティツリーYAML・advisory構造比較。既定は`false` |
| `browser.renderedMetrics` | 任意のレンダリング指標。advisoryのみ、既定は`false` |
| `browser.timeoutMs` | ナビゲーション・監査の各ステップ上限。既定は`120000` ms |
| `browser.sessionTimeoutMs` | 独立したセッション全体の上限。既定の`null`では自動算出 |
| `gate.maxStaticWarnings` | 任意の静的警告上限。`null`では警告をblockerにしない |
| `gate.allowedHosts` | 明示的なナビゲーション先ホスト許可リスト。既定はループバック |
| `gate.baselinePath` | レビュー済みのschemaVersion 2ベースライン。既定は`null` |
| `gate.valueExceptionsPath` | レビュー済みの正確なデザイン値例外JSON。既定は`null` |
| `gate.manualVisualReview` | 既定は`true`。全体の自動検査成功後も人による確認が必要 |
| `sot.path` | 任意のプロジェクト正本パス。存在を確認するが内容は自動解析しない |
| `reportDir` | 既定は`artifacts/ui-refiner` |

フォント・サイズ・例外は、承認された正本に合わせてください。エージェントがデザイン文書を読み、CLIは文書からポリシーを推論しません。信頼できるアプリURLを使用してください。許可リスト外のホストと、URL内の認証情報は拒否します。

## 3. 全体検査と変更行の検査

アプリを別途起動してから検査します。

```sh
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

`doctor`はベンダーのSHA-256、必要なパス、Node環境を確認し、Chromiumを実際に起動して空のページを開いた後に終了します。`doctor`と`check`はChromiumをダウンロードしません。

静的検査を変更範囲に絞る場合は次を使用します。

```sh
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json --changed-only
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json --changed-only --base origin/main
```

`--base`がなければ、HEADに対するstaged・unstaged変更とuntrackedソースを含みます。基準refを指定すると、そのrefに対するコミット済みの変更も含みます。モノレポ内のアプリでもパスを設定ルート基準に統一します。設定した静的対象の変更後の行だけを監査し、削除行だけから新しい違反を作ることはありません。

**ブラウザー検査は、引き続き設定したページ全体と操作計画を検査します。** 互換性のある`last-full-report.json`があれば、URL・ロケール・ポリシー内容・操作計画の内容に基づき、以前観測した安定したIDを持つブラウザー違反と新しい違反を区別します。既存違反は`existingBrowserDebt`として表示し続けますが、部分範囲の結果はブロックしません。互換性のある全体結果がなければ、ブラウザー違反は引き続き強制判定の対象です。この処理はベースラインを作成・承認しません。全体検査では既存違反も引き続き強制判定します。

### ステータスと終了コード

| ステータス | 終了 | 意味 |
|---|---:|---|
| `PASS` | 0 | 全体検査に新しい強制違反がない。手動レビューは無効 |
| `REVIEW_REQUIRED` | 0 | 全体の自動検査成功。人による視覚・UXレビューが必要 |
| `FAIL` | 1 | 新しい強制違反を検出 |
| `ERROR` / `INCOMPLETE` | 2 | ツール・環境の障害、または必須検査範囲の欠落 |
| `SCOPED_PASS` | 3 | 変更範囲は成功。**全体QAの承認ではない** |

必須エンジンを片方でも無効にすると、全体PASSにはなりません。部分検査の成功結果からベースラインを作成できません。受け入れ前には全体検査を実行してください。

## 4. ブラウザー検査の範囲と証拠画像

ブラウザーは、全体の時間・出力上限を持つ別プロセスで実行します。`browser.timeoutMs`は各ナビゲーション・監査ステップの上限です。`browser.sessionTimeoutMs`を設定すると全体上限を明示できます。未設定の場合は、ビューポート・テーマの組み合わせ、操作計画、撮影の余裕から**最大600000 ms**の範囲で算出します。有効な複数ステップの合計が1ステップの上限を超えただけで早期終了することはありません。

初期状態・操作後の監査と画像は、同じブラウザーセッション・ロケール・reduced-motion設定を共有します。撮影は任意で、**状態ごとに最大5個の一意な違反要素クロップ**を生成します。クロップできない場合は理由を記録します。中断した実行後は、現在のレポートのartifact一覧を基準にしてください。

整列、レイアウト/コントロール間隔、入れ子の角丸、コントロールinsetの対象数を表示します。対象ゼロは`not-tested`、カウンター情報の欠落は`unknown`です。検査が必要な場所に適切な`data-ui-*`契約マーカーを追加してください。PASSは、マーカーのない契約まで検査したという意味ではありません。

クリック可能な汎用要素のキーボードフォーカス・意味的役割の欠落を、インライン`onclick`、DOMの`onclick`プロパティ（React方式を含む）、`data-ui-clickable`、Chromium CDPの直接clickリスナーから確認します。CDPは**状態ごとに最大500個の表示されている非ネイティブ要素候補**を検査し、文書順より`cursor:pointer`を優先します。既知のフレームワークのイベント委譲ルートは除外します。検査の制限とCDPの利用可否をレポートに公開します。委譲先の子要素や上限を超えた候補には、明示的なマーカー・操作計画が必要です。実際のEnter/Space動作は操作計画で検証してください。[examples/interactions.json](examples/interactions.json)を参照してください。

### 名前付きルート・ARIA証拠・レンダリング指標

既存の`browser`オブジェクトの他の設定を保持し、次のフィールドを追加します。

```json
{
  "routes": [
    { "name": "home", "url": "/" },
    { "name": "settings", "url": "/settings", "ready": "[data-app-ready]", "interactionsPath": null }
  ],
  "captureAriaSnapshots": true,
  "renderedMetrics": true
}
```

ルートは一意で安全な名前と、絶対HTTP(S) URLまたはルート相対パスを使用します。`ready` / `interactionsPath`の省略は共通設定を継承し、明示的な`null`はそのルートで無効にします。ルート・ビューポート・テーマごとに新しいコンテキストを作り、1つのブラウザープロセスで検査します。全体の時間予算はルート数を含みます。要求したルートが1つでも失敗すれば部分PASSではなくERRORです。一覧のルートのみを検査し、アプリ全体を自動検査するものではありません。Storybook URLも明示できます。認証状態・Cookieはルート間で共有しません。

ナビゲーションのホストはリクエスト前に検証します。リダイレクトは追跡せず拒否するため、最終URLを直接設定してください。この監査セッションではService Workerを無効にします。外部サブリソースはナビゲーション許可リストの対象外であり、汎用ネットワークサンドボックスではありません。

複数ルートの指紋には名前と正規化した設定URLを含め、従来の単一URLのidentityは維持します。明示的なルートへ移行したら新しい全体ベースラインをレビューしてください。画像名にはルートを含めます。任意のARIA YAMLには内容ハッシュも含め、以前の証拠を保持します。互換性のある連続実行の`ariaDiff`は、変更・追加・削除・不変の次元と`previousFile` / `file`を示します。ハッシュによる構造変更の要約であり、自動的な欠陥判定や行単位diffではありません。YAMLの組を比較してください。保存は任意で状態ごとに2 MBまでです。要求した保存の失敗はERRORです。画像・アクセシブルネームに機密内容が含まれる可能性があるため、共有前に確認してください。

レンダリング指標は現在のビューポートに表示された上端fixed/sticky領域（入れ子は1回）、塗りつぶされたボタン、繰り返しのボタン/リンク名・リンク先、計算済みの文字/背景/枠線色の概算15度有彩色hueバケットを記録します。DOM要素は最大10000個までで、制限を公開します。反復動作や複数の塗りつぶしボタンは意図的なUIの場合があります。観測は**advisoryのみ**で、ゲートをブロックしたりベースラインへ入ったりせず、アクセシビリティ検査を弱めません。hue数はレビュー証拠であり強制色数上限ではありません。グラデーション・画像・完全な知覚色分析は対象外です。

## 5. レポートと修正ハンドオフ

出力は`reportDir`に生成します。

| ファイル | 内容 |
|---|---|
| `report.json` | 全違反・対象、実測/期待値、元のブラウザー詳細、blockingフラグ、グループ・範囲・カバレッジ |
| `report.md` | 読みやすい原因別の違反、ゲート状態と検査範囲 |
| `AGENT_HANDOFF.md` | 優先順位付きの修正タスク、短い対象ヒント、前回からの変化 |
| `previous-report.json` | 互換性のある範囲を比較するための前回結果 |
| `last-full-report.json` | 部分検査で既存ブラウザー違反を区別するための完了済み全体結果 |
| `lintapple.raw.json` | 元のレンダリング検査結果 |
| `render-*.png` | 任意の同一セッション状態画像・要素クロップ |
| `render-*.aria.yml` | 任意の同一状態ARIA構造。内容ハッシュで以前の証拠を保持 |
| `VISUAL_REVIEW.md` | 人または外部ビジョンモデル向けのadvisoryレビューパケット |

ハンドオフは**実際のblocker → advisoryエラー → 警告**の順です。同じ原因を対象・ビューポート・状態にまたがってまとめるため、継承されたフォントの問題を子要素ごとに直すのではなく、指定元から修正できます。意味ベースの対象は、identity JSONではなく`h1 "Unlock…"`のようなヒントで表示します。

修正一覧は約**6 KiB**に制限します。blockerグループを省略した場合は、その数とルール名を明記します。全セレクター、正確なidentity、残りのグループはすべて`report.json`に保持するので、修正完了前に確認してください。

互換性のある連続実行では、解決・追加・継続したidentityを記録します。エージェントのガイドは1つの修正タスクを最大2回の修正/再検査に制限しますが、CLI自体が自律修正ループを実行するわけではありません。ビジョンモデルの意見はadvisoryで、ゲート状態を変更しません。視覚的な受け入れは人が判断します。

## 6. ベースラインschemaVersion 2

設定ファイルは`schemaVersion: 1`、回帰ベースラインは**`schemaVersion: 2`**です。

新しい**全体**レポートから作成します。

```sh
node tools/ui-refiner/bin/ui-refiner.mjs baseline create --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.v2.json
```

抑制一覧をレビューしてから`gate.baselinePath`を設定してください。v1ベースラインは拒否し、バージョン番号だけを変更して安全に移行することはできません。作成コマンドは既存の出力ファイルを上書きしません。

- 静的identityは相対ソースファイルと一意なソース行内容を使用し、行番号・診断メッセージを除外します。空または重複したアンカーはベースライン化できません。
- ブラウザーidentityは一意なアプリマーカー、またはスコープ内で一意な意味識別子、ビューポート寸法・テーマ・状態・疑似要素・関連対象を使用します。測定値と`nth-of-type`位置は除外します。
- React useId、Radix、Headless UIの既知の自動IDは、一意でもアンカーから除外します。`:r0:`、`«r0»` / `«R1»`、`_r_0_`などが該当します。明示的な`data-ui-id`、`data-testid`、`data-qa`を優先してください。
- あいまいなidentityは表示し続け、抑制できません。`excludedFindings`に除外数を記録します。ソース内容や意味が変わると、新しいidentityになる場合があります。

検査が違反を自動的にベースラインへ追加したり、ポリシーを弱めたりすることはありません。

### レビュー済みの正確な値例外

`gate.valueExceptionsPath`にプロジェクト相対のJSONパスを指定します。[examples/value-exceptions.json](examples/value-exceptions.json)を参考に、明示的にレビューしてください。例自体は承認ではありません。各項目は`engine: "lintapple"`、`rule`、正確なプリミティブ値`actual`、空でない`reason`が必要です。任意の`route`・レポートの正確な`selector`で範囲を絞れます。対象は`font-family`・`font-size`・`copy`・`root-background`です。類似フォントや同等CSSセレクターではなく、`report.json`の値とセレクターを使用します。

一致した違反は証拠と`reviewedException`理由を保持し、ブロックしません。ベースラインへ自動追加しないため、値限定の承認が値と無関係な抑制へ拡大しません。他の値・範囲は引き続き失敗します。アクセシビリティ・操作規則はこの方式で免除できません。既存ポリシーの`exceptions`はセレクター全体の規則除外であり、より広い別の仕組みです。

## 7. エージェントスキルとチーム用フック

アプリルートから任意でインストールします。

```sh
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
```

ツールがプロジェクト内にあれば、既存のClaude設定を保持しながら、`CLAUDE_PROJECT_DIR`を使うプロジェクト相対PostToolUseフックを追加します。wrapperも保守対象のフックを相対importするため、チェックアウトを移動しても個人の絶対パスは埋め込まれません。個人の外部チェックアウトは`.claude/settings.local.json`とローカルの`UI_REFINER_HOME`を使用し、共有設定は変更しません。

他のホストでは、生成された`.agents/skills/ui-refiner-agent/hook-registration.json`を、サポートされているフックUIから登録してください。未対応のCodex設定を独自に作ることはありません。フックは編集した静的行だけを検査し、全体ゲートではありません。インストーラーは既存スキルを上書きしないため、更新前に配置済みのコピーを確認してください。

ランタイムの既定は`static.auditPath: "bundled"`です。任意のsutaガイド用コピーは次で配置できます。

```sh
bash tools/ui-refiner/scripts/install-suta.sh "$PWD"
```

Doctorはコピーの不一致を通知します。明示された旧監査パスは保持するため、古い`.agents/skills/suta/scripts/audit.mjs`設定は確認後に`"bundled"`へ変更してください。

## 8. アップストリーム保守と出典

```sh
node tools/ui-refiner/bin/ui-refiner.mjs upstream check
node tools/ui-refiner/scripts/sync-vendor.mjs --suta <40-character-SHA>
node tools/ui-refiner/scripts/sync-vendor.mjs --lintapple <40-character-SHA>
```

`upstream check`はファイルを変更せず、固定コミットとアップストリームHEADを比較します。`sync-vendor`は未記録のローカルベンダー変更を拒否し、指定したソースを一時領域へ取得してレビュー済みパッチを再適用し、原本/現在のハッシュを記録して、単体テストとUI・CLIのブラウザースモークを実行します。パッチ競合や検証失敗では以前のベンダーソースとmanifestを復元します。Chromiumのインストール、コミット、push、アップグレード承認は行いません。

今後のエンジン修正は再適用可能なパッチに保持し、レビュー対象のmanifestを更新してください。ライセンス・固定コミット: [vendor/UPSTREAM.json](vendor/UPSTREAM.json)、[licenses/THIRD_PARTY.md](licenses/THIRD_PARTY.md)、[suta MITライセンス](vendor/suta/LICENSE)、[lintapple MITライセンス](vendor/lintapple/LICENSE)。原本プロジェクト: [suta](https://github.com/Guksu/suta)、[lintapple](https://github.com/gholtzap/lintapple)。

## 9. 開発と検証

UI Refinerリポジトリのルートから実行します。

```sh
npm ci
npm test
npx playwright install chromium
npm run smoke:ui
npm run smoke:gate
npm run smoke:review2
npm run smoke:routes
```

CIは単体・契約テスト、実際のChromiumによるUI・CLI検査、セッションタイムアウト検査、固定ベンダー同期の検証を実行します。正常/違反ページ、モノレポの変更、移動したチェックアウトのフック、自動ID、1600行の一覧後にあるpointer候補の優先検出、同じ状態の画像、要素クロップを検証します。

実際の検査出力とハッシュ・出典は`test/fixtures`に保持し、ライブスモーク出力をレビュー済みの修正情報契約と比較します。CIは`upstream-contracts`の証拠もアップロードします。契約が変わった場合はfixtureを自動再生成せず、レビューしてください。[CIワークフロー](.github/workflows/ci.yml)と[実装レポート](IMPLEMENTATION_REPORT_KO.md)を参照してください。
