# suzumiyaaoba.com

Next.js App Router、React、TypeScript で構築した個人サイトです。日本語・英語のブログとノート、書籍、ツールを静的出力し、GitHub Pages に公開します。

## 開発

CI と同じ Node.js 22 系と npm を使用します。

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

初期状態は `items: []` です。登録を始めるときは次のように `items` の下へ項目を追加してください。表示順は YAML の記載順です。新しい発見を先頭に表示したい場合はリストの先頭へ追記します。

```yaml
items:
  - id: example-tool
    name: Example Tool
    category: アプリケーション
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
| `description`  | ○    | 簡単な説明。複数行は YAML の `\|` や `>` で記入可能                                     |
| `websiteUrl`   |      | 公式サイトの HTTP(S) URL                                                                |
| `githubUrl`    |      | GitHub リポジトリの HTTP(S) URL                                                         |
| `articles`     |      | 紹介記事のリスト。HTTP(S) URL、または `url` と任意の `title` を持つオブジェクト         |
| `relatedPosts` |      | サイト内の関連記事のリスト。`articles` と同形式で、`/` から始まるサイト内パスも指定可能 |

任意の URL は省略・空欄、記事リストは省略・空欄・`[]` にできます。未設定のリンクや見出しは表示しません。カテゴリの選択肢は記録から自動生成され、名称・説明・カテゴリのキーワード検索と組み合わせて絞り込めます。

日英のページで記録内容は共通です。関連記事は指定した URL をそのまま使うため、日本語だけの記事にも英語ページからリンクできます。必須項目の不足、ID の重複、不正な URL、フィールド名の誤りは読み込み時にファイル名と項目の位置を含むエラーになり、ビルドも失敗します。

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
npm run test -- --project=unit
npx playwright install chromium
npm run test -- --project=storybook
npm run build
```

`npm run test` は単体テストと Storybook のブラウザテストをまとめて実行します。Storybook 単体は `npm run storybook` で確認できます。ファイル監視数の制限で Steiger が `EMFILE` になる環境では、`CHOKIDAR_USEPOLLING=1 npm run lint` を使用できます。

`npm run build` はアイコン生成、Next.js の静的出力、Pagefind のインデックス生成を順に行い、公開用ファイルを `out/` に出力します。PRでは lint・テスト・ビルドを実行し、`master` への push 時に GitHub Pages へデプロイします。
