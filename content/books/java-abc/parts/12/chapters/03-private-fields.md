---
title: フィールドを private にする ― データを守る
llm: true
co-author: ["Claude Opus 4.7"]
---

## フィールドを private にする ― データを守る

カプセル化の第一歩は、**フィールドを `private` にして隠す**ことです。
この節では、銀行口座 `BankAccount` を例に、データを守る基本形を作り上げます。

---

## 守りたいルールを決める

まず、「口座として、絶対に守りたいルール」を考えます。

- 残高は、**マイナスにならない**
- 入金できるのは、**正の金額だけ**
- 出金できるのは、**残高の範囲内だけ**

第11章のように `balance` が外から丸見えだと、これらのルールはいつでも破られてしまいます。
そこで、`balance` を `private` で隠し、ルールをチェックする**メソッドだけ**を入口にします。

---

## private フィールド + 公開メソッド

`BankAccount` を、次のように作ります。

```java
class BankAccount {
    private int balance;   // 隠す（外から直接さわれない）

    // 入金：正の金額のときだけ受け付ける
    void deposit(int amount) {
        if (amount > 0) {
            balance += amount;
        }
    }

    // 出金：残高の範囲内のときだけ受け付ける
    void withdraw(int amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
        }
    }

    // 残高を見る（読み取り専用の入口）
    int getBalance() {
        return balance;
    }
}
```

ポイントは、`balance` が `private` であることです。
外からは、`deposit`・`withdraw`・`getBalance` という**3つの公開メソッド**を通してしか、口座を操作できません。
そして、`deposit` と `withdraw` の中で**ルールをチェック**しているので、残高がマイナスになることはありません。

---

## 使ってみる

`Main` クラスから、この口座を使ってみましょう。

```java
class BankAccount {
    private int balance;
    void deposit(int amount) { if (amount > 0) balance += amount; }
    void withdraw(int amount) { if (amount > 0 && amount <= balance) balance -= amount; }
    int getBalance() { return balance; }
}

public class Main {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount();
        acc.deposit(1000);     // 入金
        acc.withdraw(300);     // 出金
        IO.println("残高: " + acc.getBalance());
    }
}
```

```text
$ java Main.java
残高: 700
```

1000円入金して300円出金したので、残高は700円。期待どおりです。

---

## ルール違反は、はじかれる

では、ルールを破ろうとするとどうなるでしょうか。

```java
public class Main {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount();
        acc.deposit(1000);
        acc.withdraw(5000);    // 残高は1000円なのに、5000円出金しようとする
        acc.deposit(-200);     // マイナスの入金

        IO.println("残高: " + acc.getBalance());
    }
}
```

```text
$ java Main.java
残高: 1000
```

`withdraw(5000)` は「残高の範囲内ではない」のではじかれ、`deposit(-200)` は「正の金額ではない」のではじかれました。
そのため、残高は最初に入れた1000円のまま、**おかしな状態にはなりません**。

そして何より、`acc.balance = -5000;` のように**直接書き換える道は、`private` でふさがれています**。
口座は、`deposit`・`withdraw` という正しい入口を通すしかなく、その入口にはチェックの見張りが立っている ―― これがカプセル化の力です。

---

## getter ―「読む」専用の入口

`getBalance()` のように、**フィールドの値を読み取るためのメソッド**を、**ゲッター**（getter、取得メソッド）と呼びます。

`private` で隠したフィールドも、値を**見る**だけなら安全です。
そこで、「読むための入口」としてゲッターを用意します。

なお、`getBalance()` は**読むだけ**で、残高を変える手段は提供していません。
このように、「読めるが、書き換えられない」ようにできるのも、カプセル化の利点です。
`balance` を `public` にしてしまうと「読み書き自由」になりますが、`private` ＋ ゲッターなら「読み取り専用」にできるのです。

次の節では、このゲッターと、値を**書き込む**ための「セッター」を、セットで整理します。

---

## まとめ

- カプセル化の基本形は、**フィールドを `private`**、**操作するメソッドを `public`** にすること
- メソッドの中で**ルールをチェック**すれば、ありえない値（マイナス残高など）を防げる
- `private` フィールドは外から直接書き換えられないので、必ず**正しい入口（メソッド）**を通る
- フィールドの値を読むメソッドを**ゲッター**（getter）と呼ぶ
- `private` ＋ ゲッターだけにすれば、「**読めるが書き換えられない**」フィールドにできる

次の節では、ゲッターと、値を設定する**セッター**を整理し、検証つきの安全な書き込みを学びます。
