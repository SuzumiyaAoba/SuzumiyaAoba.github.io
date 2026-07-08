---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7"]
---

## よくあるつまずき

Mockito で、初心者がはまりやすいポイントを、まとめて確認します。

---

## 1. マッチャーと具体値を混ぜる ― 一番多い落とし穴

前節でも触れましたが、これがとにかく多いです。

```java
verify(mailSender).send("taro@example.com", anyString(), anyString());   // △
```

実行すると、

```text line-numbers=false
org.mockito.exceptions.misusing.InvalidUseOfMatchersException:
Invalid use of argument matchers!
3 matchers expected, 1 recorded.
```

「マッチャーが期待された数と違う」というメッセージですが、原因は**マッチャーと具体値が混ざっている**こと。

### 対処

```java
verify(mailSender).send(eq("taro@example.com"), anyString(), anyString());  // ◯
```

具体値を **`eq(...)`** で包んでマッチャーにそろえます。

---

## 2. `void` メソッドに `when().thenReturn` を使う

```java
when(mailSender.send("...", "...", "...")).thenThrow(new RuntimeException()); // △
```

`mailSender.send(...)` は戻り値が `void` なので、この書き方は**コンパイル時点でエラー**になります。
（`when()` は引数に何らかの戻り値を要求するため。）

### 対処

```java
doThrow(new RuntimeException())
    .when(mailSender).send(anyString(), anyString(), anyString());   // ◯
```

第3節で紹介した **`do〜().when(...)`** の逆さま構文を使います。

---

## 3. モックの使いすぎ ― すべてをモックにする

たとえば、`User`（POJO / record）までモック化するケース。

```java
@Mock User user;
when(user.email()).thenReturn("taro@example.com");
```

`User` がただのレコードで、ロジックを持たないなら、

```java
User user = new User(1L, "Taro", "taro@example.com");   // ◯ 本物を作る
```

と、**本物のインスタンスを生成**したほうが、テストもコードも分かりやすくなります。

### 対処

- **ロジックを持たない値オブジェクト**は、モックではなく**本物を `new`** する
- モックは「**外の世界との境界**」だけに限定する（前節）

---

## 4. テスト対象自身をモックにする

```java
@Mock UserService service;          // △ テスト対象をモックにしている

@Test
void testSomething() {
    when(service.notifyUser(...)).thenReturn(...);    // 検証になっていない
}
```

**テスト対象は、本物を使うべき**です。モック化すると、何もテストしていないことになります。

### 対処

```java
@Mock UserRepository repository;
@Mock MailSender mailSender;
@InjectMocks UserService service;   // ◯ 本物（依存だけモック）
```

`@InjectMocks` を使う、または手で `new UserService(モック, モック)` する。

---

## 5. final なクラス / メソッドのモック化

伝統的な Mockito では、**final クラスや final メソッド**はモック化できません。
Java 25 では、レコードや sealed クラスがらみで final が増えています。

Mockito 5.x では、**inline mock maker** がデフォルトで有効なので、final もモックできるようになっています。
ただし、まれに環境依存の問題が出るので、こんなエラーが出たら原因を疑ってください。

```text line-numbers=false
Cannot mock/spy class com.example.FinalClass
Mockito cannot mock/spy because :
 - final class
```

### 対処

- できれば、final を解除するのではなく、**インターフェースを切る**設計に変える
- どうしても必要なら、Mockito 公式ドキュメントの inline mock maker の設定を確認

---

## 6. スタブと検証が混ざる ― `verify` で値を仕込もうとする

```java
verify(repository).findById(1L);     // △ スタブのつもり？
```

`verify` は「**呼ばれたかを検証する**」のが役割で、**値を返すように仕込むことはできません**。
`when()` と `verify()` を**取り違える**のは、入門段階のあるあるです。

### 対処

- **仕込む** ＝ `when().thenReturn()` / `doThrow().when()`
- **確かめる** ＝ `verify()`

2つの役割を、頭の中ではっきり分けておきましょう。

---

## 7. `MockitoExtension` を忘れる ― `@Mock` が `null` になる

```java
class UserServiceTest {
    @Mock UserRepository repository;   // null のまま

    @Test
    void test() {
        repository.findById(1L);   // NullPointerException!
    }
}
```

`@ExtendWith(MockitoExtension.class)` を**忘れると**、`@Mock` フィールドは初期化されません。

### 対処

```java
@ExtendWith(MockitoExtension.class)   // ◯ これを忘れない
class UserServiceTest {
    @Mock UserRepository repository;
    ...
}
```

---

## 8. テストで「実装の詳細」を verify する

```java
verify(repository).findById(1L);
verify(repository).findById(1L);     // ← 2回呼ばれていないと壊れる
verify(repository, atLeastOnce()).save(any());
```

過剰に `verify` を並べると、**内部実装を変更しただけで**テストが壊れます。

たとえば「`findById` を 1 回呼んでいるはず」を厳密に書くと、キャッシュ最適化で 0 回に減っただけでテストが落ちます。

### 対処

- **重要な副作用**だけを verify する（メールを送ったかどうか、など）
- 戻り値で検証できるなら、`assertEquals` のほうが望ましい
- 「**外部から観察できる振る舞い**」だけを検証する

---

## 9. モックの初期化を `@BeforeEach` でやり直そうとする

```java
@BeforeEach
void setUp() {
    repository = mock(UserRepository.class);    // △ @Mock との重複
    mailSender = mock(MailSender.class);
    service = new UserService(repository, mailSender);
}
```

`MockitoExtension` がすでに各テストの前に新品のモックを作ってくれているので、
**自分で `mock()` を呼ぶ必要はありません**。

### 対処

```java
@Mock UserRepository repository;
@Mock MailSender mailSender;
@InjectMocks UserService service;
```

これだけで、テストごとに新品の状態から始まります。

---

## まとめ

- マッチャーと具体値は混ぜない（混ぜたら全部マッチャー）
- `void` メソッドには **`doThrow / doAnswer`** を使う
- **値オブジェクトはモックしない**。本物を `new` する
- **テスト対象自身はモックしない**
- `verify` と `when()` の役割を**取り違えない**
- **`@ExtendWith(MockitoExtension.class)`** を忘れない
- 過剰な `verify` で、**実装の詳細**を固めない

次は、この章で学んだ言葉を、用語集としてまとめます。
