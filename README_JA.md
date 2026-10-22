# UI Refiner v0.3.0

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md)

UI Refinerは、一般的なDOMベースのWebアプリ向けに、**sutaのソース監査・デザインガイド**と**lintappleの実際のレンダリングに基づくレイアウト・アクセシビリティ・操作検証**を組み合わせます。開発者とコーディングエージェントに、修正に必要な証拠と決定的な品質ゲートを提供します。

固定されたsutaの完全なスキルカタログと57のパターン、保守対象のlintappleランタイムソースを含みます。UIの自動生成、コードの自動修正、ビジョンモデルの呼び出し、リリース承認は行いません。Godot UI、Phaser Canvas、ゲームHUDは対象外です。

## 1. 必要環境とインストール

**Node.js 22.18以上**、npm、Git、および明示的にインストールしたPlaywright Chromiumが必要です。ランタイムのnpm依存関係は`axe-core@4.14.0`・`playwright@1.63.0`・`pixelmatch@7.2.0`・`pngjs@7.0.0`に固定されています。

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
| `browser.ariaSnapshotMasks` | 明示的な動的文言の正規表現マスク。既定は`[]` |
| `browser.renderedMetrics` | 任意のレンダリング指標。advisoryのみ、既定は`false` |
| `browser.timeoutMs` | ナビゲーション・監査の各ステップ上限。既定は`120000` ms |
| `browser.sessionTimeoutMs` | 独立したセッション全体の上限。既定の`null`では自動算出 |
| `browser.routeTimeoutMs` | ルートworker上限。既定の`null`では残りの全体時間を公平に分配 |
| `gate.maxStaticWarnings` | 任意の静的警告上限。`null`では警告をblockerにしない |
| `gate.allowedHosts` | 明示的なナビゲーション先ホスト許可リスト。既定はループバック |
| `gate.baselinePath` | レビュー済みのschemaVersion 2ベースライン。既定は`null` |
| `gate.valueExceptionsPath` | レビュー済みの正確なデザイン値例外JSON。既定は`null` |
| `gate.manualVisualReview` | 既定は`true`。全体の自動検査成功後も人による確認が必要 |
| `sot.path` | 任意のプロジェクト正本パス。存在を確認するが内容は自動解析しない |
| `visual` | 任意の同一セッション画像回帰検査。enabled=false、mode=advisory、独立した承認画像ストア |
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

### レポート比較の互換性

レポートはfindingの変化・既存ブラウザー負債・ARIA証拠ごとに、バージョン付きの`comparisonContexts`を記録します。従来の`comparisonContext`はfindingコンテキストの別名として残します。finding IDとbaseline schemaVersion 2は変更しません。

単一ページと名前付きルートの両方で、実際に適用されるURL・ready・操作内容、ロケール・ポリシー・固定エンジン情報を比較します。`browser.ready`の変更は比較と既存負債の抑制を無効にします。ルートが上書きした未使用の共通ready/planは比較に影響しません。比較互換性には絶対URLを残し、ホスト・ポートに依存しないbaseline IDとは区別します。

| 変更 | Finding比較 | 既存ブラウザー負債 | ARIA比較 |
|---|---|---|---|
| 有効なURL/ready/plan、ロケール、ポリシー、ブラウザーエンジン | リセット | リセット | リセット |
| `renderedMetrics` | リセット | 維持 | 維持 |
| ARIAマスクまたは`captureAriaSnapshots` | 維持 | 維持 | リセット |
| `captureScreenshots`、時間予算、手動レビュー設定 | 維持 | 維持 | 維持 |
| 静的対象/auditパス/エンジン | リセット | 維持 | 維持 |

範囲変更や必須検査の未完了を、解決したfindingや削除されたARIAとして比較しません。既存負債には完了した互換全体レポートだけを使います。新しい情報のない旧レポートは理由を示して比較を拒否するため、全体検査を一度実行して参照を更新してください。レビュー済みの既存v2ベースラインは引き続き使えます。JSONの`diff.reason`・`ariaDiff.reason`・`browserReference.reason`に比較できない理由を記録し、ハンドオフとARIA要約にも表示します。

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

