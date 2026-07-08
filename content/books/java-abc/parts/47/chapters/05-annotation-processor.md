---
title: アノテーションプロセッサを作る
llm: true
---

## アノテーションプロセッサを作る

ここまでで「コンパイル時にプロセッサが動く」と何度か触れてきました。
この節では、その**プロセッサそのもの**を実装してみます。

> 本格的なプロセッサ開発は、それ自体が本 1 冊ぶんの分量があります。
> 本書では、**プロセッサが何をしているか**を**動かしながら理解する**ことを目指します。
> 詳細仕様まで踏み込まないので、興味があれば JDK の `javax.annotation.processing` パッケージのドキュメントを参照してください。

---

## プロセッサの全体像

アノテーションプロセッサは、

1. **`javax.annotation.processing.Processor`** インタフェースを実装したクラス
2. ソースに付いたアノテーションを `javac` から渡されて、
3. 対象を**解析**し、
4. 必要なら**追加の `.java` を出力**する
5. これを `javac` がもう一度コンパイルする

という流れで動きます。
普通の Java クラスとして書ける一方、**`javac` の中**で動くため、書き手は特殊な API を扱います。

---

## やってみる: `@AutoToString` プロセッサ

「**`@AutoToString` の付いたクラスに対して、フィールド一覧を表示する `toString` メソッドを生成する**」 ―― そんな、ミニ Lombok っぽいプロセッサを作ってみます。

### 1. アノテーションを定義

```java
// src/AutoToString.java
import java.lang.annotation.*;

@Retention(RetentionPolicy.SOURCE)
@Target(ElementType.TYPE)
public @interface AutoToString { }
```

`SOURCE` 保持 ―― 実行時には消える。コンパイル時に処理して、終わり。

### 2. プロセッサを実装

```java
// src/AutoToStringProcessor.java
import javax.annotation.processing.*;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.*;
import javax.tools.*;
import java.io.*;
import java.util.Set;

@SupportedAnnotationTypes("AutoToString")
@SupportedSourceVersion(SourceVersion.RELEASE_25)
public class AutoToStringProcessor extends AbstractProcessor {

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment env) {
        for (Element e : env.getElementsAnnotatedWith(AutoToString.class)) {
            if (e instanceof TypeElement type) {
                generate(type);
            }
        }
        return true;
    }

    private void generate(TypeElement type) {
        String className = type.getSimpleName().toString();
        String packageName = ((PackageElement)
                processingEnv.getElementUtils().getPackageOf(type)).getQualifiedName().toString();
        String genName = className + "_ToString";
        try {
            JavaFileObject f = processingEnv.getFiler()
                .createSourceFile(packageName.isEmpty() ? genName : packageName + "." + genName);
            try (PrintWriter w = new PrintWriter(f.openWriter())) {
                if (!packageName.isEmpty()) {
                    w.println("package " + packageName + ";");
                }
                w.println("public class " + genName + " {");
                w.println("  public static String toStringOf(" + className + " self) {");
                w.print("    return \"" + className + "[\"");
                boolean first = true;
                for (Element f2 : type.getEnclosedElements()) {
                    if (f2.getKind() == ElementKind.FIELD) {
                        if (!first) w.print(" + \", \"");
                        w.print(" + \"" + f2.getSimpleName() + "=\" + self." + f2.getSimpleName());
                        first = false;
                    }
                }
                w.println(" + \"]\";");
                w.println("  }");
                w.println("}");
            }
        } catch (IOException ex) {
            processingEnv.getMessager().printMessage(
                javax.tools.Diagnostic.Kind.ERROR, ex.getMessage());
        }
    }
}
```

ポイントを 3 つ。

- **`AbstractProcessor`** を継承して、`process(...)` を実装
- `RoundEnvironment.getElementsAnnotatedWith(...)` で、アノテーション付きの要素を取得
- **`Filer`** を使って、新しい `.java` を生成

### 3. プロセッサを登録

`META-INF/services/javax.annotation.processing.Processor` というファイルに、プロセッサのフル名を書きます。

