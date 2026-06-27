---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7"]
---

## よくあるつまずき

カプセル化とアクセス修飾子で、初心者がつまずきやすいポイントを、まとめて確認します。

---

## 1. 何でも public にしてしまう

「エラーが出ないように」と、フィールドをぜんぶ `public` にしてしまうのは、よくある失敗です。

```java
class BankAccount {
    public int balance;   // ✕ 公開すると、外から何でもできてしまう
}
```

これでは、せっかくクラスにまとめても、`acc.balance = -5000;` のような不正な操作を防げません。
**フィールドは原則 `private`、外に見せる操作（メソッド）だけ `public`** ―― これがカプセル化の基本姿勢です。
「とりあえず `public`」ではなく、「本当に外から使う必要があるか？」を考えて、公開範囲を決めましょう。

---

## 2. private は「クラス単位」。同じクラスの中なら見える

`private` を「オブジェクト単位」で考えてしまうと、混乱することがあります。
`private` は **クラス単位**です。**同じクラスのオブジェクトどうし**なら、おたがいの `private` フィールドにアクセスできます。

```java
class Account {
    private int balance;

    // 別の Account オブジェクト other の private にも、アクセスできる
    boolean richerThan(Account other) {
        return this.balance > other.balance;   // other.balance は private だが OK
    }
}
```

`other.balance` は `private` ですが、`richerThan` は**同じ `Account` クラスの中**のメソッドなので、アクセスできます。
「`private` ＝ 同じクラスの中だけ」を、正確に押さえておきましょう（オブジェクトごとではなく、クラスごとの制限です）。

---

## 3. セッターで this を忘れる

セッターでは、フィールド名と引数名が同じになりがちです。
このとき `this` を忘れると、第11章で見たとおり、フィールドに値が入りません。

```java
class Person {
    private String name;

    public void setName(String name) {
        name = name;        // ✕ 引数に引数を入れているだけ（フィールドは変わらない）
    }
}
```

正しくは `this.name = name;` です。
フィールドと引数の名前が同じときは、**フィールドのほうに `this.` を付ける**のを忘れないようにしましょう。

---

## 4. 機械的にゲッター・セッターを作る

「`private` にしたら、必ずゲッターとセッターをセットで作る」と機械的に考えるのは、考えものです。

```java
class BankAccount {
    private int balance;
    public int getBalance() { return balance; }
    public void setBalance(int balance) { this.balance = balance; }  // ✕ これでは…
}
```

`setBalance` を `public` で作ってしまうと、`acc.setBalance(-5000);` で、結局マイナス残高にできてしまいます。
これでは、`balance` を `public` にしたのと、ほとんど変わりません。

- 残高のように「直接設定させたくない」値には、**セッターを作らない**（`deposit`/`withdraw` のような操作だけにする）
- 読ませる必要がない値には、**ゲッターも作らない**

「`private` にする」ことと、「ゲッター・セッターを作る」ことは、別の判断です。
**本当に必要な入口だけ**を公開しましょう。

---

## 5. public class とファイル名

`public` を付けたクラスは、第3章で学んだとおり、**ファイル名とクラス名を一致**させる必要があります。

```java
// Main.java というファイルに書く
public class Main { ... }      // ◯ ファイル名と一致
public class Program { ... }   // ✕ Program.java でないとエラー
```

1つのファイルに `public` クラスは**1つだけ**です。
第12章以降のサンプルでは、`public class Main` をファイル名 `Main.java` にそろえ、部品となるクラス（`public` を付けない `class BankAccount` など）を、同じファイルに並べています。

---

## まとめ

- フィールドは原則 `private`。「とりあえず public」にしない
- `private` は**クラス単位**。同じクラスのオブジェクトどうしは、おたがいの private が見える
- セッターでは `this.name = name;` の **`this` を忘れない**
- ゲッター・セッターは機械的に作らない。**本当に必要な入口だけ**公開する
- `public class` は、**ファイル名と一致**させる（1ファイルに public は1つ）

次は、この章で学んだ言葉を、用語集としてまとめます。
