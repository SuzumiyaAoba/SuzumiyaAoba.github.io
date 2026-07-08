---
title: チェック例外と非チェック例外
llm: true
co-author: ["Claude Opus 4.7"]
---

## チェック例外と非チェック例外

第20章で学んだとおり、Java の例外には大きく 2 種類あります。

| 種類 | 親クラス | 例 |
|---|---|---|
| **チェック例外**（checked） | `Exception` を継承（`RuntimeException` 以外） | `IOException`、`SQLException` |
| **非チェック例外**（unchecked） | `RuntimeException` を継承 | `NullPointerException`、`IllegalArgumentException` |

違いは「**呼び出し側に処理を強制するかどうか**」です。

- チェック例外 → `try-catch` か `throws` が**必須**（コンパイルエラー）
- 非チェック例外 → 自由。書かなくてもコンパイルが通る

---

## どちらを使うかの議論

「チェック例外と非チェック例外、どちらを使うべきか?」は、Java の世界で長く議論されてきたテーマです。
本書では、**現代の Java での主流の考え方**を紹介します。

> 「**ふつうは非チェック例外**を使う。
> チェック例外は、**呼び出し側が現実的にリカバリできる場合**にだけ使う」

これは、Effective Java（Joshua Bloch 著）や、Spring・Hibernate などの主要フレームワークが採用している方針でもあります。

---

## なぜ「ふつうは非チェック例外」なのか

チェック例外には、設計上の欠点があります。

### 1. 呼び出し側に「とりあえず `throws`」を強要する

```java
public void process() throws IOException, SQLException, ParseException, /* … */ {
    ...
}
```

メソッドのシグネチャに、**例外がずらずら並ぶ**ことになります。
呼び出し元では、`try-catch` か `throws` を**書かないと**コンパイルが通りません。

### 2. ラッピングが多発する

```java
try {
    doSomething();   // IOException を投げる
} catch (IOException e) {
    throw new RuntimeException(e);   // 結局ラップして投げる
}
```

「自分には対処できない」と分かっていて、`catch` → `throw new RuntimeException` を**機械的に書く**羽目になります。
コードノイズが多いだけで、何の価値もありません。

### 3. ラムダ式と相性が悪い

第22章のラムダ式は、**チェック例外を投げる関数型インターフェース**を直接サポートしていません。

```java
list.stream()
    .map(item -> doSomething(item))   // doSomething が IOException を投げると…
    .toList();                          // コンパイルエラー
```

ストリーム API でファイルを扱おうとして、ここで詰むのは「Java 入門者あるある」です。

---

## いつチェック例外を使う?

それでも、チェック例外を使うのが妥当な場面はあります。

> **「呼び出し側が、その例外をきちんと意識して、リカバリ処理を書くべき」場合**

たとえば、

- ファイル読み込み失敗 → ユーザーに**別のファイルを選ばせる**
- ネットワーク接続失敗 → **再試行する**
- パース失敗 → **デフォルト値で続行する**

このような「**呼び出し側にとっての対処が、意味ある分岐**」になるなら、チェック例外が向いています。
逆に、

- 設定ファイル読み込み失敗 → 起動できない（落ちるしかない）
- DB 接続失敗 → 業務を続行できない

なら、**非チェック例外（実行時に落ちる）**で十分です。

---

## Spring / Hibernate がチェック例外を**ラップ**する理由

`JdbcTemplate` や Spring Data JPA は、JDBC の `SQLException`（チェック例外）を、

```java
DataAccessException                      ← 非チェック例外
├── DuplicateKeyException
├── DataIntegrityViolationException
├── ...
```

のような `DataAccessException` 階層（**すべて非チェック例外**）にラップしてから投げ直します。
これにより、

- 呼び出し側で `throws SQLException` を書かずに済む
- ラムダ式とも相性がよい
- それでもキャッチしたければ、`DataAccessException` で捕まえられる

という、現代的な扱いになります。
Spring 系のコードで「`throws SQLException` を書かない」のは、こういう理由です。

---

## 標準ライブラリの主な例外

参考までに、Java 標準ライブラリでよく見る例外をまとめます。

### よく見る非チェック例外（`RuntimeException`）

| 例外 | いつ起きる |
|---|---|
| `NullPointerException` | `null` のフィールドやメソッドを使った |
| `IllegalArgumentException` | 引数の値が不正 |
| `IllegalStateException` | オブジェクトの状態が、その操作にとって不正 |
| `ArithmeticException` | ゼロ除算など |
| `ClassCastException` | キャストが不正 |
| `IndexOutOfBoundsException` | 配列・リストの範囲外アクセス |
| `UnsupportedOperationException` | サポートされていない操作 |
| `NumberFormatException` | 文字列→数値の変換失敗 |

### よく見るチェック例外

| 例外 | いつ起きる |
|---|---|
| `IOException` | ファイル・ネットワークの入出力エラー |
| `InterruptedException` | スレッドが中断された |
| `SQLException` | JDBC で SQL 実行エラー（Spring ではラップされる） |
| `ParseException` | 文字列のパース失敗 |
| `TimeoutException` | タイムアウト |

業務システムでは、これらを**自分のドメイン例外でラップ**することが多いです（次節）。

---

## 自作の例外を作るときの基準

自分で例外クラスを作るときは、こう判断します。

```text line-numbers=false
これは、呼び出し側で「この例外」を意識した分岐処理を書くべきか?
  ├─ はい → チェック例外でもよい（が、ふつうは非チェック）
  └─ いいえ → 非チェック例外
```

たとえば、

- `BookNotFoundException` → 上の層で「404 を返す」とハンドリング。**非チェック**でよい
- `InsufficientStockException` → 在庫不足を伝える。やはり**非チェック**でよい
- `MalformedConfigFileException` → アプリ起動を諦めるしかない。**非チェック**でよい
- `RetryableHttpException` → 呼び出し側でリトライさせたい。**チェック例外**もアリ

ふつうは、**ほぼ非チェック例外を選ぶ**ことになります。

---

## チェック例外を非チェックに変換する

既存のチェック例外を、自分のドメイン例外（非チェック）に**ラップして投げ直す**のは、よくあるパターンです。

```java
public void load(Path path) {
    try {
        String content = Files.readString(path);
        ...
    } catch (IOException e) {
        throw new ConfigLoadException("設定ファイルの読み込みに失敗: " + path, e);
    }
}
```

`ConfigLoadException` は `RuntimeException` を継承させて、非チェックにしておきます。
`e` を**第 2 引数**で渡しているのが大事です。これで、元の `IOException` が**スタックトレースに残り**、原因追跡ができます（**例外チェーン**）。

```java
public class ConfigLoadException extends RuntimeException {
    public ConfigLoadException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

---

## まとめ

- 例外には **チェック例外** と **非チェック例外** がある
- 現代の Java では、**ふつうは非チェック例外**を使う
- チェック例外は、「**呼び出し側がリカバリすべき**」場合にだけ使う
- Spring / Hibernate は `SQLException` などを**非チェックにラップ**して投げる
- 自作例外は、**`RuntimeException` を継承**するのが基本
- チェック例外をラップするときは、**原因例外 `cause` を渡す**

次の節では、業務エラーを表現する**ドメイン例外**の設計を学びます。