PNGは実行ごとの`images-<runId>/`に、内容のSHA-256を含む名前で保存し、次の監査で以前の画像を上書きしません。`imageArtifacts`と`image-artifacts.json`にartifact ID・ハッシュ・バイト数・ルート/状態/ビューポート/テーマ/ロケールを記録します。各ブラウザーfindingの`imageEvidence`は状態画像と一致する要素クロップを参照します。`artifacts`と`captures[].image`は引き続き`reportDir`相対パスですが、新しいサブディレクトリへの対応が必要です。共有時は参照ディレクトリもコピーしてください。

現在・直前・最後の全体レポートとfinding diff内の画像参照が、その実行の画像一式を保護します。レポートと画像一覧をファイルごとに一時ファイルから原子的に置き換えた後、所有マーカーのある未参照ディレクトリだけを整理します。手動ファイル・未知の内容・シンボリックリンクがあれば削除せず、旧形式の平面PNGも残します。中断した未公開の実行には、最大ブラウザー予算と1分を合わせた11分の猶予を設けます。無期限アーカイブではなく参照に基づく保持です。同時監査や長期保存には別の`reportDir`を使用し、参照した実行ディレクトリ全体を保持してください。要求した状態画像の失敗はERROR、クロップ不可は理由を記録します。撮影失敗で最後の完了済み全体レポートを置き換えません。

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

ルートは一意で安全な名前と、絶対HTTP(S) URLまたはルート相対パスを使用します。`ready` / `interactionsPath`の省略は共通設定を継承し、明示的な`null`はそのルートで無効にします。ルートごとに時間制限付きの独立worker/ブラウザーを実行し、ビューポート・テーマごとのコンテキストを分離します。全体の時間予算はルート数を含みます。ルートが1つでも失敗すれば全体はERRORですが、完了した実行・状態のfindingと他のルート結果は`routeResults`・元のrunsに保持します。workerの時間切れではそのworkerのバッファ内の部分状態を失う場合がありますが、先に完了したworkerの結果は維持します。一覧のルートのみを検査し、アプリ全体を自動検査するものではありません。Storybook URLも明示できます。認証状態・Cookieはルート間で共有しません。

ナビゲーションのホストはリクエスト前に検証します。リダイレクトは追跡せず拒否するため、最終URLを直接設定してください。この監査セッションではService Workerを無効にします。外部サブリソースはナビゲーション許可リストの対象外であり、汎用ネットワークサンドボックスではありません。

複数ルートの指紋には名前と`pathname + search`のみを含め、origin・ホスト・ポート・fragmentを除外し、従来の単一URLのidentityは維持します。明示的なルートへ移行したら新しい全体ベースラインをレビューしてください。絶対URL指紋を使った既存の複数ルートベースラインも一度再作成します。ハッシュだけの項目は安全に移行できません。ベースラインschemaVersionは2のままです。画像名にはルートを含めます。任意のARIA YAMLには内容ハッシュも含め、以前の証拠を保持します。互換性のある連続実行の`ariaDiff`は、変更・追加・削除・不変の次元と`previousFile` / `file`を示します。ハッシュ要約に行番号付きの YAML テキスト説明を追加し、report.json/report.md とエージェント引き継ぎに表示します。ARIA の変化は advisory とし、完全な証拠はリンクした YAML の組で確認します。保存は任意で状態ごとに2 MBまでです。要求した保存の失敗はERRORです。画像・アクセシブルネームに機密内容が含まれる可能性があるため、共有前に確認してください。

レンダリング指標は現在のビューポートに表示された上端fixed/sticky領域（入れ子は1回）、塗りつぶされたボタン、繰り返しのボタン/リンク名・リンク先、計算済みの文字/背景/枠線色の概算15度有彩色hueバケットを記録します。DOM要素は最大10000個までで、制限を公開します。反復動作や複数の塗りつぶしボタンは意図的なUIの場合があります。観測は**advisoryのみ**で、ゲートをブロックしたりベースラインへ入ったりせず、アクセシビリティ検査を弱めません。hue数はレビュー証拠であり強制色数上限ではありません。グラデーション・画像・完全な知覚色分析は対象外です。

指標の動作名はDOMラベル/テキストの近似であり、完全なアクセシブルネーム計算ではありません。意味の証拠はARIA YAMLを確認してください。可視性はブラウザーの`checkVisibility`とビューポート境界で判断し、遮蔽はモデル化しません。対象サンプルは項目ごとに10個、反復動作グループは20個までで、全体数と上限を記録します。

