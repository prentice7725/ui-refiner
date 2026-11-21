# UI Refiner

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md)

UI Refiner は、韓国・日本のサイト 2,245 件の実測をもとにしたウェブデザインテーマを 13 種類収録しています。Codex や Claude Code で業種に合うページを作成でき、CLI では既存のページを点検できます。

![韓国・日本のウェブデザインテーマ全13種類のサンプルページ一覧](docs/assets/themes.jpg)

[テーマギャラリー](skills/ui-refiner-agent/reference/themes/GALLERY.md) · [測定方法とテーマ一覧](skills/ui-refiner-agent/reference/themes/README.md)

## クイックスタート

Node.js 22.18 以上、npm、Git が必要です。既存のアプリで使う場合は、アプリのルートから実行します。

```sh
git clone https://github.com/prentice7725/ui-refiner tools/ui-refiner
cd tools/ui-refiner
npm ci
npx playwright install chromium
node bin/ui-refiner.mjs doctor
node bin/ui-refiner.mjs scan examples/ai-slop-landing.html --lang ja
```

実行後に `ui-refiner-scan/DESIGN_REVIEW.md` を開きます。同じフォルダにデスクトップとモバイルのスクリーンショットが保存されます。サンプルの代わりに URL やローカル HTML のパスを指定すると、自分のページを点検できます。同じページを同じ出力先に再スキャンすると前回の結果と比較できます。

## エージェントで使う

上の手順で開いた `tools/ui-refiner` で、使うツールに合ったコマンドを一つ実行してください。CLI だけを使う場合はこの手順を省略できます。

| ツール | インストール | 対象のアプリでの使い方 |
|---|---|---|
| Codex | `node scripts/install-agent-skill.mjs ../.. --host codex` | 新しいチャットで「landing.html のデザインを点検して」と依頼 |
| Claude Code | `node scripts/install-agent-skill.mjs ../.. --host claude` | 点検は `/ui-review landing.html`、修正は `/ui-refine landing.html` |

インストーラーを再実行するとバージョンとファイルの差分が表示されます。`--update` を付けると更新できるファイルを適用し、ローカルで編集したファイルは個別に表示します。

<details>
<summary>Claude Code プラグインとしてインストール</summary>

Claude Code のチャットで次のコマンドを実行し、プラグインのフォルダで `npm ci` と `npx playwright install chromium` を実行します。

```text
/plugin marketplace add prentice7725/ui-refiner
/plugin install ui-refiner@ui-refiner
```

</details>

## 用途別の機能

- **既存ページの点検。** `scan` は検出したデザインパターンの根拠と修正案を示します。0〜100 のスコアは検出したパターンの強さを表します。文字のコントラストなどの品質項目は別に報告します。レポートは日本語・韓国語・英語に対応し、`--lang ja` などで指定できます。
- **既存ページの修正。** 小さな修正では構成を維持し、全面的に見直す場合は三つの案から選びます。`keep check` でリンク・フォーム・数値が保たれたか、`stress` で長い文言や大きな数値がレイアウトを崩さないかを確認できます。
- **新しいページの制作。** 韓国・日本のサイト 2,245 件の実測をもとにした 13 テーマを収録しています。ローカルのギャラリーをブラウザで開くと、国・業種・写真の有無でサンプルを絞り込めます。

3 ページを対象にした試行では、三つの案から選ぶ手法がページ別の平均順位で首位でした。一方、完成した 3 ページは互いに似ていると評価されました。評価に使ったモデルは一つです。 [試行結果](docs/refine-pilot-2026-11-15-local/results-five-arms.json)

[ガイドとプロジェクトの QA 設定](docs/GUIDE_JA.md) · [変更履歴](CHANGELOG.md) · [MIT](LICENSE) · [第三者ライセンス](licenses/THIRD_PARTY.md)
