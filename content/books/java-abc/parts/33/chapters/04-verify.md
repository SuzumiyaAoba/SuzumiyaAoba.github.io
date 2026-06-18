---
title: 呼び出しを検証する
llm: true
---

## 呼び出しを検証する

スタブは、「**呼ばれたら、これを返してね**」と仕込むものでした。
これと対になるのが、「**ちゃんと呼ばれたか**」を確かめる **`verify`** です。

---

## 基本形 ― `verify(モック).メソッド(引数)`

```java
verify(mailSender).send("taro@example.com", "お知らせ", "ご注文ありがとうございます");
```

これは、

> `mailSender.send("taro@example.com", "お知らせ", "ご注文ありがとうございます")` が、**ちょうど 1 回呼ばれたはず**

という断定です。

- 1 回呼ばれていれば … テスト成功
- 一度も呼ばれていなければ … テスト失敗
- 引数が違ったら … テスト失敗
- 2 回以上呼ばれていれば … テスト失敗

つまり、`verify` も**アサーションの一種**です。

---

## 戻り値ではなく「副作用」を検証する

`verify` の本質は、

> 「**呼び出し自体が、テスト対象の振る舞いになっている**」場合に使う

ということです。

たとえば、

- `UserService` の `notifyUser` は、戻り値が `void`（戻り値での検証ができない）
- 内部で `mailSender.send(...)` を呼ぶことが「正しい動き」

の場合、戻り値ではなく**呼び出しの事実**で正しさを判断するしかありません。
これを **振る舞いベースのテスト**（behavior verification）と呼びます。

---

## 呼び出し回数を検証する

第2引数で、回数を指定できます。

```java
verify(mailSender, times(1)).send(anyString(), anyString(), anyString());  // ちょうど1回
verify(mailSender, times(3)).send(anyString(), anyString(), anyString());  // ちょうど3回
verify(mailSender, never()).send(anyString(), anyString(), anyString());   // 一度も呼ばれていない
verify(mailSender, atLeast(2)).send(anyString(), anyString(), anyString()); // 2回以上
verify(mailSender, atMost(5)).send(anyString(), anyString(), anyString());  // 5回以下
```

| 呼び出し回数の指定 | 意味 |
|---|---|
| `times(N)` | ちょうど N 回 |
| `never()` | 0 回（一度も呼ばれていない） |
| `atLeast(N)` | N 回以上 |
| `atLeastOnce()` | 1 回以上 |
| `atMost(N)` | N 回以下 |

省略すると **`times(1)`** が暗黙で適用されます。

---

## 「異常系では呼ばれていない」を検証する

異常系のテストで、よく書くのが「**ある条件のときには、依存先を呼ばないはず**」というパターンです。

```java
@Test
void throwsWhenUserNotFound() {
    when(repository.findById(99L)).thenReturn(Optional.empty());

    assertThrows(IllegalArgumentException.class,
        () -> service.notifyUser(99L, "any"));

    verify(mailSender, never()).send(anyString(), anyString(), anyString());
}
```

「ユーザーが見つからないときには、メールを送らないはず」と断定しています。
実機で動かすと、次のように成功します。

```text
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## すべての呼び出しが検証済みかを確認 ― `verifyNoMoreInteractions`

「**verify で確認した以外には、何も呼ばれていないはず**」をまとめて確認するのが、`verifyNoMoreInteractions` です。

```java
verify(mailSender).send("taro@example.com", "お知らせ", "ご注文ありがとうございます");
verifyNoMoreInteractions(mailSender);   // ほかには何もしていないはず
```

これを書いておくと、「**追加で予想外の呼び出しがあったら**」も検出できます。

ただし、使いすぎると**テストが脆く**なります（依存先の呼び出しが 1 つ増えただけでテストが落ちる）。
「ここでは絶対に副作用を一つに絞りたい」という、限定的な場面でだけ使います。

---

## 一度も触られていないことを確認 ― `verifyNoInteractions`

```java
verifyNoInteractions(mailSender);
```

「`mailSender` に対しては、**スタブも呼び出しも、何も起きていない**」を確認します。
「異常系で、まったく外部に影響を与えていない」というのを示すのに使えます。

`verifyNoMoreInteractions` との違いは、**`verify` をすでにいくつか書いたあと**で、それ以上を許さないのが前者、
**一切何もしていない**を許さないのが後者です。

---

## 呼び出し順序を検証する ― `InOrder`

「**A の前に B が呼ばれるはず**」のような、**呼び出し順序**まで検証したいときは、`InOrder` を使います。

```java
import org.mockito.InOrder;

@Test
void callsRepositoryBeforeMailSender() {
    User taro = new User(1L, "Taro", "taro@example.com");
    when(repository.findById(1L)).thenReturn(Optional.of(taro));

    service.notifyUser(1L, "msg");

    InOrder inOrder = inOrder(repository, mailSender);
    inOrder.verify(repository).findById(1L);
    inOrder.verify(mailSender).send(anyString(), anyString(), anyString());
}
```

`inOrder(...)` で監視対象のモック群を作り、そこに対して順番に `verify` を書きます。
入門段階ではあまり使う場面はありませんが、「順序自体が仕様の一部」のときに使えると覚えておきましょう。

---

## 引数のキャプチャ ― `ArgumentCaptor`

「**呼ばれたときの引数**そのものを、テスト側で取り出して検証したい」場合は、**`ArgumentCaptor`** を使います。

```java
import org.mockito.ArgumentCaptor;

@Test
void capturesEmailContent() {
    User taro = new User(1L, "Taro", "taro@example.com");
    when(repository.findById(1L)).thenReturn(Optional.of(taro));

    service.notifyUser(1L, "ご注文ありがとう");

    ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
    verify(mailSender).send(anyString(), anyString(), bodyCaptor.capture());

    String capturedBody = bodyCaptor.getValue();
    assertTrue(capturedBody.contains("ご注文"));
}
```

複雑なオブジェクトを引数に渡す場合に、**フィールドだけ取り出して個別に検証**したいときに重宝します。

---

## まとめ

- **`verify(モック).メソッド(引数)`** で、呼び出しを検証します
- 戻り値が `void` のメソッドや、副作用が主な場合の**振る舞いベースのテスト**に必須
- 第2引数で、`times(N)`・`never()`・`atLeast(N)` などの回数を指定できます
- 「呼ばれていない」を断定するには **`never()` / `verifyNoInteractions`**
- 順序まで確かめるなら **`InOrder`**
- 引数を取り出して検証したいなら **`ArgumentCaptor`**

次の節では、引数の検証で出てきた **`anyString()` / `eq()`** などの「**引数マッチャー**」を整理します。
