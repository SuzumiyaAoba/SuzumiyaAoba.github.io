---
title: Chain of Responsibility パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Chain of Responsibility パターン

**Chain of Responsibility**（CoR、責任の連鎖）パターンは、**リクエストを、複数のハンドラに順番に通して処理させる**振る舞いパターンです。

各ハンドラは「**自分が処理できるか**」を判断し、できなければ次に回します。
チェーンの構造を変えるだけで、処理の順番や内容を自由に組み替えられます。

---

## 解きたい問題

「ログメッセージ」を、種類（DEBUG、INFO、WARN、ERROR）によって**異なる出力先**に送りたいとします。

- DEBUG はファイルだけ
- INFO はファイルと標準出力
- WARN は標準出力とメール
- ERROR は標準出力とメール、さらに監視サービス

これを 1 つのメソッドに `if-else` で書くと、

```java
if (level == DEBUG) { writeToFile(); }
else if (level == INFO) { writeToFile(); writeToStdout(); }
else if (level == WARN) { writeToStdout(); sendMail(); }
else if (level == ERROR) { writeToStdout(); sendMail(); notifyMonitor(); }
```

出力先が増えるたび、メソッドの中身が**爆発**します。
さらに、「**WARN を一時的にメール以外にも送りたい**」のように、組み合わせを動的に変えたいときに対応しにくい。

**「各ハンドラを 1 つずつ独立に作って、つなげる**」のが Chain of Responsibility です。

---

## 構造と登場人物

```text line-numbers=false
Handler（インターフェース）
  └ handle(request)

ConcreteHandlerA → ConcreteHandlerB → ConcreteHandlerC → ...
   ※ 次のハンドラへの参照を持つ
```

各 Handler が「**処理する／次に渡す**」を判断します。

---

## 実装例 ― ログレベルのフィルタ

```java
public abstract class LogHandler {
    private LogHandler next;
    public LogHandler setNext(LogHandler next) {
        this.next = next;
        return next;
    }
    public void handle(int level, String message) {
        doHandle(level, message);
        if (next != null) next.handle(level, message);
    }
    protected abstract void doHandle(int level, String message);
}
```

3 つのハンドラを作ります。

```java
public class FileLogger extends LogHandler {
    @Override protected void doHandle(int level, String message) {
        if (level >= 0) System.out.println("[FILE] " + message);
    }
}
public class ConsoleLogger extends LogHandler {
    @Override protected void doHandle(int level, String message) {
        if (level >= 1) System.out.println("[CONSOLE] " + message);
    }
}
public class MailLogger extends LogHandler {
    @Override protected void doHandle(int level, String message) {
        if (level >= 2) System.out.println("[MAIL] " + message);
    }
}
```

連鎖を組み立て:

```java
LogHandler chain = new FileLogger();
chain.setNext(new ConsoleLogger())
     .setNext(new MailLogger());

chain.handle(0, "デバッグメッセージ");
// → [FILE] デバッグメッセージ

chain.handle(2, "エラー!");
// → [FILE] エラー!
// → [CONSOLE] エラー!
// → [MAIL] エラー!
```

ハンドラの順序や有無を変えるだけで、ログの出力先を**動的に組み替えられます**。

---

## Servlet Filter / Spring Interceptor との関係

Web フレームワークの世界で、Chain of Responsibility は**至るところで**出てきます。

- **Servlet Filter**: `doFilter(req, res, chain)` の中で `chain.doFilter(...)` を呼んで次に渡す
- **Spring Interceptor**: 各 Interceptor が前処理／後処理を担当
- **Spring Security Filter Chain**: 認証・認可を段階的にチェック

```java
public class AuthFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
        if (isAuthenticated(req)) {
            chain.doFilter(req, res);   // 次へ
        } else {
            ((HttpServletResponse) res).setStatus(401);
        }
    }
}
```

「**通すか、止めるか**」を、各フィルタが**独立に**決められる ―― これが CoR の力です。

---

## ラムダで書く軽い連鎖

メソッドが 1 つだけの Handler なら、**`Consumer<T>` のチェーン**として書けます。

```java
import java.util.function.Consumer;

Consumer<String> file = msg -> System.out.println("[FILE] " + msg);
Consumer<String> console = msg -> System.out.println("[CONSOLE] " + msg);
Consumer<String> chain = file.andThen(console);

chain.accept("Hello");
// → [FILE] Hello
// → [CONSOLE] Hello
```

`Consumer#andThen` は、**ハンドラを順に呼ぶ**ことそのものです。
複雑な条件分岐がなく、「**順に呼ぶだけ**」なら、これで十分です。

---

## 使いどころと注意点

向く場面:

- **複数の前処理／後処理**を、段階的に組み合わせたい
- 「処理できる人が見つかるまで回す」というロジック
- **動的に**ハンドラの構成を変えたい

注意点:

- 連鎖が長すぎると、**どこで何が処理されたか**を追いにくくなる
- 「**全員に通す**」のか「**最初の 1 人が処理して終わり**」なのか、設計時に明確にする
- ハンドラの**順序依存**でバグが出やすい（順序を文書化する）

---

## まとめ

- **Chain of Responsibility** は、リクエストを**順次ハンドラに渡す**振る舞いパターン
- 各ハンドラは独立で、組み合わせも順序も柔軟
- Servlet Filter・Spring Interceptor の**根本の構造**
- 単純な順次処理なら **`Consumer#andThen`** で十分

次の章では、**Mediator** ―― **多対多のやり取りを 1 点にまとめる**振る舞いパターンを見ます。
