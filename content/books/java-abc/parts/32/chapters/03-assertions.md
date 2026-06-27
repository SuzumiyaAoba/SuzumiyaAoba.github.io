---
title: アサーション
llm: true
co-author: ["Claude Opus 4.7"]
---

## アサーション

**アサーション**（assertion）は、「**こうあるはず**」と断定するための道具です。
前の節では `assertEquals` を見ました。
この節では、JUnit 5 がそろえている**主要なアサーション**を、目的別に整理します。

すべて `org.junit.jupiter.api.Assertions` クラスの `static` メソッドです。
`import static org.junit.jupiter.api.Assertions.*;` と書いておくと、まとめて使えるので便利です。

---

## 等しさを確かめる ― `assertEquals` / `assertNotEquals`

もっとも使うのが、**等しさ**の検証です。

```java
assertEquals(5, calc.add(2, 3));
assertNotEquals(0, calc.add(2, 3));   // 0 とは違うはず
```

第1引数が**期待値**、第2引数が**実際値**です。
順番を逆にすると、失敗時のエラーメッセージ（`expected` / `but was`）が逆になってしまうので、**「期待値が先」**と覚えましょう。

### 浮動小数点数 ― 第3引数に許容誤差

```java
assertEquals(0.3, 0.1 + 0.2);   // ※ これは失敗する
```

実は、`0.1 + 0.2` は厳密には `0.3` になりません。第4章で学んだ、浮動小数点の誤差です。
`double` / `float` の比較には、**第3引数に許容誤差**を渡します。

```java
assertEquals(0.3, 0.1 + 0.2, 0.0001);   // 誤差 0.0001 まで許す
```

数値計算のテストでは、この**許容誤差つきの比較**が定番です。

### 文字列の等しさも `assertEquals`

```java
assertEquals("Hello, Java!", greeter.greet("Java"));
```

文字列も同じく `assertEquals` です。
`String` の比較に `==` を使ってはいけないのは第10章で学びましたが、`assertEquals` は内部で `equals` を使っているので**安心して比較できます**。

---

## 真偽を確かめる ― `assertTrue` / `assertFalse`

戻り値が `boolean` のときは、これを使います。

```java
assertTrue(calc.isPositive(1));     // true のはず
assertFalse(calc.isPositive(-1));   // false のはず
```

`assertTrue(計算結果)` は、`assertEquals(true, 計算結果)` とほぼ同じ意味ですが、こちらのほうが意図が明確です。

---

## null を確かめる ― `assertNull` / `assertNotNull`

```java
assertNull(repository.findById(999));      // 見つからないはずなので null
assertNotNull(repository.findById(1));     // 見つかるはず
```

`Optional` を返すメソッドを設計するべき場面でも、レガシーな API は `null` を返してきます。
そのときは、こちらで確認します。

---

## 例外が起きることを確かめる ― `assertThrows`

`assertThrows` は、第6節で詳しく扱いますが、感覚だけここで掴んでおきましょう。

```java
assertThrows(IllegalArgumentException.class, () -> calc.divide(10, 0));
```

「**`calc.divide(10, 0)` を呼ぶと、`IllegalArgumentException` が投げられるはず**」という断定です。

---

## 複数のアサーションを束ねる ― `assertAll`

ふつう、テストメソッドの中で **1 つアサーションが失敗すると、そこで止まり**ます。

```java
@Test
void positiveOnly() {
    assertTrue(calc.isPositive(1));    // ここで失敗すると…
    assertFalse(calc.isPositive(0));   // ← もう実行されない
    assertFalse(calc.isPositive(-1));  // ← もう実行されない
}
```

「3 つのうち、どれが壊れているのかを**まとめて知りたい**」というときに使うのが、**`assertAll`** です。

```java
@Test
void positiveOnly() {
    assertAll(
        () -> assertTrue(calc.isPositive(1)),
        () -> assertFalse(calc.isPositive(0)),
        () -> assertFalse(calc.isPositive(-1))
    );
}
```

