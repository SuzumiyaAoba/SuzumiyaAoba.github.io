---
name: awesome
description: ユーザーから渡された URL・説明・メモをもとに、このリポジトリの Awesome Something に項目を追加・統合するときに使う。
---

# Awesome Something に項目を追加する

ユーザーが提供した情報を `content/awesome-something.yaml` の `items` に反映する。根拠のある情報だけを記録し、必須情報が不足するときはユーザー提供の URL にある一次情報を確認する。確認できない情報は創作せず、ユーザーに確認する。

作業前に `README.md` の「Awesome Something の記録」、`content/awesome-something.yaml` の最新データ、`src/foundation/pages/awesome-something/index/model/awesome-categories.ts` のカテゴリ、`src/foundation/pages/awesome-something/index/model/awesome-item.ts` のスキーマを確認する。既存項目との照合と検証には `src/foundation/pages/awesome-something/index/model/awesome-catalog.test.ts` と `src/foundation/pages/awesome-something/index/model/awesome-item.test.ts` を参照する。

- 既存項目を ID・名称・公式 URL で照合する。同じ対象があれば重複登録せず、提供情報で裏付けられる新情報だけを統合する。追加情報がなければ変更しない。同一性や既存情報との矛盾を判断できない場合は、推測で変更せず確認する。
- カテゴリとサブカテゴリは既存分類を優先し、主な用途・分野で選ぶ。意図や主用途を判断する情報が足りない場合に限り、必要な情報を確認する。提供形態や技術はタグにする。
- 必須項目は `id`、`name`、`category`、`subcategory`、`description`。`description` は既存項目に合わせ、用途と特徴を簡潔な日本語で説明する。ID は重複しない英小文字・数字・ハイフンの kebab-case にする。公式サイトは `websiteUrl`、GitHub リポジトリは `githubUrl`、外部記事は `articles`、このサイトの記事は `relatedPosts` に記録する。任意項目は情報が分かる場合だけ記入し、不明なら省略する。独自フィールドは追加しない。
- URL は `websiteUrl`、`githubUrl`、`articles` には HTTP(S) を使う。`relatedPosts` は HTTP(S) URL または `/` から始まるサイト内パスを使う。記事リンクは URL 文字列、または `url` と任意の `title` を持つオブジェクトで記入する。
- 既存項目の順序を保ち、追加位置の指定がなければ新項目を末尾に加える。リストの記載順が表示順になる。

編集後、次の Awesome 関連テストを実行する。`awesome-catalog.test.ts` は実際の `content/awesome-something.yaml` を読み、項目が有効な分類ルートから一度ずつ見つかることとカテゴリ件数を確認する。

```sh
rtk npm run test -- --project=unit src/foundation/pages/awesome-something/index/model/awesome-catalog.test.ts src/foundation/pages/awesome-something/index/model/awesome-item.test.ts
```

失敗した場合は出力を確認し、今回の項目に関係する問題を直して再実行する。結果と、追加・統合・変更なしの判断をユーザーに簡潔に伝える。
