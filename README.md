# SuzumiyaAoba ブログ

このプロジェクトは [Next.js](https://nextjs.org/) を使用して作成されたブログサイトです。

## 始め方

開発サーバーを起動するには：

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くとサイトが表示されます。

`app/page.tsx` を編集することでページの内容を変更できます。ファイルを保存すると自動的に更新されます。

このプロジェクトでは [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) を使用してフォントを最適化しています。

## サイト内検索

このサイトでは Pagefind を使用したサイト内検索機能を実装しています。

### 開発環境でのサイト内検索

開発環境でサイト内検索を使用するには、以下の手順で行います：

```bash
# 開発サーバーを起動するだけで自動的にインデックスが作成されます
npm run dev
```

`npm run dev` コマンドは以下の処理を行います：

1. 一時的にサイトをビルド
2. Pagefind を使用してインデックスを作成
3. 開発サーバーを起動

### 本番環境でのサイト内検索

本番環境のビルド時には自動的に Pagefind のインデックスが作成されます：

```bash
npm run build
```

### カスタマイズ

検索機能のカスタマイズは以下のファイルで行えます：

- `src/app/search/page.tsx` - 検索ページ
- `src/components/Search/SearchComponent.tsx` - 検索コンポーネント
- `scripts/pagefind-dev.js` - 開発環境用インデックス作成スクリプト

## さらに詳しく

Next.js についてさらに学ぶには、以下のリソースをご覧ください：

- [Next.js ドキュメント](https://nextjs.org/docs) - Next.js の機能と API について学べます
- [Learn Next.js](https://nextjs.org/learn) - Next.js の対話型チュートリアル

[Next.js GitHub リポジトリ](https://github.com/vercel/next.js/) へのフィードバックや貢献も歓迎します！

## Vercel へのデプロイ

Next.js アプリを最も簡単にデプロイする方法は、Next.js の開発元である
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) を使用することです。

詳しくは [Next.js デプロイドキュメント](https://nextjs.org/docs/deployment) をご覧ください。
