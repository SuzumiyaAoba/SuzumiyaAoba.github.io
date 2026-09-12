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
