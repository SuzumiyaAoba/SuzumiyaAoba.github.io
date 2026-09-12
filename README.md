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

MDX のコンパイルは `shared/lib/mdx/render-mdx.tsx`、AST変換は個別のプラグイン、目次抽出は `toc.ts` が担当します。重いチャートやコード表示は使用する記事で遅延読み込みします。グラフの凡例操作・ツールチップ・模様定義と、目次の監視・位置計算もそれぞれ表示本体から分離しています。

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
