# suzumiyaaoba.com

Next.js App Router、React、TypeScript で構築した個人サイトです。日本語・英語のブログとノート、書籍、ツールを静的出力し、GitHub Pages に公開します。

## 開発

CI と同じ Node.js 22 系（22.18.0 以上）と npm を使用します。テスト・lint・整形には [Vite+](https://viteplus.dev/guide/migrate) を使用し、プロジェクトの依存関係としてインストールします。

```sh
npm ci
npm run dev
```

開発サーバーは `http://localhost:3000` で起動します。検索に必要な Pagefind インデックスは、別途生成します。

```sh
npm run pagefind:dev
# コンテンツの変更を検索に反映する場合
npm run pagefind:dev:force
```

## 構成

| パス                        | 役割                                                        |
| --------------------------- | ----------------------------------------------------------- |
| `src/app`                   | ルーティング、レイアウト、メタデータ、OGP画像、サイトマップ |
| `src/foundation/pages`      | 各ページのデータ取得と表示                                  |
| `src/foundation/widgets`    | ヘッダー・フッターなどのページ共通領域                      |
| `src/foundation/entities`   | ブログ、ノート、書籍、シリーズのモデルと公開API             |
| `src/foundation/shared/lib` | コンテンツ読み込み、MDX変換、言語選択、URL・日付処理        |
| `src/foundation/shared/ui`  | 共通UI、目次、グラフ、MDXコンポーネント                     |
| `content`                   | Markdown / MDX本文、記事データ、シリーズ定義                |
| `src/i18n/messages`         | 日本語・英語のUIメッセージ                                  |
| `scripts`                   | アイコン生成と検索インデックスのビルド補助                  |

依存方向は `pages → widgets / entities → shared` を基本とし、Steiger で確認します。スライス外からの参照には各 `index.ts` の公開APIを使います。

ブログとノートは `shared/lib/content-file` の共通コレクション処理を使用し、frontmatter の正規化と永続キャッシュの方針は各エンティティが管理します。翻訳のフォールバックは `shared/lib/routing` に集約しています。公開一覧は日本語版の下書き状態・日付を基準にし、日本語版がない場合は英語版を使います。

frontmatter の解析は書籍も含めて `shared/lib/content-file/parse-content.ts` を使います。解析途中のデータが再利用されないよう、キャッシュは読み込み側で管理します。書籍モデルは型定義・解析・ファイル探索・公開APIに分割し、目次と本文で同じ Markdown / MDX ファイルを参照します。

タグ集計は `entities/blog/model/blog-tags.ts` に集約しています。一覧・詳細・メタデータには言語別の索引を使い、静的ルートとサイトマップには両言語のタグ集合を使います。同じ記事内の重複タグは一度だけ数えます。

MDX のコンパイルは `shared/lib/mdx/render-mdx.tsx`、AST変換は個別のプラグイン、目次抽出は `toc.ts` が担当します。重いチャートやコード表示は使用する記事で遅延読み込みします。グラフの凡例操作・ツールチップ・模様定義と、目次の監視・位置計算もそれぞれ表示本体から分離しています。

## Awesome Something の記録

`content/awesome-something.yaml` に記録すると、`/awesome-something/` と `/en/awesome-something/` の一覧に反映されます。ヘッダーの「Awesome」から開けます。公開時は再ビルドが必要です。開発中はページを再読み込みすると変更を反映します。

次のように `items` の下へ項目を追加してください。項目はカテゴリごとにまとめて表示されます。カテゴリは YAML で最初に登場する順、カテゴリ内の項目は記載順です。新しい発見を先頭に表示したい場合はリストの先頭へ追記します。登録を空にする場合は `items: []` と記載します。

```yaml
items:
  - id: example-tool
    name: Example Tool
    category: アプリケーション
    tags: [CLI, 自動化]
    description: 日々の作業を少し便利にするツール。
    websiteUrl: https://example.com/
    githubUrl: https://github.com/example/example-tool
    articles:
      - https://example.com/introduction
      - title: 使い方の紹介
        url: https://example.com/guide
    relatedPosts:
      - title: このサイトでの紹介記事
        url: /blog/post/example-tool/
```

| フィールド     | 必須 | 内容                                                                                    |
| -------------- | ---- | --------------------------------------------------------------------------------------- |
| `id`           | ○    | 重複しない英小文字・数字・ハイフンの ID。項目のアンカー `#awesome-<id>` にも使用        |
| `name`         | ○    | 名称                                                                                    |
| `category`     | ○    | 自由なカテゴリ名。例: サービス、ライブラリ、フレームワーク、アプリケーション            |
| `tags`         |      | 用途・技術・特徴を表すタグの文字列リスト。例: `[CLI, 自動化]`                           |
| `description`  | ○    | 簡単な説明。複数行は YAML の `\|` や `>` で記入可能                                     |
| `websiteUrl`   |      | 公式サイトの HTTP(S) URL                                                                |
| `githubUrl`    |      | GitHub リポジトリの HTTP(S) URL                                                         |
| `articles`     |      | 紹介記事のリスト。HTTP(S) URL、または `url` と任意の `title` を持つオブジェクト         |
| `relatedPosts` |      | サイト内の関連記事のリスト。`articles` と同形式で、`/` から始まるサイト内パスも指定可能 |

任意の URL は省略・空欄、記事リストとタグは省略・空欄・`[]` にできます。未設定のリンクや見出し、タグ欄は表示しません。タグは前後の空白と重複を除き、記載順に表示します。空文字や文字列以外のタグはエラーになります。カテゴリの選択肢は記録から自動生成され、名称・説明・カテゴリ・タグのキーワード検索と組み合わせて絞り込めます。

項目のタグをクリックすると、そのタグを持つ項目だけを表示します。選択中のタグは強調表示され、同じタグの再クリックまたは選択中タグの解除ボタンで解除できます。タグ・カテゴリ・キーワードはすべての条件を満たす項目に絞り込み、「絞り込みを解除」でまとめて解除できます。

カテゴリの選択肢・見出しとタグには、内容に合うアイコンを表示します。カテゴリの対応は `src/foundation/pages/awesome-something/index/ui/category-icon.tsx`、タグの対応は `src/foundation/shared/ui/tag.tsx` で管理しています。未登録のカテゴリはフォルダ、タグは `#` のアイコンになります。アイコンを追加したら `npm run build:icons` で SVG データを再生成してください（開発サーバーの起動時とビルド時にも自動生成します）。

日英のページで記録内容は共通です。関連記事は指定した URL をそのまま使うため、日本語だけの記事にも英語ページからリンクできます。必須項目の不足、ID の重複、不正な URL、フィールド名の誤りは読み込み時にファイル名と項目の位置を含むエラーになり、ビルドも失敗します。

## AI モデルのリリース比較

`/archive/ai-news/` では、`content/tools/ai-news.yaml` の全期間を連続した時間軸で比較します。画面幅いっぱいのチャートを横スクロールでき、拡大・縮小、全期間を画面内に収める表示、任意の年・最初・最新の記録への移動に対応しています。年や月をまたぐ間隔も、記録のない期間も日数に比例した同じ縮尺で表示し、系列名と年月の目盛りはスクロール中も固定します。提供元のロゴを絞り込み・時間軸・カレンダー・詳細に共通して使い、時間軸は提供元ごとに最近更新された系列から表示します。通常の倍率ではモデル名も併記します。

カレンダーは日曜始まり・7列×6週の月別グリッドを横に並べ、閲覧者のローカル日付の「今月」を先頭にして開きます。「今日」を強調し、左へ過去、右へ未来の月を連続してたどれます。月単位の移動、任意の月への移動、「今日に戻る」「直前のリリース」に対応しています。日付内の提供元ロゴからリリースのある日を見つけ、選択すると下部に詳細を表示します。矢印キーで日付、Page Up / Down で月を移動できます。画面付近の月だけを描画し、端に近づくと期間を追加します。「今日」は静的ビルドの日付ではなく閲覧時に取得し、日付の変わり目にも更新します。

時間軸・カレンダー・一覧は、一つのパネル内で同じ検索・提供元・種類・系列の絞り込みを共有します。見出しと操作部の位置、選択状態、ボタン、余白を共通化し、表示を切り替えても同じ操作で探索できます。

一覧は月ごとにまとめた行形式で、日付・提供元・モデル名・前回からの日数を比較できます。新しい順・古い順の切り替え、各行の詳細・出典の展開に対応しています。画面上部の直近30日の件数と増減は、今日を含む30日間とその前の30日間を比較し、将来の日付と日付未詳の記録は除外します。提供元・モデルの種類・系列・モデル名の絞り込みは3つの表示で共通です。

従来の縦型タイムラインは `/archive/ai-news/timeline/` で引き続き閲覧できます。年ごとの区切り、日付、アイコン、説明文のデザインを保ち、ページ上部のリンクでカレンダーと行き来できます。どちらも同じ YAML の記録を使用します。

各イベントの `series` に比較する系列名の配列を指定してください（例: `series: ["Claude Opus"]`）。同時発表には複数指定できます（例: `series: ["Gemini Pro", "Gemini Flash"]`）。同じ提供元・種類・系列の前回の記録と日数を比較し、同日公開は同じリリース日として扱います。検索やカレンダーの表示日を変更しても比較元は変わらず、全期間のチャートの範囲も絞り込み前の全件で固定します。年への移動は表示位置を変えるだけで、その年に記録を限定しません。

Qwen・Kimi・Llama・Mistral・Grok・GLM・MiniMax などの海外モデルと、PLaMo・ELYZA・Sarashina・LLM-jp などの日本語モデルの公開履歴を収録しています。提供元は `tags` に明記します（例: Qwen は `Alibaba`、Kimi は `Moonshot AI`）。派生モデルでは基盤モデルの系列タグより明示した提供元を優先します。提供元のフィルターは横スクロールできます。

追加時は公式発表・公式リポジトリの公開履歴・公式ドキュメントを確認し、`summary_ja` に出典リンクを付けて日付の新しい順に並べてください。発表、API 提供、モデル重みの公開が別の日なら、どの出来事の日付かをタイトルや説明に明記します。`Open Weight Model` は、その記録の時点でモデル重みの公開を確認できる場合に付けます。月しか分からない場合は日を推測で補いません。

`date` が実在する `YYYY-MM-DD` 形式の記録をカレンダーに表示します。日付未詳の記録は一覧に残り、間隔の計算対象にはなりません。`series` を省略した記録もカレンダー・一覧には表示されますが、系列の間隔比較には含めません。プレビュー・限定提供・一般提供を含む記録の間隔であり、モデルの世代交代だけを示すものではありません。

## アフィリエイトリンクの管理

記事全体のリンク先は `content/affiliate-products.json` に集約しています。リンクを差し替えるときは、対象の `id` の `productUrl` を変更して再ビルドします。同じ ID を参照する日本語・英語の記事や商品カードに反映されるため、記事本文の編集は不要です。開発中はページを再読み込みすると変更を反映します。

- `products`: 商品カードにも使う定義。`id`、`title`、`productUrl`、`imageUrl` が必須です。`amazonProductIds` や `<AmazonProductSection>` はここの ID を参照します。
- `links`: 本文だけで使う定義。`id`、`title`、`productUrl` が必須で、画像は不要です。

本文では、`affiliate://` の後に管理ファイルの `id` を完全一致で指定します。表示名は記事ごとに自由に設定できます。次の例はいずれも登録済みの ID を参照しています。

```md
[Clean Code](affiliate://clean-code)
[Clean Architecture](affiliate://clean-architecture-reference)
[現場で活用するためのAIエージェント実践入門](affiliate://ai-agent-practical-introduction)
```

新しい ID は `clean-code` のような英小文字・数字・ハイフンによる kebab-case にします。リンクは管理ファイルに一度だけ登録し、本文に URL を直接書かず ID を参照してください。ID は `products` と `links` を通して一意にします。ID の重複・未登録の参照・不正な定義はビルド時にエラーになります。

既存の `products` には日本語や空白を含む ID もあります。その場合も登録済みの ID をそのまま指定します。空白を含む場合は `[Clean Architecture](<affiliate://Clean Architecture>)` のようにリンク先を `<...>` で囲みます。

既存のリンク先を保つため、同じ書籍名でも異なる URL は別の ID として登録しています（例: `Clean Architecture`、`clean-architecture-intro`、`clean-architecture-reference`）。これらを同じリンク先に統一する場合は、各定義の `productUrl` を更新します。

## 検証

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test -- --project=unit
npx playwright install chromium
npm run test -- --project=storybook
npm run build
```

`npm run test` は単体テストと Storybook のブラウザテストをまとめて実行します。Storybook 単体は `npm run storybook` で確認できます。ファイル監視数の制限で Steiger が `EMFILE` になる環境では、`CHOKIDAR_USEPOLLING=1 npm run lint` を使用できます。

`vite.config.ts` に Vite+ のテスト・lint・整形設定をまとめています。`npm run lint` は `vp lint` と Steiger、`npm run test` は `vp test run`、`npm run format` は `vp fmt` を実行します。テストを監視しながら実行するには `npm run test:watch` を使用します。型検査は `npm run typecheck` で TypeScript を実行します。

Oxlint は全カテゴリを `error` にし、TypeScript の型情報を使った検査、React / Next.js、アクセシビリティ、import、Promise、Node.js、JSDoc のルールを有効にしています。Vitest のルールは単体テストに適用します。警告と不要になった無効化コメントも lint を失敗させます。

競合するルールやフレームワークの規約に合わない制限は、`vite.config.ts` に理由を記載して調整しています。生成ファイルは対象から除外し、生成元を検査します。新たな例外は必要なファイル・行に限定し、理由をコメントに残してください。`nursery` を含むため、Vite+ の更新時は追加ルールの指摘と自動修正後の整形結果も確認します。

Vite+ の `vp dev` / `vp build` は Vite 向けのコマンドです。このサイトの開発・静的出力は Next.js を使用するため、`npm run dev` / `npm run build` を使います。

Vite+ は Storybook 10.6 の対応範囲に合わせて 0.2.9 に固定しています。更新するときは Storybook の対応範囲を確認し、`vite` のエイリアスと overrides、`vitest`・`@vitest/browser-playwright`・`@vitest/coverage-v8` も同梱バージョンに揃えてください。これらの直接依存は Storybook の peer dependency とブラウザテスト・カバレッジに必要です。TypeScript のパスエイリアスは Vite の `resolve.tsconfigPaths` で解決します。

`npm run build` はアイコン生成、Next.js の静的出力、Pagefind のインデックス生成を順に行い、公開用ファイルを `out/` に出力します。PRでは型検査・lint・テスト・ビルドを実行し、`master` への push 時に GitHub Pages へデプロイします。
