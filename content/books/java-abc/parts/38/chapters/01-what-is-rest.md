---
title: REST とは
llm: true
co-author: ["Claude Opus 4.7"]
---

## REST とは

**REST**（Representational State Transfer）は、HTTP の上で**リソースを操作する**ように設計された API のスタイルです[^rest-fielding]。
ひとことで言うと、

> 「**URL でリソースを示し、HTTP メソッドで操作の意味を表す**」

というのが、REST の考え方です。

---

## リソースと URL

REST では、扱う対象を**リソース**（resource、資源）と呼びます。
そして、リソースには**それぞれ URL を付ける**のがルールです。

たとえば「本」をリソースとすると、

| URL | 何を表す |
|---|---|
| `/api/books` | 本の**コレクション**（全体） |
| `/api/books/1` | ID が `1` の本（1 件） |
| `/api/books/1/reviews` | ID が `1` の本のレビュー一覧 |

このように、**URL は「名詞」**で書きます。
`/api/createBook` のような「動詞」入りの URL は、REST では使いません。
動詞は、**HTTP メソッド**が担います。

---

## HTTP メソッドで「何をするか」を示す

REST では、**5 つの HTTP メソッド**を主に使います。

| メソッド | 用途 | 例 |
|---|---|---|
| **GET** | 取得 | `GET /api/books` → 全件取得 |
| **POST** | 新規作成 | `POST /api/books` → 本を追加 |
| **PUT** | 全体置換 | `PUT /api/books/1` → 本を上書き |
| **PATCH** | 部分更新 | `PATCH /api/books/1` → 一部だけ変更 |
| **DELETE** | 削除 | `DELETE /api/books/1` → 本を削除 |

「**URL（リソース）+ HTTP メソッド（操作）= 何をするか**」が、REST の基本構造です。

```text
GET /api/books         → 本の一覧を取得
GET /api/books/1       → ID=1 の本を取得
POST /api/books        → 本を 1 つ新規作成
PUT /api/books/1       → ID=1 の本を上書き
PATCH /api/books/1     → ID=1 の本を部分更新
DELETE /api/books/1    → ID=1 の本を削除
```

URL を見ただけで、何が起きるか想像できる ―― これが REST のうれしさです。

---

## HTTP ステータスコード ― 結果を 3 桁の数字で

REST API は、結果も**標準的な 3 桁の数字**で返します[^rfc9110]。

| コード | 名前 | 意味 |
|---|---|---|
| **200 OK** | 成功 | 取得・更新が成功 |
| **201 Created** | 作成成功 | POST で新規作成された |
| **204 No Content** | 空の成功 | DELETE 成功・更新成功（本文なし） |
| **400 Bad Request** | 入力が悪い | バリデーションエラー |
| **401 Unauthorized** | 認証が必要 | ログインしていない |
| **403 Forbidden** | 権限がない | ログインしているが操作不可 |
| **404 Not Found** | 見つからない | リソースが存在しない |
| **409 Conflict** | 競合 | 一意制約違反など |
| **422 Unprocessable Entity** | 内容が無効 | 業務的に意味が通らない |
| **500 Internal Server Error** | サーバー側のバグ | 想定外の例外 |

クライアント側のミスは **4xx**、サーバー側のミスは **5xx**、と覚えれば大丈夫です。

---

## REST の基本ルール ― 6 つあるけど、まず 3 つ

Roy Fielding の論文には 6 つの制約が書かれていますが、入門段階で押さえてほしいのは次の 3 つです。

### 1. リソース指向

URL は**リソース（名詞）**を表す。
動詞は HTTP メソッドが担う。

### 2. ステートレス

各リクエストには**それだけで処理に必要な情報**が含まれていて、
サーバー側は**前のリクエストの状態を覚えていない**という設計です。

これにより、

- サーバーを**ロードバランサーで並列化**しやすい
- 失敗時の**リトライ**が安全

になります。
逆に言うと、「ログイン状態」のような**状態**は、**トークン**で毎回送る、という設計になります。

### 3. 統一インターフェース