```text line-numbers=false
AutoToStringProcessor
```

これで、`javac` が**サービスローダ**経由でプロセッサを発見できるようになります。

### 4. 使ってみる

```java
@AutoToString
public class Point {
    int x;
    int y;
    public Point(int x, int y) { this.x = x; this.y = y; }
    public static void main(String[] args) {
        Point p = new Point(3, 5);
        System.out.println(Point_ToString.toStringOf(p));
    }
}
```

コンパイルと実行:

```text line-numbers=false
$ javac -processor AutoToStringProcessor \
       AutoToString.java AutoToStringProcessor.java Point.java
$ ls
AutoToString.class  AutoToStringProcessor.class  Point.class  Point_ToString.class

$ java Point
Point[x=3, y=5]
```

`Point_ToString.class` という新しいクラスが**生成**され、それを呼び出して **`Point[x=3, y=5]`** が出力されました。

---

## 何が起きていたか

ステップを整理すると:

1. `javac` がソースを読む
2. `-processor AutoToStringProcessor` で指定したプロセッサが起動
3. プロセッサが `@AutoToString` の付いたクラスを発見
4. **新しい `.java`**（`Point_ToString.java`）を生成
5. `javac` がそれを**もう一度**コンパイル

「**コンパイル中に新しいソースが生まれて、また `javac` が呼ばれる**」 ―― これがアノテーション処理の核心です。

---

## 高機能なプロセッサに必要なもの

このサンプルは「文字列を組み立てて書き出す」だけの素朴な作りです。
プロダクション品質のプロセッサは、もっと多くのものを使います。

### JavaPoet ―― コード生成の DSL

`Filer` で `PrintWriter` に直接書くと、文字列操作のミスが起きやすいです。
**JavaPoet** という有名なライブラリは、コード生成を**ジェネリッククラスや構造体**として組み立てる DSL を提供します。

```java
MethodSpec main = MethodSpec.methodBuilder("main")
    .addModifiers(Modifier.PUBLIC, Modifier.STATIC)
    .returns(void.class)
    .addParameter(String[].class, "args")
    .addStatement("$T.out.println($S)", System.class, "Hello")
    .build();
```

このような書き方で、`.java` の見た目通りのコードを安全に作れます。
本格的なプロセッサを書くなら、JavaPoet は事実上の標準です。

### `@AutoService` ―― プロセッサ登録の自動化

`META-INF/services/...` のファイルを**手書き**するのは面倒です。
Google の **`@AutoService`** アノテーションを使うと、プロセッサ自身を `@AutoService(Processor.class)` で**マーク**するだけで、サービスファイルが自動生成されます（メタプロセッサ）。

```java
@AutoService(Processor.class)
@SupportedAnnotationTypes("AutoToString")
public class AutoToStringProcessor extends AbstractProcessor { ... }
```

これも、プロセッサ作者の定番ツールです。

### Element API の使い方

`javax.lang.model.element` パッケージには、Java のソースコード構造を表す型がそろっています。

- `Element` ―― ソース要素（クラス、メソッド、フィールドなどの抽象）
- `TypeElement` ―― クラス・インタフェース
- `ExecutableElement` ―― メソッド・コンストラクタ
- `VariableElement` ―― フィールド・引数・ローカル変数

これらを駆使して、**ソースコードを解析**します。
リフレクションと違って、**`.class` を作る前**のソースの構造を扱う点が、独特の難しさです。

---

## まとめると

- アノテーションプロセッサは、`AbstractProcessor` を継承して `process(...)` を実装する
- `META-INF/services/javax.annotation.processing.Processor` に登録（`@AutoService` で自動化可）
- `Filer` で新しい `.java` を生成 ―― これが `javac` で**もう一度**コンパイルされる
- 文字列の組み立てより、**JavaPoet** で安全に書ける
- 解析は **`javax.lang.model.element`** の API を使う
- 本格的なプロセッサは難しいので、**ライブラリ作者向けの世界**

次の節では、世の中で広く使われている**既存のプロセッサ**（Lombok・MapStruct）を見ていきます。
