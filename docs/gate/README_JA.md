# UI Refiner 詳細 QA ゲート（`check`）

[English](README.md) | [한국어](README_KO.md) | 日本語 | [メイン README へ](../../README_JA.md)

このマニュアルでは、任意のポリシー強制ゲート（`init`、`check`、ベースライン、ルート、証拠、エクスポート、レビューパケット）を説明します。設定不要のデザイン点検とエージェントの手順は[メイン README](../../README_JA.md) をご覧ください。

## 1. 必要環境とインストール

**Node.js 22.18 以上**、npm、Git、および明示的にインストールした Playwright Chromium が必要です。ランタイムの npm 依存関係は `axe-core@4.14.0`・`playwright@1.63.0`・`pixelmatch@7.2.0`・`pngjs@7.0.0` に固定しています。

このリポジトリを対象アプリの `tools/ui-refiner` に配置してください。このソース配置方式はサポートしていますが、`node_modules` 配下で `suta` のネイティブ TypeScript を実行する方式はサポートしていません。コンパイル済みの npm 配布版はまだありません。

**対象アプリのルート**から実行します。

```sh
(cd tools/ui-refiner && npm ci && npx playwright install chromium)
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale ja-JP
```

初期ポリシーのロケールは `en-US`・`ko-KR`・`ja-JP` に対応しており、唯一の正本 `vendor/lintapple/ui-policy.json` から派生します。韓国語・日本語版には初期フォント一覧と文言ルールを追加し、日本語版にはヒラギノ・Noto Sans JP・メイリオ・游ゴシックなどを含みます。生成したポリシーは、プロジェクトで承認されたデザインシステムに合わせて見直してください。

`init` は既存の設定・ポリシーファイルを保持します。別のロケールで再実行しても既存ポリシーは上書きしません。

## 2. プロジェクト設定

`init` は `ui-refiner.config.json` と `ui-policy.json` を生成します。プロジェクト内のパスはすべて、**設定ファイルがあるディレクトリ**を基準に解決します。

| フィールド | 用途 / 既定値 |
|---|---|
| `preset` | `web` のみ対応 |
| `locale` | ブラウザのロケールと初期ポリシー選択（既定値 `en-US`） |
| `static.auditPath` | 既定値 `"bundled"`（保守対象の `vendor/suta` を直接実行） |
| `static.targets` | 静的監査対象のソースパス（既定値 `["src"]`） |
| `static.enforcement` / `browser.enforcement` | `enforce` または `advisory`（どちらも既定値 `enforce`） |
| `browser.url` | 起動中のアプリ URL（既定値 `http://127.0.0.1:5173`） |
| `browser.routes` | 単一 URL の代わりに使う名前付きルート 1〜50 個（相対パスは `browser.url` 基準） |
| `browser.policyPath` | プロジェクトポリシー（既定値 `ui-policy.json`） |
| `browser.ready` | 指定した準備完了セレクタが表示されるまで待機（既定値 `null`） |
| `browser.interactionsPath` | 任意の操作計画 JSON（既定値 `null`） |
| `browser.captureScreenshots` | 同一セッションの状態画像・要素クロップを保存（既定値 `false`） |
| `browser.captureAriaSnapshots` | 同一状態のアクセシビリティツリー YAML・advisory 構造比較（既定値 `false`） |
| `browser.ariaSnapshotMasks` | 明示的な動的文言の正規表現マスク（既定値 `[]`） |
| `browser.renderedMetrics` | 任意のレンダリング指標（advisory のみ、既定値 `false`） |
| `browser.timeoutMs` | ナビゲーション・監査の各ステップ上限（既定値 `120000` ms） |
| `browser.sessionTimeoutMs` | 独立したセッション全体の上限（既定値 `null` の場合は自動算出） |
| `browser.routeTimeoutMs` | ルートワーカーの上限（既定値 `null` の場合は残りの全体時間を均等配分） |
| `gate.maxStaticWarnings` | 任意の静的警告上限（`null` の場合は警告をブロッカーにしない） |
| `gate.allowedHosts` | 明示的なナビゲーション先ホスト許可リスト（既定はループバック） |
| `gate.baselinePath` | レビュー済みの `schemaVersion` 2 ベースライン（既定値 `null`） |
| `gate.valueExceptionsPath` | レビュー済みの正確なデザイン値例外 JSON（既定値 `null`） |
| `gate.manualVisualReview` | 既定値 `true`（自動検査にすべて合格しても人による視覚レビューが必要） |
| `sot.path` | 任意のプロジェクト正本パス（存在のみ確認し、内容は自動解析しない） |
| `visual` | 任意の同一セッション画像ビジュアル回帰検査（`enabled: false`、`mode: "advisory"`、独立した承認画像ストア） |
| `reportDir` | 既定値 `artifacts/ui-refiner` |

フォント・サイズ・例外は承認済みの正本に合わせてください。エージェントがデザイン文書を読み込む前提であり、CLI は文書からポリシーを推論しません。信頼できるアプリ URL を指定してください。許可リスト外のホストと URL に含まれる認証情報は拒否します。

## 3. 全体検査と変更行の検査

アプリを別途起動してから検査を実行します。

