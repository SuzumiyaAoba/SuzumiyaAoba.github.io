---
title: 例外とタイムアウトのテスト
llm: true
---

## 例外とタイムアウトのテスト

これまでは、「**戻り値が、期待値と等しいか**」というテストばかりでした。
ですが、テストしたい振る舞いは、戻り値だけではありません。

- **例外が、ちゃんと投げられるか**
- 処理が、**時間内に終わるか**

これらも、JUnit 5 はかんたんに書けるように、専用のアサーションをそろえています。

---

## `assertThrows` ― 例外が投げられることをテストする

第20章で見た「例外」を、覚えていますか。
たとえば、`Calculator` に、こんな割り算メソッドがあるとします。

```java
public int divide(int a, int b) {
    if (b == 0) {
        throw new IllegalArgumentException("0で割れません");
    }
    return a / b;
}
```

「0 で割ると、例外を投げる」という**約束**を、テストで確かめましょう。

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CalculatorTest {

    @Test
    void zeroDivisionThrows() {
        assertThrows(
            IllegalArgumentException.class,
            () -> new Calculator().divide(10, 0)
        );
    }
}
```

**`assertThrows(例外クラス, ラムダ)`** は、次のことを断定します。

> 「ラムダの中身を実行すると、その例外クラス（またはそのサブクラス）が投げられるはず」

- 投げられれば … テスト成功
- 投げられなければ … テスト失敗
- **違うクラスの例外**が投げられても … テスト失敗

ラムダ式（第22章）を渡すのがポイントです。
「**まだ実行してはいけない処理**」を、ラムダで包んで `assertThrows` に渡すわけです。

### 例外オブジェクトを取り出して、メッセージを検証する

`assertThrows` の戻り値は、投げられた**例外オブジェクト**そのものです。
これを変数で受けて、メッセージや中身を**さらに検証**できます。

```java
@Test
void zeroDivisionThrowsWithMessage() {
    IllegalArgumentException e = assertThrows(
        IllegalArgumentException.class,
        () -> new Calculator().divide(10, 0)
    );
    assertEquals("0で割れません", e.getMessage());
}
```

これで、例外の**メッセージまで含めて**検証できます。
業務システムでは「例外のエラーコードが正しいか」「特定のフィールドが正しく設定されているか」もここで確認します。

### `assertDoesNotThrow` ― 例外が投げられないことを確認する

逆に、「**例外を投げないはず**」を確かめたいときは、`assertDoesNotThrow` を使います。

```java
@Test
void normalDivisionDoesNotThrow() {
    assertDoesNotThrow(() -> new Calculator().divide(10, 2));
}
```

たとえば、リファクタリング後に「正常系で例外が投げられていない」ことを確認したいときに、明示的に書けます。

> **補足: `try { ... fail(); } catch (...)` ではダメ?**
>
> 古い JUnit 4 までは、例外のテストには、try-catch と `fail()` の組み合わせを使っていました。
> ですが、書き方が冗長で、**例外が投げられる場所**を絞り込みにくいという欠点がありました。
> JUnit 5 では、**`assertThrows`** が標準になっています。

---

## `assertTimeout` ― 処理時間の上限をテストする

「**この処理は 1 秒以内に終わるはず**」のように、性能要件をテストすることもできます。
そのためのアサーションが、**`assertTimeout`** です。

```java
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.assertTimeout;

@Test
void completesQuickly() {
    assertTimeout(Duration.ofSeconds(1), () -> {
        new Calculator().add(1, 2);
    });
}
```

**`assertTimeout(時間, ラムダ)`** は、

- ラムダの実行時間が**指定の時間以内**なら … テスト成功
- 指定の時間を**超えた**ら … テスト失敗

入門段階では、**「想定外に重い処理になっていないか」を見張る**くらいの使い方で十分です。
細かい性能チェックは、専門の JMH などのマイクロベンチマークツールに任せます。

### `assertTimeoutPreemptively` ― 超えたら即停止

`assertTimeout` は、処理を**最後まで実行**してから「時間オーバーだった」と判定します。
ですが、時間オーバーしたらすぐに止めたい場合は、**`assertTimeoutPreemptively`** を使います。

```java
assertTimeoutPreemptively(Duration.ofSeconds(1), () -> {
    // 1 秒を過ぎたら、即座にスレッドを止める
});
```

ただし、`Preemptively` 版は別スレッドで実行されるため、注意点があります。

- ラムダ内で `ThreadLocal` を使っていると正しく動かない
- 中断されることを想定していない処理（DB トランザクションなど）では予期しない結果になる

業務システムでは、まずは**`assertTimeout`（プリエンプティブでないほう）**を使うのが無難です。

---

## どちらをいつ使うか

| 検証したいこと | 使うアサーション |
|---|---|
| 例外が投げられるはず | `assertThrows` |
| 例外を投げないはず | `assertDoesNotThrow` |
| 時間内に終わるはず | `assertTimeout` |
| 時間オーバーで即中断したい | `assertTimeoutPreemptively` |

たとえば、`Repository#findById(invalidId)` で `NotFoundException` を投げる、という仕様なら、`assertThrows` の出番です。
バリデーションメソッドで「不正な値を渡したら、ちゃんと例外で弾いてくれるか」も、`assertThrows` でテストします。

---

## まとめ

- 例外が投げられることをテストするときは、**`assertThrows`**
- 投げられた**例外オブジェクト**を受け取って、メッセージや中身も検証できます
- 例外を投げないことを確かめたければ **`assertDoesNotThrow`**
- 処理時間の上限を確かめるなら **`assertTimeout`**
- ラムダ式（第22章）が、これらのアサーションの**鍵**になっています

次の節は、JUnit 5 で初心者がはまりやすい**よくあるつまずき**を整理します。
