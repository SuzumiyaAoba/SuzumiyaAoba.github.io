---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

第38章では、Spring Boot を使った REST API の設計と実装を学びました。
節ごとに、言葉を整理しておきます。

---

## REST の基礎（第1節）

| 用語 | 英語・読み | 意味 |
|---|---|---|
| REST | Representational State Transfer | HTTP 上でリソース指向に設計された API スタイル |
| RESTful | ― | REST 的に作られた API（実務での慣用） |
| リソース | resource | API の対象（本、ユーザー、注文など） |
| HTTP メソッド | ― | GET / POST / PUT / PATCH / DELETE |
| ステータスコード | ― | 200 / 201 / 204 / 400 / 401 / 403 / 404 / 409 / 422 / 500 |
| ステートレス | stateless | サーバーが状態を覚えない設計 |
| 統一インターフェース | uniform interface | すべての API が同じパターン |
| JSON | ― | リクエスト/レスポンスの事実上の標準形式 |

---

## コントローラ（第2節）

| 用語 | 意味 |
|---|---|
| `@RestController` | REST API 用のコントローラ。戻り値が JSON 化される |
| `@RequestMapping("/...")` | クラス全体の URL の先頭を指定 |
| `@GetMapping` / `@PostMapping` / `@PutMapping` / `@DeleteMapping` | HTTP メソッドごとのアノテーション |
| Jackson | Java ⇔ JSON 変換ライブラリ |
| DTO | Data Transfer Object。API でやり取りする値オブジェクト（record で書く） |

---

## パラメータの受け取り（第3節）

| 用語 | 意味 |
|---|---|
| `@PathVariable` | URL のパスの一部を受け取る |
| `@RequestParam` | クエリパラメータ（`?key=value`）を受け取る |
| `required` / `defaultValue` | クエリの必須/任意/既定値 |
| `Pageable` | ページング情報をまとめて受け取る |
| `@RequestHeader` | HTTP ヘッダーを受け取る |

---

## リクエストボディ（第4節）

| 用語 | 意味 |
|---|---|
| `@RequestBody` | ボディの JSON を Java オブジェクトに変換して受け取る |
| `ResponseEntity<T>` | ステータス・ヘッダー・ボディを細かく組み立てる |
| `@ResponseStatus` | メソッドのレスポンスステータスを指定 |
| `Location` ヘッダー | 201 Created で新リソースの URL を返す |
| PUT / PATCH | 全体更新 / 部分更新 |

---

## バリデーション（第5節）

| 用語 | 意味 |
|---|---|
| `spring-boot-starter-validation` | Jakarta Bean Validation + Hibernate Validator |
| `@Valid` | バリデーションを実行する宣言 |
| `@NotNull` / `@NotBlank` / `@NotEmpty` | null・空白・空のチェック |
| `@Min` / `@Max` / `@Size` | 数値・長さの制限 |
| `@Email` / `@Pattern` | 形式チェック |
| `MethodArgumentNotValidException` | バリデーション失敗時に投げられる例外 |
| カスタムバリデーション | 自作の `ConstraintValidator` |

---

## 例外ハンドリング（第6節）

| 用語 | 意味 |
|---|---|
| `@ResponseStatus` | 例外クラスにステータスを付与 |
| `@ExceptionHandler` | 特定例外を処理するメソッド |
| `@RestControllerAdvice` | 全コントローラ共通の例外ハンドラ |
| ProblemDetail | RFC 7807 標準のエラーレスポンス形式（Spring 6+ 標準対応） |
| 最後の保険 | `@ExceptionHandler(Exception.class)` で 500 を返す |

---

## つまずき（第7節）

| 用語 | 意味 |
|---|---|
| JSON 無限ループ | 双方向関連で起きる再帰 |
| CORS | Cross-Origin Resource Sharing。ブラウザの安全機構 |
| `MockMvc` | Tomcat を起動せずにコントローラをテスト |
| Content-Type | リクエスト/レスポンスの形式（JSON / CSV / ...） |
| `@CrossOrigin` | 別オリジンからの呼び出しを許可 |

---

## おわりに ― 業務 Web API の入口に立ちました

第38章で、Spring Boot を使った REST API の**基本パターン**を学び終えました。
ここまで学んだ知識を組み合わせれば、

- ユーザー認証なしの**シンプルな業務 API**
- フロントエンドと組み合わせた **SPA バックエンド**
- マイクロサービス間の**内部 API**

は、もう作れる状態です。
ここからは、これを「**実務で運用できるレベル**」に仕上げていく話に入ります。

次の第39章は、**エラーハンドリングと例外設計**です。
本章では入口だけ示した「**例外のドメイン設計**」を、もう一段掘り下げます。
業務システムで「**業務エラー**」を、どんなクラス階層・どんなレスポンスで表現するか ―― それを学んでいきましょう。