```sh
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

`doctor` はベンダーの SHA-256、必要なパス、Node 実行環境を確認し、Chromium を実際に起動して空のページを開いたあと終了します。`doctor` も `check` も Chromium をダウンロードしません。

静的検査を変更範囲だけに絞る場合は `--changed-only` を使います。

```sh
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json --changed-only
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json --changed-only --base origin/main
```

`--base` を省略すると、`HEAD` に対する staged・unstaged の変更と untracked ソースを含めます。基準 ref を指定した場合は、その ref に対するコミット済みの変更も含めます。モノレポ内のアプリでもパスは設定ルート基準に統一します。設定した静的対象の変更後の行だけを監査し、削除行だけから新しい違反を作ることはありません。

**ブラウザ検査は、引き続き設定したページ全体と操作計画を検査します。** 互換性のある `last-full-report.json` があれば、URL・ロケール・ポリシー内容・操作計画の内容をもとに、以前観測した安定した ID を持つブラウザ違反と新しい違反を区別します。既存違反は `existingBrowserDebt` として表示を続けますが、部分範囲の結果はブロックしません。互換性のある全体結果がなければ、ブラウザ違反は引き続き強制判定の対象になります。この処理はベースラインを作成・承認しません。また、全体検査では既存違反も引き続き強制判定します。

### レポート比較の互換性

レポートには finding の変化・既存ブラウザ負債・ARIA 証拠ごとにバージョン付きの `comparisonContexts` を記録します。従来の `comparisonContext` は finding コンテキストの別名として残ります。これらのハッシュは finding ID やベースライン `schemaVersion` 2 を変更しません。

単一ページと名前付きルートのどちらでも、実際に適用される URL・`ready`・操作内容と、ロケール・ポリシー・固定エンジンメタデータを比較します。そのため `browser.ready` を変更すると比較と既存負債の抑制は無効になります。一方、ルートが上書きした未使用の共通 `ready`／操作計画は比較に影響しません。比較互換性には絶対 URL を残し、ホスト・ポートに依存しないベースライン ID とは区別します。

| 変更 | Finding 比較 | 既存ブラウザ負債 | ARIA 比較 |
|---|---|---|---|
| 有効な URL／`ready`／操作計画、ロケール、ポリシー、ブラウザエンジン | リセット | リセット | リセット |
| `renderedMetrics` | リセット | 維持 | 維持 |
| ARIA マスクまたは `captureAriaSnapshots` | 維持 | 維持 | リセット |
| `captureScreenshots`、時間予算、手動レビュー設定 | 維持 | 維持 | 維持 |
| 静的対象／audit パス／エンジン | リセット | 維持 | 維持 |

範囲変更や必須検査の未完了があると、解決した finding や削除された ARIA として比較できません。既存負債の判定には完了済みの互換全体レポートだけを使います。新しいメタデータのない旧レポートは理由を示して比較を拒否するため、全体検査を 1 度実行して参照を更新してください。レビュー済みの既存 v2 ベースラインは引き続き使えます。JSON の `diff.reason`・`ariaDiff.reason`・`browserReference.reason` に比較できない理由を記録し、ハンドオフと ARIA 要約にも表示します。

### ステータスと終了コード

| ステータス | 終了 | 意味 |
|---|---:|---|
| `PASS` | 0 | 全体検査で新しい強制違反が見つからず、手動レビューも無効 |
| `REVIEW_REQUIRED` | 0 | 設定した強制検査に合格。advisory 画像または人による視覚レビューが必要 |
| `FAIL` | 1 | 新しい強制違反を検出 |
| `ERROR` / `INCOMPLETE` | 2 | ツール・環境の障害、または必須検査範囲の欠落 |
| `SCOPED_PASS` | 3 | 変更範囲の検査に合格。**全体 QA の承認ではない** |

必須エンジンを片方でも無効にすると全体 `PASS` にはなりません。部分検査の合格結果からベースラインを作成することはできないため、受け入れ前には必ず全体検査を実行してください。

## 4. ブラウザ検査の範囲と証拠画像

ブラウザは全体の時間・出力上限を持つ別プロセスで実行します。`browser.timeoutMs` は各ナビゲーション・監査ステップの上限です。`browser.sessionTimeoutMs` を設定すれば全体上限を明示でき、未設定の場合はビューポート・テーマの組み合わせ、操作計画、撮影の余裕から **最大 600,000 ms** の範囲で算出します。有効な複数ステップの合計が 1 ステップの上限を超えただけで早期終了することはありません。

初期状態・操作後の監査と画像は、同じブラウザセッション・ロケール・`reduced-motion` 設定を共有します。撮影は任意で、**状態ごとに最大 5 個の一意な違反要素クロップ**を生成し、クロップできない場合は理由を記録します。中断した実行のあとは、現在のレポートの成果物一覧を正として扱ってください。

PNG は実行ごとの `images-<runId>/` に、内容の SHA-256 を含むファイル名で保存するため、次の監査で以前の画像を上書きしません。`imageArtifacts` と `image-artifacts.json` に成果物 ID・ハッシュ・バイト数・ルート／状態／ビューポート／テーマ／ロケールを記録し、各ブラウザ finding の `imageEvidence` で状態画像と対応する要素クロップを結び付けます。`artifacts` と `captures[].image` は引き続き `reportDir` 相対パスですが、新しいサブディレクトリに対応する必要があります。レポート共有時は参照ディレクトリもあわせてコピーしてください。

現在・直前・最後の全体レポートと finding diff 内の画像参照が、その実行の画像一式を保護します。レポートと画像一覧をファイルごとに一時ファイルから原子的に置き換えたあと、所有マーカーのある未参照ディレクトリだけを整理します。手動ファイル・未知の内容・シンボリックリンクがあれば削除せず、旧形式の平面 PNG も残します。中断して未公開の実行には、最大ブラウザ予算と 1 分を合わせた 11 分の猶予を設けます。無期限のアーカイブではなく参照にもとづく保持のため、同時監査や長期保存には別の `reportDir` を使い、参照した実行ディレクトリ全体を残してください。要求した状態画像の撮影に失敗すると `ERROR` になり、クロップ不可は理由を記録します。撮影に失敗した実行が最後の完了済み全体レポートを置き換えることはありません。

整列、レイアウト／コントロール間隔、入れ子の角丸、コントロールインセットについては検査対象数を表示します。対象ゼロは `not-tested`、カウンター情報の欠落は `unknown` です。検査が必要な箇所に適切な `data-ui-*` 契約マーカーを追加してください。`PASS` は、マーカーのない契約まで検査したという意味ではありません。

クリック可能な汎用要素におけるキーボードフォーカス・意味的役割の欠落は、インライン `onclick`、DOM の `onclick` プロパティ（React 方式を含む）、`data-ui-clickable`、Chromium CDP の直接 click リスナーから確認します。CDP は **状態ごとに最大 500 個の表示されている非ネイティブ要素候補**を検査し、文書順より `cursor:pointer` を優先し、既知のフレームワークのイベント委譲ルートを除外します。検査の制限と CDP の利用可否はレポートに明示します。委譲先の子要素や上限を超えた候補には明示的なマーカーや操作計画が必要です。実際の `Enter`／`Space` 動作は [examples/interactions.json](../../examples/interactions.json) のような操作計画で検証してください。

### 名前付きルート・ARIA 証拠・レンダリング指標

既存の `browser` オブジェクトの他の設定を保ったまま、次のフィールドを追加します。

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

ルートには一意で安全な名前と、絶対 HTTP(S) URL またはルート相対パスを指定します。`ready` や `interactionsPath` を省略すると共通設定を継承し、明示的に `null` を指定するとそのルートでは無効になります。

ルートごとに時間制限付きの独立したワーカー／ブラウザを起動し、ビューポート・テーマごとのコンテキストを分離します。全体の時間予算はルート数を含めて計算します。ルートが 1 つでも失敗すると全体は `ERROR` になりますが、完了した実行・状態の finding と他のルート結果は `routeResults` と元の実行データに保持されます。ワーカーがタイムアウトするとそのワーカーのバッファ内の部分状態が失われる場合がありますが、先に完了したワーカーの結果は維持されます。一覧に書いたルートのみを検査し、アプリ全体を自動検査するわけではありません。Storybook の URL も明示的に並べられ、認証状態・Cookie はルート間で共有しません。

ナビゲーション先のホストはリクエスト前に検証します。リダイレクトは追跡せず拒否するため、最終 URL を直接設定してください。この監査セッションでは Service Worker を無効にします。外部サブリソースはナビゲーション許可リストの対象外であり、汎用ネットワークサンドボックスではありません。

複数ルートの指紋には名前と `pathname + search` のみを含めて origin・ホスト・ポート・フラグメントを除外し、従来の単一 URL の ID は維持します。明示的なルートへ移行したら新しい全体ベースラインをレビューしてください。絶対 URL 指紋を使った既存の複数ルートベースラインはハッシュだけの項目を安全に移行できないため、1 度再作成する必要があります。ベースライン `schemaVersion` は 2 のままです。

画像ファイル名にはルートを含めます。任意の ARIA YAML には内容ハッシュも含めて以前の証拠を保持します。互換性のある連続実行の `ariaDiff` は、変更・追加・削除・不変の軸と `previousFile`／`file` を示し、ハッシュ要約に行番号付きの YAML テキスト説明を追加して `report.json`／`report.md` とエージェント引き継ぎに表示します。ARIA の変化は advisory として扱い、完全な証拠はリンクされた YAML の組で確認してください。保存は任意で状態ごとに 2 MB までとし、要求した保存に失敗すると `ERROR` になります。画像やアクセシブルネームに機密内容が含まれる場合があるため、共有前に確認してください。

レンダリング指標は現在のビューポートに表示されている上端の fixed／sticky 領域（入れ子は 1 回だけ集計）、塗りつぶしボタン、繰り返しのボタン／リンク名とリンク先、計算済みの文字／背景／枠線色のおよそ 15 度単位の有彩色色相バケットを記録します。検査対象の DOM 要素は最大 10,000 個で、制限がある場合は明示します。反復動作や複数の塗りつぶしボタンは意図的な UI の場合もあります。観測結果は **advisory のみ**であり、ゲートをブロックしたりベースラインに入ったりせず、アクセシビリティ検査を弱めることもありません。色相数はレビュー用の証拠であって強制色数上限ではなく、グラデーション・画像・完全な知覚色分析は対象外です。

指標の動作名は DOM ラベル／テキストの近似であり、完全なアクセシブルネーム計算ではありません（意味の証拠は ARIA YAML を確認してください）。可視性はブラウザの `checkVisibility` とビューポート境界で判定し、他要素による遮蔽はモデル化しません。対象サンプルは項目ごとに 10 個、反復動作グループは 20 個までに制限し、全体数と上限を記録します。

`browser.routeTimeoutMs` でワーカーごとの上限を指定でき、未指定の場合は残りの全体時間を未実行ルートに均等配分します。全体 600,000 ms の上限は変わらないため、200 回の実行ではオーバーヘッド前でも 1 回約 3,000 ms しか割り当てられません。レポートには実際の割り当てと平均予算を表示します。大きい、または遅い一覧は分割して実行し、部分完了を `PASS` として扱わないでください。ブラウザ出力はバッチ全体で 20 MB までです。

塗りつぶしボタンは最も近い不透明な祖先背景との計算上のコントラストが `1.5:1` 以上の場合に数えます（半透明の祖先層は合成します）。同色のゴーストボタンや低コントラストの標準コントロールを除くためのデザイン近似指標です。グラデーション・画像・不明なキャンバス背景は塗りつぶしと断定せず `unknown` として記録します。上端固定の集計からは `dialog`・明示的な背景幕の範囲と、ビューポートの半分以上を覆う要素を除外します。

既知の動的文言だけを `browser.ariaSnapshotMasks` でマスクできます。既定値は `[]` で最大 20 個の正規表現を指定でき、フラグは `g`/`i`/`m`/`u` のみ（既定値 `g`）を許可します。

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

マスク済みの YAML を保存してハッシュを計算しつつ、マスクしていないラベルや役割の変化は引き続き表示します。意味のある数量や構造まで消してしまう広いパターンは避けてください。マスクを変更すると新しい比較コンテキストが始まります。レポート保存後はツール所有の未参照 ARIA ファイルのみを整理し、現在・直前のレポート、比較の組、`last-full-report.json` 参照の証拠を保持します。手動ファイルは変更しません。

### 読みやすい ARIA 変更説明

`browser.captureAriaSnapshots` が有効な互換実行では、変更・追加・削除されたスナップショットの差分を YAML テキストの編集として説明します。`ariaDiff.changed[].textDiff`（`added`／`removed` も同様）は unified hunk・前後の行位置・`oldFile`／`newFile`・アルゴリズム・上限・省略理由を記録します。変更項目には `previousSha256`／`previousBytes` も保持し、`ariaDiff.textSummary` は `compared`／`unavailable`／`notGenerated`／`truncated` の件数を示します。互換性ハッシュと finding／ベースライン ID は維持し、マスク変更時は従来どおり ARIA 比較をリセットします。説明はレポート書き込み時に生成します。

ファイルが通常ファイルであること、2 MB のスナップショット上限、保存ハッシュ、確認可能なバイト数を検証します。過去の証拠が欠落または不整合なら `unavailable` の理由を示し、変化なしとは解釈しません。要求したブラウザ保存の失敗は従来どおり `ERROR` です。YAML 文法を解析したり意味／WCAG 違反を判定したりせず、テキストとして比較します。名前・役割・選択状態の行位置を確認でき、実際のコントラスト・キーボード規則と人による視覚レビュー要件は独立して維持します。

説明ごとの生成テキストは 120 行 / 12,000 バイト、1 行は 2,000 バイトまでです。バッチでは最大 16 件の比較を試み、出力は 600 行 / 64,000 テキストバイトに制限します（JSON メタデータを除く）。行照合の計算量が大きい場合は `algorithm=bounded-replacement` へ切り替え、結果がやや長くなることがあります。省略した行・hunk と理由は明記し、完全な YAML へのリンクを維持します。`report.md` は最大 8 件 / 24,000 抜粋バイト、`AGENT_HANDOFF.md` は 2 件 / 6,000 バイトまで表示します。`TRUNCATED` の抜粋は適用可能なパッチとして使わないでください。変更のないスナップショットはテキストを再読込しません。

`npm run smoke:aria` は実際の Chromium で名前・役割・選択状態・追加・削除、時刻マスクの安定性、旧ファイル保持・欠落理由、コントラスト／キーボード欠陥の対照を検証します。CI は `artifacts/upstream-contracts/aria-text.report.json` と `aria-text-evidence/` に YAML・Markdown 比較の証拠を保存します。

### 計画した検査範囲と正常／欠陥ベンチマーク

`report.json` のブラウザステージにある `inspectionScope` は、設定した `route × viewport × colorScheme × initial/名前付き state` を列挙します。要求・開始確認・完了・失敗・未実行・不明（`unknown`）を集計し、`completionRate` の分母には設定した計画のみを用い、未発見のアプリページは含めません。操作途中のスナップショットは `intermediateStates` に分離します。完了は違反の有無に関係なく検査と要求された証拠処理が終わったことを示します。強制終了したワーカーが返していない進捗は `unknown` です。計画ファイルの読み込みに失敗すると `planComplete=false` となり、欠落した名前付き状態の分母は未確定になります。部分失敗でも完了した finding を保持し、`ERROR`（終了コード `2`）とベースライン作成禁止を維持します。

規則の対象範囲は計画完了率とは別です。対象 0 は `not-tested`、`null`・欠落・無効なカウンターは `unknown` とし、`tested` には数えません。制限の明細では axe の色コントラスト、選択した axe アクセシビリティ規則、独自規則を区別しており、完全な WCAG 検査ではありません。`iframe` 内部と shadow root は文書範囲の検査から除外し、明示的な操作は主文書の対象のみ対応します。イベント委譲と候補上限のある直接リスナー探索には明示的なマーカー・計画が必要です。

固定 Chromium のインストール後に `npm run benchmark:scope` を実行します。フォント方針・アクセシブルネーム・ラベル・コントラスト・横はみ出し・テキストのクリッピングについて正常／欠陥ペアを期待ラベルと照合し、`iframe`・open Shadow DOM・イベント委譲の境界チェックは別に検証します。CI はラベル・実際の finding・一致判定・スコープ・TP/FP/FN を `artifacts/upstream-contracts/scope-benchmark.json` に保存します。同じラベルの重複検出は 1 度だけ数え、境界チェックは精度の分母から除外し、分母 0 は `null` にします。この小さな標本の数値は製品全体の精度や性能を示すものではありません。既存の操作・ルート失敗・タイムアウト・互換性・証拠のスモークテストも引き続き必須です。

### 状態シナリオと明示的な Storybook ルート

`npm run demo:states` でポート `5173` の `/ko`・`/ja` を起動します（`UI_REFINER_DEMO_PORT` で変更可能）。ページには実際の KO/JA 翻訳データが入っています。`examples/state-scenarios/routes.json` から必要な項目を `browser.routes` にコピーし、`browser.url` をフィクスチャサーバーのオリジンに設定してください。操作計画のパスはプロジェクトルート基準のため、別アプリでは例をコピーするかパスを調整します。実行ごとにロケールも合わせて設定してください。ブラウザロケール 1 つだけでアプリが翻訳されたり、ルートごとのロケール指定になったりするわけではありません。既存の操作計画／設定形式をそのまま使います。

リポジトリ内の KO/JA JSON 例はフォーム検証エラー・モーダルの開閉・空リスト・`loading → ready`・長文の折り返しを検査します。`Enter`／`Space` は異なる結果テキストで、モーダルはフォーカス閉じ込め・`Escape`・元の要素への復帰で確認します。名前付き状態はすべて表示／非表示または正確なテキストの ready 契約を持ちます。制御されたローディングフィクスチャは “Release fixture data” 操作までデータを保留し、任意の sleep を使わずページ内容から準備完了を確認します。実際のアプリではフィクスチャの制御ボタンではなく、アプリの準備完了要素・データを待ってください。

`npm run smoke:states` は両翻訳 × 2 ビューポート × light/dark、キーボード／クリッピングの欠陥対照、7 つの名前付き状態それぞれの到達失敗を検証します。到達失敗は `ERROR`（`2`）となり、前の完了検査を保持し、後の状態を未実行にしてベースライン作成を拒否します。機械可読結果は `artifacts/upstream-contracts/state-scenarios.json` に出力し、参照する ARIA YAML は通常の保持整理前に隣接する `state-scenarios-evidence/` へコピーします。この有限の例はアプリ全体のカバレッジや性能目標を示すものではありません。

既知の Storybook ストーリーは `/iframe.html?id=states--ko&viewMode=story` のような文書 URL を `ready` セレクタ・操作計画とともに `routes` へ直接指定します。デモの同じ URL はルート／クエリ処理を確認するローカルフィクスチャであり、本物の Storybook 環境ではありません。アプリでは実際のストーリー ID／URL を指定してください。自動探索・インデックスアダプター・ログイン自動化・ルート間の Cookie 共有は追加していません。実際の対象が必要とする場合にバージョンを確認して任意のインデックスアダプターを検討する方針であり、Storybook を依存関係には追加しません。

### 任意の画像ビジュアル回帰検査

画像比較は既定で無効、有効にした場合の既定モードは `advisory` です。既存の `onState` ブラウザセッション内で初期・操作状態を撮影し、比較用ブラウザを別に起動しません。次の最上位設定を追加し、`environmentProfile` をレビュー済みのフォント／実行イメージ識別子に置き換えてください。

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

既存 `browser.captureScreenshots` による生の証拠画像・クロップ撮影は独立して維持します。ビジュアル撮影は `document.fonts.ready` と表示画像のデコードを待ち、アニメーション無効・キャレット非表示・CSS ピクセルスケールを使います。`stabilityAttempts`（2〜5）内で連続する 2 枚の PNG バイト列が一致する必要があり、安定化・リソース・撮影の失敗は `ERROR` になります。`capture` は `viewport` または `fullPage` で、PNG ごとに 1,600 万ピクセル / 32 MB までです。既存セッション／ルートの時間・出力上限を維持し、ワーカーのタイムアウトを一致と扱うことはありません。

`environmentProfile` は制御したフォント・テストデータ・実行環境を利用者が明示する値であり、フォントファイルやコンテナの自動検証ではありません。マニフェストには OS／リリース／アーキテクチャ、ブラウザ／Playwright／比較器／デコーダーのバージョン、DPR、ロケール、UTC／`reduced-motion`、`ready`／操作計画、撮影／比較オプションも記録します。プロファイルのない候補は承認できません。記録条件が違えば `not-comparable` となり、ルート／状態／ビューポート／テーマ／ロケール／撮影方式ごとの承認画像が必要です。基準キーからサーバーのオリジン／ポートは除外します。自動探索・認証・アプリデータ準備は含みません。

`check` で集めた候補をレビューしてから明示的に承認します。

```sh
node tools/ui-refiner/bin/ui-refiner.mjs visual candidate --from artifacts/ui-refiner/report.json --out visual-candidate
# 候補 PNG、マニフェストの寸法、マスク、環境、ポリシーを先に確認してください。
node tools/ui-refiner/bin/ui-refiner.mjs visual approve --from visual-candidate/manifest.json --out ui-visual-baseline
```

`visual candidate` は候補画像をレポート保持整理から独立した所有ディレクトリへコピーします。`visual approve` は `baselineDir` に画像マニフェストを原子的に公開し、以降の明示的承認では画像集合全体を置換して旧マニフェスト所有画像の未参照ファイルのみを削除します（手動ファイルは保持）。`check` は承認ストアを読み取るだけです。既存の `baseline create` は finding ID 抑制用であり画像を承認しません。候補作成には全体の静的／ブラウザ検査完了と要求撮影が必要です（`enforce` の `needs-baseline` 結果からも候補を作れますが、`--changed-only` や撮影失敗は拒否します）。

| `visual` 結果 | `advisory` | 明示的 `enforce` |
|---|---|---|
| 無効 | `not-requested` | — |
| 承認画像と一致 | `matched` | `matched` |
| 画像／寸法の差 | レビュー必要 | `FAIL` / 1 |
| 承認画像なし | `needs-baseline`・レビュー必要 | `INCOMPLETE` / 2 |
| 環境／オプション不一致 | `not-comparable`・レビュー必要 | `INCOMPLETE` / 2 |
| 要求撮影／ファイル／比較失敗 | `ERROR` / 2 | `ERROR` / 2 |

制御環境での反復安定性と承認画像を確認してから `mode` を `enforce` に切り替えてください。既存の DOM／ソースの強制違反は独立して失敗します。`advisory` の差や未承認を `matched` と表示せず、手動レビュー設定が無効でも `REVIEW_REQUIRED` を表示します。画像の一致によって既存の人の確認要件は解除されません。

`masks` には最大 20 個のセレクタ文字列を指定できます。各セレクタは 1〜100 要素と表示対象を持つ必要があり、対象欠落は失敗になります。マスク箇所は不透明マゼンタで塗りつぶし、セレクタ／インデックス／ビューポート CSS ボックスを `maskRegions` に記録します。背景やパネルの自動除外はありません。データを固定するか狭い範囲を明示的に隠し、範囲外の差は検出し続けます。`pixelmatch` の `threshold`（0〜1）はピクセルごとの色許容値です。許容差ピクセル数は `max(maxDiffPixels, floor(totalPixels × maxDiffRatio))` で計算し、既定は色許容・アンチエイリアス処理後 0 ピクセルです。寸法が異なってもリサイズせず、`different` と実際／基準寸法および理由を記録します。

`report.visual` には状態ごとの `actual`／`expected`／`diff` の不変参照、ピクセル数／比率／許容値、安定化／マスク／環境、時間／容量指標を記録します。`expected` も基準ストアから実行ディレクトリへコピーするため、後の承認で過去の証拠は変わりません。既存の実行別画像保持整理を使います。`maxObservedWorkerRssBytes` はブラウザ子孫プロセスを除くワーカー RSS の標本であり、プロセスツリー全体の最大メモリではありません。基準欠落や失敗には理由を記録し、`enforce` の全体 `PASS` にはしません。`visual` オプションは独立した互換性契約を持ち、finding／ARIA 比較をリセットしません。

`npm run smoke:visual` は 10 回の制御反復（初期／保存状態）、マスク内の正常変化、レイアウト／クリッピング／マスク外の欠陥、寸法変更、基準欠落／環境不一致、不安定／失敗撮影、CLI での明示的承認、生証拠の独立性を検証します。CI は `artifacts/upstream-contracts/visual.report.json` と隣接の `visual-evidence/` を保持します。生の標本とソース／環境情報を記録し、製品全体の精度・p95・速度改善目標は主張しません。`pixelmatch@7.2.0`（ISC）・`pngjs@7.0.0`（MIT）を固定し、`licenses/` に原文の通知を保持しています。

## 5. レポートと修正ハンドオフ

出力は `reportDir` に生成します。

| ファイル | 内容 |
|---|---|
| `report.json` | 全違反・対象、実測／期待値、元のブラウザ詳細、blocking フラグ、グループ・範囲・カバレッジ |
| `report.md` | 読みやすい原因別の違反、ゲート状態と検査範囲 |
| `AGENT_HANDOFF.md` | 優先順位付きの修正タスク、短い対象ヒント、前回からの変化 |
| `previous-report.json` | 互換性のある範囲を比較するための前回結果 |
| `last-full-report.json` | 部分検査で既存ブラウザ違反を区別するための完了済み全体結果 |
| `lintapple.raw.json` | 元のレンダリング検査結果 |
| `images-<runId>/render-*.png` | 任意の同一セッション状態画像・要素クロップ（実行別の不変パス） |
| `image-artifacts.json` | 現在の実行の画像一覧・SHA-256・バイト数・撮影条件 |
| `render-*.aria.yml` | 任意の同一状態 ARIA 構造（内容ハッシュで以前の証拠を保持） |
| `VISUAL_REVIEW.md` | 人または外部ビジョンモデル向けの advisory レビューパケット |

ハンドオフは **実際のブロッカー → advisory エラー → 警告** の順に並べます。同じ原因を対象・ビューポート・状態にまたがってまとめるため、継承されたフォントの問題を子要素ごとに直すのではなく、指定元から修正できます。意味ベースの対象は identity JSON ではなく `h1 "Unlock…"` のようなヒントで表示します。

修正一覧は約 **6 KiB** に制限します。ブロッカーグループを省略した場合は、その数とルール名を明記します。全セレクタ、正確な identity、残りのグループはすべて `report.json` に保持するため、修正完了前に確認してください。

互換性のある連続実行では、解決・追加・継続した identity を記録します。エージェントのガイドでは 1 つの修正タスクを最大 2 回の修正／再検査に制限しますが、CLI 自体が自律修正ループを実行するわけではありません。ビジョンモデルの意見は advisory であり、ゲート状態を変更しません。視覚的な受け入れは人が判断します。

## 6. ベースライン `schemaVersion` 2

設定ファイルは `schemaVersion: 1`、回帰ベースラインは **`schemaVersion: 2`** です。

新しい**全体**レポートから作成します。

```sh
node tools/ui-refiner/bin/ui-refiner.mjs baseline create --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.v2.json
```

抑制一覧をレビューしてから `gate.baselinePath` を設定してください。v1 ベースラインは拒否され、バージョン番号だけを変更して安全に移行することはできません。作成コマンドは既存の出力ファイルを上書きしません。

- 静的 identity は相対ソースファイルと一意なソース行内容を使い、行番号・診断メッセージは除外します。空または重複したアンカーはベースライン化できません。
- ブラウザ identity は一意なアプリマーカーまたはスコープ内で一意な意味識別子、ビューポート寸法・テーマ・状態・疑似要素・関連対象を使います。測定値と `nth-of-type` 位置は除外します。
- React `useId`・Radix・Headless UI の既知の自動 ID（`:r0:`、`«r0»` / `«R1»`、`_r_0_` など）は、一意でもアンカーから除外します。明示的な `data-ui-id`、`data-testid`、`data-qa` を優先してください。
- あいまいな identity は表示し続け、抑制できません（`excludedFindings` に除外数を記録）。ソース内容や意味が変わると新しい identity になる場合があります。

検査が違反を自動的にベースラインへ追加したり、ポリシーを弱めたりすることはありません。

### レビュー済みの正確な値例外

`gate.valueExceptionsPath` にプロジェクト相対の JSON パスを指定してください。[examples/value-exceptions.json](../../examples/value-exceptions.json) を参考に明示的にレビューする必要があります（例自体は承認ではありません）。各項目は `engine: "lintapple"`、`rule`、正確なプリミティブ値 `actual`、空でない `reason` が必要で、任意の `route` やレポートの正確な `selector` で範囲を絞れます。対象は `font-family`・`font-size`・`copy`・`root-background` です。類似フォントや同等 CSS セレクタではなく、`report.json` の値とセレクタをそのまま使ってください。

一致した違反は証拠と `reviewedException` 理由を保持しつつ、ゲートをブロックしません。ベースラインへ自動追加しないため、値限定の承認が値と無関係な抑制へ拡大しません。他の値や範囲は引き続き失敗します。アクセシビリティや操作規則はこの方式で免除できません。既存ポリシーの `exceptions` はセレクタ全体の規則除外であり、より広い別の仕組みです。

## 7. エージェントスキルとチーム用フック

アプリルートから任意でインストールできます。

```sh
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
```

ツールがプロジェクト内にあれば、既存の Claude 設定を保持しながら `CLAUDE_PROJECT_DIR` を使うプロジェクト相対の `PostToolUse` フック（および `Stop` 終了フック）を追加します。ラッパーも保守対象のフックを相対インポートするため、チェックアウトを移動しても個人の絶対パスは埋め込まれません。個人の外部チェックアウトは `.claude/settings.local.json` とローカルの `UI_REFINER_HOME` を使い、共有設定は変更しません。

スキルは `.agents/skills/ui-refiner-agent`（Codex）と `.claude/skills/ui-refiner-agent`（Claude Code）にコピーされます。他のホストでは、生成された `.agents/skills/ui-refiner-agent/hook-registration.json` をサポートされているフック UI から登録してください。未対応の Codex 設定を独自に作ることはありません。フックは編集した静的行だけを検査するもので、全体ゲートではありません。インストーラーはローカルで変更されたファイルをそのまま上書きしないため、`--update` の前に差分を確認してください。

ランタイムの既定値は `static.auditPath: "bundled"` です。任意の `suta` ガイド用コピーは次のコマンドで配置できます。

```sh
bash tools/ui-refiner/scripts/install-suta.sh "$PWD"
```

`doctor` はコピーの不一致を通知します。明示された旧監査パスは保持するため、古い `.agents/skills/suta/scripts/audit.mjs` 設定は確認後に `"bundled"` へ変更してください。

## 8. アップストリーム保守と出典

```sh
node tools/ui-refiner/bin/ui-refiner.mjs upstream check
node tools/ui-refiner/scripts/sync-vendor.mjs --suta <40-character-SHA>
node tools/ui-refiner/scripts/sync-vendor.mjs --lintapple <40-character-SHA>
```

`upstream check` はファイルを変更せず、固定コミットとアップストリーム `HEAD` を比較します。`sync-vendor` は未記録のローカルベンダー変更を拒否し、指定したソースを一時領域へ取得してレビュー済みパッチを再適用し、原本・現在のハッシュを記録したうえで単体テストと UI・CLI のブラウザスモークを実行します。パッチ競合や検証失敗時は以前のベンダーソースとマニフェストを復元します。Chromium のインストール、コミット、push、アップグレード承認は行いません。

今後のエンジン修正は再適用可能なパッチに保持し、レビュー対象のマニフェストを更新してください。ライセンスと固定コミット：[vendor/UPSTREAM.json](../../vendor/UPSTREAM.json)、[licenses/THIRD_PARTY.md](../../licenses/THIRD_PARTY.md)、[suta MIT ライセンス](../../vendor/suta/LICENSE)、[lintapple MIT ライセンス](../../vendor/lintapple/LICENSE)。原本プロジェクト：[suta](https://github.com/Guksu/suta)、[lintapple](https://github.com/gholtzap/lintapple)。

## 9. 開発と検証

UI Refiner リポジトリのルートから実行します。

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

CI は単体・契約テスト、実際の Chromium による UI・CLI 検査、セッションタイムアウト検査、固定ベンダー同期の検証を実行します。正常／違反ページ、モノレポの変更、移動したチェックアウトのフック、自動 ID、1,600 行の一覧後にあるポインタ候補の優先検出、同じ状態の画像、要素クロップを検証します。

実際の検査出力とハッシュ・出典は `test/fixtures` に保持し、ライブスモーク出力をレビュー済みの修正情報契約と比較します。CI は `upstream-contracts` の証拠もアップロードします。契約が変わった場合はフィクスチャを自動再生成せず、レビューしてください。[CI ワークフロー](../../.github/workflows/ci.yml) を参照してください。

## 10. 標準出力とオフラインレビュー

JSON が判定の原本です。各検査はスクリプト・サーバー不要の `report.html`、`handoff.json`、分量制限付きの `AGENT_HANDOFF.md` を生成します。引き継ぎにはルート・状態・画面サイズ・テーマ、実測／期待値、検証済み静的ソース位置、不変 PNG／ARIA 参照、入力ハッシュ、再現引数を記録します。保存済み設定では実行コマンドを出力し、メモリ設定では先にスナップショットを保存する必要を明示します。再検査前にアプリと同じデータ・認証状態を用意してください。

```sh
node bin/ui-refiner.mjs check --config ui-refiner.config.json --format json
node bin/ui-refiner.mjs check --config ui-refiner.config.json --format sarif
node bin/ui-refiner.mjs export html --from artifacts/ui-refiner/report.json --out review-bundle
node bin/ui-refiner.mjs export sarif --from artifacts/ui-refiner/report.json --out review.sarif
npm run smoke:export
```

`--format json|sarif|html|markdown` は `stdout` の形式のみを切り替え、既定の要約動作は変えません。すべての形式と成功したエクスポートは元の終了コード（`0`/`1`/`2`/`3`）、手動レビューと部分通過の区別を維持します。エクスポート自体の失敗は `2` です。JUnit は具体的な利用先ができるまで保留します。

`review-bundle/report.html` は `file://` で直接開けます。エクスポート先は新規ディレクトリのみ許可し、原本 JSON を変更せず、現在・以前の PNG／YAML 証拠を同梱します。`evidence-manifest.json` は欠落・破損・ハッシュのない旧証拠を明示します。レポート外のパスとシンボリックリンクによる逸脱は拒否します。上限は参照 2,000 件、合計 256 MB、PNG あたり 32 MB、YAML あたり 2 MB です。HTML プレビューは finding 300 件、画像状態 40 件、ARIA 比較 20 件、整形テキスト 12,000 文字までを表示して省略を明示し、全データは JSON に残ります。ソースツリー・ホスティング・DB は不要です。

