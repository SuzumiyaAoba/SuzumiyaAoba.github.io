---
title: 引数つきコンストラクタ ― 作るときに値を渡す
llm: true
co-author: ["Claude Opus 4.7"]
---

## 引数つきコンストラクタ ― 作るときに値を渡す

引数なしのコンストラクタは、いつも同じ初期値しか作れませんでした。
この節では、**作るときに値を渡せる**、引数つきコンストラクタを学びます。これが、コンストラクタの本領です。

---

## 引数を受け取るコンストラクタ

コンストラクタも、ふつうのメソッドと同じように、`()` の中に**引数**を書けます。
受け取った引数を、フィールドに入れれば、「作るときに初期値を指定できる」ようになります。

```java
class Person {
    String name;
    int age;

    Person(String name, int age) {   // 引数を受け取る
        this.name = name;            // 受け取った値をフィールドに入れる
        this.age = age;
    }
}
```

ここで、第11章で学んだ **`this`** が活躍しています。
引数名（`name`・`age`）と、フィールド名（`name`・`age`）が同じなので、フィールドのほうを `this.` で明示しています。

- `this.name` … このオブジェクトのフィールド
- `name` … コンストラクタの引数

`this.name = name;` は、「このオブジェクトのフィールド `name` に、引数の `name` を入れる」と読めます。
この「引数名とフィールド名をそろえて、`this.` で区別する」書き方は、コンストラクタでとてもよく使われる、定番の形です。

---

## new のときに値を渡す

引数つきコンストラクタを定義すると、`new` のときに、`()` の中へ値を渡せるようになります。

```java
class Person {
    String name;
    int age;

    Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    void introduce() {
        IO.println(name + "さん（" + age + "歳）");
    }
}

public class Main {
    public static void main(String[] args) {
        Person p1 = new Person("佐藤", 25);   // 作ると同時に初期化
        Person p2 = new Person("鈴木", 30);

        p1.introduce();
        p2.introduce();
    }
}
```

```text line-numbers=false
$ java Main.java
佐藤さん（25歳）
鈴木さん（30歳）
```

`new Person("佐藤", 25)` の1行で、`name` に `"佐藤"`、`age` に `25` が入った `Person` が作られました。
第12章のように、作ってからセッターで設定する必要は、もうありません。
**作ると同時に、正しい状態のオブジェクト**ができあがります。

![new とコンストラクタの流れ。new Person("佐藤", 25) を実行すると、①メモリに領域が確保され（フィールドは初期値）、②コンストラクタが実行されて this.name と this.age に値が入り、③初期化済みのオブジェクトが変数 p に入る。](./images/constructor-flow.svg)

---

## コンストラクタで「中途半端なオブジェクト」を防ぐ

引数つきコンストラクタには、もう1つ大きな利点があります。
**「初期値を必ず渡さなければ、オブジェクトを作れない」**ようにできることです。

`Person(String name, int age)` というコンストラクタだけを用意すると、`new Person("佐藤", 25)` のように、名前と年齢を渡さないとコンパイルエラーになります。

```java
Person p = new Person();   // 引数を渡していない → エラー
```

```text line-numbers=false
エラー: クラス Personのコンストラクタ Personは指定された型に適用できません。
  期待値: String,int
  検出値:    引数がありません
```

「名前と年齢が必要なのに、渡されていない」と、Java が止めてくれます。
これにより、「**名前のない人**」「**年齢が `0` の人**」のような、中途半端なオブジェクトが作られるのを、根本から防げます。
オブジェクトは、**生まれた瞬間から、必要なデータがそろっている**ことが保証されるのです。

---

## カプセル化と組み合わせる

第12章のカプセル化（`private` フィールド）と、引数つきコンストラクタを組み合わせると、とても堅牢なクラスになります。
コンストラクタの中で、**値のチェック**もできます。

```java
class Person {
    private String name;
    private int age;

    Person(String name, int age) {
        this.name = name;
        if (age < 0) {
            this.age = 0;        // ありえない年齢は 0 にする
        } else {
            this.age = age;
        }
    }

    public String getName() { return name; }
    public int getAge() { return age; }
}

public class Main {
    public static void main(String[] args) {
        Person p = new Person("佐藤", -5);   // マイナスの年齢を渡してみる
        IO.println(p.getName() + " / " + p.getAge() + "歳");
    }
}
```

```text line-numbers=false
$ java Main.java
佐藤 / 0歳
```

マイナスの年齢 `-5` を渡しても、コンストラクタのチェックで `0` に直されました。
このように、コンストラクタは「**オブジェクトが生まれる瞬間に、正しい状態を保証する**」ための、最初の見張りになります。
フィールドを `private` で守り、コンストラクタとメソッドで正しさをチェックする ―― これが、堅牢なオブジェクトの基本形です。

---

## まとめ

- コンストラクタに**引数**を持たせると、`new` のときに初期値を渡せる
- `Person(String name, int age) { this.name = name; ... }` が定番の形（`this` でフィールドを明示）
- `new Person("佐藤", 25)` のように、**作ると同時に初期化**できる
- 引数つきコンストラクタだけにすると、**初期値なしでオブジェクトを作れなくなる**（中途半端なオブジェクトを防ぐ）
- コンストラクタの中で値を**チェック**すれば、生まれた瞬間から正しい状態を保証できる

次の節では、複数のコンストラクタを使い分ける**オーバーロード**と、`this()` を学びます。
