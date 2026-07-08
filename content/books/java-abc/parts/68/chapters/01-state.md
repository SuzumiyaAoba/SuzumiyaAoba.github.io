---
title: State パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## State パターン

**State**（状態）パターンは、**「オブジェクトの状態によって、振る舞いを切り替える」**振る舞いパターンです。

「現在の状態」を**オブジェクトとして抱える**ことで、`if` 連発のコードを構造化します。

---

## 解きたい問題

「自動販売機」を、`if` だけで書くとこうなります。

```java
public class VendingMachine {
    private String state = "IDLE";
    private int credit = 0;

    public void insertCoin(int yen) {
        if (state.equals("IDLE")) { credit += yen; state = "READY"; }
        else if (state.equals("READY")) { credit += yen; }
        else if (state.equals("SOLD_OUT")) { /* 返却 */ }
    }
    public void pressButton() {
        if (state.equals("IDLE")) { /* 何もしない */ }
        else if (state.equals("READY")) {
            if (credit >= 100) { state = "DISPENSING"; /* 出す */ credit -= 100; state = "IDLE"; }
        }
        else if (state.equals("SOLD_OUT")) { /* 何もしない */ }
    }
}
```

状態が増えるたびに、**すべてのメソッドの中で if が増えます**。
状態が 5 つ、メソッドが 5 つあれば、**25 か所**に条件分岐が散らばります。

「**今の状態**」を 1 つのオブジェクトに集約しよう ―― それが State です。

---

## 構造と登場人物

```text line-numbers=false
Context（自販機）
  └ state: State
       ↑
  IDLE / READY / SOLD_OUT      ← 状態それぞれをオブジェクト化
```

各状態は、メソッド呼び出しに対する**自分なりの振る舞い**を持ちます。状態遷移は、**メソッドの中で次の状態に切り替わる**かたちで表現します。

---

## 実装例 ― 自動販売機（古典的な書き方）

```java
public interface VendingState {
    void insertCoin(VendingMachine vm, int yen);
    void pressButton(VendingMachine vm);
}

public class IdleState implements VendingState {
    @Override public void insertCoin(VendingMachine vm, int yen) {
        vm.addCredit(yen);
        vm.setState(new ReadyState());
    }
    @Override public void pressButton(VendingMachine vm) { /* 無反応 */ }
}

public class ReadyState implements VendingState {
    @Override public void insertCoin(VendingMachine vm, int yen) {
        vm.addCredit(yen);
    }
    @Override public void pressButton(VendingMachine vm) {
        if (vm.credit() >= 100) {
            System.out.println("商品が出ました");
            vm.subtractCredit(100);
            if (vm.credit() == 0) vm.setState(new IdleState());
        }
    }
}
```

`VendingMachine`（Context）:

```java
public class VendingMachine {
    private VendingState state = new IdleState();
    private int credit = 0;

    void setState(VendingState s) { this.state = s; }
    void addCredit(int yen) { credit += yen; }
    void subtractCredit(int yen) { credit -= yen; }
    public int credit() { return credit; }

    public void insertCoin(int yen) { state.insertCoin(this, yen); }
    public void pressButton() { state.pressButton(this); }
}
```

呼び出し:

```java
VendingMachine vm = new VendingMachine();
vm.insertCoin(100);
vm.pressButton();   // → 商品が出ました
```

各状態が自分の振る舞いを知っているので、Context はただ**現在の状態にメッセージを投げる**だけです。

---

## シールドクラス + パターンマッチングで書き直す

第27章で学んだ**シールドクラス**と、第26章のパターンマッチングを使うと、状態遷移を**型レベルで閉じた形**で書けます。

```java
public sealed interface VendingState permits Idle, Ready {}
public record Idle() implements VendingState {}
public record Ready(int credit) implements VendingState {}

public class VendingMachine {
    private VendingState state = new Idle();

    public void insertCoin(int yen) {
        state = switch (state) {
            case Idle() -> new Ready(yen);
            case Ready(int c) -> new Ready(c + yen);
        };
    }
    public void pressButton() {
        state = switch (state) {
            case Idle() -> state;
            case Ready(int c) when c >= 100 -> {
                System.out.println("商品が出ました");
                int rest = c - 100;
                yield rest == 0 ? new Idle() : new Ready(rest);
            }
            case Ready r -> r;
        };
    }
}
```

状態は**不変なレコード**、遷移は**`switch` 式**で表現。
新しい状態を増やせば、すべての `switch` で**コンパイラが網羅性をチェック**してくれます。

---

## Strategy パターンとの違い

| 観点 | Strategy | State |
|---|---|---|
| 動機 | アルゴリズムを切り替えたい | 状態によって振る舞いを変えたい |
| 差し替えの主体 | **外**（呼び出し側） | **内**（自分の状態） |
| 主な切り替えの契機 | 呼び出し側の判断 | 状態遷移ロジック |
| 状態遷移の表現 | なし | 必須 |

Strategy は「**何を**するか」、State は「**今どうふるまうか**」と覚えるとよいでしょう。

---

## 使いどころと注意点

向く場面:

- 同じ操作でも、**状態によって反応が違う**
- 状態の数が**増えそう**で、`if` 連発を整理したい
- **状態遷移図**が頭に浮かぶような領域

注意点:

- 状態が 2 〜 3 個しかなければ、`enum` で済むことも多い
- 状態の数が少ないと **過剰設計**になる
- 状態間の**遷移ルール**をどこに置くか、設計時に明確にする

---

## まとめ

- **State** は、状態によって振る舞いを変えるとき、**状態をオブジェクト化**するパターン
- if 連発のコードを、**状態のクラス分割**で整理する
- 現代の Java では、**シールドクラス + パターンマッチング**で簡潔に表現できる
- Strategy（外から渡す）との違い: State は**内側で持つ**

次の章では、**Chain of Responsibility** ―― 順に責任を受け渡す振る舞いパターンを見ます。