SARIF 2.1.0 の主要ソース位置には、検査時に実ファイルと行を確認した静的結果だけを含めます。ブラウザセレクタはプロパティ、PNG／YAML は関連証拠として記録し、架空のソースパスは作りません。元のプロジェクトとレポートの基準 URI を別々に記録するため、他環境では基準パスを調整してください。テストでは固定した OASIS 公式スキーマでオフライン検証し、ランタイム依存は追加しません。

`smoke:export` は固定欠陥 2 種類を最大 2 回の予算で修正し、全体再検査で試行数と新規ブロッカーを記録します。決められたフィクスチャ消費者の実験であり、自律エージェント試行数は 0 のためエージェント成功率は主張しません。自動修正・ベースライン承認・PR コメントは実行しません。ポリシー・正本（SOT）と人による視覚承認を維持してください。

元の証拠パスを維持したまま短い `e/` 別名で HTML から参照することで、Windows ブラウザの長いパス制限を回避します。別名コピーも合計バイト上限に含めます。

## 11. 製品コンテキスト・機能保持・デザインレビュー

任意の `contextPath` は製品の事実、文書参照、ルート別の画面目的（`persuade`、`operate`、`read`、`experience`）を分けた `schemaVersion` 1 JSON を指定します。不明な事実は `unknown` のまま残し、文書ハッシュとユーザーが宣言した承認状態を記録します。コンテキストから検査ポリシーを自動生成・緩和しません。[例](../../examples/project-context.json)と[詳しい手順](../CONTEXT_PRESERVATION_REVIEW_KO.md)を参照してください。

