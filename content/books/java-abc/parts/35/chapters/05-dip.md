---
title: 依存性逆転原則（DIP）
llm: true
---

## 依存性逆転原則（DIP）

**Dependency Inversion Principle**（DIP、依存性逆転原則）は、SOLID の最後にして、いちばん抽象的な原則です。

> **「上位モジュールは、下位モジュールに依存してはならない。両方とも、抽象に依存すべきである」**
> **「抽象は、詳細に依存してはならない。詳細が、抽象に依存すべきである」**

―― 言い回しが難解ですが、噛み砕くと、

> **「具体的な実装ではなく、抽象（インタフェース）に依存しよう」**
> **「具体の側が、抽象に合わせる構造にしよう」**

ということです。

---

## ダメな例 ― 上位が下位に直接依存する

ふつう、私たちは「**重要な処理（上位）が、補助的な処理（下位）を使う**」コードを書きます。

```java
public class OrderService {                    // 上位
    private final MySqlOrderRepository repo;    // 下位（具象）

    public OrderService() {
        this.repo = new MySqlOrderRepository();  // 直接 new
    }

    public void placeOrder(Order order) {
        repo.save(order);
    }
}

public class MySqlOrderRepository {            // 下位
    public void save(Order order) {
        // MySQL に保存
    }
}
```

このとき、依存関係はこうなります。

```text
OrderService（上位） ──→ MySqlOrderRepository（下位の具象）
```

上位 `OrderService` は、下位の**具体的な実装**である `MySqlOrderRepository` を**直接知っています**。

問題は、

- 「データベースを **PostgreSQL** に変えたい」 → `OrderService` を書き換えないといけない
- 「テストで **モック** に差し替えたい」 → `OrderService` を直接いじることになる
- 「**インメモリ実装**を試したい」 → 同上

`MySqlOrderRepository` という**具象**に縛られているのが、問題の根本です。

---

## DIP に従う ― 抽象を挟む

`OrderRepository` という**抽象（interface）**を、上位と下位の**間に**入れます。

```java
public interface OrderRepository {              // 抽象
    void save(Order order);
}

public class OrderService {                    // 上位
    private final OrderRepository repo;         // 抽象に依存

    public OrderService(OrderRepository repo) {
        this.repo = repo;                       // コンストラクタで受け取る
    }

    public void placeOrder(Order order) {
        repo.save(order);
    }
}

public class MySqlOrderRepository implements OrderRepository {   // 下位
    @Override
    public void save(Order order) {
        // MySQL に保存
    }
}
```

依存関係を、図にすると、こうなります。

```text
OrderService ──→ OrderRepository ←── MySqlOrderRepository
（上位）         （抽象）          （下位）
```

下位の `MySqlOrderRepository` は、**`OrderRepository` という抽象を実装する側**になっています。
これが、**「依存が逆転した」**状態です。

---

## 何が「逆転」したのか

「逆転」と言われると分かりにくいので、もう一度整理します。

| | 通常（DIP違反） | DIP に従う |
|---|---|---|
| `OrderService` が依存するもの | `MySqlOrderRepository`（具象） | `OrderRepository`（抽象） |
| `OrderRepository` を所有しているのは | 下位 | 上位（=上位の都合で定義する） |
| `MySqlOrderRepository` が知ること | 自分のことだけ | `OrderRepository` に合わせる |

つまり、

- 通常: **上位** が **具象** に従う（具象が主導権を握る）
- DIP: **具象** が **抽象** に従う（上位が主導権を握る）

抽象（`OrderRepository`）は、上位（`OrderService`）の**ニーズに合わせて定義**されます。
そして、下位（`MySqlOrderRepository`）は、その抽象の要請に**合わせて作る**わけです。

「**主導権が、下位から上位に移った**」 ―― この向きの変化が、「依存が逆転した」の意味です。

---

## DIP のメリット

DIP のメリットは、これまでの章で何度も顔を出してきました。

| メリット | 説明 |
|---|---|
| **差し替えやすい** | 実装を変えても、上位のコードは変わらない |
| **テストしやすい** | モックで差し替えてユニットテスト（第33章） |
| **並行に作業できる** | 抽象を決めれば、上位と下位を別の人が並行で書ける |
| **依存先のライブラリを変えられる** | MySQL → PostgreSQL、SMTP → SES など |
| **OCP の前提** | 抽象に依存していなければ、拡張は閉じれない |

---

## DIP と DI の関係

「**DI**（依存性の注入）」は、DIP を実現するためのテクニックの 1 つです。

```java
public OrderService(OrderRepository repo) {   // ← DI: 依存をコンストラクタで受け取る
    this.repo = repo;
}
```

このコンストラクタ注入が、DIP の「**抽象に依存する**」を、コード上で実現しているわけです。

第36章で本格的に学ぶ Spring などの DI コンテナは、

1. `OrderService` が `OrderRepository` 型を要求していることを認識し
2. 実装クラス（`MySqlOrderRepository`）を**自動で組み立てて注入**してくれる

という、**DIP を強力に支援する道具**です。

---

## DIP の限界 ― 「全部 interface 化しろ」ではない

DIP を真に受けると、こんなコードに陥る危険があります。

```java
interface StringJoiner { String join(String... items); }
class StandardStringJoiner implements StringJoiner { ... }

interface DateFormatter { String format(LocalDate date); }
class StandardDateFormatter implements DateFormatter { ... }
```

ただの文字列結合や日付フォーマットまで `interface` を切るのは、明らかに過剰です。

DIP が活きるのは、

- **外の世界**（DB、HTTP、メール、ファイル）との接点
- **複数の実装**がありうる場面
- **テストで差し替え**たい場面

です。
ただの内部ロジックには、不要です。
「**変わる可能性のあるところ・テストの境界**にだけ抽象を入れる」 ―― これが現実的な落としどころです。

---

## DIP は、5原則の総まとめ

DIP は、ほかの SOLID 原則を**機能させるための基盤**でもあります。

- **OCP** … 抽象に依存していないと、拡張に閉じられない
- **LSP** … 抽象の契約があってこそ、置換可能性が保証される
- **ISP** … 小さく分けた抽象を使うときの依存先になる
- **SRP** … 責務を分けたあと、互いを抽象でつなげる

DIP を理解すると、ほかの原則の**深い意味**が見えてきます。

---

## まとめ

- **DIP** は、「**具体ではなく、抽象に依存する**」原則
- 「**抽象は上位のニーズで定義し、下位がそれに合わせる**」 ―― これが「依存の逆転」
- メリットは、**差し替え・テスト・拡張**のしやすさ
- **DI（依存性の注入）** は、DIP を実現するテクニック
- ただし、**何でも interface 化はやり過ぎ**。境界にだけ使う
- DIP は、ほかの SOLID 原則の**基盤**でもある

次の節では、ここまで学んだ 5 つの原則を**まとめて適用**して、コードを改善する流れを見ます。