`browser.routeTimeoutMs`でworkerごとの上限を指定できます。既定は残りの全体時間を未実行ルートに公平に分配した値です。全体600000 msの上限は維持するため、200回の実行ではオーバーヘッド前でも1回約3000 msです。レポートに実際の割当と平均予算を示します。大きい・遅い一覧は分割し、部分完了をPASSと扱わないでください。ブラウザー出力はバッチ全体で20 MBまでです。

塗りつぶしボタンは最も近い不透明な祖先背景との計算上のコントラストが1.5:1以上の場合に数えます。半透明の祖先層は合成します。同色ghostボタンや低コントラストの標準コントロールを除くデザイン近似です。グラデーション・画像・不明なキャンバス背景は塗りつぶしと断定せずunknownとして記録します。上端固定数からdialog・明示的backdropの範囲と、ビューポートの半分以上を覆う要素を除外します。

既知の動的文言だけを`browser.ariaSnapshotMasks`でマスクできます。既定は`[]`で最大20個の正規表現です。フラグは`g/i/m/u`のみ、既定は`g`です。例えば`browser`に次を追加します。

```json
{
  "ariaSnapshotMasks": [
    {
      "pattern": "\\d{2}:\\d{2}:\\d{2}",
      "flags": "g"
    }
  ]
}
```

マスク済みYAMLを保存してハッシュを計算します。未設定のラベル・役割変更は引き続き表示します。意味ある数量や構造まで消す広いパターンは避けてください。マスク変更は新しい比較コンテキストを開始します。レポート保存後にツール所有の未参照ARIAファイルのみを整理し、現在・直前のレポート、比較の組、最後の全体検査参照の証拠を保持します。手動ファイルは変更しません。

### 読みやすい ARIA 変更説明

`browser.captureAriaSnapshots` が有効な互換実行では、変更/追加/削除した snapshot 次元を YAML テキスト編集として説明します。`ariaDiff.changed[].textDiff`（added/removed も同様）は unified hunk・前後の行位置・oldFile/newFile・algorithm・上限・省略理由を記録します。変更項目には previousSha256/previousBytes も保持し、`ariaDiff.textSummary` は compared/unavailable/notGenerated/truncated 数を示します。互換性ハッシュと finding/baseline ID は維持し、マスク変更時は従来どおり ARIA 比較をリセットします。説明はレポート書き込み時に生成します。

通常ファイルであること、2 MB snapshot 上限、保存ハッシュと確認できるバイト数を検証します。過去の証拠が欠落または不整合なら unavailable の理由を示し、変化なしとは解釈しません。要求したブラウザー保存の失敗は従来どおり ERROR です。YAML 文法を解析したり意味/WCAG 違反を判定したりせず、テキストを比較します。名前・役割・選択状態の行位置を確認でき、実際のコントラスト・キーボード規則と人の視覚レビュー要件は独立して維持します。

説明ごとの生成テキストは120行/12000バイト、1行は2000バイトまでです。バッチは最大16件を試み、出力600行/64000テキストバイトに制限します（JSON メタデータを除く）。行照合の計算量が大きい場合は bounded-replacement 編集へ切り替え、結果が長くなることがあります。省略した行/hunk と理由を明記し、完全な YAML へのリンクを維持します。report.md は最大8件/24000抜粋バイト、AGENT_HANDOFF.md は2件/6000まで表示します。TRUNCATED の抜粋を適用可能なパッチとして使用しないでください。不変 snapshot のテキストは再読込しません。

`npm run smoke:aria` は実際の Chromium で名前/役割/選択状態/追加/削除、時刻マスクの安定性、旧ファイル保持・欠落理由、コントラスト/キーボード欠陥の対照を検証します。CI は `artifacts/upstream-contracts/aria-text.report.json` と隣の `aria-text-evidence/` に YAML・Markdown 比較の証拠を保存します。


### 計画した検査範囲と正常／欠陥ベンチマーク

`report.json` のブラウザー stage にある `inspectionScope` は、設定 route × viewport × colorScheme × initial／名前付き state を列挙します。要求・開始確認・完了・失敗・未実行・不明(unknown)を集計し、completionRate の分母は設定した計画のみです。未発見のアプリページは含めません。操作途中のスナップショットは intermediateStates に分離します。完了は違反の有無に関係なく検査と要求された証拠処理が終了したことを示します。強制終了した worker が返していない進捗は unknown です。計画ファイルの読み込み失敗では planComplete=false となり、欠落した名前付き状態の分母は未確定です。部分失敗でも完了した finding を保持し、ERROR／終了コード2と baseline 作成禁止を維持します。

