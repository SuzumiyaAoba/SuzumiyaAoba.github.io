---
title: パラメータ化テスト
llm: true
co-author: ["Claude Opus 4.7"]
---

## パラメータ化テスト

「同じテストロジックを、**いろんな値で何回もやりたい**」ということは、よくあります。
たとえば、`isPositive(int)` をテストするときに、

- `1` のとき `true`
- `2` のとき `true`
- `100` のとき `true`
- `0` のとき `false`
- `-1` のとき `false`

と、入力ごとに `@Test` メソッドを 5 個書くのは、見るからに無駄です。

そういうときに使うのが、**パラメータ化テスト**（parameterized test）です。

---

## 依存をひとつ追加する

パラメータ化テストは、JUnit 5 の**追加モジュール**である `junit-jupiter-params` に入っています。
ふだんは、`junit-jupiter` を依存に書いておけば、これも一緒に取得されます（推移的依存関係、第31章）。

Maven なら、

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.11.3</version>
    <scope>test</scope>
</dependency>
```

これだけで OK です。`junit-jupiter` には、`junit-jupiter-params` も含まれています。

---

## `@ParameterizedTest` と `@ValueSource`

もっとも簡単なパラメータ化テストです。

```java
package com.example;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CalculatorTest {

    Calculator calc;

    @BeforeEach
    void setUp() {
        calc = new Calculator();
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 100})
    void positives(int n) {
        assertTrue(calc.isPositive(n));
    }
}
```

ポイントは次のとおりです。

- **`@ParameterizedTest`** … 「これはパラメータ化テストだ」と示す
- **`@ValueSource(ints = {1, 2, 3, 100})`** … 渡す値の一覧
- **メソッド引数 `int n`** … 1 つずつ値が代入される

実行すると、

```text
[INFO] Tests run: 4, Failures: 0, Errors: 0
```

**1 つのメソッドから、4 つのテスト**が走ったことになります。
レポート上も、`[1] 1`、`[2] 2`、`[3] 3`、`[4] 100` のように個別に表示されます。

### `@ValueSource` で渡せる型

`@ValueSource` は、シンプルな**1 種類の値**だけを渡せます。

| 属性 | 型 | 例 |
|---|---|---|
| `ints` | `int[]` | `ints = {1, 2, 3}` |
| `longs` | `long[]` | `longs = {1L, 2L}` |
| `doubles` | `double[]` | `doubles = {1.1, 2.2}` |
| `strings` | `String[]` | `strings = {"a", "b"}` |
| `booleans` | `boolean[]` | `booleans = {true, false}` |
| `classes` | `Class<?>[]` | `classes = {Integer.class}` |

「**入力 1 つ → 結果**」の検証なら、`@ValueSource` で十分です。

---

## `@CsvSource` ― 複数の値をセットで渡す

「**入力2つ → 期待値**」のように、複数の値をセットで渡したいときは、**`@CsvSource`** を使います。

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CalculatorTest {

    @ParameterizedTest
    @CsvSource({
        "1, 2, 3",
        "10, 20, 30",
        "-1, 1, 0",
        "0, 0, 0"
    })
    void addsParametrized(int a, int b, int expected) {
        assertEquals(expected, new Calculator().add(a, b));
    }
}
```

各行が CSV のように `,` で区切られて、**メソッドの引数に順番に**入ります。
4 行あるので、テストも 4 回走ります。

### 文字列を含めるとき

```java
@CsvSource({
    "Java,    Hello, Java!",
    "Maven,   Hello, Maven!"
})
```

`,` を含む文字列を入れたいときは、**ダブルクォートで囲み**ます。

```java
@CsvSource({
    "'Java, Modern', 'Hello, Java, Modern!'"
})
```

シングルクォートも CSV 内では使えます（属性に `quoteCharacter` がないかぎり）。
このように、`@CsvSource` は意外と表現力があります。

### ヘッダーで読みやすく

入力の意味がパッとわかるように、**1 行目をヘッダーにする**こともできます。

```java
@ParameterizedTest
@CsvSource(useHeadersInDisplayName = true, textBlock = """
    a, b, expected
    1, 2, 3
    10, 20, 30
    -1, 1, 0
    """)
void addsParametrized(int a, int b, int expected) {
    assertEquals(expected, new Calculator().add(a, b));
}
```

テキストブロック（第28章）を使って、**表のように書ける**のがうれしいところです。
テスト結果には、ヘッダー名と組み合わせた読みやすい表示名が出ます。

---

## 他のソース ― `@MethodSource` と `@CsvFileSource`

### `@MethodSource` ― メソッドからデータを供給する

データが多くなる、複雑なオブジェクトを渡したい、というときは、**`@MethodSource`** が便利です。

```java
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import java.util.stream.Stream;

class CalculatorTest {

    @ParameterizedTest
    @MethodSource("additionCases")
    void addsFromMethodSource(int a, int b, int expected) {
        assertEquals(expected, new Calculator().add(a, b));
    }

    static Stream<Arguments> additionCases() {
        return Stream.of(
            Arguments.of(1, 2, 3),
            Arguments.of(10, 20, 30),
            Arguments.of(-1, 1, 0)
        );
    }
}
```

`Stream<Arguments>` を返す `static` メソッドを書き、`@MethodSource("メソッド名")` で参照します。
**ロジックでテストケースを作りたい**ときに重宝します。

### `@CsvFileSource` ― 外部 CSV ファイルから読む

膨大なデータがあるときは、CSV ファイル（`src/test/resources/cases.csv`）から読み込めます。

```java
@ParameterizedTest
@CsvFileSource(resources = "/cases.csv", numLinesToSkip = 1)
void addsFromFile(int a, int b, int expected) {
    assertEquals(expected, new Calculator().add(a, b));
}
```

CSV はビジネスサイドのテスターと共有しやすい形式なので、業務システムでよく使われます。

---

## どれを使うか ― 選択の指針

| こんな場合 | 使うソース |
|---|---|
| 値が 1 つ、シンプルな型 | `@ValueSource` |
| 値が複数、すぐ書ける | `@CsvSource` |
| 値が多い、見やすく書きたい | `@CsvSource` + `textBlock` |
| データの生成にロジックが必要 | `@MethodSource` |
| データが大量・別管理したい | `@CsvFileSource` |

入門段階では、まず **`@ValueSource` と `@CsvSource`** を使えるようになれば十分です。

---

## まとめ

- 同じロジックを複数入力で試したいときは、**`@ParameterizedTest`**
- 1 つの値だけ渡すなら **`@ValueSource`**
- 複数の値をまとめて渡すなら **`@CsvSource`**（テキストブロックで表のように書ける）
- ロジックで生成するなら **`@MethodSource`**、ファイル管理なら **`@CsvFileSource`**
- パラメータ化テストは、テスト 1 つから**複数のテストケース**が生まれます

次の節では、**例外**や**タイムアウト**といった、より高度な検証を学びます。
