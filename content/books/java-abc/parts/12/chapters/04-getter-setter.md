---
title: ゲッターとセッター ― 安全な読み書きの入口
llm: true
---

## ゲッターとセッター ― 安全な読み書きの入口

前の節で、フィールドを `private` にして隠し、値を読む**ゲッター**を用意しました。
この節では、値を**書き込む**ための**セッター**と合わせて、Java で広く使われる「ゲッター・セッター」のパターンを学びます。

---

## ゲッターとセッター

`private` フィールドを、外から安全に扱うために、2種類のメソッドを用意するのが定番です。

- **ゲッター**（getter） … フィールドの値を**読み取る**メソッド。`getXxx()` という名前にする
- **セッター**（setter） … フィールドに値を**設定する**メソッド。`setXxx(値)` という名前にする

人を表す `Person` クラスで見てみましょう。名前（`name`）と年齢（`age`）を `private` にし、それぞれにゲッターとセッターを付けます。

```java
class Person {
    private String name;
    private int age;

    // name のゲッター・セッター
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    // age のゲッター・セッター
    public int getAge() {
        return age;
    }
    public void setAge(int age) {
        this.age = age;
    }
}
```

セッターの中で、第11章で学んだ `this` が活躍しています。
`this.name = name;` は「このオブジェクトのフィールド `name` に、引数の `name` を入れる」でしたね。
フィールド名と引数名が同じなので、`this.` でフィールドのほうを明示しています。

---

## 使ってみる

`Main` から `Person` を使ってみましょう。

```java
class Person {
    private String name;
    private int age;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
}

public class Main {
    public static void main(String[] args) {
        Person p = new Person();
        p.setName("佐藤");      // セッターで設定
        p.setAge(25);

        IO.println(p.getName() + "さん（" + p.getAge() + "歳）");  // ゲッターで取得
    }
}
```

```text
$ java Main.java
佐藤さん（25歳）
```

`private` なフィールドを、セッターで設定し、ゲッターで読み取れました。

---

## セッターの本当の価値 ― 値をチェックできる

「結局、読み書きできるなら、`public` のフィールドと同じでは？」と思うかもしれません。
ですが、セッターには、`public` フィールドにはない、大きな価値があります。
それは、**値を設定する前に、チェック（検証）できる**ことです。

たとえば、「年齢にマイナスの値を入れさせない」セッターは、こう書けます。

```java
class Person {
    private int age;

    public void setAge(int age) {
        if (age < 0) {
            IO.println("年齢に負の値は設定できません: " + age);
            return;            // 設定せずに終了
        }
        this.age = age;
    }

    public int getAge() {
        return age;
    }
}

public class Main {
    public static void main(String[] args) {
        Person p = new Person();
        p.setAge(-5);          // 不正な値
        IO.println("年齢: " + p.getAge());

        p.setAge(25);          // 正しい値
        IO.println("年齢: " + p.getAge());
    }
}
```

```text
$ java Main.java
年齢に負の値は設定できません: -5
年齢: 0
年齢: 25
```

`setAge(-5)` はチェックではじかれたので、`age` は初期値の `0` のままです。続く `setAge(25)` で、正しく `25` になりました。
もし `age` が `public` だったら、`p.age = -5;` を止める手段はありません。
**セッターという入口を通すからこそ、見張り（チェック）を置ける** ―― これがカプセル化の真価です。

---

## 何でもゲッター・セッターにしない

ゲッター・セッターは便利ですが、「**すべてのフィールドに、機械的にゲッター・セッターを付ける**」のは、おすすめできません。
それでは、`private` にした意味が薄れ、結局フィールドを公開しているのと変わらなくなってしまいます。

設計するときは、次のように考えます。

- **読ませる必要がないなら、ゲッターを作らない**
- **書き換えさせる必要がないなら、セッターを作らない**（読み取り専用にする）
- 値の変更には、`setAge` のように**意味のある名前**や、`deposit`/`withdraw` のような**操作の名前**を選ぶ

前の節の `BankAccount` には、`setBalance`（残高を直接設定するセッター）をあえて作りませんでした。
残高は「入金・出金」という操作を通してのみ変わるべきで、外から直接設定させたくないからです。
「**そのデータは、本当に外から自由に書き換えてよいのか？**」を、いつも考えるようにしましょう。

> **コラム: getter/setter は IDE が自動生成してくれる**
>
> 第2章で入れた IntelliJ IDEA には、`private` フィールドから、ゲッター・セッターを**自動生成**する機能があります（メニューの「Generate」など）。
> 単純なゲッター・セッターを手で書く手間は、実際の開発ではほとんどありません。
> とはいえ、「何のために作るのか」「本当に必要か」を考えるのは、人間の仕事です。自動生成に頼りつつも、設計の判断は自分で行いましょう。

---

## まとめ

- **ゲッター**（`getXxx()`）は値を読む、**セッター**（`setXxx(値)`）は値を設定するメソッド
- `private` フィールドを、これらのメソッド経由で安全に読み書きする
- セッターの最大の価値は、**設定前に値をチェック（検証）できる**こと
- 機械的に全フィールドへ付けない。**読ませない・書かせない**選択や、操作にふさわしい名前を考える
- ゲッター・セッターは IDE が自動生成できるが、「必要かどうか」の判断は自分で行う

次の節では、クラスを整理し、別パッケージのクラスを使うためのしくみ ―― **パッケージと `import`** を学びます。
