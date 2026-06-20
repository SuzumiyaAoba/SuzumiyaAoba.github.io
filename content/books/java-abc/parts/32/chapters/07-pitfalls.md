---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

ユニットテストで、初心者がはまりやすいポイントを、まとめて確認します。

---

## 1. テストが互いに干渉する ― `static` フィールドや共有状態を使う

JUnit 5 は、**テストごとにテストクラスのインスタンスを new し直す**仕組みでした。
ですが、`static` フィールドや、外部の状態（ファイル・データベース）を共有してしまうと、独立性が壊れます。

```java
class CounterTest {

    static int counter = 0;     // △ static で共有してしまった

    @Test
    void incrementOnce() {
        counter++;
        assertEquals(1, counter);
    }

    @Test
    void incrementTwice() {
        counter++;
        counter++;
        assertEquals(2, counter);   // どちらのテストが先に走ったかで結果が変わる
    }
}
```

`static int counter` は、テストが**実行された順序**で値が変わってしまいます。
テストは、**実行順に依存してはいけない**のです。

### 対処

- 共有しないといけない状態は、**`@BeforeEach` で毎回リセット**する
- それでも難しいなら、**ファイル・DB は `@TempDir` などで分離**する（次項）
- 「テスト同士が独立しているか?」と、ときどき疑う癖をつける

---

## 2. テストが、本物のファイル/DB を残してしまう

ファイルやデータベースを使うテストで、**後始末を忘れる**と、

- 次のテストが「ファイルがすでにある」状態で始まる
- CI 環境で何度も実行されると、ゴミが溜まる
- 重要なファイルを上書き・削除してしまう

といった事故が起きます。

### 対処1 ― `@TempDir`

JUnit 5 には、**`@TempDir`** という便利なアノテーションがあります。

```java
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;

class FileTest {

    @TempDir
    Path tempDir;   // テストごとに新品の一時フォルダ

    @Test
    void writesFile() throws Exception {
        Path file = tempDir.resolve("memo.txt");
        Files.writeString(file, "hello");
        assertEquals("hello", Files.readString(file));
    }
}
```

`@TempDir` が付いたフィールドには、**テストごとに新しい一時ディレクトリ**が割り当てられます。
テスト終了後、JUnit が**自動で削除**してくれるので、後始末を忘れる心配がありません。

### 対処2 ― DB ならインメモリ / コンテナ

DB を使うテストでは、

- **H2** のようなインメモリ DB を使う
- **Testcontainers** で、本物の DB をコンテナで起動する

といった、テスト用の隔離環境を作ります。
これらは第37章（ORM）で改めて扱います。

---

## 3. テストの名前から、何のテストか伝わらない

```java
@Test
void test1() { ... }

@Test
void check() { ... }
```

このような名前は、**失敗したときに何が壊れたのかが分からない**最悪のパターンです。
テストレポートには、メソッド名がそのまま出ます。

### 対処

- 「**何を、どんなときに、どう確かめるか**」がわかる名前にする
- 動詞で始める英文（`returnsZeroWhenEmpty`、`throwsWhenIdIsNegative`）
- 日本語でわかりやすく書きたければ、**`@DisplayName`** を活用する

```java
@Test
@DisplayName("ID が負の数のとき、例外を投げる")
void throwsWhenIdIsNegative() {
    assertThrows(IllegalArgumentException.class,
        () -> repository.findById(-1));
}
```

---

## 4. アサーションが「曖昧」 ― 何も比べていないテスト

```java
@Test
void addsTwoNumbers() {
    int result = calc.add(2, 3);
    assertTrue(result > 0);   // △ 何の値でも通ってしまう
}
```

`assertTrue(result > 0)` は、`result` が **1** でも **42** でも通ります。
本当に確かめたいのは「**5 になるはず**」なのに、ぼんやりした条件で済ませてしまうと、不具合を見逃します。

### 対処

- 期待値が**1 つに決まる**なら、`assertEquals` で具体的な値を断定する
- 「**何でも通ってしまうテスト**」になっていないかチェックする

`assertTrue` / `assertFalse` は、本当に真偽だけ確かめたいときに使う、と意識しておきましょう。

---

## 5. 1 つのテストで、たくさんの assertion を並べる

```java
@Test
void everything() {
    assertEquals(5, calc.add(2, 3));
    assertEquals(7, calc.add(3, 4));
    assertEquals(-1, calc.add(2, -3));
    assertTrue(calc.isPositive(1));
    assertFalse(calc.isPositive(-1));
    assertThrows(IllegalArgumentException.class,
        () -> calc.divide(1, 0));
}
```

このテストには、6 つの検証が入っています。
これだと、

- どこで失敗したのかが、レポートからわかりにくい
- 1 つ失敗すると、その後は実行されない（残りの検証は隠れる）
- 名前が `everything` のように曖昧になる

という問題があります。

### 対処

- **1 テスト 1 検証**を基本にする
- 関連する複数の検証は、**`assertAll`**（第3節）でまとめる
- 入力違いの繰り返しは、**パラメータ化テスト**（第5節）に切り出す

---

## 6. 「実装そのもの」をテストしてしまう

```java
@Test
void implementationDetails() {
    Calculator calc = new Calculator();
    assertEquals(123, calc.internalCounter);   // 内部フィールドを覗いている
}
```

テストが、**クラスの内部実装**（プライベートな変数など）に依存してしまうと、

- 内部をリファクタリングしただけで、テストが大量に壊れる
- テストが「**仕様**」ではなく「**いまの実装**」を固めてしまう

ことになります。

### 対処

- **公開された振る舞い**（public メソッドの入出力）をテストする
- 内部実装を直接見たくなったら、それは「**設計を見直すサイン**」のことが多い

「テストは仕様の説明書」と言いました（第1節）。
**設計が後から変えられるテスト**を、いつも目指しましょう。

---

## 7. テストを「コメントアウトで止める」癖をつけてしまう

```java
// @Test
// void someTest() {
//     ...
// }
```

「いま壊れているけど、後で直す」と思って、テストをコメントアウトしてしまうことがあります。
ですが、コメントアウトされたテストは、**忘れられる**ものです。
気づいたら、半年前のコメントアウトが残ったまま、ということもザラです。

### 対処

- 一時的に止めたいだけなら、**`@Disabled("理由をここに書く")`** を使う
- レポートに「無効化されている」と出るので、忘れにくい
- 直すまでの**期限と担当**を、コメントで明記する

```java
@Disabled("外部 API が安定するまで一時停止 - 2026-07 まで")
@Test
void callsExternalApi() {
    ...
}
```

---

## まとめ

- テストは**独立**であるべき。`static` や共有状態に注意
- ファイル・DB は **`@TempDir`** や隔離環境で分離する
- メソッド名と **`@DisplayName`** で「何のテストか」を伝える
- アサーションは**具体的**に。何でも通ってしまうテストは無意味
- 1 テスト 1 検証が基本。関連検証は **`assertAll`**、繰り返しは**パラメータ化**
- 公開された振る舞いをテストし、**実装の詳細**には踏み込まない
- 止めたいテストは **コメントアウトせず `@Disabled`**

次は、この章で学んだ言葉を、用語集としてまとめます。
