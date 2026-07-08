---
title: 独自例外を作る
llm: true
co-author: ["Claude Opus 4.7"]
---

## 独自例外を作る

これまでは、`IllegalArgumentException` など、Java が用意した例外を使ってきました。
ですが、自分のプログラムに合った、**独自の例外**を作ることもできます。
この節では、その方法と利点を学びます。

---

## なぜ独自例外を作るのか

第12章で作った銀行口座 `BankAccount` で、「残高を超える出金」を考えます。
標準の例外でも表現できますが、「**残高不足**」という、このプログラム特有の状況を、ぴったり表す例外があれば、より分かりやすくなります。

独自例外を作ると、

- **何が起きたか**が、例外の名前（`InsufficientBalanceException` など）で明確に伝わる
- 「残高不足だけ」を、`catch` で**狙って捕まえられる**
- そのプログラムのルールを、例外という形で表現できる

といった利点があります。

---

## 独自例外の作り方

独自例外は、**既存の例外クラスを継承**して作ります（第14章の継承です）。
非チェック例外にしたいなら **`RuntimeException`** を、チェック例外にしたいなら **`Exception`** を継承します。

ここでは、扱いやすい非チェック例外として、`RuntimeException` を継承します。

```java
class InsufficientBalanceException extends RuntimeException {
    InsufficientBalanceException(String message) {
        super(message);   // 親（RuntimeException）にメッセージを渡す
    }
}
```

やっていることは、これだけです。

- `extends RuntimeException` … 例外クラスを継承する
- コンストラクタで、`super(message)` … 受け取ったメッセージを、親の例外に渡す（第14章の `super(...)`）

`super(message)` でメッセージを渡しておくと、`getMessage()` でそのメッセージを取り出せるようになります。
これで、`InsufficientBalanceException`（残高不足例外）という、独自の例外ができました。

---

## 独自例外を投げる・捕まえる

作った独自例外を、`BankAccount` で使ってみましょう。
残高を超える出金が要求されたら、この例外を投げます。

```java
class InsufficientBalanceException extends RuntimeException {
    InsufficientBalanceException(String message) {
        super(message);
    }
}

class BankAccount {
    private int balance;

    public void deposit(int amount) {
        balance += amount;
    }

    public void withdraw(int amount) {
        if (amount > balance) {
            throw new InsufficientBalanceException(
                "残高不足です。残高: " + balance + " 円、出金: " + amount + " 円");
        }
        balance -= amount;
    }

    public int getBalance() { return balance; }
}

public class Main {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount();
        acc.deposit(1000);

        try {
            acc.withdraw(5000);   // 残高不足 → 独自例外が投げられる
        } catch (InsufficientBalanceException e) {
            IO.println("出金できませんでした: " + e.getMessage());
        }

        IO.println("現在の残高: " + acc.getBalance() + " 円");
    }
}
```

```text line-numbers=false
$ java Main.java
出金できませんでした: 残高不足です。残高: 1000 円、出金: 5000 円
現在の残高: 1000 円
```

`withdraw(5000)` で残高不足になり、`InsufficientBalanceException` が投げられました。
それを `catch` が捕まえ、「出金できませんでした」と、分かりやすく対応できています。
残高は `1000` のまま変わらず、おかしな状態（マイナス残高）にはなっていません。

`catch (InsufficientBalanceException e)` と、**独自例外の名前で捕まえている**点に注目してください。
「残高不足」という特定の状況だけを、狙って捕まえ、それに合った対応ができています。
これが、独自例外を作る大きな利点です。

---

## 例外名で、意図を伝える

独自例外の名前は、それ自体が「**何が起きたか**」を説明します。

```java
catch (InsufficientBalanceException e) {  // 「残高不足が起きた」と一目で分かる
    ...
}
```

`InsufficientBalanceException`（残高不足例外）という名前を見れば、コードを読む人は、すぐに状況を理解できます。
このように、独自例外は「**プログラム特有の問題を、名前で語る**」ための、表現力のある道具です。
例外の名前は、`〜Exception` で終わらせ、何が起きたかが分かる名前を付けるのが慣習です。

---

## まとめ

- **独自例外**は、既存の例外（`RuntimeException` や `Exception`）を**継承**して作る
- コンストラクタで `super(message)` を呼び、メッセージを親に渡す
- 投げるときは `throw new 独自例外(...)`、捕まえるときは `catch (独自例外 e)`
- 独自例外の名前（`InsufficientBalanceException` など）が、**何が起きたかを明確に伝える**
- プログラム特有の状況を、狙って捕まえ、適切に対応できる

次の節では、例外処理でつまずきやすいポイントを、まとめて確認します。