すべての API が、**同じパターン**（URL + HTTP メソッド + JSON）で操作できる。
特殊な扱いがないので、新しい API でも**すぐ使い方が分かる**。

---

## JSON ― REST の事実上の共通フォーマット

REST API では、リクエストもレスポンスも、**JSON**（JavaScript Object Notation）でやり取りするのがほぼ標準です。
たとえば、

```text
GET /api/books/1
```

のレスポンスは、

```json
{
  "id": 1,
  "title": "Java入門",
  "author": "鈴木",
  "publishedYear": 2026
}
```

のような JSON になります。
Spring Boot では、**Jackson** というライブラリが、Java オブジェクトと JSON を自動で相互変換してくれます。
私たちが手で JSON 文字列を組み立てる必要はありません。

---

## URL 設計のコツ

実務でよく出てくる URL 設計のコツを、いくつかまとめておきます。

### 1. パスは「名詞の複数形」

`/books`、`/users`、`/orders` のように、**複数形**を使うのが慣習です。
「全体（コレクション）と個別（要素）」を区別しやすくなります。

### 2. ID はパスに

`/books/1` のように、リソースの**識別子はパスの中**に書きます。
`/books?id=1` のように、クエリで指定する流派もありますが、REST では一般的でありません。

### 3. 検索や絞り込みはクエリで

`/books?author=鈴木&year=2026` のように、**条件は `?` 以降のクエリ**で指定します。

### 4. 動詞を URL に入れない

`POST /createBook` ・`GET /searchBooks` のような「動詞 URL」は、REST 的ではありません。
HTTP メソッド + リソース URL で十分です。
ただし、業務システムでは「動詞 URL を完全に避けるのは難しい」場面もあり、現実的な妥協も必要です。

### 5. ネストは深くしない

`/users/1/orders/2/items/3/comments/4` のような深いネストは、

- 読みづらい
- 例外パターンが多い
- API のテストが大変

なので、避けるのが定石です。**2 階層まで**がよい目安です。

---

## REST 以外の選択肢

最後に、REST 以外の代表的な選択肢にも触れておきます。

| 種類 | 特徴 |
|---|---|
| **REST** | HTTP + JSON。広く普及 |
| **GraphQL** | クライアントが必要なフィールドを宣言。柔軟だが学習コストあり |
| **gRPC** | バイナリ + Protocol Buffers。マイクロサービスで人気 |
| **WebSocket** | サーバーからもプッシュできる、双方向通信 |

業務システムでは、まず **REST から始める**のが鉄板です。
慣れたら、用途に応じて他も検討する、という順番がいいでしょう。

---

## まとめ

- REST は **URL でリソース**、**HTTP メソッドで操作**を表す API スタイル
- 5 つの HTTP メソッド（GET・POST・PUT・PATCH・DELETE）
- 結果は **3 桁のステータスコード**で表現
- リソース指向・ステートレス・統一インターフェースが基本
- リクエスト/レスポンスは **JSON** が事実上の標準
- URL は**名詞の複数形**、ID はパスに、検索はクエリに

次の節では、**`@RestController`** で、いちばん小さな API を書いていきます。

[^rest-fielding]: Roy T. Fielding, *Architectural Styles and the Design of Network-based Software Architectures*（PhD dissertation, UC Irvine, 2000）, [https://ics.uci.edu/~fielding/pubs/dissertation/top.htm](<https://ics.uci.edu/~fielding/pubs/dissertation/top.htm>)。REST（Representational State Transfer）は Fielding が博士論文の第5章で提唱したアーキテクチャスタイル。クライアント・サーバ、ステートレス、キャッシュ可能、統一インタフェース、階層化システム、コードオンデマンドの6つの制約からなる。

[^rfc9110]: IETF RFC 9110: HTTP Semantics, [https://www.rfc-editor.org/rfc/rfc9110](<https://www.rfc-editor.org/rfc/rfc9110>)。HTTP のメッセージ、メソッド（GET、POST など）、ステータスコード（200、404、500 など）、ヘッダの意味論を規定する。RFC 7230〜7235、RFC 5789（PATCH）等を統合・改訂した最新仕様（2022年公開）。
