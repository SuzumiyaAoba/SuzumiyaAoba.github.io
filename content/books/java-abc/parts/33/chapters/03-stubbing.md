---
title: スタブを設定する
llm: true
---

## スタブを設定する

**スタブ**（stub）とは、「**呼ばれたら、この値を返してね**」とモックに仕込む振る舞いのことです。
Mockito では、`when(...).thenReturn(...)` で書きます。

---

## 基本形 ― `when().thenReturn()`

もういちど、もっとも基本の形を確認します。

```java
when(repository.findById(1L)).thenReturn(Optional.of(taro));
```

これは、

> `repository.findById(1L)` が呼ばれたら、`Optional.of(taro)` を返してね

という意味です。

注意点として、引数が違うと**スタブは効きません**。

```java
when(repository.findById(1L)).thenReturn(Optional.of(taro));

repository.findById(1L);    // → Optional.of(taro) が返る
repository.findById(2L);    // → デフォルト（Optional.empty()）が返る
```

`findById(2L)` には、**何も仕込んでいないので、デフォルト挙動**になります。

---

## 複数のスタブを並べる

異なる引数に対して、異なる返り値を仕込むこともできます。

```java
when(repository.findById(1L)).thenReturn(Optional.of(taro));
when(repository.findById(2L)).thenReturn(Optional.of(jiro));
when(repository.findById(99L)).thenReturn(Optional.empty());
```

これで、

| 引数 | 戻り値 |
|---|---|
| `1L` | `Optional.of(taro)` |
| `2L` | `Optional.of(jiro)` |
| `99L` | `Optional.empty()` |
| それ以外 | デフォルト（`Optional.empty()`） |

という挙動になります。

---

## 例外を投げさせる ― `thenThrow`

「**呼ばれたら例外を投げる**」という振る舞いを仕込めます。

```java
when(repository.findById(99L))
    .thenThrow(new IllegalArgumentException("DB エラー"));
```

これで `repository.findById(99L)` を呼ぶと、`IllegalArgumentException` が飛びます。
**異常系のテスト**でとくに重宝します。

```java
@Test
void propagatesRepositoryException() {
    when(repository.findById(99L))
        .thenThrow(new IllegalArgumentException("DB エラー"));

    assertThrows(IllegalArgumentException.class,
        () -> service.notifyUser(99L, "any"));
}
```

「DB がエラーを返したら、サービスがどう振る舞うか」を、本物の DB を壊さずにテストできます。

---

## 戻り値が `void` のメソッドに振る舞いを仕込む ― `doThrow` / `doAnswer`

`void` のメソッド（例: `mailSender.send(...)`）は、戻り値がないので `when().thenReturn(...)` の形では書けません。
そういうときは、**`do〜().when(...)`** という、逆さまの構文を使います。

```java
// mailSender.send が呼ばれたら例外を投げる
doThrow(new RuntimeException("SMTP エラー"))
    .when(mailSender).send(anyString(), anyString(), anyString());
```

「`mailSender.send` が呼ばれた**とき**、例外を投げてね」と読みます。
**主語が動詞のあと**にくる、英語的な並びです。

そのほか、

- `doReturn(値).when(...)` … 戻り値を返す（特殊な状況でだけ使う）
- `doAnswer(ラムダ).when(...)` … 呼び出しに応じて動的に答える
- `doNothing().when(...)` … 何もしない（デフォルトと同じだが、後でスタブを上書きするときに使う）

があります。

---

## 連続して違う値を返す ― 引数を増やす

「**1 回目はこれ、2 回目はそれ**」のように、呼び出しごとに違う値を返したいときは、`thenReturn` に**引数を並べる**だけです。

```java
when(repository.findById(1L))
    .thenReturn(Optional.of(taro))   // 1回目
    .thenReturn(Optional.empty());    // 2回目以降
```

リトライ処理のテストで使うことがあります。
「**1 回目は失敗、2 回目は成功**」というシナリオも、これで書けます。

---

## 動的に答える ― `thenAnswer`

「**引数に応じて、戻り値を変えたい**」というときは、`thenAnswer` を使います。

```java
when(repository.findById(anyLong()))
    .thenAnswer(invocation -> {
        long id = invocation.getArgument(0);
        return Optional.of(new User(id, "User-" + id, "user" + id + "@example.com"));
    });
```

`invocation.getArgument(N)` で、N 番目の引数を取り出せます。
これを使って、**呼び出しのたびに違う `User` を組み立てて返す**こともできます。

実際の現場では、ここまで複雑にせず、**素直に `thenReturn` を並べる**ことが多いです。
`thenAnswer` は「最後の手段」くらいに覚えておきましょう。

---

## スタブの優先順位

スタブを同じメソッドに何度も仕込むと、**最後に書いたものが勝ち**ます。

```java
when(repository.findById(1L)).thenReturn(Optional.of(taro));
when(repository.findById(1L)).thenReturn(Optional.empty());   // 上書き

repository.findById(1L);    // → Optional.empty()（最後のスタブ）
```

`@BeforeEach` で共通スタブを仕込んでおいて、テストメソッドごとに上書きする、というパターンもあります。

---

## 「呼ばれなかった」ことの扱い

スタブを仕込んでも、**そのメソッドが呼ばれなかった**としても、Mockito は何も文句を言いません。
これは「**スタブはあくまでも仕込み**であって、呼ばれることまでは強制しない」という考え方です。

「**呼ばれたかどうか**」を確かめたいときは、次節で出てくる `verify` を使います。

---

## まとめ

- スタブは、**`when(モック.メソッド(引数)).thenReturn(値)`** で仕込みます
- 例外を投げさせるなら **`thenThrow`**
- `void` のメソッドは **`doThrow / doAnswer.when(モック).メソッド(...)`**
- 連続して違う値を返したければ **`thenReturn` を並べる**
- 動的に答えたければ **`thenAnswer`**（最後の手段）
- 後から書いたスタブが**前のスタブを上書き**します
- 呼ばれなかったことを許す（強制したければ次節の `verify`）

次の節では、「**期待した呼び出しが行われたか**」を検証する、`verify` を学びます。