`preservation: {"enabled": true, "enforcement": "advisory", "baselinePath": null}` は同じ状態のリンク・フォーム・フィールド・操作・テストフック、明示した対象の属性／文言／名前、ルート CSS トークンを記録します。全体キャプチャを確認してから `preserve record --from report.json --out preservation-reference.json` で別の基準を記録し、`baselinePath` と必要なら `enforce` を設定してください。`enforce` での差分は `FAIL`/`1`、基準なし・互換性なしは `INCOMPLETE`/`2`、収集失敗は `ERROR`/`2` です。`check` は基準を更新しません。ID／class／順序は比較せず、名前は近似で入力値は保存しません。DOM 一致はハンドラやサーバー動作の証明ではないため、操作計画の実行も引き続き必要です。

```sh
node bin/ui-refiner.mjs rules --json
node bin/ui-refiner.mjs guide harden --json
node bin/ui-refiner.mjs review packet --from artifacts/ui-refiner/report.json --out design-review
node bin/ui-refiner.mjs review validate --from submitted-review.json --report artifacts/ui-refiner/report.json --out accepted-review.json
npm run smoke:context
```

`guide` は `audit`/`critique`/`polish`/`harden` の手順を案内し、必須検査範囲を減らしません。規則カタログは ID・エンジン・領域・検査段階・前提・制限を説明し、実際の実行範囲はレポートに残します。レビューパケットはデザイン入力と検出結果を分離して証拠を保持します。検証は正確なレポートハッシュ・添付・画面状態を確認しますが、宣言されたレビュー実行や独立性を証明するものではありません。意見は常に advisory で、モデルの自動呼び出しはありません。

