---
title: this ― 自分自身への参照
llm: true
co-author: ["Claude Opus 4.7"]
---

## this ― 自分自身への参照

メソッドの中で、よく見かける `this`（ジス）というキーワードがあります。
この節では、`this` が何を指すのか、そしてどんなときに役立つのかを学びます。

---

## this は「このオブジェクト自身」

**`this`** は、**いま動いているメソッドが属するオブジェクト自身**を指します。

たとえば、`myCar.show()` を呼ぶと、`show` メソッドが動きます。
このとき、`show` の中の `this` は、`myCar` を指しています。
`yourCar.show()` を呼んだなら、そのときの `this` は `yourCar` です。
つまり `this` は、**「いま、自分を呼び出してくれたオブジェクト」**を指す、と考えてください。

前の節で書いたメソッドは、実は次のように、すべてのフィールドの前に `this.` を付けても、まったく同じ意味になります。

```java
void accelerate(int delta) {
    this.speed = this.speed + delta;   // this.speed は「このオブジェクトの speed」
}
```

`speed` と書いても `this.speed` と書いても、指しているのは同じ「自分のフィールド」です。
ふだんは `this.` を省略して `speed` と書けますが、**省略しても、裏では `this` が補われている**のです。

---

## this が必要になる場面 ― 名前がかぶるとき

「省略できるなら、`this` はいらないのでは？」と思うかもしれません。
ところが、`this` を**省略できない**場面があります。それは、**フィールドと引数（やローカル変数）の名前が同じ**ときです。

車に名前を設定する `setName` メソッドを、引数名も `name` にして書いてみましょう。

```java
class Car {
    String name;

    void setName(String name) {   // 引数も name
        name = name;              // ← うまくいかない！
    }
}
```

この `name = name;` は、一見「フィールドに引数を入れている」ように見えますが、そうはなりません。
メソッドの中で `name` と書くと、**より近くにある引数の `name`** が優先されます。
そのため `name = name;` は「引数 `name` に、引数 `name` を入れる」という、何も起きない文になってしまうのです（フィールドの `name` は `null` のまま）。

ここで `this` の出番です。
**フィールドのほうを `this.name` と明示**すれば、はっきり区別できます。

```java
class Car {
    String name;

    void setName(String name) {
        this.name = name;   // this.name（フィールド）に、name（引数）を入れる
    }
}
```

- `this.name` … **このオブジェクトのフィールド** `name`
- `name` … **引数**の `name`

`this.name = name;` は、「このオブジェクトのフィールド `name` に、引数の `name` を入れる」と、はっきり読めます。

---

## 動かして確かめる

完全なプログラムで確認しましょう。

```java
class Car {
    String name;

    void setName(String name) {
        this.name = name;
    }
}

void main() {
    Car c = new Car();
    c.setName("ロードスター");
    IO.println(c.name);
}
```

```text line-numbers=false
$ java CarApp.java
ロードスター
```

`this.name` を使ったおかげで、フィールドにきちんと値が入りました。
もし `this` を付けず `name = name;` と書いていたら、`c.name` は `null` のままで、`null` と表示されていたはずです。

> **慣習: 引数名は、フィールド名と同じにすることが多い**
>
> `setName(String name)` のように、引数名をフィールド名とそろえるのは、Java でよく使われる書き方です。
> 「この引数は、このフィールドのための値だ」と一目でわかるからです。
> そのぶん `this.` が必須になりますが、これは「名前がかぶっているので、フィールドのほうを指している」という、はっきりした意思表示になります。
> この書き方は、第13章「コンストラクタ」で本格的に活躍します。

---

## まとめ

- **`this`** は、いま動いているメソッドが属する**オブジェクト自身**を指す
- メソッドの中の `speed` は、実は `this.speed` の `this.` を省略したもの
- **フィールドと引数の名前が同じ**ときは、`this.` を付けてフィールドを明示する（省略不可）
- `this.name = name;` は「このオブジェクトのフィールド `name` に、引数 `name` を入れる」

次の節では、1つのクラスから**複数のオブジェクト**を作り、それぞれが独立した状態を持つことを確かめます。
