---
title: テストのライフサイクル
llm: true
co-author: ["Claude Opus 4.7"]
---

## テストのライフサイクル

前の節の終わりで、こんなコードを見ました。

```java
class CalculatorTest {

    @Test
    void addsTwoNumbers() {
        assertEquals(5, new Calculator().add(2, 3));   // ① new
    }

    @Test
    void addsZero() {
        assertEquals(7, new Calculator().add(7, 0));   // ② new
    }

    @Test
    void addsNegative() {
        assertEquals(-1, new Calculator().add(2, -3)); // ③ new
    }
}
```

`new Calculator()` が、3 か所に書かれています。
こうした**共通の準備**を、1 か所にまとめるしくみが **テストのライフサイクル**です。

---

## 4 つのライフサイクルアノテーション

JUnit 5 には、テストの**前後**で自動的に呼ばれるメソッドを宣言する 4 つのアノテーションがあります。

| アノテーション | いつ呼ばれる | 用途 |
|---|---|---|
| `@BeforeAll` | テストクラスで**1 回だけ**、最初に | 重い共通リソースの準備（DB 接続など） |
| `@BeforeEach` | **各テストの直前**ごとに | テスト対象の準備（`new` するなど） |
| `@AfterEach` | **各テストの直後**ごとに | 後始末（一時ファイル削除など） |
| `@AfterAll` | テストクラスで**1 回だけ**、最後に | 重いリソースの解放（DB 切断など） |

実行順をフローにすると、こうなります。

```text
@BeforeAll
├── @BeforeEach
│   テスト1
├── @AfterEach
├── @BeforeEach
│   テスト2
├── @AfterEach
├── @BeforeEach
│   テスト3
└── @AfterEach
@AfterAll
```

---

## `@BeforeEach` で準備を共通化する

最初の例を、`@BeforeEach` で書き直してみます。

```java
package com.example;

import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class CalculatorTest {

    Calculator calc;     // フィールドにして共有

    @BeforeEach
    void setUp() {
        calc = new Calculator();   // 各テストの直前に新品を用意
    }

    @Test
    void addsTwoNumbers() {
        assertEquals(5, calc.add(2, 3));
    }

    @Test
    void addsZero() {
        assertEquals(7, calc.add(7, 0));
    }

    @Test
    void addsNegative() {
        assertEquals(-1, calc.add(2, -3));
    }
}
```

3 回書いていた `new Calculator()` が、`@BeforeEach` の 1 か所だけになりました。

このとき、**テストごとに `calc` が新品になる**ことが大事です。
3 つの `@Test` が、**同じ `Calculator` インスタンス**を共有してしまうと、

- テスト1 が `calc` に変な状態を残す
- そのせいで、テスト2 が思わぬ結果になる

という、**テストどうしの干渉**が起きます。
`@BeforeEach` のおかげで、**各テストは独立**して動きます。これがユニットテストの大原則です。

---

## 「テストはなぜ毎回 new しないといけないか」 ― JUnit のインスタンスのしくみ

実は、JUnit 5 は、**テストメソッドごとに、テストクラスのインスタンスを new し直しています**。

```text
テストメソッドが3つあるテストクラス → CalculatorTest が 3 回 new される
```

これは、各テストを**独立**させるための設計です。
あるテストが書き換えたフィールドの状態が、次のテストに**漏れない**ようになっています。

つまり、`calc` フィールドも、テストごとに**新しい `CalculatorTest` インスタンスのフィールド**として、まっさらな状態から始まる、というわけです。
`@BeforeEach` は、その**新品のインスタンス**に対して初期化を行います。

> **補足: JUnit 4 とは違う**
>
> JUnit 4 では `@Before` という名前でした。JUnit 5 は **`@BeforeEach`** と「Each」が付くようになりました。
> 同じく、`@After` → `@AfterEach`、`@BeforeClass` → `@BeforeAll`、`@AfterClass` → `@AfterAll` に名前が変わっています。

---

## `@AfterEach` で後始末をする

ファイルを開く、一時的なフォルダを作る、DB に書き込むなど、**後始末が必要な処理**が絡むテストでは、`@AfterEach` を使います。

```java
import java.nio.file.*;

class FileWriterTest {

    Path tempFile;

    @BeforeEach
    void setUp() throws Exception {
        tempFile = Files.createTempFile("test", ".txt");
    }

    @AfterEach
    void tearDown() throws Exception {
        Files.deleteIfExists(tempFile);   // 後始末
    }

    @Test
    void writesText() throws Exception {
        Files.writeString(tempFile, "hello");
        assertEquals("hello", Files.readString(tempFile));
    }
}
```

このように、テストの**前**で用意し、**後**で必ず片付ける、という流れを作ることで、
**テストが失敗しても、一時ファイルが残らない**ようにできます。

---

## `@BeforeAll` / `@AfterAll` ― 重い処理は 1 度だけ

`@BeforeAll` と `@AfterAll` は、**テストクラスごとに 1 回だけ**呼ばれます。

```java
class HeavyTest {

    @BeforeAll
    static void connectToDatabase() {
        // 例: DB に接続する（時間がかかる）
    }

    @AfterAll
    static void disconnectFromDatabase() {
        // 例: DB を切断する
    }

    @Test
    void test1() { ... }

    @Test
    void test2() { ... }
}
```

注意点は **`static` をつける**ことです。
これは、JUnit 5 のテストインスタンスがテストごとに new されるしくみと関係しています。
クラス全体で 1 回しか呼ばれない処理は、**インスタンスに属さない `static`** にする必要があります。

ふだんは `@BeforeEach` で十分です。
DB の起動やファイルの読み込みなど、**時間がかかるけれど、テストの間で共有しても問題ない**処理にだけ `@BeforeAll` を使いましょう。

---

## メソッド名は何でもよい

`setUp` / `tearDown` という名前は、JUnit 3 〜 4 の名残で、いまでもよく使われる**慣習**です。
JUnit 5 では、アノテーションが付いてさえいれば**メソッド名は何でも構いません**。

```java
@BeforeEach
void newCalculatorForEachTest() {   // 内容が分かる名前でもOK
    calc = new Calculator();
}
```

長い `setUp` メソッドができてしまうくらいなら、内容に合わせて分割して、**わかりやすい名前**にするほうが読みやすいです。
ただし、`@BeforeEach` を付けたメソッドが**複数**あっても、JUnit はぜんぶ呼んでくれます（順序は保証されないので、依存しないように）。

---

## `@DisplayName` ― テスト名に日本語を付ける

JUnit 5 では、`@DisplayName`（表示名）で、テスト結果に出る名前を**自由な文字列**で付けられます。

```java
@Test
@DisplayName("正の数どうしの足し算")
void addsTwoNumbers() {
    assertEquals(5, calc.add(2, 3));
}
```

テストレポートには、メソッド名の代わりに **「正の数どうしの足し算」** が表示されます。
日本語の現場では、テスト一覧をパッと見て**何のテストか**を判別できる、便利な機能です。

---

## まとめ

- **`@BeforeEach`** で、各テストの**準備**を共通化します
- **`@AfterEach`** で、各テストの**後始末**を共通化します
- **`@BeforeAll` / `@AfterAll`** は**クラスで 1 回だけ**呼ばれる重い処理用（`static` 必須）
- JUnit 5 は、**テストごとにテストインスタンスを new し直す**ので、各テストは独立しています
- メソッド名は自由。**`@DisplayName`** で日本語の表示名も付けられます

次の節では、同じテストロジックを**複数の入力で繰り返す**「パラメータ化テスト」を学びます。
