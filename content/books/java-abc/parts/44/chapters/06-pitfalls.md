---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

`StructuredTaskScope` と `ScopedValue` は新しい仕組みです。
プレビュー段階特有の罠も含めて、5 つのつまずきを整理します。

---

## つまずき1: 「**プレビュー機能であることを忘れる**」

`StructuredTaskScope`（JEP 505）は、Java 25 でも依然として**プレビュー**です。
コンパイル時に**`--enable-preview --release 25`**、実行時にも**`--enable-preview`** が必要です。

```text
$ javac Foo.java
Foo.java:5: エラー: java.util.concurrent.StructuredTaskScopeはプレビューAPIであり、デフォルトで無効になっています。
  (プレビューAPIを有効にするには--enable-previewを使用します)

$ javac --enable-preview --release 25 Foo.java
ノート: Foo.javaはJava SE 25のプレビュー機能を使用します。
ノート: 詳細は、-Xlint:previewオプションを指定して再コンパイルしてください。
$ java --enable-preview Foo
```

ビルドツールでも、Maven なら `pom.xml` に、

```xml
<plugin>
  <artifactId>maven-compiler-plugin</artifactId>
  <configuration>
    <release>25</release>
    <compilerArgs>
      <arg>--enable-preview</arg>
    </compilerArgs>
  </configuration>
</plugin>
```

のように指定する必要があります。実行時の Maven Surefire や Spring Boot のプラグインにも、同じ引数を渡す必要があり、設定が面倒です。

**「本番投入」までは慎重に**、というのがプレビュー機能との付き合い方です。
API は**マイナーチェンジを繰り返している**ので、Java 25 で書いたコードが Java 26 でそのまま動くとは限りません。

ちなみに `ScopedValue`（JEP 506）は Java 25 で**正式機能**になったので、`--enable-preview` 不要で使えます。

---

## つまずき2: 「**`scope.join()` を呼ぶ前に `task.get()`**」

`Subtask.get()` は、**`scope.join()` の後で呼ぶ**のが大原則です。

```java
try (var scope = StructuredTaskScope.open()) {
    var t1 = scope.fork(() -> fetchUser(id));
    return t1.get();    // ← join していない！
}
```

`get()` の時点でタスクがまだ走っていれば、Java 21 のプレビューでは `IllegalStateException` を投げました。Java 25 の現行 API でも、ふるまいの保証は「**`join()` が成功して戻った後**」のみです。

「**fork → join → get**」の順序を、リズムとして覚えましょう。

---

## つまずき3: 「**CPU ループのキャンセルが効かない**」

第3節で触れたとおり、`StructuredTaskScope` のキャンセルは `Thread.interrupt()` で行われます。
**CPU 計算が中心**のタスクは、自分で `Thread.currentThread().isInterrupted()` を見ないと、止まりません。

```java
scope.fork(() -> {
    long total = 0;
    for (long i = 0; i < Long.MAX_VALUE; i++) {   // ← 永遠に走り続ける
        total += i;
    }
    return total;
});
```

長時間ループでは、**定期的なチェックを挿入**します。

```java
scope.fork(() -> {
    long total = 0;
    for (long i = 0; i < Long.MAX_VALUE; i++) {
        if ((i & 0xFFFF) == 0 && Thread.currentThread().isInterrupted()) {
            throw new InterruptedException();
        }
        total += i;
    }
    return total;
});
```

---

## つまずき4: 「**`ScopedValue` を持ち出そうとする**」

`ScopedValue.get()` は、スコープの**外**では `NoSuchElementException` を投げます。

```java
String name;
ScopedValue.where(USER, "alice").run(() -> {
    // ここでは USER.get() == "alice"
});
System.out.println(USER.get());   // ← NoSuchElementException
```

「スコープの中の値を、ブロックの外でも使いたい」 ―― これは設計の見直しサインです。
本当に「スコープに紐づく」性質の値なら、**ブロックの外に出すべきではありません**。
ブロックの外でも必要なら、ふつうの引数か戻り値で**明示的に**渡すのが正解です。

---

## つまずき5: 「**全部 `StructuredTaskScope` で書こうとする**」

新しい技術が出ると「これからは全部これで」と振りたくなりますが、現実は折衷的です。

- **公開 API** は `CompletableFuture` の方が、呼び出し側で柔軟に扱える
- **長期プール** は `ExecutorService` のほうが自然
- **イベント駆動** は `CompletableFuture` か、専用のメッセージング
- **メソッド内の並行処理** こそ、`StructuredTaskScope` の本領

それぞれに**得意な場面**があります。
道具を増やすのは、置き換えではなく**選択肢を広げる**ためだと考えましょう。

---

## まとめると ―― 構造化並行性との付き合い方

第44章のまとめとして、5 つの心得を:

1. **プレビュー機能の不安定さ**は受け入れて、慎重に導入する
2. **「open → fork → join → get」** のリズムを守る
3. **CPU ループには `isInterrupted()` チェック**を入れる
4. **`ScopedValue` の値はスコープに閉じる** ―― 外に持ち出さない
5. **既存の道具（`CompletableFuture`・`ExecutorService`）と共存**させる

並行処理は、Java の中でも**もっとも進化が続いている**領域です。
今後の Java バージョンで API はさらに洗練されるはずですが、**構造化**という発想は、もう揺らがないでしょう。

次の節「用語集」で本章の言葉を整理し、第45章では、コードベース全体の**構造**を扱う **モジュールシステム（JPMS）** を見ていきます。