規則の対象範囲は計画完了率とは別です。対象0は not-tested、null・欠落・無効なカウンターは unknown で、tested に数えません。制限の明細では axe の色コントラスト、選択した axe アクセシビリティ規則、独自規則を区別します。完全な WCAG 検査ではありません。iframe 内部と shadow root は文書範囲の検査から除外し、明示的な操作は主文書の対象のみ対応します。イベント委譲と候補上限のある直接リスナー探索には明示的なマーカー・計画が必要です。

固定 Chromium のインストール後に `npm run benchmark:scope` を実行します。フォント方針・アクセシブル名・ラベル・コントラスト・横 overflow・テキスト clipping の正常／欠陥ペアを expected label と照合します。iframe・open Shadow DOM・イベント委譲の境界 probe は別に検証します。CI は label・実際の finding・一致判定・scope・TP/FP/FN を `artifacts/upstream-contracts/scope-benchmark.json` に保存します。同じラベルの重複検出は一度だけ数え、境界 probe は精度の分母から除外し、分母0は null にします。この小さな標本の数値は製品全体の精度や性能を表しません。既存の操作・route失敗・timeout・互換性・証拠の smoke も引き続き実行します。


### 状態シナリオと明示的な Storybook ルート

`npm run demo:states` でポート5173の `/ko`、`/ja` を起動します（`UI_REFINER_DEMO_PORT` で変更可能）。ページには実際の KO/JA 翻訳データがあります。`examples/state-scenarios/routes.json` の必要な項目を `browser.routes` にコピーし、`browser.url` を fixture サーバーの origin に設定します。interactions のパスはプロジェクトルート基準なので、別のアプリでは例をコピーするかパスを変更します。実行ごとに locale も合わせて設定します。ブラウザー locale だけではアプリは翻訳されず、ルートごとの locale 指定にもなりません。既存の interactions/config 形式を使用します。

KO/JA の JSON 例はフォーム検証エラー・モーダルの開閉・空リスト・loading → ready・長文の折り返しを検査します。Enter/Space は異なる結果テキスト、モーダルはフォーカス包含・Escape・opener への復帰で確認します。名前付き状態はすべて visible/hidden または正確なテキストの ready 契約を持ちます。制御された loading fixture は “Release fixture data” 操作までデータを保留し、任意の sleep を使わずページ内容から ready を確認します。実際のアプリでは fixture の制御ボタンではなく、アプリの準備要素・データを待ちます。

`npm run smoke:states` は両翻訳 × 2 viewport × light/dark、キーボード/clipping の欠陥対照、7つの名前付き状態それぞれの到達失敗を検証します。到達失敗は ERROR/2 となり、前の完了検査を保持し、後の状態を未実行にして baseline 作成を拒否します。機械可読結果は `artifacts/upstream-contracts/state-scenarios.json`、参照する ARIA YAML は通常の保持整理前に隣接する `state-scenarios-evidence/` へコピーします。この有限の例はアプリ全体のカバレッジや性能目標を示しません。

既知の Storybook story は `/iframe.html?id=states--ko&viewMode=story` のような文書 URL を ready selector・interaction plan とともに routes に直接指定します。デモの同じ URL は route/query 処理を確認するローカル fixture であり、本物の Storybook 環境ではありません。アプリの実際の story ID/URL を使用してください。自動探索・index adapter・ログイン自動化・ルート間の cookie 共有は追加しません。実際の対象が必要とする場合にバージョンを確認して任意の index adapter を検討し、Storybook を依存関係に追加しません。


### 任意の画像ビジュアル回帰検査

画像比較は既定で無効、有効にした場合の既定モードは advisory です。既存の onState ブラウザーセッションで初期・操作状態を撮影し、比較用ブラウザーを別に起動しません。次の最上位設定を追加し、profile をレビューしたフォント/実行イメージの識別子に置き換えます。

```json
{
  "visual": {
    "enabled": true,
    "mode": "advisory",
    "baselineDir": "ui-visual-baseline",
    "environmentProfile": "reviewed-fonts-and-execution-image-v1",
    "capture": "viewport",
    "threshold": 0.1,
    "maxDiffPixels": 0,
    "maxDiffRatio": 0,
    "masks": [],
    "stabilityAttempts": 3
  }
}
```