`npm run benchmark:agent -- --executor <claude 実行ファイルの絶対パス>` は CI とは別の実エージェント実験です。一時的な合成フィクスチャのみを対象に、制限した CLI のファイルツールで修正します（欠陥 2 種類 × 2 条件、課題ごと最大 2 回、試行ごと 180 秒・API 予算 1 USD）。返されたモデル・費用、ポリシー／保持違反、全体再検査、未解決・エラー・未実行、検査コードのハッシュを記録します。この少数例から統計的な優劣や Hallmark／Impeccable との直接比較は主張しません。要件と成果物は詳しい手順を参照してください。

## 12. UX 修正ガイダンスの検索と引き継ぎ

検査結果にローカル UX 検索を関連付けます。全候補は `report.json.repairGuidance`、`handoff.json.repairGuidance` と各ターゲットの `repairSuggestions` に、制限付きプレビューは `AGENT_HANDOFF.md`/`report.md`/`report.html` に記録します。クエリは既知の finding rule ID から作り、ページの文言を検索指示には使いません。未知の規則は `no-match` とします。ブロッカーを優先し、ベースライン・承認済み例外・既存負債の対象は除外します。

```sh
node bin/ui-refiner.mjs guidance --query "keyboard focus" --limit 3
node bin/ui-refiner.mjs guidance --query "フォーム エラー" --limit 2
npm run smoke:guidance
```

