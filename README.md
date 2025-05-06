This is a [Next.js](https://nextjs.org/) project bootstrapped with
[`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

You can start editing the page by modifying `app/page.tsx`. The page
auto-updates as you edit the file.

This project uses
[`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to
automatically optimize and load Inter, a custom Google Font.

## サイト内検索

このサイトでは Pagefind を使用したサイト内検索機能を実装しています。

### 開発環境でのサイト内検索

開発環境でサイト内検索を使用するには、以下の手順で行います：

```bash
# 開発サーバーを起動するだけで自動的にインデックスが作成されます
npm run dev
```

`npm run dev`コマンドは以下の処理を行います：

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out
[the Next.js GitHub repository](https://github.com/vercel/next.js/) - your
feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our
[Next.js deployment documentation](https://nextjs.org/docs/deployment) for more
details.
