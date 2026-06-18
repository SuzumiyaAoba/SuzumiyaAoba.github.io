---
title: はじめに ― この章で学ぶこと
llm: true
---

## はじめに ― この章で学ぶこと

前の章までで、

- **DI コンテナ**でクラスを組み立て（第36章）
- **データベース**にデータを永続化する（第37章）

ところまで来ました。
あとは、これを**外の世界に公開**できれば、立派な業務アプリケーションのできあがりです。

世界に公開する手段の中で、もっとも標準的なのが **REST API**（レスト・エーピーアイ）です。
**HTTP** という共通言語を使って、**JSON** をやり取りするしくみ ―― それを Java の世界で動かすために、**Spring Boot** を使います。

---

## REST API ってなんで作るんだっけ?

REST API は、

- **Web ブラウザ**から、JavaScript で叩く（フロントエンド分離）
- **モバイルアプリ**（iOS / Android）から叩く
- **他のサーバー**から叩く（マイクロサービス間連携）
- **CLI ツール**から叩く

など、**いろんな利用者**から呼ばれる**入口**になります。
1 つの REST API を作っておけば、Web ・モバイル・サーバー連携をぜんぶサポートできる ―― それが REST の魅力です。

---

## この章のテーマ

本書のサンプルは、第37章で作った `library` プロジェクトに、Web 層を**追加するかたち**で進めます。

```text
HTTP リクエスト
       ↓
@RestController       ← この章の主役
       ↓
@Service              ← 第36章で作ったビジネスロジック
       ↓
@Repository           ← 第37章で作った DB アクセス
       ↓
データベース
```

`pom.xml` には、新しく **`spring-boot-starter-web`** と **`spring-boot-starter-validation`** を追加します。

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

`spring-boot-starter-web` を入れると、内蔵 Tomcat と Jackson（JSON ライブラリ）が一緒についてきます。
`-validation` は、リクエストの入力チェックに使います。

サンプルは、**Spring Boot 3.5・Java 25** で実機検証しています。

---

## この章で学ぶこと

第38章は、次の8つの節で構成されています。

| 節 | タイトル | 内容 |
|---|---|---|
| 1 | REST とは | HTTP メソッドとリソース指向 |
| 2 | `@RestController` の基本 | 最小の REST API を書く |
| 3 | パス変数とクエリパラメータ | `@PathVariable` / `@RequestParam` |
| 4 | リクエストボディ | `POST` と `@RequestBody` |
| 5 | バリデーションとステータス | `@Valid` と HTTP ステータス |
| 6 | 例外ハンドリング | `@RestControllerAdvice` |
| 7 | よくあるつまずき | エンティティを返さない・CORS など |

前半（1〜3節）で、**取得系**の API を作ります。
中盤（4〜5節）で、**書き込み系**と**入力検証**を扱います。
後半（6〜7節）で、**エラーレスポンス**と現場での落とし穴を整理します。

---

## この章を読み終えると

第38章を読み終えるころには、次のことができるようになっています。

- REST の基本概念（リソース、HTTP メソッド、ステータスコード）を説明できる
- `@RestController` で、GET / POST / DELETE の API を書ける
- パス変数・クエリ・リクエストボディを、ハンドラに受け取れる
- バリデーションエラー時に、適切な HTTP ステータスを返せる
- ドメイン例外を、グローバルにハンドリングできる
- エンティティと DTO を分けて、安全に JSON を返せる

---

> **補足: REST と RESTful の違い**
>
> 厳密には、REST は Roy Fielding が論文で定義したアーキテクチャ・スタイルです。
> 実務で「REST API」と言うときは、**HTTP + JSON で、リソース指向に作った API**くらいの意味で、それを RESTful API と呼ぶこともあります。
> 本書もその慣習に従って、両者をだいたい同じ意味で使います。

それでは、最初の節「REST とは」から始めましょう。
