# シリーズ定義

このディレクトリには、ブログ記事のシリーズ定義 JSON ファイルを配置します。

## ファイル形式

各シリーズは個別の JSON ファイルとして定義します。ファイル名は `{slug}.json` の形式にすることを推奨します。

```json
{
  "name": "シリーズの表示名",
  "slug": "series-url-slug",
  "description": "シリーズの説明（オプショナル）",
  "posts": [
    "2024-01-01-first-post",
    "2024-01-02-second-post",
    "2024-01-03-third-post"
  ]
}
```

## フィールドの説明

- **name** (必須): シリーズの表示名
- **slug** (必須): URL で使用される slug（例: `/series/series-url-slug/`）
- **description** (オプショナル): シリーズの説明文
- **posts** (必須): シリーズに含まれる記事の slug の配列（順序通り）

## posts 配列について

`posts` 配列には、記事のディレクトリ名（slug）を順序通りに記載します。
この順序がシリーズページや前後の記事ナビゲーションで使用されます。

例: `src/contents/blog/2024-12-19-scala-cats/index.mdx` の記事の場合、
slug は `2024-12-19-scala-cats` となります。

## 新しいシリーズの追加方法

1. このディレクトリに新しい JSON ファイルを作成（例: `my-new-series.json`）
2. 上記の形式で JSON を記述
3. `posts` 配列にシリーズに含めたい記事の slug を順序通りに記載
4. ビルド時に自動的に読み込まれます

## 注意事項

- JSON ファイルの形式が正しくない場合、ビルド時にエラーが発生します
- `posts` 配列に記載された記事が存在しない場合、警告が表示されますが、ビルドは継続されます
- 記事側のフロントマターに `series` フィールドを記載する必要はありません（記載しても無視されます）

## 例

### Scala Cats 型クラス シリーズ

**ファイル名**: `scala-cats-typeclass.json`

```json
{
  "name": "Scala Cats 型クラス",
  "slug": "scala-cats-typeclass",
  "description": "Scala Cats ライブラリの型クラスについて学ぶシリーズ",
  "posts": [
    "2024-12-19-scala-cats",
    "2024-12-20-scala-cats-eq",
    "2024-12-21-scala-cats-order"
  ]
}
```

このシリーズは以下の URL でアクセスできます:
`https://your-site.com/series/scala-cats-typeclass/`