UI UX Pro Max の UX CSV をコミット `28b3b8dee8c976df4fa3e94aed4e092ad43fcb03` に固定しました。原本 119 行から `Web`/`All` のみ検索し、正確なバイト・ライセンス・原本行・行 ID・ハッシュを `knowledge/ui-ux-pro-max/` に保持しています。Python の検索／デザインシステム生成器はインストール・実行しません。Node 実装は決定的な BM25 順位付け、限定的な韓国語／日本語キーワード別名、カテゴリフィルタ、明示的 `no-match` を提供します。順位はキーワード関連度であり、視覚品質や確信度ではありません。

任意の `guidance` 設定の既定値は `{"enabled": true, "maxFindings": 20, "maxSuggestions": 2}` です。上限は finding 50 件、対象ごと 3 候補で、`guidance.enabled=false` で無効にできます。Markdown プレビューは別途 4 件 / 3,200 バイトまでとし、JSON に省略件数を記録します。データ欠落・ハッシュ不一致は `guidance` unavailable とし、元の判定を変えません。検索中のネットワーク／モデル呼び出しはありません。

候補には原本の優先度、良い／悪い例、固定ソース URL を含めます。原本の `High` も常に advisory であり、ブロッカーやポリシー値にはなりません。実際の finding・証拠・承認済み SOT を先に読み、例がプロジェクトに適合するか確認してください。例はフレームワークや文脈に依存し、既存基準より厳しい場合もあります。ポリシー生成・ページ別上書き・スタック推論・自動修正・MCP／プラグイン導入は含みません。