既存 browser.captureScreenshots の生の証拠画像・クロップは独立して維持します。visual 撮影は document.fonts.ready と表示画像の decode を待ち、animation 無効・caret 非表示・CSS pixel scale を使用します。stabilityAttempts（2–5）内で連続する2枚の PNG バイトが一致する必要があり、安定化・リソース・撮影失敗は ERROR です。capture は viewport または fullPage、PNG ごとに1600万pixel/32 MBまでです。既存 session/route の時間・出力上限を維持し、worker timeout を一致と扱いません。

profile は制御したフォント・テストデータ・実行環境を利用者が明示する値で、フォントファイル/コンテナーの自動検証ではありません。manifest には OS/release/architecture、ブラウザー/Playwright/比較器/decoder version、DPR、locale、UTC/reduced-motion、ready/interactions、撮影/比較 options も記録します。profile のない候補は承認できません。記録条件が違えば not-comparable とし、route/state/viewport/theme/locale/capture ごとの承認画像を必要とします。基準キーから server origin/port は除外します。自動探索・認証・アプリデータ準備は含みません。

check で集めた候補をレビューして明示的に承認します。

```sh
node tools/ui-refiner/bin/ui-refiner.mjs visual candidate --from artifacts/ui-refiner/report.json --out visual-candidate
# Review candidate PNGs, manifest dimensions, masks, environment and policy first.
node tools/ui-refiner/bin/ui-refiner.mjs visual approve --from visual-candidate/manifest.json --out ui-visual-baseline
```

候補画像はレポート保持整理から独立した所有ディレクトリーへコピーします。approve は baselineDir に画像 manifest を原子的に公開します。後の明示的承認は画像集合全体を置換し、旧 manifest 所有画像の未参照ファイルのみ削除します。手動ファイルは保持します。check は承認ストアを読み取るだけです。既存 baseline create は finding ID 抑制用で画像を承認しません。候補には全体の static/browser 完了と要求撮影が必要です。enforce の needs-baseline 結果からも候補を作れますが、changed-only や撮影失敗は拒否します。

| visual 結果 | advisory | 明示的 enforce |
|---|---|---|
| 無効 | not-requested | — |
| 承認画像と一致 | matched | matched |
| 画像/寸法の差 | レビュー必要 | FAIL / 1 |
| 承認画像なし | needs-baseline・レビュー必要 | INCOMPLETE / 2 |
| 環境/options 不一致 | not-comparable・レビュー必要 | INCOMPLETE / 2 |
| 要求撮影/ファイル/比較失敗 | ERROR / 2 | ERROR / 2 |

制御環境での反復安定性と承認画像を確認してから mode を enforce に変更します。既存 DOM/ソースの強制違反は独立して失敗します。advisory の差や未承認を matched と表示せず、手動レビュー設定が無効でも REVIEW_REQUIRED を表示します。一致によって既存の人の確認要件は解除しません。

masks は最大20個の selector 文字列です。各 selector は1–100要素と表示対象を持つ必要があり、対象欠落は失敗です。不透明 magenta でマスクし、selector/index/viewport CSS box を maskRegions に記録します。背景やパネルの自動除外はありません。データを固定するか狭い範囲を明示的に隠し、範囲外の差は検出し続けます。pixelmatch threshold（0–1）は pixel ごとの色許容値です。許容差pixel数は max(maxDiffPixels, floor(totalPixels × maxDiffRatio))、既定は色許容/anti-alias処理後0pixelです。寸法変更は resize せず different と実際/基準寸法・理由を記録します。

report.visual に状態ごとの actual/expected/diff の不変参照・pixel数/比率/許容値・安定化/mask/環境・時間/容量を記録します。expected も基準ストアから実行へコピーするため、後の承認で過去の証拠は変わりません。既存の実行別画像保持整理を使用します。maxObservedWorkerRssBytes はブラウザー子孫を除く worker RSS 標本であり、全プロセスツリーの最大メモリーではありません。基準欠落/失敗には理由を記録し enforce 全体 PASS にしません。visual options は独立した互換性契約を持ち finding/ARIA 比較をリセットしません。

