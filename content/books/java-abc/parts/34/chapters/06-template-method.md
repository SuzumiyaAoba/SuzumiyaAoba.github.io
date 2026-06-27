---
title: Template Method パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Template Method パターン

最後に取り上げるのは、**Template Method**（テンプレートメソッド）パターンです。

> 「**全体の流れ**は親クラスで決めて、**一部のステップ**だけサブクラスで差し替える」

というアイデアです。
継承を使ったパターンの代表選手です。

---

## 想定する場面

たとえば、いろんな形式のレポートを生成するクラスを考えます。
レポートは、ふつう次の流れで作られます。

1. データを集める
2. データを整形する
3. ファイルに書き出す

ここで、**「データの集め方」と「ファイルへの書き出し方」**は、データソースや出力形式によって違います。
ですが、**全体の流れ**（集める → 整形する → 書き出す）は、どのレポートでも変わりません。

このとき、Template Method は

- **全体の流れ**を、親クラスの 1 メソッドで決める
- **変わるところ**を、抽象メソッドにして**サブクラスに任せる**

という形をとります。

---

## 古典的な書き方

```java
public abstract class ReportGenerator {

    // テンプレートメソッド ― 全体の流れ
    public final void generate() {
        Object data = collect();   // 1. データを集める
        String body = format(data); // 2. 整形する
        write(body);                // 3. 書き出す
    }

    protected abstract Object collect();
    protected abstract String format(Object data);
    protected abstract void write(String body);
}
```

**`generate()` を `final`** にしているのが、ポイントです。
これにより、

- 「**流れ**」はサブクラスから上書きできない
- 一方で、「**ステップ**」（`collect` / `format` / `write`）はサブクラスで自由に書ける

という、**「流れだけは固定する」**設計になります。

サブクラスは、

```java
public class CsvReportGenerator extends ReportGenerator {

    @Override
    protected Object collect() {
        return List.of("Apple", "Banana", "Cherry");
    }

    @Override
    protected String format(Object data) {
        @SuppressWarnings("unchecked")
        List<String> list = (List<String>) data;
        return String.join(",", list);
    }

    @Override
    protected void write(String body) {
        System.out.println("CSV出力: " + body);
    }
}
```

`CsvReportGenerator.generate()` を呼ぶと、親クラスで決められた**順番**で動きます。

```java
new CsvReportGenerator().generate();
// CSV出力: Apple,Banana,Cherry
```

---

## どこが嬉しいのか

- 全体の**流れを 1 か所に**集める → 抜け・順序ミスが起きにくい
- ステップが**個別に差し替えできる** → 拡張に強い
- サブクラスは**埋めればよい**だけなので、**書き手が迷わない**

「**フレームワークが流れを決め、ユーザーが部品を埋める**」という形を、ハリウッド原則と呼びます。

> 「**呼び出すな、こちらから呼び出す**」

―― これは、フレームワーク設計の根幹の考え方です。
Spring の `@Controller`、JUnit の `@Test`、すべて Template Method 的な発想で動いています。

---

## 現代風 ― 関数オブジェクトを引数で渡す

継承を使わずに、**振る舞いを引数で渡す**書き方もできます。

```java
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.function.Consumer;

public class ReportGenerator<T> {

    private final Supplier<T> collector;
    private final Function<T, String> formatter;
    private final Consumer<String> writer;

    public ReportGenerator(
            Supplier<T> collector,
            Function<T, String> formatter,
            Consumer<String> writer) {
        this.collector = collector;
        this.formatter = formatter;
        this.writer = writer;
    }

    public void generate() {
        T data = collector.get();           // 1. 集める
        String body = formatter.apply(data); // 2. 整形する
        writer.accept(body);                 // 3. 書き出す
    }
}
```

使うときは、ラムダ式で部品を渡すだけです。

```java
ReportGenerator<List<String>> csv = new ReportGenerator<>(
    () -> List.of("Apple", "Banana", "Cherry"),
    list -> String.join(",", list),
    body -> System.out.println("CSV出力: " + body)
);
csv.generate();
```

継承の代わりに、**関数を引数で渡して合成する**わけです。
柔軟に組み替えられる反面、ステップごとに型がそろっている必要がある点には注意します。

---

## いつ Template Method を使うか

- 「**流れは固定、一部だけ違う**」パターンが繰り返し出てくる
- 派生クラスを書く人に、**埋めるべきメソッドを明示**したい
- フレームワーク的なクラスを設計している

逆に、

- 流れが**ずっと変わるかもしれない**
- ステップが**増減**しそう

なら、Template Method ではなく、Strategy + Composition のほうが柔軟です。
「**継承 vs 委譲**」の選択は、第35章の SOLID 原則でも話題にします。

---

## まとめ

- **Template Method** は、全体の流れを親クラスで決め、**一部のステップをサブクラスに任せる**パターン
- テンプレートメソッドは `final` にして、流れを**変えられないようにする**のが定番
- 「**呼び出すな、こちらから呼び出す**」（ハリウッド原則）の代表例
- 現代の Java では、**関数を引数で受け取る**書き方で、継承なしに同じ構造が組める
- 流れが固定、ステップが少数で安定しているときに有効

次の節は、デザインパターンを学んで初心者がはまりやすい**よくあるつまずき**です。