`assertAll` を使うと、**すべての assertion を実行したうえで**、失敗したものをまとめて報告してくれます。
1 つ直したらほかも直っていた、というケースを早く見つけられます。

---

## 表で整理

JUnit 5 のおもなアサーションを表でまとめておきます。

| アサーション | 用途 | 例 |
|---|---|---|
| `assertEquals(期待, 実際)` | 等しい | `assertEquals(5, calc.add(2, 3))` |
| `assertEquals(期待, 実際, 誤差)` | 等しい（浮動小数点） | `assertEquals(0.3, 0.1+0.2, 1e-9)` |
| `assertNotEquals` | 等しくない | `assertNotEquals(0, result)` |
| `assertTrue(条件)` | `true` のはず | `assertTrue(list.isEmpty())` |
| `assertFalse(条件)` | `false` のはず | `assertFalse(list.contains(0))` |
| `assertNull(値)` | `null` のはず | `assertNull(map.get("nothing"))` |
| `assertNotNull(値)` | `null` でないはず | `assertNotNull(user)` |
| `assertSame(期待, 実際)` | **同じインスタンス**（`==`） | `assertSame(cached, fetched)` |
| `assertNotSame` | 同じインスタンスでないはず | `assertNotSame(copy, original)` |
| `assertArrayEquals(期待, 実際)` | 配列の要素が等しい | `assertArrayEquals(new int[]{1,2}, arr)` |
| `assertIterableEquals(期待, 実際)` | コレクションの要素が等しい | `assertIterableEquals(List.of(1,2), list)` |
| `assertLinesMatch(期待, 実際)` | 行ごとに比べる（正規表現可） | ログのテストに便利 |
| `assertThrows(型, ラムダ)` | 例外が投げられるはず | 次節で詳説 |
| `assertAll(ラムダ群)` | すべて実行してまとめて報告 | 上記参照 |

---

## メッセージを添える ― 最後の引数に文字列

すべてのアサーションは、**最後の引数**にエラーメッセージを書けます。

```java
assertEquals(5, calc.add(2, 3), "足し算の結果が違います");
```

失敗時の出力は、こうなります。

```text
org.opentest4j.AssertionFailedError: 足し算の結果が違います ==> expected: <5> but was: <99>
```

たくさんのアサーションが並んだとき、どこで失敗したのか分かりやすくなります。
**「壊れたら、その場で見て分かるメッセージ」**を、慣れてきたら付けるようにしましょう。

### 重い文字列の生成は遅延させる ― `Supplier` 形式

メッセージを文字列で組み立てるのが重い場合（`String.format` などを使うときなど）は、**ラムダ式（`Supplier<String>`）**で渡すこともできます。

```java
assertEquals(5, calc.add(2, 3),
    () -> "計算結果: " + calc.add(2, 3));   // 失敗時だけ実行される
```

これで、テストが**成功した場合は、メッセージの生成を行いません**。
無駄な計算が減り、テストが速くなります。

---

## どのアサーションを使うか ― 1つだけ覚えるなら `assertEquals`

入門段階で覚えるのは、まずこの 4 つで十分です。

- `assertEquals` … いちばん使う
- `assertTrue` / `assertFalse` … 真偽値の検証
- `assertThrows` … 例外のテスト（第6節）
- `assertNotNull` … 「存在するはず」の検証

ほかは、必要になったときに表を見返せば大丈夫です。

---

## まとめ

- アサーションは「**こうあるはず**」を断定する道具です
- 主要なのは **`assertEquals`** / `assertTrue` / `assertFalse` / `assertNotNull` / `assertThrows`
- 浮動小数点は**第3引数に許容誤差**を渡す
- 複数の検証をまとめて行いたければ **`assertAll`**
- 失敗時の手がかりを増やしたければ、最後の引数に**メッセージ**を渡す

次の節では、テスト前後の**準備と後始末**を、`@BeforeEach` / `@AfterEach` で書く方法を学びます。