npm run smoke:visual は10回の制御反復（初期/保存状態）、mask 内の正常変化・layout/clipping/mask外の欠陥・寸法変更・基準欠落/環境不一致・不安定/失敗撮影・CLI 明示承認・生証拠の独立性を検証します。CI は artifacts/upstream-contracts/visual.report.json と隣接 visual-evidence/ を保持します。生の標本と source/環境情報を記録し、製品全体の精度・p95・速度改善目標は主張しません。pixelmatch 7.2.0（ISC）・pngjs 7.0.0（MIT）を固定し、licenses/ に原文通知を保持します。


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
| `images-<runId>/render-*.png` | 任意の同一セッション状態画像・要素クロップ。実行別の不変パス |
| `image-artifacts.json` | 現在の実行の画像一覧・SHA-256・バイト数・撮影条件 |
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
npm run smoke:review4
```

CIは単体・契約テスト、実際のChromiumによるUI・CLI検査、セッションタイムアウト検査、固定ベンダー同期の検証を実行します。正常/違反ページ、モノレポの変更、移動したチェックアウトのフック、自動ID、1600行の一覧後にあるpointer候補の優先検出、同じ状態の画像、要素クロップを検証します。

実際の検査出力とハッシュ・出典は`test/fixtures`に保持し、ライブスモーク出力をレビュー済みの修正情報契約と比較します。CIは`upstream-contracts`の証拠もアップロードします。契約が変わった場合はfixtureを自動再生成せず、レビューしてください。[CIワークフロー](.github/workflows/ci.yml)と[実装レポート](IMPLEMENTATION_REPORT_KO.md)を参照してください。

## 10. 標準出力とオフラインレビュー

JSONが判定の原本です。各検査はスクリプト・サーバー不要の `report.html`、`handoff.json`、分量制限付き `AGENT_HANDOFF.md` を生成します。引き継ぎにはルート・状態・画面サイズ・テーマ、実測/期待値、検証済み静的ソース位置、不変PNG/ARIA参照、入力ハッシュ、再現引数を記録します。保存済み設定では実行コマンドを提供し、メモリ設定では先にスナップショットを保存する必要を明示します。再検査前にアプリと同じデータ・認証を用意してください。

```sh
node bin/ui-refiner.mjs check --config ui-refiner.config.json --format json
node bin/ui-refiner.mjs check --config ui-refiner.config.json --format sarif
node bin/ui-refiner.mjs export html --from artifacts/ui-refiner/report.json --out review-bundle
node bin/ui-refiner.mjs export sarif --from artifacts/ui-refiner/report.json --out review.sarif
npm run smoke:export
```

`--format json|sarif|html|markdown` はstdoutのみを選択し、既定は従来の要約です。全形式と成功したエクスポートは元の終了コード0/1/2/3、手動レビューと部分通過の区別を維持します。エクスポート自体の失敗は2です。JUnitは具体的な利用先ができるまで保留します。

`review-bundle/report.html` は `file://` で直接開けます。新規出力先のみ許可し、原本JSONを変更せず、現在・以前のPNG/YAMLをコピーします。`evidence-manifest.json` は欠落・破損・ハッシュのない旧証拠を明示します。レポート外のパスとシンボリックリンクによる逸脱を拒否します。上限は参照2000件、合計256 MB、PNGあたり32 MB、YAMLあたり2 MBです。HTMLはfinding300件、画像状態40件、ARIA比較20件、整形テキスト12000文字までを表示し、省略を明示します。全データはJSONに残ります。ソースツリー・ホスティング・DBは不要です。

SARIF 2.1.0の主要ソース位置は、検査時に実ファイルと行を確認した静的結果だけです。ブラウザーセレクターは属性、PNG/YAMLは関連証拠として記録し、架空のソースパスを作りません。元のプロジェクトとレポートの基準URIを別々に記録するため、他環境では基準パスを調整してください。固定したOASIS公式スキーマでオフライン検証し、ランタイム依存は追加しません。

`smoke:export` は固定欠陥2種類を最大2回の予算で修正し、全体再検査で試行数と新規ブロッカーを記録します。決められたfixture消費者の実験であり、自律エージェント試行数は0なのでエージェント成功率は主張しません。自動修正・ベースライン承認・PRコメントは実行しません。ポリシー・SOTと人による視覚承認を維持してください。

元の証拠パスを維持し、短い `e/` 別名でHTMLを参照することでWindowsブラウザーの長いパス制限を回避します。別名コピーも合計バイト上限に含めます。
